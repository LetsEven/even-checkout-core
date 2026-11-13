"use client";

import type { RefObject } from "react";
import { useTranslations } from "next-intl";
import { RestaurantIntro as SharedIntro, type IntroPhase } from "@even/ui";
import type { Restaurant } from "../../interfaces/restaurant";

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
  ...props
}: RestaurantIntroProps) {
  const t = useTranslations("RestaurantIntro");
  const tc = useTranslations("Common");

  return (
    <SharedIntro
      {...props}
      name={restaurant.name}
      logoUrl={restaurant.logo_url}
      labels={{
        title: t("title"),
        skip: t("skip"),
        logoAlt: tc("restaurantLogoAlt"),
        branchLabel: tc("branchLabel"),
      }}
    />
  );
}
