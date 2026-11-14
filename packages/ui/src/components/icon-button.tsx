import type { ComponentProps } from "react";
import { cn } from "../lib/cn";

const variants = {
  /** Círculo blanco con borde: cerrar, volver, +/- de cantidad. */
  default: "border border-tone-300 bg-white text-even-evergreen hover:bg-tone-200",
  primary: "bg-even-grass text-even-evergreen hover:opacity-90",
  ghost: "bg-transparent text-current hover:bg-black/5",
} as const;

const sizes = {
  // El tamaño visual no cambia; el área táctil llega a 44 px con un pseudo-elemento (before:).
  sm: "size-8 before:absolute before:-inset-1.5",
  md: "size-10 before:absolute before:-inset-0.5 md:size-12 md:before:inset-0 lg:size-14",
} as const;

export type IconButtonProps = ComponentProps<"button"> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  /** Obligatorio: el botón solo tiene un icono. */
  "aria-label": string;
};

export function IconButton({ variant = "default", size = "md", type = "button", className, ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full transition-transform duration-200 active:scale-95",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-even-evergreen",
        "disabled:pointer-events-none disabled:opacity-40",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
