"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useMemo,
} from "react";
import { useParams } from "next/navigation";
import { Restaurant } from "../interfaces/restaurant";
import { MenuSection } from "../interfaces/category";
import { restaurantService } from "../services/restaurant.service";
import { authService } from "../services/auth.service";
import { isRestaurantOpen } from "../utils/restaurantHours";
import { useBranch } from "./BranchContext";

interface RestaurantContextValue {
  restaurantId: number | null;
  restaurant: Restaurant | null;
  menu: MenuSection[];
  loading: boolean;
  error: string | null;
  isOpen: boolean;
  orderableFrom: string | null;
  menuValidUntil: string | null;
  isClosedByHours: boolean;
  availableItemIds: Set<number>;
  setRestaurantId: (id: number) => void;
  refetchMenu: () => Promise<void>;
}

const RestaurantContext = createContext<RestaurantContextValue | undefined>(
  undefined,
);

interface RestaurantProviderProps {
  children: ReactNode;
}

export function RestaurantProvider({ children }: RestaurantProviderProps) {
  const params = useParams();
  const urlRestaurantId = params?.restaurantId
    ? parseInt(params.restaurantId as string)
    : null;

  const [restaurantId, setRestaurantIdState] = useState<number | null>(
    urlRestaurantId && !isNaN(urlRestaurantId) ? urlRestaurantId : null,
  );
  const { selectedBranchNumber, branchInitialized, fetchBranches } =
    useBranch();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menu, setMenu] = useState<MenuSection[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [orderableFrom, setOrderableFrom] = useState<string | null>(null);
  const [menuValidUntil, setMenuValidUntil] = useState<string | null>(null);
  const [, setTick] = useState(0);

  // Función para establecer el restaurantId y cargar los datos
  const setRestaurantId = useCallback((id: number) => {
    setRestaurantIdState(id);
  }, []);

  // Función para recargar el menú
  const refetchMenu = async () => {
    if (!restaurantId) return;

    //console.log("🔄 Refetching menu for restaurant:", restaurantId);
    await fetchRestaurantData(restaurantId);
  };
  // Función para cargar datos del restaurante y menú
  const fetchRestaurantData = async (id: number, branch?: number) => {
    try {
      setLoading(true);
      setError(null);

      if (branch) {
        /*console.log(
          "📡 Fetching restaurant data for ID:",
          id,
          "branch:",
          branch,
        );*/
        // Obtener restaurante y menú filtrado por sucursal
        const data = await restaurantService.getRestaurantWithMenuByBranch(
          id,
          branch,
        );

        //console.log("✅ Restaurant data loaded:", data.restaurant.name);
        /*console.log(
          "✅ Menu loaded with",
          data.menu.length,
          "sections (filtered by branch",
          branch,
          ")",
        );*/

        setRestaurant(data.restaurant);
        setMenu(data.menu);
        setOrderableFrom(data.orderable_from ?? null);
        setMenuValidUntil(data.menu_valid_until ?? null);
      } else {
        //console.log("📡 Fetching restaurant data for ID:", id);
        // Obtener restaurante y menú completo (sin filtrar por sucursal)
        const data = await restaurantService.getRestaurantWithMenu(id);

        //console.log("✅ Restaurant data loaded:", data.restaurant.name);
        //console.log("✅ Menu loaded with", data.menu.length, "sections");

        setRestaurant(data.restaurant);
        setMenu(data.menu);
        setOrderableFrom(null);
        setMenuValidUntil(null);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load restaurant data";
      console.error("❌ Error loading restaurant data:", errorMessage);
      setError(errorMessage);
      setRestaurant(null);
      setMenu([]);
    } finally {
      setLoading(false);
    }
  };

  // Iniciar carga de branches cuando restaurantId esté disponible
  useEffect(() => {
    if (restaurantId && !branchInitialized) {
      fetchBranches(restaurantId);
    }
  }, [restaurantId, branchInitialized, fetchBranches]);

  // Fetch restaurante solo cuando branch ya fue inicializado
  // Evita el doble fetch (primero sin branch, luego con branch)
  useEffect(() => {
    if (!restaurantId) {
      setRestaurant(null);
      setMenu([]);
      setError(null);
      return;
    }
    if (!branchInitialized) return;
    fetchRestaurantData(restaurantId, selectedBranchNumber || undefined);
  }, [restaurantId, selectedBranchNumber, branchInitialized]);

  // El service no puede leer este contexto, así que se le inyecta (mismo
  // patrón que cart.service.ts) para que `sendPhoneOTP` lo mande. La sucursal
  // sale de BranchContext: la ruta de esta app es sólo `/[restaurantId]`.
  useEffect(() => {
    authService.setRestaurantId(restaurantId);
  }, [restaurantId]);

  useEffect(() => {
    authService.setBranchNumber(selectedBranchNumber);
  }, [selectedBranchNumber]);

  // Se recalcula en cada render; el intervalo de abajo fuerza uno por minuto.
  const isClosedByHours = !isRestaurantOpen(restaurant?.opening_hours);
  const isOpen = !isClosedByHours && !orderableFrom;

  const availableItemIds = useMemo(
    () => new Set(menu.flatMap((s) => s.items.map((i) => i.id))),
    [menu],
  );

  // Recargar el menú cuando abre o cierra una ventana de horario.
  useEffect(() => {
    if (!menuValidUntil || !restaurantId) return;
    const ms = new Date(menuValidUntil).getTime() - Date.now();
    const timer = setTimeout(
      () =>
        fetchRestaurantData(restaurantId, selectedBranchNumber || undefined),
      Math.min(Math.max(ms, 0) + 1000, 2147483647),
    );
    return () => clearTimeout(timer);
  }, [menuValidUntil, restaurantId, selectedBranchNumber]);

  // Re-check restaurant hours every minute
  useEffect(() => {
    const interval = setInterval(() => setTick((n) => n + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const value: RestaurantContextValue = {
    restaurantId,
    restaurant,
    menu,
    loading,
    error,
    isOpen,
    orderableFrom,
    menuValidUntil,
    isClosedByHours,
    availableItemIds,
    setRestaurantId,
    refetchMenu,
  };

  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  );
}

// Hook personalizado para usar el contexto
export function useRestaurant() {
  const context = useContext(RestaurantContext);

  if (context === undefined) {
    throw new Error("useRestaurant must be used within a RestaurantProvider");
  }

  return context;
}
