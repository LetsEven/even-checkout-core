import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MenuQuickAddModal } from "./menu-quick-add-modal";

function setup(overrides: Partial<Parameters<typeof MenuQuickAddModal>[0]> = {}) {
  const props = {
    open: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    name: "tacos",
    description: "Con piña",
    priceLabel: "$80.00",
    labels: { add: "Agregar", back: "Regresar" },
    ...overrides,
  };
  render(<MenuQuickAddModal {...props} />);
  return props;
}

describe("MenuQuickAddModal", () => {
  it("muestra nombre, descripción y precio dentro de un dialog", () => {
    setup();
    expect(screen.getByRole("dialog", { name: "tacos" })).toBeTruthy();
    expect(screen.getByText("Con piña")).toBeTruthy();
    expect(screen.getByText("$80.00")).toBeTruthy();
  });

  it("no renderiza nada cerrado", () => {
    setup({ open: false });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("«Agregar» cierra y confirma; «Regresar» solo cierra", async () => {
    const props = setup();
    await userEvent.click(screen.getByRole("button", { name: "Regresar" }));
    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onConfirm).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Agregar" }));
    expect(props.onClose).toHaveBeenCalledTimes(2);
    expect(props.onConfirm).toHaveBeenCalledTimes(1);
  });

  it("cierra con Escape", async () => {
    const props = setup();
    await userEvent.keyboard("{Escape}");
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});
