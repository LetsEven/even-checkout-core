"use client";

import { useEffect, type ReactNode } from "react";
import { Menu, ShoppingCart, X } from "lucide-react";
import { cn } from "../../lib/cn";

export type MenuFabProps = {
  open: boolean;
  onToggle: () => void;
  /** Artículos en el carrito. Con más de 0 el botón se pone verde y cambia al ícono del carrito. */
  count?: number;
  /** Oculto mientras hay otra capa encima (bienvenida, detalle, modales). */
  hidden?: boolean;
  /** Texto del contador para lectores de pantalla: "3 artículos". Se agrega al nombre del botón. */
  countLabel?: (count: number) => string;
  labels: { open: string; close: string };
};

/**
 * Botón flotante abajo a la derecha que abre las acciones del menú (perfil, carrito, Pepper).
 * Es interactivo: con el carrito vacío es la hamburguesa; con artículos se vuelve verde y muestra el carrito.
 * Conserva `#cart-icon` y `#cart-badge` porque `useFlyToCart` (@even/cart) anima el platillo hasta ellos.
 */
export function MenuFab({ open, onToggle, count = 0, hidden = false, countLabel, labels }: MenuFabProps) {
  const hasItems = count > 0;
  const base = open ? labels.close : labels.open;
  const label = hasItems && countLabel ? `${base}, ${countLabel(count)}` : base;

  return (
    <div
      id="cart-icon"
      className={cn(
        "fixed right-5 z-[60] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] md:right-8",
        hidden && "pointer-events-none translate-y-4 opacity-0",
      )}
      style={{ bottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      inert={hidden}
      aria-hidden={hidden}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-label={label}
        // before: área táctil de 64 px sobre un botón de 56 px.
        className={cn(
          "relative flex size-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 before:absolute before:-inset-1 active:scale-90 md:size-16",
          hasItems
            ? "bg-even-grass text-even-evergreen"
            : "border border-white/40 bg-white/85 text-primary backdrop-blur-sm",
        )}
      >
        <FabIcon>
          {open ? <X className="size-6 md:size-7" /> : hasItems ? <ShoppingCart className="size-6 md:size-7" /> : <Menu className="size-6 md:size-7" />}
        </FabIcon>
      </button>
      {hasItems && (
        <div
          id="cart-badge"
          key={count}
          className="pointer-events-none absolute -top-1 -left-1 flex size-6 animate-qty-pop items-center justify-center rounded-full bg-even-evergreen text-xs font-medium text-white md:size-7 md:text-sm"
        >
          {count}
        </div>
      )}
    </div>
  );
}

function FabIcon({ children }: { children: ReactNode }) {
  return <span className="flex items-center justify-center">{children}</span>;
}

export type MenuActionsModalProps = {
  open: boolean;
  onClose: () => void;
  /** Nombre accesible del diálogo ("Menú"). */
  label: string;
  children: ReactNode;
};

/**
 * Fondo desenfocado a pantalla completa con la píldora de acciones hacia el centro (un poco abajo).
 * Se cierra con Escape, tocando fuera de la píldora o con el mismo botón flotante.
 * Los hijos son `PillButton`, `PillCartButton` y `PillPepperButton`.
 */
export function MenuActionsModal({ open, onClose, label, children }: MenuActionsModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <div
      data-testid="menu-actions-backdrop"
      className="reduce-motion-fade fixed inset-0 z-[55] flex items-center justify-center bg-black/30 backdrop-blur-md transition-opacity duration-200"
      style={{ opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }}
      inert={!open}
      aria-hidden={!open}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="flex items-center gap-4 rounded-full border border-white/40 px-6 py-3 shadow-lg transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] md:gap-5 md:px-7 md:py-3.5"
        style={{
          background: "rgba(255, 255, 255, 0.82)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          transform: open ? "translateY(12vh) scale(1)" : "translateY(14vh) scale(0.96)",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
