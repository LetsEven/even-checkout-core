import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MenuProductCard, type MenuProductCardProps } from "./menu-product-card";
import { QuantityStepper } from "./quantity-stepper";

const stepperLabels = { increment: "Agregar", decrement: "Quitar" };

describe("QuantityStepper", () => {
  it("suma y resta con botones reales y sin propagar el click", async () => {
    const onIncrement = vi.fn();
    const onDecrement = vi.fn();
    const onParent = vi.fn();
    render(
      <div onClick={onParent}>
        <QuantityStepper value={2} onIncrement={onIncrement} onDecrement={onDecrement} labels={stepperLabels} />
      </div>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Agregar" }));
    await userEvent.click(screen.getByRole("button", { name: "Quitar" }));
    expect(onIncrement).toHaveBeenCalledTimes(1);
    expect(onDecrement).toHaveBeenCalledTimes(1);
    expect(onParent).not.toHaveBeenCalled();
  });

  it("desactiva el menos en el mínimo", () => {
    render(<QuantityStepper value={1} min={1} onIncrement={() => {}} onDecrement={() => {}} labels={stepperLabels} />);
    expect(screen.getByRole("button", { name: "Quitar" })).toHaveProperty("disabled", true);
  });

  it("con disabled el más es aria-disabled pero sigue avisando (para el modal de agotado)", async () => {
    const onIncrement = vi.fn();
    render(<QuantityStepper value={0} disabled onIncrement={onIncrement} onDecrement={() => {}} labels={stepperLabels} />);
    const plus = screen.getByRole("button", { name: "Agregar" });
    expect(plus.getAttribute("aria-disabled")).toBe("true");
    await userEvent.click(plus);
    expect(onIncrement).toHaveBeenCalledTimes(1);
  });

  it("collapseAtMin esconde el menos (inert) en 0 y lo muestra después", () => {
    const { rerender } = render(
      <QuantityStepper value={0} collapseAtMin onIncrement={() => {}} onDecrement={() => {}} labels={stepperLabels} />,
    );
    expect(screen.getByText("0").parentElement?.hasAttribute("inert")).toBe(true);
    rerender(<QuantityStepper value={1} collapseAtMin onIncrement={() => {}} onDecrement={() => {}} labels={stepperLabels} />);
    expect(screen.getByText("1").parentElement?.hasAttribute("inert")).toBe(false);
  });

  it("entrega la ref del más (useFlyToCart)", () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(<QuantityStepper value={0} incrementRef={ref} onIncrement={() => {}} onDecrement={() => {}} labels={stepperLabels} />);
    expect(ref.current).toBe(screen.getByRole("button", { name: "Agregar" }));
  });
});

function card(overrides: Partial<MenuProductCardProps> = {}) {
  const props: MenuProductCardProps = {
    id: 7,
    name: "tacos",
    description: "Con piña",
    price: 100,
    variant: "image",
    quantity: 1,
    onOpen: vi.fn(),
    onIncrement: vi.fn(),
    onDecrement: vi.fn(),
    labels: {
      outOfStock: "Agotado",
      discount: (p) => `${p}% OFF`,
      increment: (n) => `Agregar ${n}`,
      decrement: (n) => `Quitar ${n}`,
      imageAlt: (n) => `Foto de ${n}`,
    },
    ...overrides,
  };
  return { props, ...render(<MenuProductCard {...props} />) };
}

describe.each(["image", "compact"] as const)("MenuProductCard (%s)", (variant) => {
  it("emite data-menu-item-id y abre una sola vez con la tarjeta o con el nombre", async () => {
    const { props, container } = card({ variant });
    expect(container.querySelector('[data-menu-item-id="7"]')).not.toBeNull();
    await userEvent.click(screen.getByText("Con piña"));
    expect(props.onOpen).toHaveBeenCalledTimes(1);
    expect(vi.mocked(props.onOpen).mock.calls[0][0]).toBe(container.firstElementChild);
    await userEvent.click(screen.getByRole("button", { name: "tacos" }));
    expect(props.onOpen).toHaveBeenCalledTimes(2);
  });

  it("los botones +/− no abren el detalle", async () => {
    const { props } = card({ variant });
    await userEvent.click(screen.getByRole("button", { name: "Agregar tacos" }));
    await userEvent.click(screen.getByRole("button", { name: "Quitar tacos" }));
    expect(props.onIncrement).toHaveBeenCalledTimes(1);
    expect(props.onDecrement).toHaveBeenCalledTimes(1);
    expect(props.onOpen).not.toHaveBeenCalled();
  });

  it("muestra descuento (precio final calculado) y agotado", () => {
    card({ variant, discountPercent: 20, outOfStock: true });
    expect(screen.getAllByText("20% OFF").length).toBeGreaterThan(0);
    expect(screen.getByText("Agotado")).toBeTruthy();
    expect(screen.getByText("$100.00 MXN")).toBeTruthy(); // tachado
    expect(screen.getByText("$80.00 MXN")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Agregar tacos" }).getAttribute("aria-disabled")).toBe("true");
  });

  it("usa formatPrice y finalPrice de la app", () => {
    card({ variant, finalPrice: 55, formatPrice: (n) => `MX$${n}` });
    expect(screen.getByText("MX$55")).toBeTruthy();
  });
});

describe("MenuProductCard imagen", () => {
  it("con foto pone el alt del nombre; sin foto usa el fallback", () => {
    const { rerender, props } = card({ imageUrl: "/a.jpg" });
    expect(screen.getByAltText("Foto de tacos")).toBeTruthy();
    rerender(<MenuProductCard {...props} imageUrl={null} imageFallback={<i data-testid="fb" />} />);
    expect(screen.queryByAltText("Foto de tacos")).toBeNull();
    expect(screen.getByTestId("fb")).toBeTruthy();
  });
});
