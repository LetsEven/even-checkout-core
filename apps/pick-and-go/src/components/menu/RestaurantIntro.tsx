"use client";

import type { RefObject } from "react";
import { useTranslations } from "next-intl";
import type { Restaurant } from "../../interfaces/restaurant";

export type IntroPhase = "show" | "fly" | "done";

export const INTRO_SHOW_MS = 2500;
export const INTRO_FLY_MS = 700;

const EASING = "cubic-bezier(0.32, 0.72, 0, 1)";

interface RestaurantIntroProps {
  restaurant: Restaurant;
  phase: Exclude<IntroPhase, "done">;
  branchName: string | null;
  welcomeText: string;
  /** transform que lleva el logo hasta el del banner (vacío = en reposo) */
  logoTransform: string;
  logoRef: RefObject<HTMLDivElement | null>;
  onSkip: () => void;
}

/**
 * Pantalla de bienvenida: tarjeta mínima sobre el menú con logo grande,
 * nombre, sucursal y saludo. Al terminar, el logo viaja hasta el del banner
 * mientras la tarjeta se desvanece.
 */
export default function RestaurantIntro({
  restaurant,
  phase,
  branchName,
  welcomeText,
  logoTransform,
  logoRef,
  onSkip,
}: RestaurantIntroProps) {
  const t = useTranslations("RestaurantIntro");
  const tc = useTranslations("Common");
  const flying = phase === "fly";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("title")}
      className="fixed inset-0 z-[60]"
      style={{ pointerEvents: flying ? "none" : "auto" }}
      onClick={onSkip}
    >
      {/* Tarjeta: misma zona que la tarjeta del menú */}
      <div
        className="absolute inset-x-0 bottom-0 top-[8.25rem] md:top-[20.75rem] lg:top-[25.75rem] bg-white rounded-t-4xl flex flex-col items-center px-6 md:px-8 lg:px-10 pt-44 md:pt-52 text-center"
        style={{
          opacity: flying ? 0 : 1,
          transform: flying ? "translateY(2rem)" : "translateY(0)",
          transition: `opacity ${INTRO_FLY_MS * 0.7}ms ${EASING}, transform ${INTRO_FLY_MS}ms ${EASING}`,
        }}
      >
        <h2 className="text-2xl md:text-3xl font-medium text-black">
          {restaurant.name}
        </h2>
        {branchName && (
          <p className="mt-1 text-tone-600 text-sm md:text-base">
            {tc("branchLabel")}{" "}
            <span className="font-medium text-black">{branchName}</span>
          </p>
        )}
        <p className="mt-6 text-lg md:text-xl text-black">{welcomeText}</p>
        <p className="mt-auto mb-10 text-xs md:text-sm text-tone-600">
          {t("skip")}
        </p>
      </div>

      {/* Logo: vive fuera de la tarjeta para poder viajar al banner */}
      <div className="pointer-events-none absolute inset-x-0 top-[8.25rem] md:top-[20.75rem] lg:top-[25.75rem] flex justify-center pt-8">
        <div
          ref={logoRef}
          className="size-28 md:size-36 rounded-full bg-even-evergreen overflow-hidden border border-white/70 shadow-sm"
          style={{
            transformOrigin: "top left",
            transform: logoTransform || "none",
            transition: `transform ${INTRO_FLY_MS}ms ${EASING}`,
          }}
        >
          {restaurant.logo_url && (
            <img
              src={restaurant.logo_url}
              alt={tc("restaurantLogoAlt")}
              className="w-full h-full object-cover"
            />
          )}
        </div>
      </div>
    </div>
  );
}
