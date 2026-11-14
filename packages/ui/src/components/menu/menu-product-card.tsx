"use client";

import { memo, type ReactNode, type Ref } from "react";
import { EvenAsterisk } from "../even-asterisk";
import { QuantityStepper } from "./quantity-stepper";

export type MenuProductCardProps = {
  id: string | number;
  name: string;
  description?: string | null;
  /** Precio de lista. */
  price: number;
  /** Precio final ya calculado (el descuento admin/personal lo resuelve la app). Por defecto, `price` menos `discountPercent`. */
  finalPrice?: number;
  discountPercent?: number;
  imageUrl?: string | null;
  /** "image" (con foto) o "compact" (menu_show_images = false). */
  variant: "image" | "compact";
  features?: string[];
  outOfStock?: boolean;
  quantity: number;
  /** Resalta el stepper un instante tras sumar/restar; lo controla la app. */
  pulse?: boolean;
  /** Abrir el detalle. Recibe el elemento de la tarjeta (para `rememberMenuPosition`). */
  onOpen: (card: HTMLElement) => void;
  onIncrement: () => void;
  onDecrement: () => void;
  /** Ancla para `useFlyToCart`. */
  incrementRef?: Ref<HTMLButtonElement>;
  formatPrice?: (amount: number) => string;
  /** Sin foto: por defecto, el asterisco Even. */
  imageFallback?: ReactNode;
  /** Valor de `data-menu-item-id` (restauración de scroll). Por defecto, `id`. */
  dataId?: string;
  labels: {
    outOfStock: string;
    /** "20% OFF" */
    discount: (percent: number) => string;
    /** "Agregar Tacos" */
    increment: (name: string) => string;
    decrement: (name: string) => string;
    imageAlt: (name: string) => string;
  };
};

const defaultFormat = (amount: number) => `$${amount.toFixed(2)} MXN`;

/**
 * Tarjeta de producto del menú, solo presentación: no conoce el carrito, la navegación ni el stock.
 * Toda la tarjeta abre el detalle con el puntero; con teclado, el nombre es un botón.
 */
