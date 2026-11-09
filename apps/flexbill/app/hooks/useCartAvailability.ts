import { useRestaurant } from "@/app/context/RestaurantContext";

interface AvailabilityItem {
  id: number;
  isPromoItem?: boolean;
  userDiscountId?: string | null;
}

// "closed": cerrado por opening_hours o sin menú activo (modal de cerrado).
// "unavailable": hay platillos del carrito fuera de su horario.
export type CartBlock = "closed" | "unavailable" | null;

// true si el platillo no está en el menú activo por su horario. Solo aplica a
// restaurantes con menú por horario (el backend manda menu_valid_until).
// Durante una recarga se sigue usando el menú anterior para no parpadear.
export function useIsOffSchedule() {
  const { orderableFrom, menuValidUntil, availableItemIds } = useRestaurant();
  const checkSchedule =
    !!menuValidUntil && !orderableFrom && availableItemIds.size > 0;
  return (menuItemId: number) =>
    checkSchedule && !availableItemIds.has(menuItemId);
}

export function useCartAvailability<T extends AvailabilityItem>(items: T[]) {
  const { isClosedByHours, orderableFrom, restaurant, error } = useRestaurant();
  const isOffSchedule = useIsOffSchedule();

  // Hasta la primera carga del menú no se sabe qué está disponible.
  const ready = !!restaurant || !!error;

  const unavailableItems = items.filter(
    (i) => !(i.isPromoItem && !i.userDiscountId) && isOffSchedule(i.id),
  );

  const block: CartBlock =
    isClosedByHours || orderableFrom
      ? "closed"
      : unavailableItems.length > 0
        ? "unavailable"
        : null;

  return { block, unavailableItems, ready };
}
