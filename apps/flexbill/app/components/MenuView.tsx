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
  forwardRef,
  useImperativeHandle,
} from "react";
import { useTranslations } from "next-intl";
import {
  setMenuCategory,
  takeMenuPosition,
} from "@/app/utils/menuScrollMemory";
import MenuHeader from "@/app/components/headers/MenuHeader";
import RestaurantDetailCard, {
  DETAIL_ANIMATION_MS,
} from "@/app/components/RestaurantDetailCard";
import RestaurantIntro from "@/app/components/RestaurantIntro";
import {
  MenuActionsPill,
  PillButton,
  PillCartButton,
  PillPepperButton,
  UserAvatar as SharedUserAvatar,
  useRestaurantIntro,
} from "@even/ui";
import MenuCategory from "@/app/components/MenuCategory";
import PepperIcon from "@/app/components/UI/PepperIcon";
import ErrorScreen from "@/app/components/ErrorScreen";
import Loader from "@/app/components/UI/Loader";
import {
  Search,
  ShoppingCart,
  ReceiptText,
  RefreshCw,
  X,
  Utensils,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { useTableNavigation } from "@/app/hooks/useTableNavigation";
import { useCart } from "@/app/context/CartContext";
import { useRestaurant } from "@/app/context/RestaurantContext";
import { DEFAULT_IMAGES } from "@/app/constants/images";
import { useTable } from "@/app/context/TableContext";
import ReorderModal from "@/app/components/ReorderModal";
import { useModalBackClose } from "@/app/hooks/useModalBackClose";

const ChatView = lazy(() => import("@/app/components/ChatView"));
const AuthView = lazy(() => import("./AuthView"));
const DashboardView = lazy(() => import("./DashboardView"));
const RestaurantClosedModal = lazy(
  () => import("@/app/components/RestaurantClosedModal"),
);

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

function getStatusText(status: string, labels: Record<string, string>) {
  switch (status) {
    case "pending":
      return labels.pending;
    case "preparing":
      return labels.preparing;
    case "ready":
      return labels.ready;
    case "delivered":
      return labels.delivered;
    default:
      return status;
  }
}

function lockScroll() {
  const scrollY = window.scrollY;
  document.body.style.position = "fixed";
  document.body.style.top = `-${scrollY}px`;
  document.body.style.width = "100%";
  document.body.style.overflow = "hidden";
}

function unlockScroll() {
  const scrollY = parseInt(document.body.style.top || "0") * -1;
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.width = "";
  document.body.style.overflow = "";
  window.scrollTo(0, scrollY);
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

export interface MenuViewHandle {
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const MenuView = forwardRef<MenuViewHandle, MenuViewProps>(function MenuView(
  { tableNumber },
  ref,
) {
  const t = useTranslations("MenuView");
  const tc = useTranslations("Common");
  const tr = useTranslations("RestaurantDetail");
  const statusLabels = {
    pending: tc("statusPending"),
    preparing: tc("statusPreparing"),
    ready: tc("statusReady"),
    delivered: tc("statusDelivered"),
  };
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
  const filterBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pill, setPill] = useState<{
    left: number;
    width: number;
    animate: boolean;
  } | null>(null);

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
    filterBtnRefs.current[cat]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
    startTransition(() => setFilter(cat));
  };
  const [showPepperChat, setShowPepperChat] = useState(false);
  const [isPepperClosing, setIsPepperClosing] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isSettingsClosing, setIsSettingsClosing] = useState(false);
  const [dashboardInitialTab, setDashboardInitialTab] = useState<
    "profile" | "cards" | "history" | "support"
  >("profile");
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [showClosedModal, setShowClosedModal] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
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

  // La píldora (perfil, carrito, orden, Pepper) se ve si el usuario la abrió con
  // la hamburguesa o si aparece por scroll.
  const [menuOpenByUser, setMenuOpenByUser] = useState(false);
  const pillVisible =
    (menuOpenByUser || showStickyBar) && !showDetail && !introActive;
  // Al volver arriba la píldora se cierra sola
  const prevStickyRef = useRef(false);
  useEffect(() => {
    if (prevStickyRef.current && !showStickyBar) setMenuOpenByUser(false);
    prevStickyRef.current = showStickyBar;
  }, [showStickyBar]);

  useEffect(() => {
    if (
      showPepperChat ||
      showSettingsModal ||
      showReorderModal ||
      isStatusModalOpen ||
      showDetail ||
      introActive
    ) {
      lockScroll();
    } else {
      unlockScroll();
    }
    return unlockScroll;
  }, [
    showPepperChat,
    showSettingsModal,
    showReorderModal,
    isStatusModalOpen,
    showDetail,
    introActive,
  ]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("dashboard") === "cards") {
      setDashboardInitialTab("cards");
      setShowSettingsModal(true);
      url.searchParams.delete("dashboard");
      window.history.replaceState({}, "", url);
    }
  }, []);

  // Precargar chunks lazy después de que la página ya es interactiva
  useEffect(() => {
    const t = setTimeout(() => {
      import("./DashboardView");
      import("./AuthView");
      import("@/app/components/ChatView");
    }, 1500);
    return () => clearTimeout(t);
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

  const closePepperChat = () => {
    setIsPepperClosing(true);
    setTimeout(() => {
      setShowPepperChat(false);
      setIsPepperClosing(false);
    }, 380);
  };

  const closeSettingsModal = () => {
    setIsSettingsClosing(true);
    setTimeout(() => {
      setShowSettingsModal(false);
      setIsSettingsClosing(false);
    }, 380);
  };

  // El back gesto/botón del dispositivo cierra estos modales en vez de
  // salir de la página (misma animación que cerrar con la X/backdrop).
  useModalBackClose(showDetail, () => closeDetail());
  useModalBackClose(showPepperChat, () => closePepperChat());
  useModalBackClose(showSettingsModal, () => closeSettingsModal());

  const { profile, isAuthenticated, logout } = useAuth();
  const { navigateWithTable } = useTableNavigation();

  useImperativeHandle(ref, () => ({
    openAuthModal: () => setShowSettingsModal(true),
    closeAuthModal: () => closeSettingsModal(),
  }));

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
  const { state: cartState } = useCart();
  const { state: tableState, loadDishOrders, syncOrderFromPOS } = useTable();
  const { restaurant, menu, loading, error } = useRestaurant();
  const showImages = !!restaurant && restaurant.menu_show_images !== false;

  const handleRefreshOrder = async () => {
    setIsRefreshing(true);
    // Best-effort: jala platillos agregados directo en el POS antes de recargar, mismo patrón que OrderStatus.handleRefresh.
    await syncOrderFromPOS();
    await loadDishOrders();
    setIsRefreshing(false);
  };

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

  // Obtener categorías únicas del menú de la BD ordenadas por display_order
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

  // Posiciona la píldora negra bajo la categoría activa (y re-mide si cambia el ancho por fuentes)
  useLayoutEffect(() => {
    const btn = filterBtnRefs.current[activeCat];
    if (!btn) return;
    const measure = () =>
      setPill((prev) => ({
        left: btn.offsetLeft,
        width: btn.offsetWidth,
        animate: prev !== null,
      }));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(btn);
    return () => observer.disconnect();
  }, [activeCat, categorias]);

  const totalItems = cartState.totalItems;

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

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <ErrorScreen
        title={t("loadErrorTitle")}
        description={t("loadErrorDescription")}
        detail={error}
      />
    );
  }

  if (!restaurant) {
    return (
      <ErrorScreen
        title={t("restaurantNotFoundTitle")}
        description={t("restaurantNotFoundDescription")}
        detail={t("restaurantNotFoundDetail")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white relative">
      <img
        src={restaurant.banner_url || DEFAULT_IMAGES.RESTAURANT_BANNER}
        alt=""
        fetchPriority="high"
        className="absolute -top-10 md:top-0 left-0 w-full h-(--menu-banner-h) object-cover banner-mobile z-0"
      />

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
              <img
                src={restaurant.logo_url || DEFAULT_IMAGES.RESTAURANT_LOGO}
                alt=""
                className="w-full h-full object-cover"
              />
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
                gender: profile?.gender === "female" ? "female" : "other",
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
          {/* Nombre del restaurante y mesa */}
          <div className="mt-3 md:mt-6 mb-2 md:mb-4 w-full px-2 md:px-4">
            <h2 className="text-center text-2xl md:text-4xl font-semibold tracking-tight leading-tight text-black line-clamp-2 text-balance">
              {restaurant.name}
            </h2>
            <p className="mt-1 text-center text-tone-600 text-base md:text-xl">
              {tc("tableLabel", { table: tableNumber ?? "" })}
            </p>
          </div>

          {/* Estatus de pedido + Reordenar */}
          {Array.isArray(tableState.dishOrders) &&
            tableState.dishOrders.length > 0 && (
              <div className="mb-2 md:mb-4 flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => setIsStatusModalOpen(true)}
                  className="bg-surface border border-stroke rounded-full px-3 md:px-4 lg:px-5 py-1 md:py-1.5 text-sm md:text-base lg:text-lg font-medium text-black active:scale-90 transition-all"
                >
                  {t("orderStatus")}
                </button>
                <button
                  onClick={() => setShowReorderModal(true)}
                  className="bg-even-grass text-even-evergreen border border-stroke rounded-full px-3 md:px-4 lg:px-5 py-1 md:py-1.5 text-sm md:text-base lg:text-lg font-medium flex items-center gap-1.5 active:scale-90 transition-all"
                >
                  {tc("reorderCta")}
                  <RefreshCw className="size-4" />
                </button>
              </div>
            )}

          {/* Search Input */}
          <div className="w-full">
            <div className="flex items-center justify-center border-b border-black">
              <Search
                className="text-black size-5 md:size-6 lg:size-7"
                strokeWidth={1}
              />
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-black text-base md:text-lg lg:text-xl px-3 md:px-4 py-2 md:py-3 focus:outline-none"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="relative flex gap-2 md:gap-3 mt-3 md:mt-5 mb-3 md:mb-5 w-full overflow-x-auto scrollbar-hide">
            {pill && (
              <span
                aria-hidden
                className={`absolute top-0 bottom-0 rounded-full bg-black ${pill.animate ? "transition-[left,width] duration-300 ease-[cubic-bezier(0.34,1.3,0.64,1)]" : ""}`}
                style={{ left: pill.left, width: pill.width }}
              />
            )}
            {categorias.map((cat) => (
              <button
                key={cat}
                ref={(el) => {
                  filterBtnRefs.current[cat] = el;
                }}
                onClick={() => selectCategory(cat)}
                className={`relative px-3 md:px-5 lg:px-6 py-1 md:py-2 text-sm md:text-base lg:text-lg rounded-full whitespace-nowrap shrink-0 transition-colors duration-300
                ${
                  activeCat === cat
                    ? "text-white"
                    : "text-tone-500 hover:bg-tone-100"
                }`}
              >
                {cat === "Todo" ? t("filterAll") : cat}
              </button>
            ))}
          </div>

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
            <div className="text-center py-10 md:py-16">
              <p className="text-tone-500 text-base md:text-lg lg:text-xl">
                {searchQuery.trim()
                  ? t("noResultsFor", { query: searchQuery })
                  : t("noItemsAvailable")}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Carrito flotante */}
      {totalItems > 0 && !showDetail && !introActive && (
        <div className="fixed bottom-6 md:bottom-8 lg:bottom-10 left-0 right-0 z-50 flex justify-center pointer-events-none">
          <button
            onClick={() => navigateWithTable("/cart")}
            className="pointer-events-auto bg-even-grass text-even-evergreen rounded-full px-6 md:px-8 lg:px-10 py-4 md:py-5 lg:py-6 shadow-lg flex items-center gap-3 md:gap-4 cursor-pointer transition-all hover:scale-105 animate-bounce-in active:scale-90"
          >
            <ShoppingCart className="size-5 md:size-6 lg:size-7" />
            <span className="text-base md:text-lg lg:text-xl font-medium">
              {t("viewCart", { count: totalItems })}
            </span>
          </button>
        </div>
      )}

      <MenuActionsPill visible={pillVisible}>
        <PillButton onClick={() => setShowSettingsModal(true)} clip>
          <UserAvatar
            isAuthenticated={isAuthenticated}
            profile={profile}
            iconSize="size-6 md:size-7"
            textSize="text-base md:text-lg"
          />
        </PillButton>
        <PillCartButton
          onClick={() => navigateWithTable("/cart")}
          count={cartState.totalItems}
        />
        <PillButton
          onClick={() => navigateWithTable("/order")}
          count={
            Array.isArray(tableState.dishOrders)
              ? tableState.dishOrders.length
              : 0
          }
        >
          <ReceiptText
            className="size-5 md:size-6 text-warm-700"
            strokeWidth={1.5}
          />
        </PillButton>
        <PillPepperButton onClick={() => setShowPepperChat(true)}>
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
            gender: profile?.gender === "female" ? "female" : "other",
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
        </>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <>
          <div
            className="fixed inset-0 z-[100000] bg-black/30 backdrop-blur-sm"
            style={{
              animation: isSettingsClosing
                ? "fadeOut 0.38s cubic-bezier(0.32, 0.72, 0, 1) forwards"
                : "fadeIn 0.38s cubic-bezier(0.32, 0.72, 0, 1)",
            }}
            onClick={closeSettingsModal}
          />
          <div
            className="fixed inset-x-0 z-[100000] flex flex-col rounded-t-3xl shadow-2xl border-t border-white/20"
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
              <div className="w-10 h-1 rounded-full bg-white/30" />
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
        </>
      )}

      {/* Status Modal */}
      {isStatusModalOpen && (
        <div
          className="fixed inset-0 bg-black/25 backdrop-blur-xs z-[999] flex items-center justify-center"
          onClick={() => setIsStatusModalOpen(false)}
        >
          <div
            className="bg-even-evergreen/80 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] w-full mx-4 md:mx-12 lg:mx-28 rounded-4xl z-[999] max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="shrink-0">
              <div className="w-full flex justify-end">
                <button
                  onClick={() => setIsStatusModalOpen(false)}
                  className="p-2 md:p-3 lg:p-4 hover:bg-white/10 rounded-lg md:rounded-xl transition-colors mt-3 md:mt-4 lg:mt-5 mr-3 md:mr-4 lg:mr-5"
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
                      {t("orderStatus")}
                    </h2>
                    <p className="text-sm md:text-base lg:text-lg text-white/80">
                      {tc("tableLabel", { table: tableNumber ?? "" })}
                    </p>
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

            {/* Scrollable items */}
            <div className="flex-1 overflow-y-auto px-6 md:px-8 lg:px-10 pt-4 md:pt-5 lg:pt-6 pb-6 md:pb-8 lg:pb-10">
              {isRefreshing ? (
                <div className="flex justify-center items-center py-12 md:py-16 lg:py-20">
                  <Loader2 className="size-8 md:size-10 lg:size-12 animate-spin text-white" />
                </div>
              ) : tableState.dishOrders.length > 0 ? (
                <div className="space-y-3 md:space-y-4 lg:space-y-5">
                  {tableState.dishOrders.map((dish, index) => (
                    <div
                      key={dish.dish_order_id || index}
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
                        <p className="text-xs md:text-sm lg:text-base font-medium text-white/80 uppercase">
                          {dish.guest_name}
                        </p>
                        <div className="mt-1 md:mt-1.5 lg:mt-2">
                          <span
                            className={`inline-block px-2 md:px-3 lg:px-4 py-0.5 md:py-1 lg:py-1.5 text-xs md:text-sm lg:text-base font-medium rounded-full border ${getStatusColor(dish.status)}`}
                          >
                            {getStatusText(dish.status, statusLabels)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <p className="text-xs md:text-sm lg:text-base text-white/60">
                          {tc("quantityLabel", { quantity: dish.quantity })}
                        </p>
                        <p className="text-base md:text-lg lg:text-xl text-white font-medium">
                          $
                          {(
                            dish.total_display_price ??
                            Number(dish.price) * dish.quantity
                          ).toFixed(2)}
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

      {/* Reorder Modal */}
      <ReorderModal
        isOpen={showReorderModal}
        onClose={() => setShowReorderModal(false)}
        dishOrders={tableState.dishOrders}
        tableNumber={tableNumber}
      />

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
    </div>
  );
});

export default MenuView;