function MenuProductCardBase({
  id,
  name,
  description,
  price,
  finalPrice,
  discountPercent = 0,
  imageUrl,
  variant,
  features = [],
  outOfStock = false,
  quantity,
  pulse,
  onOpen,
  onIncrement,
  onDecrement,
  incrementRef,
  formatPrice = defaultFormat,
  imageFallback,
  dataId,
  labels,
}: MenuProductCardProps) {
  const discounted = discountPercent > 0;
  const final = finalPrice ?? (discounted ? price * (1 - discountPercent / 100) : price);
  const stepperLabels = { increment: labels.increment(name), decrement: labels.decrement(name) };

  // El nombre es el único foco de teclado de la tarjeta; su click sube hasta el contenedor y abre una sola vez.
  const nameButton = (
    <button type="button" className="block max-w-full text-left capitalize focus-visible:underline">
      {name}
    </button>
  );

  if (variant === "compact") {
    return (
      <div
        data-menu-item-id={dataId ?? String(id)}
        className="cursor-pointer border-b border-tone-300 py-3 md:py-4"
        onClick={(event) => onOpen(event.currentTarget)}
      >
        <div className="flex items-center gap-3 md:gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="line-clamp-1 wrap-break-word text-base font-medium leading-tight text-black md:text-lg lg:text-xl">
                {nameButton}
              </h3>
              <div className="shrink-0 whitespace-nowrap">
                {discounted && (
                  <span className="mr-1.5 text-xs text-text-subtle line-through md:text-sm">{formatPrice(price)}</span>
                )}
                <span className="text-base font-medium text-black md:text-lg lg:text-xl">{formatPrice(final)}</span>
              </div>
            </div>
            {(description || discounted || outOfStock) && (
              <div className="mt-0.5 flex items-center gap-2 md:mt-1">
                <p className="min-w-0 flex-1 line-clamp-1 text-sm text-text-subtle md:text-base">{description}</p>
                {discounted && <Badge>{labels.discount(discountPercent)}</Badge>}
                {outOfStock && <Badge>{labels.outOfStock}</Badge>}
              </div>
            )}
          </div>
          <QuantityStepper
            variant="pill"
            collapseAtMin
            value={quantity}
            disabled={outOfStock}
            pulse={pulse}
            incrementRef={incrementRef}
            onIncrement={onIncrement}
            onDecrement={onDecrement}
            labels={stepperLabels}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      data-menu-item-id={dataId ?? String(id)}
      className="relative cursor-pointer border-b border-tone-300 py-4 md:py-6 lg:py-7"
      onClick={(event) => onOpen(event.currentTarget)}
    >
      <div className="flex items-center gap-4 md:gap-5 lg:gap-6">
        <div className="relative size-36 shrink-0 md:size-40 lg:size-44">
          <div className="flex size-full items-center justify-center overflow-hidden rounded-xl bg-tone-300 transition-transform duration-200 hover:scale-105 md:rounded-2xl">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={labels.imageAlt(name)}
                loading="lazy"
                className="size-full rounded-xl object-cover md:rounded-2xl"
              />
            ) : (
              (imageFallback ?? <EvenAsterisk className="size-18 text-even-evergreen md:size-20 lg:size-22" />)
            )}
          </div>
          {discounted && (
            <div className="absolute top-0 left-0 overflow-hidden rounded-tl-xl md:rounded-tl-2xl">
              <span className="block bg-danger-600 px-2 pt-1 pb-0.5 text-[11px] font-bold tracking-wide text-white md:text-xs">
                {labels.discount(discountPercent)}
              </span>
            </div>
          )}
          {outOfStock && (
            <div className="absolute right-0 bottom-0 overflow-hidden rounded-br-xl md:rounded-br-2xl">
              <span className="block bg-danger-600 px-2 py-0.5 text-xs font-bold tracking-wide text-white">
                {labels.outOfStock}
              </span>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex justify-between gap-2">
            <h3 className="line-clamp-2 wrap-break-word text-lg font-medium leading-tight text-black md:text-xl lg:text-2xl">
              {nameButton}
            </h3>
            <QuantityStepper
              variant="pill"
              value={quantity}
              disabled={outOfStock}
              pulse={pulse}
              incrementRef={incrementRef}
              onIncrement={onIncrement}
              onDecrement={onDecrement}
              labels={stepperLabels}
              className="h-fit"
            />
          </div>
          {features.length > 0 && (
            <div className="mt-1 mb-3 flex gap-1 md:mt-2 md:mb-4 md:gap-1.5">
              {features.map((feature) => (
                <div
                  key={feature}
                  className="rounded-3xl border border-stroke-soft/50 px-3 py-1 text-sm font-medium text-black shadow-sm md:px-4 md:py-1.5 md:text-base lg:text-lg"
                >
                  {feature}
                </div>
              ))}
            </div>
          )}
          {description && (
            <p className="mt-1.5 line-clamp-3 text-base leading-4 text-black/70 md:mt-2.5 md:text-lg md:leading-5 lg:text-xl lg:leading-6">
              {description}
            </p>
          )}
          <div className="mt-2 flex items-center justify-between md:mt-3">
            {discounted ? (
              <div className="flex flex-col text-base text-black md:text-lg lg:text-xl">
                <span className="text-xs text-text-subtle line-through md:text-sm lg:text-base">{formatPrice(price)}</span>
                <span className="-translate-y-1">{formatPrice(final)}</span>
              </div>
            ) : (
              <span className="text-base text-black md:text-lg lg:text-xl">{formatPrice(final)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="shrink-0 bg-danger-600 px-2 py-0.5 text-[11px] font-bold tracking-wide text-white md:text-xs">
      {children}
    </span>
  );
}

export const MenuProductCard = memo(MenuProductCardBase);
