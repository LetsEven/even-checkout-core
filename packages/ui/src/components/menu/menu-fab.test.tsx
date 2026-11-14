import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MenuActionsModal, MenuFab } from "./menu-fab";

const labels = { open: "Abrir menú", close: "Cerrar menú" };

describe("MenuFab", () => {
  it("con carrito vacío es la hamburguesa, sin contador ni verde", () => {
    const { container } = render(<MenuFab open={false} onToggle={() => {}} labels={labels} />);
    const button = screen.getByRole("button", { name: "Abrir menú" });
    expect(button.className).not.toContain("bg-even-grass");
    expect(container.querySelector("#cart-badge")).toBeNull();
    expect(container.querySelector("#cart-icon")).not.toBeNull();
  });

  it("con artículos se vuelve verde, muestra el contador y lo nombra", () => {
    const { container } = render(
      <MenuFab open={false} onToggle={() => {}} count={3} countLabel={(n) => `${n} artículos`} labels={labels} />,
    );
    const button = screen.getByRole("button", { name: "Abrir menú, 3 artículos" });
    expect(button.className).toContain("bg-even-grass");
    expect(container.querySelector("#cart-badge")?.textContent).toBe("3");
  });

  it("alterna con el botón y cambia el nombre al abrir", async () => {
    const onToggle = vi.fn();
    const { rerender } = render(<MenuFab open={false} onToggle={onToggle} labels={labels} />);
    await userEvent.click(screen.getByRole("button", { name: "Abrir menú" }));
    expect(onToggle).toHaveBeenCalledTimes(1);
    rerender(<MenuFab open onToggle={onToggle} labels={labels} />);
    expect(screen.getByRole("button", { name: "Cerrar menú" }).getAttribute("aria-expanded")).toBe("true");
  });

  it("oculto no es accesible", () => {
    const { container } = render(<MenuFab open={false} onToggle={() => {}} hidden labels={labels} />);
    expect(container.querySelector("#cart-icon")?.hasAttribute("inert")).toBe(true);
  });
});

describe("MenuActionsModal", () => {
  it("cierra tocando fuera o con Escape, pero no tocando la píldora", async () => {
    const onClose = vi.fn();
    render(
      <MenuActionsModal open onClose={onClose} label="Menú">
        <button type="button">Perfil</button>
      </MenuActionsModal>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Perfil" }));
    expect(onClose).not.toHaveBeenCalled();
    await userEvent.click(screen.getByTestId("menu-actions-backdrop"));
    expect(onClose).toHaveBeenCalledTimes(1);
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("cerrado queda inert y sin escuchar Escape", async () => {
    const onClose = vi.fn();
    render(
      <MenuActionsModal open={false} onClose={onClose} label="Menú">
        <button type="button">Perfil</button>
      </MenuActionsModal>,
    );
    expect(screen.getByTestId("menu-actions-backdrop").hasAttribute("inert")).toBe(true);
    await userEvent.keyboard("{Escape}");
    expect(onClose).not.toHaveBeenCalled();
  });
});
