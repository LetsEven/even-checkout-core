"use client";

import { Restaurant } from "../../interfaces/restaurant";
import { useCart } from "../../context/CartContext";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";

interface MenuHeaderProps {
  restaurant: Restaurant;
  /** La píldora de acciones (perfil, carrito, Pepper) está abierta por el usuario */
  menuOpen: boolean;
  onToggleMenu: () => void;
}

export default function MenuHeader({ menuOpen, onToggleMenu }: MenuHeaderProps) {
  const { state } = useCart();
  const t = useTranslations("MenuView");

  return (
    <header className="relative container mx-auto px-5 md:px-8 lg:px-10 pt-5 md:pt-7 lg:pt-9 z-5">
      <div className="flex items-center justify-end z-10">
        {/* id cart-icon / cart-badge: el contador del carrito vive en la hamburguesa */}
        <div className="relative group" id="cart-icon">
          <button
            type="button"
            onClick={onToggleMenu}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? t("closeMenu") : t("openMenu")}
            className="size-10 md:size-12 lg:size-14 rounded-full flex items-center justify-center bg-white/85 backdrop-blur-sm shadow-sm hover:scale-105 active:scale-95 transition-transform duration-200"
          >
            {menuOpen ? (
              <X className="text-primary size-5 md:size-6 lg:size-7" />
            ) : (
              <Menu className="text-primary size-5 md:size-6 lg:size-7" />
            )}
          </button>
          {state.totalItems > 0 && (
            <div
              id="cart-badge"
              className="absolute -top-1 -right-1 bg-even-grass text-even-evergreen rounded-full size-4 md:size-5 lg:size-6 flex items-center justify-center text-xs md:text-sm font-normal pointer-events-none"
            >
              {state.totalItems}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
