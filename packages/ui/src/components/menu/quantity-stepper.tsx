"use client";

import type { ReactNode, Ref } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "../../lib/cn";

export type QuantityStepperProps = {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  /** Valor mínimo: 0 en la tarjeta, 1 en el detalle. Con `value <= min` el "−" queda desactivado. */
  min?: number;
  /**
   * Marca el "+" como no disponible (agotado): se atenúa y lleva `aria-disabled`, pero SIGUE llamando a
   * `onIncrement` para que la app explique por qué (p. ej. abrir el modal de agotado).
   */
  disabled?: boolean;
  /** "pill" (tarjeta), "boxed" (footer del detalle), "compact" (opciones). Todas con área táctil >= 44 px. */
  variant?: "pill" | "boxed" | "compact";
  /** Con `value <= min` oculta el "−" y el número, dejando solo el "+" (tarjeta sin imagen). */
  collapseAtMin?: boolean;
  /** Ancla para `useFlyToCart`. */
  incrementRef?: Ref<HTMLButtonElement>;
  /** Sustituye el ícono del "−" (Trash2 en modo edición del detalle). */
  decrementIcon?: ReactNode;
  /** Resalta el control un instante tras sumar/restar. */
  pulse?: boolean;
  labels: { increment: string; decrement: string };
  className?: string;
};

// El tamaño visual lo da el botón; el pseudo-elemento (before:) lleva el área táctil a 44 px.
const variants = {
  pill: {
    root: "h-8 gap-1.5 rounded-full border border-stroke px-2 text-black md:h-9",
    button: "size-7 before:absolute before:-inset-2",
    icon: "size-4 md:size-5",
    value: "min-w-[1ch] text-base font-normal md:text-lg",
  },
  boxed: {
    root: "h-12 gap-2 rounded-full border border-stroke bg-white px-1 text-black md:h-14",
    button: "size-10 before:absolute before:-inset-0.5 md:size-12 md:before:inset-0",
    icon: "size-5 md:size-6",
    value: "min-w-[2ch] text-lg font-medium md:text-xl",
  },
  compact: {
    root: "gap-2 text-black",
    button: "size-8 rounded-full border border-stroke before:absolute before:-inset-1.5",
    icon: "size-4",
    value: "min-w-[2ch] text-base font-medium",
  },
} as const;

/** Control +/− de cantidad. Presentacional: la lógica del carrito vive en la app. */
export function QuantityStepper({
  value,
  onIncrement,
  onDecrement,
  min = 0,
  disabled = false,
  variant = "pill",
  collapseAtMin = false,
  incrementRef,
  decrementIcon,
  pulse = false,
  labels,
  className,
}: QuantityStepperProps) {
  const v = variants[variant];
  const atMin = value <= min;
  const collapsed = collapseAtMin && atMin;

  return (
    <div
      // El stepper vive dentro de tarjetas clicables: sus toques no deben abrirlas.
      onClick={(event) => event.stopPropagation()}
      className={cn(
        "flex shrink-0 items-center transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
        v.root,
        variant === "pill" && (pulse ? "scale-110 bg-even-grass/50" : "bg-surface"),
        className,
      )}
    >
      <div
        inert={collapsed}
        className={cn(
          "flex items-center overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          collapsed ? "mr-0 max-w-0 opacity-0" : "max-w-24 opacity-100",
        )}
      >
        <button
          type="button"
          onClick={onDecrement}
          disabled={atMin}
          aria-label={labels.decrement}
          className={cn(
            "relative flex shrink-0 items-center justify-center disabled:cursor-not-allowed disabled:opacity-30",
            v.button,
          )}
        >
          {decrementIcon ?? <Minus className={v.icon} aria-hidden />}
        </button>
        <span key={value} aria-live="polite" className={cn("animate-qty-pop text-center", v.value)}>
          {value}
        </span>
      </div>
      <button
        ref={incrementRef}
        type="button"
        onClick={onIncrement}
        aria-disabled={disabled || undefined}
        aria-label={labels.increment}
        className={cn(
          "relative flex shrink-0 items-center justify-center",
          disabled && "cursor-not-allowed opacity-30",
          v.button,
        )}
      >
        <Plus className={v.icon} aria-hidden />
      </button>
    </div>
  );
}
