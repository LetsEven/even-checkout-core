import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MenuActionsPill, MenuHamburger, PillButton, UserAvatar } from "./menu-actions-pill";
import { RestaurantDetailSheet, type RestaurantDetailLabels } from "./restaurant-detail-sheet";

const labels: RestaurantDetailLabels = {
  title: "Detalle",
  logoAlt: "Logo",
  branch: "Sucursal",
  changeBranch: "Cambiar sucursal",
  address: "Dirección",
  phone: "Teléfono",
  email: "Correo",
  hours: "Horario",
  closed: "Cerrado",
  allDay: "24 horas",
  days: {
    monday: "Lunes",
    tuesday: "Martes",
    wednesday: "Miércoles",
    thursday: "Jueves",
    friday: "Viernes",
    saturday: "Sábado",
    sunday: "Domingo",
  },
};

describe("RestaurantDetailSheet", () => {
  it("muestra los datos y cierra con Escape", async () => {
    const onClose = vi.fn();
    render(<RestaurantDetailSheet open onClose={onClose} name="Saku" address="Calle 1" phone="555" labels={labels} />);
    expect(screen.getByRole("dialog", { name: "Detalle" })).toBeTruthy();
    expect(screen.getByText("Calle 1")).toBeTruthy();
    expect(screen.queryByText("Sucursal")).toBeNull();
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("sin abrir queda oculto y no escucha Escape", async () => {
    const onClose = vi.fn();
    render(<RestaurantDetailSheet open={false} onClose={onClose} name="Saku" labels={labels} />);
    await userEvent.keyboard("{Escape}");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("ofrece cambiar de sucursal solo si hay onChange", async () => {
    const onChange = vi.fn();
    render(
      <RestaurantDetailSheet open onClose={() => {}} name="Saku" branch={{ label: "Centro", onChange }} labels={labels} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /Cambiar sucursal/ }));
    expect(onChange).toHaveBeenCalled();
  });
});

describe("MenuHamburger", () => {
  it("conserva #cart-icon y #cart-badge para la animación del carrito", () => {
    const { container } = render(<MenuHamburger open={false} onToggle={() => {}} count={3} labels={{ open: "Abrir", close: "Cerrar" }} />);
    expect(container.querySelector("#cart-icon")).not.toBeNull();
    expect(container.querySelector("#cart-badge")?.textContent).toBe("3");
    expect(screen.getByRole("button", { name: "Abrir" }).getAttribute("aria-expanded")).toBe("false");
  });
});

describe("MenuActionsPill", () => {
  it("queda inert cuando no es visible", () => {
    const { container } = render(
      <MenuActionsPill visible={false}>
        <PillButton onClick={() => {}} aria-label="Perfil">
          x
        </PillButton>
      </MenuActionsPill>,
    );
    expect(container.firstElementChild?.hasAttribute("inert")).toBe(true);
  });
});

describe("UserAvatar", () => {
  it("usa la inicial con sesión y nombre", () => {
    render(<UserAvatar isAuthenticated profile={{ firstName: "ana" }} alt="Perfil" />);
    expect(screen.getByText("A")).toBeTruthy();
  });
});
