"use client";

import {
  lazy,
  Suspense,
  useState,
  useMemo,
  useEffect,
  useRef,
  useLayoutEffect,
  useTransition,
  useCallback,
  useDeferredValue,
} from "react";
import { useTranslations } from "next-intl";
import MenuHeader from "../headers/MenuHeader";
import RestaurantDetailCard, {
  DETAIL_ANIMATION_MS,
} from "./RestaurantDetailCard";
import RestaurantIntro from "./RestaurantIntro";
import {
  CategoryTabs,
  FloatingCartButton,
  MenuEmptyState,
  MenuRestaurantHeading,
  MenuSearchInput,
  MenuActionsPill,
  PillButton,
  PillCartButton,
  PillPepperButton,
  UserAvatar as SharedUserAvatar,
  setMenuCategory,
  takeMenuPosition,
  useModalBackClose,
  useRestaurantIntro,
  useScrollLock,
} from "@even/ui";
import MenuCategory from "./MenuCategory";
import {
  X,
  RefreshCw,
  Utensils,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useUserData } from "../../context/userDataContext";
import { useTableNavigation } from "../../hooks/useTableNavigation";
import { useCart } from "../../context/CartContext";
import { useRestaurant } from "../../context/RestaurantContext";
import Loader from "../UI/Loader";
import PepperIcon from "../UI/PepperIcon";
import { useAuth } from "@/context/AuthContext";
import { useGuest } from "@/context/GuestContext";
import {
  tapOrderService,
  type ActiveOrder,
  type LastOrderDish,
} from "@/services/taporders.service";

const ChatView = lazy(() => import("../ChatView"));
const AuthView = lazy(() => import("../AuthView"));
const DashboardView = lazy(() => import("../DashboardView"));
const RestaurantClosedModal = lazy(() => import("../RestaurantClosedModal"));
const ReorderModal = lazy(() => import("../modals/ReorderModal"));

// Pure functions — defined outside to avoid re-creation on every render
function getStatusColor(status: string) {
  switch (status) {
    case "preparing":
      return "bg-caution-100 text-caution-800 border-caution-300";
    case "ready":
      return "bg-warning-100 text-warning-800 border-warning-300";
    case "delivered":
      return "bg-positive-100 text-positive-800 border-positive-300";
    default:
      return "bg-tone-100 text-tone-800 border-tone-300";
  }
}

interface UserAvatarProps {
  isAuthenticated: boolean;
  profile: { photoUrl?: string; firstName?: string } | null;
  iconSize?: string;
  textSize?: string;
}

function UserAvatar(props: UserAvatarProps) {
  const t = useTranslations("MenuView");
  return <SharedUserAvatar {...props} alt={t("profileAlt")} />;
}

interface MenuViewProps {
  tableNumber?: string;
}

