"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight, Clock, Mail, MapPin, Phone } from "lucide-react";

export const DAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
export type DayKey = (typeof DAY_KEYS)[number];

export type RestaurantHours = Record<
  string,
  { is_closed: boolean; open_time: string; close_time: string; is_all_day?: boolean }
>;

export type RestaurantDetailLabels = {
  /** Nombre accesible del diálogo. */
  title: string;
  logoAlt: string;
  branch: string;
  changeBranch: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  closed: string;
  allDay: string;
  days: Record<DayKey, string>;
};

export type RestaurantDetailSheetProps = {
  open: boolean;
  onClose: () => void;
  name: string;
  logoUrl?: string | null;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  hours?: RestaurantHours | null;
  /** Sucursal seleccionada. Sin esta prop no se muestra el bloque de sucursal (p. ej. Room Service). */
  branch?: { label: string; onChange?: () => void } | null;
  labels: RestaurantDetailLabels;
};

const EASING = "cubic-bezier(0.32, 0.72, 0, 1)";
export const DETAIL_ANIMATION_MS = 520;

// Gesto de cerrar jalando hacia abajo (con el contenido en su tope de scroll)
const DRAG_CLOSE_DISTANCE = 90; // px de arrastre para cerrar al soltar
const DRAG_CLOSE_VELOCITY = 0.6; // px/ms: un jalón rápido también cierra
const DRAG_RESISTANCE = 0.85; // el panel sigue al dedo con ligera resistencia
const WHEEL_CLOSE_DISTANCE = 120; // rueda/trackpad hacia arriba, acumulado
const WHEEL_SETTLE_MS = 150; // ignora la inercia del scroll que acaba de llegar al tope
const WHEEL_RESET_MS = 250; // sin eventos de rueda se reinicia lo acumulado

const shortTime = (time: string) => time.slice(0, 5);

/**
 * Tarjeta con el detalle del restaurante. Vive montada siempre y se intercambia con la tarjeta del
 * menú: sube desde abajo al abrir y baja al cerrar. Cierra con Escape, jalando hacia abajo (táctil)
 * o con rueda/trackpad hacia arriba cuando el contenido está en su tope. Su posición usa
 * `--menu-card-top` (ver theme.css). La app se encarga del gesto "atrás" y de bloquear el scroll.
 */
