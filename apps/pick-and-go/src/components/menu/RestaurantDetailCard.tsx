"use client";

import { useEffect, type RefObject } from "react";
import { useTranslations } from "next-intl";
import { ChevronRight, Clock, Mail, MapPin, Phone, X } from "lucide-react";
import type { Restaurant } from "../../interfaces/restaurant";
import type { Branch } from "../../types/branch.types";

const DAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

interface RestaurantDetailCardProps {
  restaurant: Restaurant;
  branches: Branch[];
  selectedBranchNumber: number | null;
  open: boolean;
  onClose: () => void;
  onChangeBranch: () => void;
  /** Se enfoca al abrir (botón de cerrar) */
  closeButtonRef: RefObject<HTMLButtonElement | null>;
}

const EASING = "cubic-bezier(0.32, 0.72, 0, 1)";
export const DETAIL_ANIMATION_MS = 520;

function shortTime(time: string) {
  return time.slice(0, 5);
}

/**
 * Tarjeta con el detalle del restaurante. Vive montada siempre y se
 * intercambia con la tarjeta del menú: sube desde abajo al abrir y baja
 * al cerrar (transform, respeta prefers-reduced-motion vía globals.css).
 */
export default function RestaurantDetailCard({
  restaurant,
  branches,
  selectedBranchNumber,
  open,
  onClose,
  onChangeBranch,
  closeButtonRef,
}: RestaurantDetailCardProps) {
  const t = useTranslations("RestaurantDetail");
  const tc = useTranslations("Common");

  // Escape cierra (solo si el modal de sucursal no está encima)
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    closeButtonRef.current?.focus({ preventScroll: true });
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, closeButtonRef]);

  const branch = branches.find((b) => b.branch_number === selectedBranchNumber);
  const address = branch?.address || restaurant.address;
  const phone = branch?.phone || restaurant.phone;
  const hours = restaurant.opening_hours;
  const hasHours =
    !!hours && DAY_KEYS.some((day) => hours[day] !== undefined);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("title")}
      aria-hidden={!open}
      inert={!open}
      className="fixed inset-x-0 bottom-0 top-(--menu-card-top) z-20 bg-white rounded-t-4xl flex flex-col"
      style={{
        transform: open ? "translateY(0)" : "translateY(100%)",
        visibility: open ? "visible" : "hidden",
        transition: `transform ${DETAIL_ANIMATION_MS}ms ${EASING}, visibility 0s linear ${open ? "0s" : `${DETAIL_ANIMATION_MS}ms`}`,
      }}
    >
      <button
        ref={closeButtonRef}
        type="button"
        onClick={onClose}
        aria-label={t("close")}
        className="absolute top-4 right-4 md:top-6 md:right-6 size-10 rounded-full bg-surface border border-stroke flex items-center justify-center active:scale-95 transition-transform"
      >
        <X className="size-5 text-black" />
      </button>

      <div className="overflow-y-auto overscroll-contain px-6 md:px-8 lg:px-10 pt-8 pb-10">
        <div className="mx-auto max-w-xl flex flex-col items-center text-center">
          <div className="size-28 md:size-36 rounded-full bg-even-evergreen overflow-hidden border border-stroke shadow-sm">
            {restaurant.logo_url && (
              <img
                src={restaurant.logo_url}
                alt={tc("restaurantLogoAlt")}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <h2 className="mt-4 text-2xl md:text-3xl font-medium text-black">
            {restaurant.name}
          </h2>
          {restaurant.description && (
            <p className="mt-2 text-tone-600 text-sm md:text-base">
              {restaurant.description}
            </p>
          )}
        </div>

        <dl className="mx-auto max-w-xl mt-8 flex flex-col divide-y divide-stroke text-left">
          {branches.length > 0 && (
            <div className="py-4">
              <dt className="text-xs uppercase tracking-wide text-tone-600">
                {t("branch")}
              </dt>
              <dd className="mt-1 flex items-center justify-between gap-3">
                <span className="font-medium text-black">
                  {branch?.name ||
                    (selectedBranchNumber
                      ? tc("defaultBranchName")
                      : tc("selectBranch"))}
                </span>
                {branches.length > 1 && (
                  <button
                    type="button"
                    onClick={onChangeBranch}
                    className="inline-flex items-center gap-1 rounded-full bg-surface border border-stroke px-3 py-1 text-sm text-black active:scale-95 transition-transform"
                  >
                    {t("changeBranch")}
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
                <dt className="text-xs uppercase tracking-wide text-tone-600">
                  {t("address")}
                </dt>
                <dd className="mt-1 text-black">{address}</dd>
              </div>
            </div>
          )}

          {phone && (
            <div className="py-4 flex gap-3">
              <Phone className="size-5 shrink-0 text-tone-600 mt-0.5" />
              <div>
                <dt className="text-xs uppercase tracking-wide text-tone-600">
                  {t("phone")}
                </dt>
                <dd className="mt-1">
                  <a href={`tel:${phone}`} className="text-black underline">
                    {phone}
                  </a>
                </dd>
              </div>
            </div>
          )}

          {restaurant.email && (
            <div className="py-4 flex gap-3">
              <Mail className="size-5 shrink-0 text-tone-600 mt-0.5" />
              <div>
                <dt className="text-xs uppercase tracking-wide text-tone-600">
                  {t("email")}
                </dt>
                <dd className="mt-1">
                  <a
                    href={`mailto:${restaurant.email}`}
                    className="text-black underline break-all"
                  >
                    {restaurant.email}
                  </a>
                </dd>
              </div>
            </div>
          )}

          {hasHours && hours && (
            <div className="py-4 flex gap-3">
              <Clock className="size-5 shrink-0 text-tone-600 mt-0.5" />
              <div className="flex-1">
                <dt className="text-xs uppercase tracking-wide text-tone-600">
                  {t("hours")}
                </dt>
                <dd className="mt-2 flex flex-col gap-1 text-sm text-black">
                  {DAY_KEYS.filter((day) => hours[day]).map((day) => {
                    const h = hours[day];
                    return (
                      <div key={day} className="flex justify-between gap-4">
                        <span className="text-tone-600">
                          {t(`days.${day}`)}
                        </span>
                        <span>
                          {h.is_closed
                            ? t("closed")
                            : h.is_all_day
                              ? t("allDay")
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
