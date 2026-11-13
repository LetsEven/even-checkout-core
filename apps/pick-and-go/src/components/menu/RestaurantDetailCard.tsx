"use client";

import { useTranslations } from "next-intl";
import { RestaurantDetailSheet, DETAIL_ANIMATION_MS } from "@even/ui";
import type { Restaurant } from "../../interfaces/restaurant";
import type { Branch } from "../../types/branch.types";

export { DETAIL_ANIMATION_MS };

interface RestaurantDetailCardProps {
  restaurant: Restaurant;
  branches: Branch[];
  selectedBranchNumber: number | null;
  open: boolean;
  onClose: () => void;
  onChangeBranch: () => void;
}

/** Detalle del restaurante: datos y textos de Pick & Go sobre el sheet compartido de @even/ui. */
export default function RestaurantDetailCard({
  restaurant,
  branches,
  selectedBranchNumber,
  open,
  onClose,
  onChangeBranch,
}: RestaurantDetailCardProps) {
  const t = useTranslations("RestaurantDetail");
  const tc = useTranslations("Common");

  const branch = branches.find((b) => b.branch_number === selectedBranchNumber);

  return (
    <RestaurantDetailSheet
      open={open}
      onClose={onClose}
      name={restaurant.name}
      logoUrl={restaurant.logo_url}
      description={restaurant.description}
      address={branch?.address || restaurant.address}
      phone={branch?.phone || restaurant.phone}
      email={restaurant.email}
      hours={restaurant.opening_hours}
      branch={
        branches.length > 0
          ? {
              label:
                branch?.name ||
                (selectedBranchNumber
                  ? tc("defaultBranchName")
                  : tc("selectBranch")),
              onChange: branches.length > 1 ? onChangeBranch : undefined,
            }
          : null
      }
      labels={{
        title: t("title"),
        logoAlt: tc("restaurantLogoAlt"),
        branch: t("branch"),
        changeBranch: t("changeBranch"),
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
