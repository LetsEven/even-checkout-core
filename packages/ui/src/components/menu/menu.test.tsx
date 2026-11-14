import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MenuActions, MenuActionsPill, MenuHamburger, PillButton, PillOrderButton, UserAvatar } from "./menu-actions-pill";
import { RestaurantIntro } from "./restaurant-intro";
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

describe("accesibilidad de la píldora", () => {
  it("PillOrderButton y PillCartButton llevan aria-label y suman el contador al nombre", () => {
    render(
      <MenuActions
        visible
        profile={{ onClick: () => {}, avatar: "x", label: "Perfil" }}
        cart={{ onClick: () => {}, count: 3, label: "Carrito", countLabel: (n) => `${n} artículos` }}
        order={{ onClick: () => {}, count: 2, label: "Orden", countLabel: (n) => `${n} pedidos` }}
        pepper={{ onClick: () => {}, icon: <svg />, label: "Abrir Pepper" }}
      />,
    );
    expect(screen.getByRole("button", { name: "Perfil" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Carrito, 3 artículos" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Orden, 2 pedidos" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Abrir Pepper" })).toBeTruthy();
  });

  it("sin `order` no hay botón Orden", () => {
    render(
      <MenuActions
        visible
        profile={{ onClick: () => {}, avatar: "x", label: "Perfil" }}
        cart={{ onClick: () => {}, label: "Carrito" }}
      />,
    );
    expect(screen.queryByRole("button", { name: /Orden/ })).toBeNull();
  });

  it("PillButton dispara onClick", async () => {
    const onClick = vi.fn();
    render(<PillOrderButton onClick={onClick} aria-label="Orden" />);
    await userEvent.click(screen.getByRole("button", { name: "Orden" }));
    expect(onClick).toHaveBeenCalled();
  });
});

describe("RestaurantIntro", () => {
  const base = { name: "Saku", phase: "show" as const, welcomeText: "Hola", logoTransform: "", logoRef: { current: null }, labels: { title: "Bienvenida", skip: "Toca", logoAlt: "Logo" } };

  it("muestra el subtítulo tal cual y no inventa prefijos", () => {
    render(<RestaurantIntro {...base} subtitle="Mesa 12" onSkip={() => {}} />);
    expect(screen.getByText("Mesa 12")).toBeTruthy();
  });

  it("se puede saltar con Escape", async () => {
    const onSkip = vi.fn();
    render(<RestaurantIntro {...base} onSkip={onSkip} />);
    await userEvent.keyboard("{Escape}");
    expect(onSkip).toHaveBeenCalledTimes(1);
  });
});
