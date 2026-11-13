"use client";

import { useTranslations } from "next-intl";
import { RestaurantDetailSheet, DETAIL_ANIMATION_MS } from "@even/ui";
import { DEFAULT_IMAGES } from "@/app/constants/images";
import type { Restaurant } from "@/app/interfaces/restaurante";

export { DETAIL_ANIMATION_MS };

interface RestaurantDetailCardProps {
  restaurant: Restaurant;
  open: boolean;
  onClose: () => void;
}

/** Detalle del restaurante: datos y textos de la app sobre el sheet compartido de @even/ui. */
export default function RestaurantDetailCard({
  restaurant,
  open,
  onClose,
}: RestaurantDetailCardProps) {
  const t = useTranslations("RestaurantDetail");
  const tc = useTranslations("Common");

  return (
    <RestaurantDetailSheet
      open={open}
      onClose={onClose}
      name={restaurant.name}
      logoUrl={restaurant.logo_url || DEFAULT_IMAGES.RESTAURANT_LOGO}
      description={restaurant.description}
      address={restaurant.address}
      phone={restaurant.phone}
      email={restaurant.email}
      hours={restaurant.opening_hours}
      labels={{
        title: t("title"),
        logoAlt: tc("restaurantLogoAlt"),
        branch: "",
        changeBranch: "",
        address: t("address"),
        phone: t("phone"),
        email: t("email"),
        hours: t("hours"),
        closed: t("closed"),
        allDay: t("allDay"),
        days: {
          monday: t("days.monday"),
          tuesday: t("days.tuesday"),
          wednesday: t("days.wednesday"),
          thursday: t("days.thursday"),
          friday: t("days.friday"),
          saturday: t("days.saturday"),
          sunday: t("days.sunday"),
        },
      }}
    />
  );
}
