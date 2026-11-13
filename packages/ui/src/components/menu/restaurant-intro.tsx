"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

export type IntroPhase = "show" | "fly" | "done";

export const INTRO_SHOW_MS = 2800;
export const INTRO_FLY_MS = 700;

const EASING = "cubic-bezier(0.32, 0.72, 0, 1)";
const CARD_TOP = "top-(--menu-card-top)";
const LOGO_SIZE = "size-36 md:size-48";

// Bienvenida: sale en la primera entrada al menú en la pestaña (clave por restaurante en
// sessionStorage, marcada AL INICIAR la bienvenida) y cuando el usuario recarga la página. Volver
// al menú desde el carrito, un platillo, etc. no la repite. El flag de módulo evita que una
// navegación cliente posterior en la misma carga de documento (que sigue teniendo type "reload")
// la vuelva a mostrar, y es el fallback si sessionStorage falla (modo privado).
const INTRO_STORAGE_PREFIX = "intro-shown:";
const INTRO_UNLOAD_KEY = "intro-doc-unloaded";
let introShownThisLoad = false;

function isDocumentReload(): boolean {
  const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (nav) return nav.type === "reload";
  // Fallback para navegadores sin Navigation Timing 2
  return (performance as Performance & { navigation?: { type: number } }).navigation?.type === 1;
}

// El tipo de navegación (performance) no es fiable a la hora de montar la vista, así que la recarga
// se detecta con una marca: al descargar el documento (pagehide) se deja una marca en sessionStorage
// que el siguiente documento consume al cargar. La navegación cliente no descarga el documento.
const documentLoadedAsReload = (() => {
  if (typeof window === "undefined") return false;
  let viaMark = false;
  try {
    viaMark = window.sessionStorage.getItem(INTRO_UNLOAD_KEY) === "1";
    window.sessionStorage.removeItem(INTRO_UNLOAD_KEY);
    const w = window as typeof window & { __introUnloadHook?: boolean };
    if (!w.__introUnloadHook) {
      w.__introUnloadHook = true; // una sola vez aunque el módulo se reevalúe (HMR)
      window.addEventListener("pagehide", () => {
        try {
          window.sessionStorage.setItem(INTRO_UNLOAD_KEY, "1");
        } catch {
          // almacenamiento bloqueado
        }
      });
    }
  } catch {
    // almacenamiento bloqueado
  }
  return viaMark || isDocumentReload();
})();

function introAlreadyShown(key: string | number | null, replayOnReload: boolean): boolean {
  if (typeof window === "undefined") return false;
  if (introShownThisLoad) return true;
  if (replayOnReload && documentLoadedAsReload) return false;
  try {
    return window.sessionStorage.getItem(INTRO_STORAGE_PREFIX + key) === "1";
  } catch {
    return false;
  }
}

function markIntroShown(key: string | number | null) {
  introShownThisLoad = true;
  try {
    window.sessionStorage.setItem(INTRO_STORAGE_PREFIX + key, "1");
  } catch {
    // modo privado / almacenamiento bloqueado: queda el flag en memoria
  }
}

export type UseRestaurantIntroOptions = {
  /** Identifica lo que ya se mostró en la pestaña (normalmente el id del restaurante). */
  storageKey: string | number | null;
  /** Elemento del banner al que vuela el logo (el botón del logo). */
  logoTargetRef: RefObject<HTMLElement | null>;
  /** false → la bienvenida solo sale en la primera entrada, no al refrescar. Por defecto true. */
  replayOnReload?: boolean;
};

/**
 * Estado de la bienvenida: fase (show → fly → done), transform del logo y "una vez por sesión".
 * El estado inicial es igual en servidor y en el primer render del cliente, así el overlay ya
 * está presente sin parpadeo.
 */
