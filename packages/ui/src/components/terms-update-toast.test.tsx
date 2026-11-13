import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TermsUpdateToast } from "./terms-update-toast";

const props = { title: "Actualizamos", body: "Cambió el aviso", errorText: "No se pudo", ctaLabel: "Enterado" };

describe("TermsUpdateToast", () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => {
    vi.useRealTimers();
    document.querySelectorAll("[data-even-loader]").forEach((el) => el.remove());
  });

  it("no aparece si no hace falta confirmar", async () => {
    render(<TermsUpdateToast needsAck={false} onAcknowledge={async () => ({ success: true })} {...props} />);
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("espera a que desaparezca el loader de pantalla completa", async () => {
    const loader = document.createElement("div");
    loader.setAttribute("data-even-loader", "");
    document.body.appendChild(loader);
    render(<TermsUpdateToast needsAck onAcknowledge={async () => ({ success: true })} {...props} />);
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(screen.queryByRole("status")).toBeNull();

    loader.remove();
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(screen.getByRole("status")).toBeTruthy();
  });

  it("muestra el error si no se pudo registrar", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<TermsUpdateToast needsAck onAcknowledge={async () => ({ success: false })} {...props} />);
    await act(() => vi.advanceTimersByTimeAsync(1000));
    await user.click(screen.getByRole("button", { name: "Enterado" }));
    expect(await screen.findByText("No se pudo")).toBeTruthy();
  });
});
