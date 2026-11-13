"use client";

import { Restaurant } from "../../interfaces/restaurante";
import { useCart } from "../../context/CartContext";
import { MenuHamburger } from "@even/ui";
import { useTranslations } from "next-intl";

interface MenuHeaderProps {
  restaurant: Restaurant;
  /** La píldora de acciones (perfil, carrito, Pepper) está abierta por el usuario */
  menuOpen: boolean;
  onToggleMenu: () => void;
}

export default function MenuHeader({
  menuOpen,
  onToggleMenu,
}: MenuHeaderProps) {
  const { state } = useCart();
  const t = useTranslations("MenuView");

  return (
    <header className="relative container mx-auto px-5 md:px-8 lg:px-10 pt-5 md:pt-7 lg:pt-9 z-5">
      <div className="flex items-center justify-end z-10">
        <MenuHamburger
          open={menuOpen}
          onToggle={onToggleMenu}
          count={state.totalItems}
          labels={{ open: t("openMenu"), close: t("closeMenu") }}
        />
      </div>
    </header>
  );
}