export default function MenuView({ tableNumber }: MenuViewProps) {
  const t = useTranslations("MenuView");
  const tc = useTranslations("Common");
  const tr = useTranslations("RestaurantDetail");
  const { restaurantId: menuKey, menu: initialMenu } = useRestaurant();
  // Posición guardada al abrir un platillo (se consume una sola vez al montar)
  const [restored] = useState(() => {
    const position = takeMenuPosition(String(menuKey));
    if (
      position &&
      position.category !== "Todo" &&
      !initialMenu?.some((s) => s.name === position.category)
    ) {
      position.category = "Todo";
    }
    return position;
  });
  const [filter, setFilter] = useState(restored?.category ?? "Todo");
  const [searchQuery, setSearchQuery] = useState("");
  const [, startTransition] = useTransition();
  // activeCat es urgente (mueve la píldora ya); filter va en transición (filtra la lista)
  const [activeCat, setActiveCat] = useState(restored?.category ?? "Todo");

  useEffect(() => {
    setMenuCategory(activeCat);
  }, [activeCat]);

  // Regresa el platillo tocado a la misma altura de pantalla en la que estaba.
  // Se repite en el siguiente frame porque Next hace scroll al top al montar la ruta.
  useLayoutEffect(() => {
    if (!restored) return;
    const restore = () => {
      const el = document.querySelector<HTMLElement>(
        `[data-menu-item-id="${CSS.escape(restored.itemId)}"]`,
      );
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, top - restored.itemTop);
    };
    restore();
    const frame = requestAnimationFrame(restore);
    return () => cancelAnimationFrame(frame);
  }, [restored]);

  const selectCategory = (cat: string) => {
    setActiveCat(cat);
    startTransition(() => setFilter(cat));
  };
  const { user, profile, isAuthenticated, logout } = useAuth();
  const { guestId } = useGuest();
  const { signUpData } = useUserData();
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [activeOrderIndex, setActiveOrderIndex] = useState(0);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLastOrder, setHasLastOrder] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [lastOrderItems, setLastOrderItems] = useState<LastOrderDish[]>([]);
  const [showPepperChat, setShowPepperChat] = useState(false);
  const [isPepperClosing, setIsPepperClosing] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isSettingsClosing, setIsSettingsClosing] = useState(false);
  const [dashboardInitialTab, setDashboardInitialTab] = useState<
    "profile" | "cards" | "history" | "support"
  >("profile");
  const [showClosedModal, setShowClosedModal] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const stickyTriggerRef = useRef<HTMLDivElement>(null);

  // Detalle del restaurante (se intercambia con la tarjeta del menú)
  const [showDetail, setShowDetail] = useState(false);
  const logoButtonRef = useRef<HTMLButtonElement>(null);
  const closeDetail = useCallback(() => {
    setShowDetail(false);
    setTimeout(
      () => logoButtonRef.current?.focus({ preventScroll: true }),
      DETAIL_ANIMATION_MS,
    );
  }, []);

  // Pantalla de bienvenida (hook compartido de @even/ui)
  const {
    phase: introPhase,
    active: introActive,
    logoTransform: introLogoTransform,
    logoRef: introLogoRef,
    skip: startIntroFly,
  } = useRestaurantIntro({ storageKey: menuKey, logoTargetRef: logoButtonRef });

  // La píldora (perfil, carrito, Pepper) se ve si el usuario la abrió con la
  // hamburguesa o si aparece por scroll.
  const [menuOpenByUser, setMenuOpenByUser] = useState(false);
  const pillVisible =
    (menuOpenByUser || showStickyBar) && !showDetail && !introActive;
  // Al volver arriba la píldora se cierra sola
  const prevStickyRef = useRef(false);
  useEffect(() => {
    if (prevStickyRef.current && !showStickyBar) setMenuOpenByUser(false);
    prevStickyRef.current = showStickyBar;
  }, [showStickyBar]);
  const { navigateWithTable } = useTableNavigation();
  const { state: cartState, refreshCart, addItem } = useCart();
  const { restaurant, restaurantId, menu, loading, error } = useRestaurant();
  const showImages = !!restaurant && restaurant.menu_show_images !== false;

  const getStatusText = (status: string) => {
    switch (status) {
      case "preparing":
        return tc("statusPreparing");
      case "ready":
        return tc("statusReady");
      case "delivered":
        return tc("statusDelivered");
      default:
        return status;
    }
  };

  const closeSettingsModal = () => {
    setIsSettingsClosing(true);
    setTimeout(() => {
      setShowSettingsModal(false);
      setIsSettingsClosing(false);
      setDashboardInitialTab("profile");
    }, 380);
  };

  // Abrir el dashboard en la pestaña de tarjetas cuando se regresa de agregar
  // una tarjeta (?dashboard=cards). Se limpia el parámetro para que un refresh
  // o reapertura del modal no lo vuelva a disparar.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("dashboard") === "cards") {
      setDashboardInitialTab("cards");
      setShowSettingsModal(true);
      url.searchParams.delete("dashboard");
      window.history.replaceState({}, "", url);
    }
  }, []);

  // Con Pepper Chat o el modal de Settings abiertos (Chat/Auth/Dashboard),
  // el body pasa a #F1F1F1 para que el overscroll bounce de iOS combine
  // con el gris de esos paneles en vez del blanco de la pantalla base.
  // No capturamos "previous" del DOM: el effect de arriba ya lo dejó en
  // "#ffffff", así que ese es el valor correcto al que hay que volver.
  useEffect(() => {
    const modalOpen = showPepperChat || showSettingsModal;
    document.body.style.backgroundColor = modalOpen
      ? "var(--color-overscroll)"
      : "var(--color-background)";
    return () => {
      document.body.style.backgroundColor = "var(--color-background)";
    };
  }, [showPepperChat, showSettingsModal]);

  // Logout desde el modal: primero cerrar con animación, luego limpiar la
  // sesión. Si se limpia antes, el modal re-renderiza su contenido como
  // AuthView/"Acceso denegado" durante la animación y se ve un flash.
  const handleSettingsLogout = () => {
    setIsSettingsClosing(true);
    setTimeout(() => {
      setShowSettingsModal(false);
      setIsSettingsClosing(false);
      logout();
    }, 380);
  };

  useScrollLock(
    showPepperChat ||
      showSettingsModal ||
      isStatusModalOpen ||
      showReorderModal ||
      showDetail ||
      introActive,
  );

  // Precargar chunks lazy después de que la página ya es interactiva
  useEffect(() => {
    const t = setTimeout(() => {
      import("../ChatView");
      import("../AuthView");
      import("../DashboardView");
      import("../RestaurantClosedModal");
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  // Mostrar barra sticky al hacer scroll past el trigger
  useEffect(() => {
    const trigger = stickyTriggerRef.current;
    if (!trigger) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(trigger);
    return () => observer.disconnect();
  }, []);

  // Verificar si hay pedidos activos — devuelve el array (o vacío) sin tocar estado
  const checkActiveOrder = async (): Promise<ActiveOrder[]> => {
    const clientId = user?.id || guestId;
    if (!clientId || !restaurantId) return [];
    try {
      const response = (await tapOrderService.getActiveOrderByUser(
        clientId,
        restaurantId,
      )) as any;
      return response.success && response.hasActiveOrder
        ? (response.orders ?? [])
        : [];
    } catch (error) {
      console.error("Error checking active order:", error);
      return [];
    }
  };

  // Verificar último pedido — devuelve los platillos reordenables
  const checkLastOrderItems = async (): Promise<LastOrderDish[]> => {
    const clientId = user?.id || guestId;
    if (!clientId || !restaurantId) return [];
    try {
      const response = await tapOrderService.getLastOrderByUser(
        clientId,
        restaurantId,
      );
      return response.success && (response as any).hasLastOrder
        ? ((response as any)?.data?.dishes ?? []).filter(
            (d: LastOrderDish) => d.menu_item_id,
          )
        : [];
    } catch (error) {
      console.error("Error checking last order:", error);
      return [];
    }
  };

  // Cargar ambos en paralelo y setear el estado junto, para que los botones de
  // "Estatus de pedido" y "Reordenar" aparezcan exactamente al mismo tiempo.
  // #97: se difiere a que el navegador esté ocioso para no competir con la carga del menú.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [orders, dishes] = await Promise.all([
        checkActiveOrder(),
        checkLastOrderItems(),
      ]);
      if (cancelled) return;
      setActiveOrders(orders);
      setActiveOrderIndex((prev) => (prev < orders.length ? prev : 0));
      setLastOrderItems(dishes);
      setHasLastOrder(dishes.length > 0);
    };

    // Safari no tiene requestIdleCallback.
    const hasIdle = typeof window.requestIdleCallback === "function";
    const handle = hasIdle
      ? window.requestIdleCallback(load, { timeout: 2000 })
      : window.setTimeout(load, 1500);

    return () => {
      cancelled = true;
      if (hasIdle) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, guestId, restaurantId]);

  const activeOrder = activeOrders[activeOrderIndex] ?? null;

  const handleReorder = () => setShowReorderModal(true);

  const handleRefreshOrder = async () => {
    setIsRefreshing(true);
    const orders = await checkActiveOrder();
    setActiveOrders(orders);
    setActiveOrderIndex((prev) => (prev < orders.length ? prev : 0));
    setIsRefreshing(false);
  };

  // Obtener categorías únicas del menú ordenadas por display_order
  const categorias = useMemo(() => {
    const categories = ["Todo"];
    if (menu && menu.length > 0) {
      const sortedSections = [...menu].sort(
        (a, b) => a.display_order - b.display_order,
      );
      sortedSections.forEach((section) => {
        if (section.name) categories.push(section.name);
      });
    }
    return categories;
  }, [menu]);

  const gender = signUpData?.gender;

  const totalItems = cartState.totalItems;

  const closePepperChat = () => {
    setIsPepperClosing(true);
    refreshCart();
    setTimeout(() => {
      setShowPepperChat(false);
      setIsPepperClosing(false);
    }, 380);
  };

  // El back gesto/botón del dispositivo cierra estos modales en vez de
  // salir de la página (misma animación que cerrar con la X/backdrop).
  useModalBackClose(showDetail, () => closeDetail());
  useModalBackClose(showPepperChat, () => closePepperChat());
  useModalBackClose(showSettingsModal, () => closeSettingsModal());

  const deferredFilter = useDeferredValue(filter);
  const deferredSearch = useDeferredValue(searchQuery);

  // Filtrar menú usando valores diferidos — el render pesado ocurre en baja prioridad
  const filteredMenu = useMemo(() => {
    let filtered = menu;

    if (deferredFilter !== "Todo") {
      filtered = filtered.filter((section) => section.name === deferredFilter);
    }

    if (deferredSearch.trim()) {
      const query = deferredSearch.toLowerCase().trim();
      filtered = filtered
        .map((section) => ({
          ...section,
          items: section.items.filter(
            (item) =>
              item.name.toLowerCase().includes(query) ||
              item.description?.toLowerCase().includes(query),
          ),
        }))
        .filter((section) => section.items.length > 0);
    }

    return [...filtered].sort((a, b) => a.display_order - b.display_order);
  }, [menu, deferredFilter, deferredSearch]);

  if (loading && !restaurant) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="min-h-screen brand-evergreen flex items-center justify-center">
        <div className="text-center px-6">
          <h1 className="text-2xl font-bold text-white mb-2">
            {tc("errorTitle")}
          </h1>
          <p className="text-white">{error}</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen brand-evergreen flex items-center justify-center">
        <div className="text-center px-6">
          <h1 className="text-2xl font-bold text-white mb-2">
            {t("restaurantNotFound")}
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative">
      {restaurant.banner_url ? (
        <img
          src={restaurant.banner_url}
          alt=""
          fetchPriority="high"
          className="absolute -top-10 md:top-0 left-0 w-full h-(--menu-banner-h) object-cover banner-mobile z-0"
        />
      ) : (
        <div className="absolute top-0 left-0 w-full h-(--menu-banner-h) bg-even-evergreen banner-mobile z-0" />
      )}

      {/* Degradado para legibilidad del texto sobre el banner */}
      <div className="absolute top-0 left-0 w-full h-28 md:h-40 bg-linear-to-b from-black/55 to-transparent z-0 pointer-events-none" />

      <MenuHeader
        restaurant={restaurant}
        menuOpen={menuOpenByUser}
        onToggleMenu={() => setMenuOpenByUser((open) => !open)}
      />

      {/* Logo + bienvenida sobre el banner (no sticky) */}
      <div className="absolute top-0 inset-x-0 z-6 pointer-events-none">
        <div className="container mx-auto px-5 md:px-8 lg:px-10 pt-5 md:pt-7 lg:pt-9">
          <div className="flex items-center gap-2 md:gap-3 h-10 md:h-12 lg:h-14 pr-24 md:pr-32 lg:pr-40">
            <button
              ref={logoButtonRef}
              type="button"
              onClick={() => (showDetail ? closeDetail() : setShowDetail(true))}
              aria-haspopup="dialog"
              aria-expanded={showDetail}
              aria-label={tr("openDetail")}
              style={{ opacity: introActive ? 0 : 1 }}
              className="pointer-events-auto size-10 md:size-12 lg:size-14 shrink-0 rounded-full bg-even-evergreen overflow-hidden border border-white/70 shadow-sm active:scale-95 transition-transform"
            >
              {restaurant.logo_url && (
                <img
                  src={restaurant.logo_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              )}
            </button>
            {/* Con la intro activa (y durante el vuelo del logo) el texto queda
                invisible pero ocupando su espacio; aparece al aterrizar el logo. */}
            <h1
              className="reduce-motion-fade text-white text-xl md:text-3xl lg:text-4xl font-medium truncate drop-shadow"
              style={{
                opacity: introActive ? 0 : 1,
                transform: introActive ? "translateX(-0.75rem)" : "none",
                transition:
                  "opacity 300ms ease, transform 300ms cubic-bezier(0.32, 0.72, 0, 1)",
              }}
            >
              {t("welcome", {
                gender: gender === "female" ? "female" : "other",
                name: profile?.firstName ? ` ${profile.firstName}` : "",
              })}
            </h1>
          </div>
        </div>
      </div>

      <main
        className="mt-(--menu-card-gap) relative z-10"
        inert={showDetail || introActive}
        aria-hidden={showDetail || introActive}
      >
        <div className="bg-white rounded-t-4xl flex flex-col items-center px-6 md:px-8 lg:px-10">
          {/* Trigger invisible para IntersectionObserver */}
          <div
            ref={stickyTriggerRef}
            className="absolute top-0 h-px w-px pointer-events-none"
          />
          {/* Nombre del restaurante y mesa/habitación */}
          <MenuRestaurantHeading
            name={restaurant.name}
            subtitle={tc("tableLabel", { table: tableNumber ?? "" })}
            actions={
              (activeOrders.length > 0 || hasLastOrder) ? (
                <div className="flex flex-wrap justify-center gap-2">
                  {activeOrders.length > 0 && (
                    <button
                      onClick={() =>
                        setTimeout(() => setIsStatusModalOpen(true), 400)
                      }
                      className="bg-surface border border-stroke rounded-full px-3 md:px-4 lg:px-5 py-1 md:py-1.5 text-sm md:text-lg lg:text-xl font-medium text-black w-fit active:scale-90 transition-all"
                    >
                      {activeOrders.length > 1 ? t("viewOrders") : t("orderStatus")}
                    </button>
                  )}
                  {hasLastOrder && (
                    <button
                      onClick={handleReorder}
                      className="bg-even-grass text-even-evergreen border border-stroke rounded-full px-3 md:px-4 lg:px-5 py-1 md:py-1.5 text-sm md:text-lg lg:text-xl font-medium w-fit active:scale-90 transition-all flex items-center gap-1.5"
                    >
                      {tc("reorderCta")}
                      <RefreshCw className="size-4" />
                    </button>
                  )}
                </div>
              ) : undefined
            }
          />

          <div className="w-full">
            <MenuSearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={t("searchPlaceholder")}
            />
          </div>

          <CategoryTabs
            className="mt-3 md:mt-5 mb-3 md:mb-5"
            aria-label={t("categoriesLabel")}
            tabs={categorias.map((cat) => ({
              id: cat,
              label: cat === "Todo" ? t("filterAll") : cat,
            }))}
            activeId={activeCat}
            onSelect={selectCategory}
          />

          {/* Items */}
          {filteredMenu.length > 0 ? (
            filteredMenu.map((section) => (
              <MenuCategory
                key={section.id}
                section={section}
                showSectionName={deferredFilter === "Todo"}
                onRestaurantClosed={() => setShowClosedModal(true)}
              />
            ))
          ) : (
            <MenuEmptyState
              message={
                searchQuery.trim()
                  ? t("noResultsFor", { query: searchQuery })
                  : t("noItemsAvailable")
              }
            />
          )}
        </div>
      </main>

      {/* Carrito flotante */}
      <FloatingCartButton
        count={totalItems}
        hidden={showDetail || introActive}
        label={t("viewCart", { count: totalItems })}
        onClick={() => navigateWithTable("/cart")}
      />

      <MenuActionsPill visible={pillVisible}>
        <PillButton onClick={() => setShowSettingsModal(true)} aria-label={t("profileAlt")} clip>
          <UserAvatar
            isAuthenticated={isAuthenticated}
            profile={profile}
            iconSize="size-6 md:size-7"
            textSize="text-base md:text-lg"
          />
        </PillButton>
        <PillCartButton
          onClick={() => navigateWithTable("/cart")}
          count={totalItems}
          aria-label={t("viewCart", { count: totalItems })}
        />
        <PillPepperButton onClick={() => setShowPepperChat(true)} aria-label={t("pepperLabel")}>
          <PepperIcon />
        </PillPepperButton>
      </MenuActionsPill>

      {/* Bienvenida al cargar la página */}
      {introActive && (
        <RestaurantIntro
          restaurant={restaurant}
          phase={introPhase === "fly" ? "fly" : "show"}
          branchName={tc("tableLabel", { table: tableNumber ?? "" })}
          welcomeText={t("welcome", {
            gender: gender === "female" ? "female" : "other",
            name: profile?.firstName ? ` ${profile.firstName}` : "",
          })}
          logoTransform={introLogoTransform}
          logoRef={introLogoRef}
          onSkip={startIntroFly}
        />
      )}

      {/* Detalle del restaurante (se intercambia con la tarjeta del menú) */}
      <RestaurantDetailCard
        restaurant={restaurant}
        open={showDetail}
        onClose={closeDetail}
      />

      {/* Status Modal */}
      {isStatusModalOpen && activeOrder && (
        <div
          className="fixed inset-0 bg-black/25 backdrop-blur-xs z-999 flex items-center justify-center"
          onClick={() => setIsStatusModalOpen(false)}
        >
          <div
            className="relative bg-even-evergreen/80 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] w-full mx-4 md:mx-12 lg:mx-28 rounded-4xl z-999 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {activeOrders.length > 1 && (
              <>
                <button
                  onClick={() => setActiveOrderIndex((i) => i - 1)}
                  disabled={activeOrderIndex === 0}
                  className="absolute left-3 md:left-4 top-[30%] z-10 rounded-full size-9 md:size-10 flex items-center justify-center bg-white/10 border border-white/25 hover:bg-white/20 transition-colors active:scale-90 disabled:opacity-25 disabled:pointer-events-none"
                >
                  <ChevronLeft className="size-6 md:size-7 text-white" />
                </button>
                <button
                  onClick={() => setActiveOrderIndex((i) => i + 1)}
                  disabled={activeOrderIndex === activeOrders.length - 1}
                  className="absolute right-3 md:right-4 top-[30%] z-10 rounded-full size-9 md:size-10 flex items-center justify-center bg-white/10 border border-white/25 hover:bg-white/20 transition-colors active:scale-90 disabled:opacity-25 disabled:pointer-events-none"
                >
                  <ChevronRight className="size-6 md:size-7 text-white" />
                </button>
              </>
            )}
            {/* Header */}
            <div className="shrink-0">
              <div className="w-full flex justify-end">
                <button
                  onClick={() => setIsStatusModalOpen(false)}
                  className="p-2 md:p-3 lg:p-4 hover:bg-white/10 rounded-lg md:rounded-xl transition-colors justify-end flex items-end mt-3 md:mt-4 lg:mt-5 mr-3 md:mr-4 lg:mr-5"
                >
                  <X className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-white" />
                </button>
              </div>
              <div className="px-6 md:px-8 lg:px-10 flex items-center justify-center mb-4 md:mb-5 lg:mb-6">
                <div className="flex flex-col justify-center items-center gap-3 md:gap-4 lg:gap-5">
                  {restaurant?.logo_url ? (
                    <img
                      src={restaurant.logo_url}
                      alt={restaurant.name}
                      className="size-20 md:size-24 lg:size-28 object-cover rounded-lg md:rounded-xl"
                    />
                  ) : (
                    <Utensils className="size-20 md:size-24 lg:size-28 text-white" />
                  )}
                  <div className="flex flex-col items-center justify-center">
                    <h2 className="text-xl md:text-2xl lg:text-3xl text-white font-bold">
                      {tc("orderStatusModalTitle")}
                    </h2>
                    <p className="text-sm md:text-base lg:text-lg text-white/80">
                      {tc("tableLabel", { table: tableNumber ?? "" })}
                    </p>
                    {activeOrders.length > 1 && (
                      <p className="text-sm md:text-base lg:text-lg text-white/80">
                        {t("orderPageOf", {
                          current: activeOrderIndex + 1,
                          total: activeOrders.length,
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 md:px-8 lg:px-10 border-t border-white/20 pt-4 md:pt-5 lg:pt-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-xl md:text-2xl lg:text-3xl text-white">
                    {tc("orderedItems")}
                  </h3>
                  <button
                    onClick={handleRefreshOrder}
                    disabled={isRefreshing}
                    className="rounded-full hover:bg-white/10 p-1 md:p-1.5 lg:p-2 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`size-5 md:size-6 lg:size-7 text-white ${isRefreshing ? "animate-spin" : ""}`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Order Items - Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 md:px-8 lg:px-10 pt-4 md:pt-5 lg:pt-6 pb-6 md:pb-8 lg:pb-10">
              {isRefreshing ? (
                <div className="flex justify-center items-center py-12 md:py-16 lg:py-20">
                  <Loader2 className="size-8 md:size-10 lg:size-12 animate-spin text-white" />
                </div>
              ) : activeOrder.dishes && activeOrder.dishes.length > 0 ? (
                <div className="space-y-3 md:space-y-4 lg:space-y-5">
                  {activeOrder.dishes.map((dish, index) => (
                    <div
                      key={dish.id || index}
                      className="flex items-start gap-3 md:gap-4 lg:gap-5 bg-white/5 rounded-xl md:rounded-2xl p-3 md:p-4 lg:p-5 border border-white/10"
                    >
                      {showImages && (
                        <div className="shrink-0">
                          <div className="size-16 md:size-20 lg:size-24 bg-tone-300 rounded-sm flex items-center justify-center overflow-hidden">
                            {dish.images &&
                            dish.images.length > 0 &&
                            dish.images[0] ? (
                              <img
                                src={dish.images[0]}
                                alt={dish.item}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <img
                                src="/even/even-asterisk-evergreen.svg"
                                alt="Logo Even"
                                className="size-10 md:size-12 lg:size-14 object-contain"
                              />
                            )}
                          </div>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base md:text-lg lg:text-xl text-white font-medium capitalize">
                          {dish.item}
                        </h3>
                        <div className="mt-1 md:mt-1.5 lg:mt-2">
                          <span
                            className={`inline-block px-2 md:px-3 lg:px-4 py-0.5 md:py-1 lg:py-1.5 text-xs md:text-sm lg:text-base font-medium rounded-full border ${getStatusColor(dish.status)}`}
                          >
                            {getStatusText(dish.status)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <p className="text-xs md:text-sm lg:text-base text-white/60">
                          {tc("quantityLabel", { quantity: dish.quantity })}
                        </p>
                        <p className="text-base md:text-lg lg:text-xl text-white font-medium">
                          ${(Number(dish.price) * dish.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 md:py-10 lg:py-12">
                  <p className="text-white/70 text-base md:text-lg lg:text-xl">
                    {tc("noOrderInfo")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div>
          <div
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
            style={{
              animation: isSettingsClosing
                ? "fadeOut 0.38s cubic-bezier(0.32, 0.72, 0, 1) forwards"
                : "fadeIn 0.38s cubic-bezier(0.32, 0.72, 0, 1)",
            }}
            onClick={closeSettingsModal}
          />
          <div
            className="fixed inset-x-0 z-50 flex flex-col rounded-t-3xl shadow-2xl border-t border-white/20"
            style={{
              top: "5%",
              bottom: 0,
              paddingBottom: "env(safe-area-inset-bottom)",
              background: "rgba(255, 255, 255, 0.82)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              animation: isSettingsClosing
                ? "slideDown 0.38s cubic-bezier(0.32, 0.72, 0, 1) forwards"
                : "slideUp 0.38s cubic-bezier(0.32, 0.72, 0, 1)",
            }}
          >
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-tone-300/80" />
            </div>
            <Suspense fallback={null}>
              {isAuthenticated && profile?.firstName ? (
                <div className="flex-1 min-h-0">
                  <DashboardView
                    onClose={closeSettingsModal}
                    onLogout={handleSettingsLogout}
                    initialTab={dashboardInitialTab}
                  />
                </div>
              ) : (
                <AuthView onClose={closeSettingsModal} />
              )}
            </Suspense>
          </div>
        </div>
      )}

      {/* Pepper Chat Modal */}
      {showPepperChat && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
            style={{
              animation: isPepperClosing
                ? "fadeOut 0.38s cubic-bezier(0.32, 0.72, 0, 1) forwards"
                : "fadeIn 0.38s cubic-bezier(0.32, 0.72, 0, 1)",
            }}
            onClick={closePepperChat}
          />
          <div
            className="fixed inset-x-0 z-50 flex flex-col rounded-t-3xl overflow-hidden shadow-2xl border-t border-white/30"
            style={{
              top: "12%",
              bottom: 0,
              paddingBottom: "env(safe-area-inset-bottom)",
              background: "rgba(255, 255, 255, 0.82)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              animation: isPepperClosing
                ? "slideDown 0.38s cubic-bezier(0.32, 0.72, 0, 1) forwards"
                : "slideUp 0.38s cubic-bezier(0.32, 0.72, 0, 1)",
            }}
          >
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-tone-300/80" />
            </div>
            <Suspense fallback={null}>
              <ChatView onBack={closePepperChat} />
            </Suspense>
          </div>
          <style>{`
            @keyframes slideUp {
              from { transform: translateY(100%); opacity: 0.6; }
              to   { transform: translateY(0);    opacity: 1; }
            }
            @keyframes slideDown {
              from { transform: translateY(0);    opacity: 1; }
              to   { transform: translateY(100%); opacity: 0.6; }
            }
            @keyframes fadeIn {
              from { opacity: 0; }
              to   { opacity: 1; }
            }
            @keyframes fadeOut {
              from { opacity: 1; }
              to   { opacity: 0; }
            }
          `}</style>
        </>
      )}

      {/* Reorder Modal */}
      <Suspense fallback={null}>
        <ReorderModal
          isOpen={showReorderModal}
          onClose={() => setShowReorderModal(false)}
          items={lastOrderItems}
        />
      </Suspense>

      {/* Restaurant Closed Modal */}
      <Suspense fallback={null}>
        <RestaurantClosedModal
          isOpen={showClosedModal}
          onClose={() => setShowClosedModal(false)}
          openingHours={restaurant?.opening_hours}
          restaurantName={restaurant?.name}
          restaurantLogo={restaurant?.logo_url}
        />
      </Suspense>
    </div>
  );
}
