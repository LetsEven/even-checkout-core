"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useTranslations } from "next-intl";
import type { Restaurant } from "../../interfaces/restaurant";

export type IntroPhase = "show" | "fly" | "done";

export const INTRO_SHOW_MS = 2800;
export const INTRO_FLY_MS = 700;

const EASING = "cubic-bezier(0.32, 0.72, 0, 1)";
const CARD_TOP = "top-(--menu-card-top)";
const LOGO_SIZE = "size-36 md:size-48";

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

interface Slot {
  left: number;
  top: number;
  size: number;
}

/**
 * Pantalla de bienvenida: tarjeta sobre el menú con logo grande, nombre,
 * sucursal y saludo. Entra en crossfade desde la pantalla de carga (mismo
 * verde de fondo que se desvanece) y al terminar el logo viaja hasta el del
 * banner mientras la tarjeta se desvanece.
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

  // Entrada: el primer render va "oculto" y pasa a visible en el siguiente frame
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() =>
      requestAnimationFrame(() => setEntered(true)),
    );
    return () => cancelAnimationFrame(frame);
  }, []);

  // El logo es independiente de la tarjeta (para poder viajar al banner):
  // se posiciona sobre un hueco reservado dentro del contenido.
  const slotRef = useRef<HTMLDivElement>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  useLayoutEffect(() => {
    const measure = () => {
      if (flying) return;
      const rect = slotRef.current?.getBoundingClientRect();
      if (rect) setSlot({ left: rect.left, top: rect.top, size: rect.width });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [flying]);

  const visible = entered && !flying;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("title")}
      className="fixed inset-0 z-[60]"
      style={{ pointerEvents: flying ? "none" : "auto" }}
      onClick={onSkip}
    >
      {/* Tarjeta blanca opaca desde el primer frame: misma zona que la tarjeta
          del menú. Solo se desvanece al salir, nunca al entrar. */}
      <div
        aria-hidden
        className={`reduce-motion-fade absolute inset-x-0 bottom-0 ${CARD_TOP} bg-white rounded-t-4xl`}
        style={{
          opacity: flying ? 0 : 1,
          transform: flying ? "translateY(2rem)" : "none",
          transition: flying
            ? `opacity ${INTRO_FLY_MS * 0.7}ms ${EASING}, transform ${INTRO_FLY_MS}ms ${EASING}`
            : "none",
        }}
      />

      {/* Fondo verde opaco desde el primer frame (continuación de la pantalla
          de carga, cubre menú y banner). Se desvanece al entrar la intro,
          revelando la tarjeta blanca ya opaca: el menú nunca se ve. */}
      <div
        aria-hidden
        className="reduce-motion-fade absolute inset-0 bg-even-evergreen pointer-events-none"
        style={{
          opacity: entered ? 0 : 1,
          transition: "opacity 800ms ease 250ms",
        }}
      />

      {/* Contenido centrado en la tarjeta */}
      <div
        className={`absolute inset-x-0 bottom-0 ${CARD_TOP} flex flex-col items-center justify-center px-6 md:px-10 pb-14 text-center`}
      >
        <div ref={slotRef} className={`${LOGO_SIZE} shrink-0`} />
        <div
          className="reduce-motion-fade mt-6 md:mt-8 flex flex-col items-center"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(0.75rem)",
            transition: flying
              ? `opacity ${INTRO_FLY_MS * 0.5}ms ease`
              : `opacity 600ms ease 600ms, transform 700ms ${EASING} 600ms`,
          }}
        >
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-black text-balance">
            {restaurant.name}
          </h2>
          {branchName && (
            <p className="mt-1 text-tone-600 text-sm md:text-lg">
              {tc("branchLabel")}{" "}
              <span className="font-medium text-black">{branchName}</span>
            </p>
          )}
          <p className="mt-6 md:mt-8 text-xl md:text-3xl text-black text-balance">
            {welcomeText}
          </p>
        </div>
        <p
          className="reduce-motion-fade absolute bottom-6 text-xs md:text-sm text-tone-600"
          style={{
            opacity: visible ? 1 : 0,
            transition: "opacity 400ms ease 1000ms",
          }}
        >
          {t("skip")}
        </p>
      </div>

      {/* Logo: fuera de la tarjeta para poder viajar al banner */}
      {slot && (
        <div
          className="pointer-events-none fixed"
          style={{
            left: slot.left,
            top: slot.top,
            width: slot.size,
            height: slot.size,
          }}
        >
          <div
            ref={logoRef}
            className="reduce-motion-fade size-full rounded-full bg-even-evergreen overflow-hidden border border-white/70 shadow-sm"
            style={{
              transformOrigin: "top left",
              transform: logoTransform || "none",
              opacity: entered ? 1 : 0,
              transition: `transform ${INTRO_FLY_MS}ms ${EASING}, opacity 500ms ease 150ms`,
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
      )}
    </div>
  );
}
