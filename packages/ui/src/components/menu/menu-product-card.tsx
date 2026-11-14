"use client";

import { memo, type ReactNode, type Ref } from "react";
import { cn } from "../../lib/cn";
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
  /** Ancla para `useFlyToCart`. Solo existe mientras hay cantidad (el selector no se muestra en 0). */
  incrementRef?: Ref<HTMLButtonElement>;
  /** Ref del contenedor de la tarjeta (prefetch del detalle, origen del vuelo al carrito). */
  cardRef?: Ref<HTMLDivElement>;
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

const defaultFormat = (amount: number) => `$${amount.toFixed(2)}`;

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
  cardRef,
  formatPrice = defaultFormat,
  imageFallback,
  dataId,
  labels,
}: MenuProductCardProps) {
  const discounted = discountPercent > 0;
  const final = finalPrice ?? (discounted ? price * (1 - discountPercent / 100) : price);
  // Solo se muestra el selector si el producto ya está en el carrito: agregar es tocar la tarjeta.
  const showStepper = quantity > 0 && !outOfStock;
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
        ref={cardRef}
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
          {showStepper && (
            <QuantityStepper
              variant="pill"
              value={quantity}
              pulse={pulse}
              incrementRef={incrementRef}
              onIncrement={onIncrement}
              onDecrement={onDecrement}
              labels={stepperLabels}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      data-menu-item-id={dataId ?? String(id)}
      className="relative cursor-pointer border-b border-tone-300 py-4"
      onClick={(event) => onOpen(event.currentTarget)}
    >
      <div className="flex items-center gap-4">
        {/* Sin overflow-hidden en el contenedor externo: el selector sobresale de la foto. */}
        <div className="relative size-26 shrink-0">
          <div
            className={cn(
              "flex size-full items-center justify-center overflow-hidden rounded-xl bg-tone-300",
              outOfStock && "opacity-45 grayscale",
            )}
          >
            {imageUrl ? (
              <img src={imageUrl} alt={labels.imageAlt(name)} loading="lazy" className="size-full object-cover" />
            ) : (
              (imageFallback ?? <EvenAsterisk className="size-16 text-even-evergreen" />)
            )}
          </div>
          {discounted && (
            <div className="absolute top-0 left-0 overflow-hidden rounded-tl-xl">
              <span className="block bg-danger-600 px-2 pt-1 pb-0.5 text-[11px] font-bold tracking-wide text-white">
                {labels.discount(discountPercent)}
              </span>
            </div>
          )}
          {outOfStock && (
            <div className="absolute inset-x-0 bottom-1.5 flex justify-center">
              <span className="block rounded-full bg-danger-600 px-2 py-0.5 text-[11px] font-bold tracking-wide text-white">
                {labels.outOfStock}
              </span>
            </div>
          )}
          {showStepper && (
            <QuantityStepper
              variant="floating"
              value={quantity}
              pulse={pulse}
              incrementRef={incrementRef}
              onIncrement={onIncrement}
              onDecrement={onDecrement}
              labels={stepperLabels}
              className="absolute -right-1 -bottom-1"
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 wrap-break-word text-base font-semibold leading-tight text-black">{nameButton}</h3>
          {features.length > 0 && (
            <div className="mt-1 flex items-center gap-1 overflow-hidden whitespace-nowrap">
              <span className="text-[13px] font-semibold text-black">{features[0]}</span>
              {features.slice(1, 3).map((feature, index) => (
                <span
                  key={index}
                  className="rounded-full border border-stroke-soft/50 px-1.5 py-px text-[11px] text-black"
                >
                  {feature}
                </span>
              ))}
              {features.length > 3 && <span className="text-[11px] text-tone-600">+{features.length - 3}</span>}
            </div>
          )}
          {description && <p className="mt-1 line-clamp-2 text-[13px] leading-[18px] text-tone-600">{description}</p>}
          <div className="mt-1.5 flex items-baseline gap-1.5">
            {discounted ? (
              <>
                <span className="text-[15px] font-bold text-danger-700">{formatPrice(final)}</span>
                <span className="text-xs text-text-subtle line-through">{formatPrice(price)}</span>
              </>
            ) : (
              <span className="text-[15px] font-bold text-black">{formatPrice(final)}</span>
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
