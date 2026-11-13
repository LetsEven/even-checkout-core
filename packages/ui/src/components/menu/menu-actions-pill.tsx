"use client";

import type { ReactNode } from "react";
import { Menu, ShoppingCart, UserCircle, X } from "lucide-react";
import { cn } from "../../lib/cn";

export type MenuHamburgerProps = {
  open: boolean;
  onToggle: () => void;
  /** Contador del carrito sobre la hamburguesa. */
  count?: number;
  labels: { open: string; close: string };
};

/**
 * Botón del header del menú que abre la píldora de acciones. Conserva `#cart-icon` y `#cart-badge`
 * porque `useFlyToCart` (@even/cart) anima el platillo hasta ellos.
 */
export function MenuHamburger({ open, onToggle, count = 0, labels }: MenuHamburgerProps) {
  return (
    <div className="relative group" id="cart-icon">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-label={open ? labels.close : labels.open}
        className="size-10 md:size-12 lg:size-14 rounded-full flex items-center justify-center bg-white/85 backdrop-blur-sm shadow-sm hover:scale-105 active:scale-95 transition-transform duration-200"
      >
        {open ? (
          <X className="text-primary size-5 md:size-6 lg:size-7" />
        ) : (
          <Menu className="text-primary size-5 md:size-6 lg:size-7" />
        )}
      </button>
      {count > 0 && (
        <div
          id="cart-badge"
          className="absolute -top-1 -right-1 bg-even-grass text-even-evergreen rounded-full size-4 md:size-5 lg:size-6 flex items-center justify-center text-xs md:text-sm font-normal pointer-events-none"
        >
          {count}
        </div>
      )}
    </div>
  );
}

export type MenuActionsPillProps = {
  /** Visible por la hamburguesa o por scroll; la app decide. */
  visible: boolean;
  children: ReactNode;
};

/** Píldora fija arriba con las acciones del menú. Los hijos son `PillButton` y `PillPepperButton`. */
export function MenuActionsPill({ visible, children }: MenuActionsPillProps) {
  return (
    <div
      className="reduce-motion-fade fixed top-0 inset-x-0 z-40 flex justify-center px-4 pt-4 pb-3"
      inert={!visible}
      aria-hidden={!visible}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : "translateY(-0.75rem) scale(0.97)",
        transition: "opacity 200ms ease, transform 250ms cubic-bezier(0.32, 0.72, 0, 1)",
        // El contenedor ocupa todo el ancho: no debe interceptar toques (la hamburguesa queda debajo).
        pointerEvents: "none",
      }}
    >
      <div
        className="flex items-center gap-4 md:gap-5 rounded-full px-6 md:px-7 py-3 md:py-3.5 shadow-lg border border-white/40"
        style={{
          pointerEvents: visible ? "auto" : "none",
          background: "rgba(255, 255, 255, 0.82)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export type PillButtonProps = {
  onClick: () => void;
  "aria-label"?: string;
  /** Contador sobre el botón (carrito, pedidos). */
  count?: number;
  /** Recorta el contenido al círculo (foto de perfil). */
  clip?: boolean;
  children: ReactNode;
};

export function PillButton({ onClick, count = 0, clip, children, "aria-label": ariaLabel }: PillButtonProps) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className={cn(
          "size-11 md:size-12 rounded-full flex items-center justify-center bg-white/60 border border-tone-200 hover:bg-white transition-colors active:scale-95",
          clip && "overflow-hidden",
        )}
      >
        {children}
      </button>
      {count > 0 && (
        <div className="absolute -top-1 -right-1 bg-even-grass text-even-evergreen rounded-full size-5 flex items-center justify-center text-xs font-normal">
          {count}
        </div>
      )}
    </div>
  );
}

/** Botón de carrito con el estilo de la píldora. */
export function PillCartButton({ onClick, count, "aria-label": ariaLabel }: { onClick: () => void; count?: number; "aria-label"?: string }) {
  return (
    <PillButton onClick={onClick} count={count} aria-label={ariaLabel}>
      <ShoppingCart className="size-5 md:size-6 text-warm-700" strokeWidth={1.5} />
    </PillButton>
  );
}

/** Botón del asistente: el ícono lo pone la app (`PepperIcon`). */
export function PillPepperButton({ onClick, children, "aria-label": ariaLabel }: { onClick: () => void; children: ReactNode; "aria-label"?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="size-12 md:size-14 overflow-hidden transition-colors active:scale-95"
    >
      {children}
    </button>
  );
}

export type UserAvatarProps = {
  isAuthenticated: boolean;
  profile: { photoUrl?: string; firstName?: string } | null;
  /** Texto alternativo de la foto de perfil. */
  alt: string;
  iconSize?: string;
  textSize?: string;
};

/** Foto, inicial o ícono del usuario, según haya sesión. */
export function UserAvatar({
  isAuthenticated,
  profile,
  alt,
  iconSize = "size-6 md:size-7 lg:size-8",
  textSize = "text-base md:text-lg lg:text-xl",
}: UserAvatarProps) {
  if (isAuthenticated && profile?.photoUrl) {
    return <img src={profile.photoUrl} alt={alt} className="w-full h-full object-cover" />;
  }
  if (isAuthenticated && profile?.firstName) {
    return (
      <span className={cn("text-warm-800 font-semibold select-none", textSize)}>
        {profile.firstName.charAt(0).toUpperCase()}
      </span>
    );
  }
  return <UserCircle className={cn("text-warm-500", iconSize)} strokeWidth={1.2} />;
}
