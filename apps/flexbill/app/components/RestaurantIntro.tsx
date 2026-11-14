"use client";

import type { RefObject } from "react";
import { useTranslations } from "next-intl";
import { RestaurantIntro as SharedIntro, type IntroPhase } from "@even/ui";
import { DEFAULT_IMAGES } from "@/app/constants/images";
import type { Restaurant } from "@/app/interfaces/restaurante";

interface RestaurantIntroProps {
  restaurant: Restaurant;
  phase: Exclude<IntroPhase, "done">;
  branchName: string | null;
  welcomeText: string;
  logoTransform: string;
  logoRef: RefObject<HTMLDivElement | null>;
  onSkip: () => void;
}

/** Bienvenida de Pick & Go: textos de la app sobre la pantalla compartida de @even/ui. */
export default function RestaurantIntro({
  restaurant,
  branchName,
  ...props
}: RestaurantIntroProps) {
  const t = useTranslations("RestaurantIntro");
  const tc = useTranslations("Common");

  return (
    <SharedIntro
      {...props}
      subtitle={branchName}
      name={restaurant.name}
      logoUrl={restaurant.logo_url || DEFAULT_IMAGES.RESTAURANT_LOGO}
      labels={{
        title: t("title"),
        skip: t("skip"),
        logoAlt: tc("restaurantLogoAlt"),
      }}
    />
  );
}
