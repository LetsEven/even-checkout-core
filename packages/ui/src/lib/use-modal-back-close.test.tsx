import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useModalBackClose } from "./use-modal-back-close";

const popstate = () => new Promise<void>((resolve) => window.addEventListener("popstate", () => resolve(), { once: true }));

describe("useModalBackClose", () => {
  // Desmontar consume su entrada del historial con un back() asíncrono: se espera a que su popstate pase.
  afterEach(async () => {
    cleanup();
    await new Promise((resolve) => setTimeout(resolve, 30));
  });

  it("el back cierra solo la capa más interna", async () => {
    const outer = vi.fn();
    const inner = vi.fn();
    renderHook(() => useModalBackClose(true, outer));
    renderHook(() => useModalBackClose(true, inner));

    const done = popstate();
    act(() => window.history.back());
    await done;
    expect(inner).toHaveBeenCalledTimes(1);
    expect(outer).not.toHaveBeenCalled();
  });

  it("rearm absorbe el back y deja la capa abierta", async () => {
    const onBack = vi.fn((rearm: () => void) => rearm());
    renderHook(() => useModalBackClose(true, onBack));
    const lengthBefore = window.history.length;

    let done = popstate();
    act(() => window.history.back());
    await done;
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(window.history.length).toBe(lengthBefore);

    // sigue armada: un segundo back vuelve a llegar
    done = popstate();
    act(() => window.history.back());
    await done;
    expect(onBack).toHaveBeenCalledTimes(2);
  });

  it("cerrar por otra vía consume la entrada del historial sin llamar a onBack", async () => {
    const onBack = vi.fn();
    const { rerender } = renderHook(({ open }) => useModalBackClose(open, onBack), { initialProps: { open: true } });
    expect((window.history.state as { evenModalGuard?: number } | null)?.evenModalGuard).toBeDefined();

    const done = popstate();
    rerender({ open: false });
    await done;
    expect(onBack).not.toHaveBeenCalled();
    expect((window.history.state as { evenModalGuard?: number } | null)?.evenModalGuard).toBeUndefined();
  });
});
