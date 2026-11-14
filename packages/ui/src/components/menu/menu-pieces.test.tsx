import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CategoryTabs } from "./category-tabs";
import { FloatingCartButton } from "./floating-cart-button";
import { MenuEmptyState } from "./menu-empty-state";
import { MenuRestaurantHeading } from "./menu-restaurant-heading";
import { MenuSearchInput } from "./menu-search-input";

describe("MenuSearchInput", () => {
  it("es un buscador con nombre accesible y avisa de cada cambio", () => {
    const onChange = vi.fn();
    render(<MenuSearchInput value="" onChange={onChange} placeholder="Buscar platillo" />);
    const input = screen.getByRole("searchbox", { name: "Buscar platillo" });
    fireEvent.change(input, { target: { value: "tacos" } });
    expect(onChange).toHaveBeenCalledWith("tacos");
  });

  it("la X solo aparece con texto y limpia", async () => {
    const onClear = vi.fn();
    const { rerender } = render(
      <MenuSearchInput value="" onChange={() => {}} placeholder="Buscar" onClear={onClear} clearLabel="Borrar" />,
    );
    expect(screen.queryByRole("button", { name: "Borrar" })).toBeNull();
    rerender(<MenuSearchInput value="a" onChange={() => {}} placeholder="Buscar" onClear={onClear} clearLabel="Borrar" />);
    await userEvent.click(screen.getByRole("button", { name: "Borrar" }));
    expect(onClear).toHaveBeenCalled();
  });
});

describe("CategoryTabs", () => {
  const tabs = [
    { id: "Todo", label: "Todo" },
    { id: "Postres", label: "Postres" },
  ];

  it("marca la activa con aria-pressed y selecciona por id", async () => {
    const onSelect = vi.fn();
    render(<CategoryTabs tabs={tabs} activeId="Todo" onSelect={onSelect} aria-label="Categorías" />);
    expect(screen.getByRole("group", { name: "Categorías" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Todo" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Postres" }).getAttribute("aria-pressed")).toBe("false");
    await userEvent.click(screen.getByRole("button", { name: "Postres" }));
    expect(onSelect).toHaveBeenCalledWith("Postres");
  });

  it("dibuja la píldora bajo la activa", () => {
    render(<CategoryTabs tabs={tabs} activeId="Todo" onSelect={() => {}} aria-label="Categorías" />);
    expect(screen.getByTestId("category-pill")).toBeTruthy();
  });
});

describe("MenuEmptyState", () => {
  it("anuncia el mensaje como estado", () => {
    render(<MenuEmptyState message="Sin resultados" />);
    expect(screen.getByRole("status").textContent).toBe("Sin resultados");
  });
});

describe("FloatingCartButton", () => {
  it("no se muestra con carrito vacío ni oculto", () => {
    const { container, rerender } = render(<FloatingCartButton count={0} label="Ver el carrito" onClick={() => {}} />);
    expect(container.firstChild).toBeNull();
    rerender(<FloatingCartButton count={2} label="Ver el carrito • 2" onClick={() => {}} hidden />);
    expect(container.firstChild).toBeNull();
  });

  it("llama a onClick", async () => {
    const onClick = vi.fn();
    render(<FloatingCartButton count={2} label="Ver el carrito • 2" onClick={onClick} />);
    await userEvent.click(screen.getByRole("button", { name: "Ver el carrito • 2" }));
    expect(onClick).toHaveBeenCalled();
  });
});

describe("MenuRestaurantHeading", () => {
  it("muestra nombre, subtítulo y acciones; sin subtítulo no hay línea", () => {
    const { rerender, container } = render(
      <MenuRestaurantHeading name="Saku" subtitle="Mesa 12" actions={<button type="button">Reordenar</button>} />,
    );
    expect(screen.getByRole("heading", { name: "Saku" })).toBeTruthy();
    expect(screen.getByText("Mesa 12")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reordenar" })).toBeTruthy();
    rerender(<MenuRestaurantHeading name="Saku" />);
    expect(container.querySelector("p")).toBeNull();
  });
});