export function useRestaurantIntro({ storageKey, logoTargetRef, replayOnReload = true }: UseRestaurantIntroOptions) {
  const [phase, setPhase] = useState<IntroPhase>(() => (introAlreadyShown(storageKey, replayOnReload) ? "done" : "show"));
  const [logoTransform, setLogoTransform] = useState("");
  const logoRef = useRef<HTMLDivElement>(null);

  const skip = useCallback(() => {
    const from = logoRef.current?.getBoundingClientRect();
    const to = logoTargetRef.current?.getBoundingClientRect();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!from || !to || !from.width || reduceMotion) {
      setPhase("done");
      return;
    }
    setLogoTransform(
      `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(${to.width / from.width})`,
    );
    setPhase("fly");
  }, [logoTargetRef]);

  useEffect(() => {
    if (phase !== "show") return;
    markIntroShown(storageKey);
    const timer = setTimeout(skip, INTRO_SHOW_MS);
    return () => clearTimeout(timer);
  }, [phase, skip, storageKey]);

  useEffect(() => {
    if (phase !== "fly") return;
    const timer = setTimeout(() => setPhase("done"), INTRO_FLY_MS + 30);
    return () => clearTimeout(timer);
  }, [phase]);

  return { phase, active: phase !== "done", logoTransform, logoRef, skip };
}

export type RestaurantIntroLabels = {
  /** Nombre accesible del diálogo. */
  title: string;
  /** "Toca para continuar" */
  skip: string;
  logoAlt: string;
  /** Prefijo de la sucursal, p. ej. "Sucursal". Solo se usa con `branchName`. */
  branchLabel?: string;
};

export type RestaurantIntroProps = {
  name: string;
  logoUrl?: string | null;
  phase: Exclude<IntroPhase, "done">;
  /** Si no hay sucursal (p. ej. Room Service) no se muestra la línea. */
  branchName?: string | null;
  welcomeText: string;
  /** transform que lleva el logo hasta el del banner (vacío = en reposo) */
  logoTransform: string;
  logoRef: RefObject<HTMLDivElement | null>;
  onSkip: () => void;
  labels: RestaurantIntroLabels;
};

interface Slot {
  left: number;
  top: number;
  size: number;
}

/**
 * Pantalla de bienvenida: tarjeta sobre el menú con logo grande, nombre, sucursal y saludo. Entra en
 * crossfade desde la pantalla de carga (mismo verde de fondo que se desvanece) y al terminar el logo
 * viaja hasta el del banner mientras la tarjeta se desvanece.
 */
export function RestaurantIntro({
  name,
  logoUrl,
  phase,
  branchName,
  welcomeText,
  logoTransform,
  logoRef,
  onSkip,
  labels,
}: RestaurantIntroProps) {
  const flying = phase === "fly";

  // Entrada: el primer render va "oculto" y pasa a visible en el siguiente frame
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
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
      aria-label={labels.title}
      className="fixed inset-0 z-[60]"
      style={{ pointerEvents: flying ? "none" : "auto" }}
      onClick={onSkip}
    >
      {/* Tarjeta blanca opaca desde el primer frame: misma zona que la tarjeta del menú.
          Solo se desvanece al salir, nunca al entrar. */}
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

      {/* Fondo verde opaco desde el primer frame (continuación de la pantalla de carga, cubre menú
          y banner). Se desvanece al entrar la intro, revelando la tarjeta blanca ya opaca. */}
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
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-black text-balance">{name}</h2>
          {branchName && (
            <p className="mt-1 text-tone-600 text-sm md:text-lg">
              {labels.branchLabel}
              {labels.branchLabel ? " " : ""}
              <span className="font-medium text-black">{branchName}</span>
            </p>
          )}
          <p className="mt-6 md:mt-8 text-xl md:text-3xl text-black text-balance">{welcomeText}</p>
        </div>
        <p
          className="reduce-motion-fade absolute bottom-6 text-xs md:text-sm text-tone-600"
          style={{
            opacity: visible ? 1 : 0,
            transition: "opacity 400ms ease 1000ms",
          }}
        >
          {labels.skip}
        </p>
      </div>

      {/* Logo: fuera de la tarjeta para poder viajar al banner */}
      {slot && (
        <div
          className="pointer-events-none fixed"
          style={{ left: slot.left, top: slot.top, width: slot.size, height: slot.size }}
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
            {logoUrl && <img src={logoUrl} alt={labels.logoAlt} className="w-full h-full object-cover" />}
          </div>
        </div>
      )}
    </div>
  );
}