export function RestaurantDetailSheet({
  open,
  onClose,
  name,
  logoUrl,
  description,
  address,
  phone,
  email,
  hours,
  branch,
  labels,
}: RestaurantDetailSheetProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);

  // Escape cierra (solo si algo encima, como el modal de sucursal, no lo atendió)
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) onCloseRef.current();
    };
    window.addEventListener("keydown", onKeyDown);
    dialogRef.current?.focus({ preventScroll: true });
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Cerrar jalando la tarjeta hacia abajo (táctil) o con rueda/trackpad hacia
  // arriba, solo cuando el contenido está en su tope de scroll.
  useEffect(() => {
    const dialog = dialogRef.current;
    const scroller = scrollerRef.current;
    if (!open || !dialog || !scroller) return;

    // Táctil
    let anchorY: number | null = null; // Y desde la que se mide el arrastre
    let offset = 0;
    let isDragging = false;
    let lastY = 0;
    let lastT = 0;
    let velocity = 0;

    const onTouchStart = (e: TouchEvent) => {
      const y = e.touches[0].clientY;
      anchorY = scroller.scrollTop <= 0 ? y : null;
      lastY = y;
      lastT = e.timeStamp;
      velocity = 0;
      offset = 0;
      isDragging = false;
    };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0].clientY;
      const dt = e.timeStamp - lastT;
      if (dt > 0) velocity = (y - lastY) / dt;
      lastY = y;
      lastT = e.timeStamp;

      // Si el usuario sube el contenido hasta el tope durante el mismo gesto,
      // el arrastre se mide desde ese punto
      if (scroller.scrollTop <= 0 && anchorY === null) anchorY = y;
      if (anchorY === null || scroller.scrollTop > 0) return;

      const dy = y - anchorY;
      if (dy > 0) {
        e.preventDefault(); // evita pull-to-refresh y el scroll nativo
        offset = dy * DRAG_RESISTANCE;
        if (!isDragging) {
          isDragging = true;
          setDragging(true);
        }
        setDragY(offset);
      } else if (isDragging) {
        offset = 0;
        setDragY(0);
      }
    };
    const onTouchEnd = () => {
      if (!isDragging) {
        anchorY = null;
        return;
      }
      const shouldClose = offset > DRAG_CLOSE_DISTANCE || velocity > DRAG_CLOSE_VELOCITY;
      isDragging = false;
      anchorY = null;
      setDragging(false);
      setDragY(0);
      if (shouldClose) onCloseRef.current();
    };

    // Rueda / trackpad en escritorio
    let atTopSince = performance.now();
    let wheelAcc = 0;
    let wheelTimer: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      if (scroller.scrollTop <= 0) atTopSince = performance.now();
    };
    const onWheel = (e: WheelEvent) => {
      if (scroller.scrollTop > 0 || e.deltaY >= 0) {
        wheelAcc = 0;
        return;
      }
      // Exige un gesto nuevo: no cerrar por la inercia del scroll que acaba de llegar al tope
      if (performance.now() - atTopSince < WHEEL_SETTLE_MS) return;
      wheelAcc += -e.deltaY;
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => {
        wheelAcc = 0;
      }, WHEEL_RESET_MS);
      if (wheelAcc >= WHEEL_CLOSE_DISTANCE) {
        wheelAcc = 0;
        onCloseRef.current();
      }
    };

    dialog.addEventListener("touchstart", onTouchStart, { passive: true });
    dialog.addEventListener("touchmove", onTouchMove, { passive: false });
    dialog.addEventListener("touchend", onTouchEnd);
    dialog.addEventListener("touchcancel", onTouchEnd);
    dialog.addEventListener("wheel", onWheel, { passive: true });
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      dialog.removeEventListener("touchstart", onTouchStart);
      dialog.removeEventListener("touchmove", onTouchMove);
      dialog.removeEventListener("touchend", onTouchEnd);
      dialog.removeEventListener("touchcancel", onTouchEnd);
      dialog.removeEventListener("wheel", onWheel);
      scroller.removeEventListener("scroll", onScroll);
      clearTimeout(wheelTimer);
      setDragging(false);
      setDragY(0);
    };
  }, [open]);

  const hasHours = !!hours && DAY_KEYS.some((day) => hours[day] !== undefined);

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={labels.title}
      aria-hidden={!open}
      inert={!open}
      className="fixed inset-x-0 bottom-0 top-(--menu-card-top) z-20 bg-white rounded-t-4xl flex flex-col outline-none"
      style={{
        transform: dragging ? `translateY(${dragY}px)` : open ? "translateY(0)" : "translateY(100%)",
        visibility: open ? "visible" : "hidden",
        transition: dragging
          ? "none"
          : `transform ${DETAIL_ANIMATION_MS}ms ${EASING}, visibility 0s linear ${open ? "0s" : `${DETAIL_ANIMATION_MS}ms`}`,
      }}
    >
      {/* Asa: indica que la tarjeta se puede jalar hacia abajo para cerrarla */}
      <div aria-hidden className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-stroke-soft" />

      <div ref={scrollerRef} className="overflow-y-auto overscroll-contain px-6 md:px-8 lg:px-10 pt-5 pb-10">
        <div className="mx-auto max-w-xl flex flex-col items-center text-center">
          <div className="size-28 md:size-36 rounded-full bg-even-evergreen overflow-hidden border border-stroke shadow-sm">
            {logoUrl && <img src={logoUrl} alt={labels.logoAlt} className="w-full h-full object-cover" />}
          </div>
          <h2 className="mt-4 text-2xl md:text-3xl font-medium text-black">{name}</h2>
          {description && <p className="mt-2 text-tone-600 text-sm md:text-base">{description}</p>}
        </div>

        <dl className="mx-auto max-w-xl mt-8 flex flex-col divide-y divide-stroke text-left">
          {branch && (
            <div className="py-4">
              <dt className="text-xs uppercase tracking-wide text-tone-600">{labels.branch}</dt>
              <dd className="mt-1 flex items-center justify-between gap-3">
                <span className="font-medium text-black">{branch.label}</span>
                {branch.onChange && (
                  <button
                    type="button"
                    onClick={branch.onChange}
                    className="inline-flex items-center gap-1 rounded-full bg-surface border border-stroke px-3 py-1 text-sm text-black active:scale-95 transition-transform"
                  >
                    {labels.changeBranch}
                    <ChevronRight className="size-4" />
                  </button>
                )}
              </dd>
            </div>
          )}

          {address && (
            <div className="py-4 flex gap-3">
              <MapPin className="size-5 shrink-0 text-tone-600 mt-0.5" />
              <div>
                <dt className="text-xs uppercase tracking-wide text-tone-600">{labels.address}</dt>
                <dd className="mt-1 text-black">{address}</dd>
              </div>
            </div>
          )}

          {phone && (
            <div className="py-4 flex gap-3">
              <Phone className="size-5 shrink-0 text-tone-600 mt-0.5" />
              <div>
                <dt className="text-xs uppercase tracking-wide text-tone-600">{labels.phone}</dt>
                <dd className="mt-1">
                  <a href={`tel:${phone}`} className="text-black underline">
                    {phone}
                  </a>
                </dd>
              </div>
            </div>
          )}

          {email && (
            <div className="py-4 flex gap-3">
              <Mail className="size-5 shrink-0 text-tone-600 mt-0.5" />
              <div>
                <dt className="text-xs uppercase tracking-wide text-tone-600">{labels.email}</dt>
                <dd className="mt-1">
                  <a href={`mailto:${email}`} className="text-black underline break-all">
                    {email}
                  </a>
                </dd>
              </div>
            </div>
          )}

          {hasHours && hours && (
            <div className="py-4 flex gap-3">
              <Clock className="size-5 shrink-0 text-tone-600 mt-0.5" />
              <div className="flex-1">
                <dt className="text-xs uppercase tracking-wide text-tone-600">{labels.hours}</dt>
                <dd className="mt-2 flex flex-col gap-1 text-sm text-black">
                  {DAY_KEYS.filter((day) => hours[day]).map((day) => {
                    const h = hours[day];
                    return (
                      <div key={day} className="flex justify-between gap-4">
                        <span className="text-tone-600">{labels.days[day]}</span>
                        <span>
                          {h.is_closed
                            ? labels.closed
                            : h.is_all_day
                              ? labels.allDay
                              : `${shortTime(h.open_time)} – ${shortTime(h.close_time)}`}
                        </span>
                      </div>
                    );
                  })}
                </dd>
              </div>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
