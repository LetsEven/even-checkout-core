"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  MenuItem as MenuItemDB,
  MenuItemData,
  CustomField,
} from "@/app/interfaces/menuItemData";
import { useCart } from "@/app/context/CartContext";
import { useTableNavigation } from "@/app/hooks/useTableNavigation";
import { useFlyToCart } from "@/app/hooks/useFlyToCart";
import { useRestaurant } from "@/app/context/RestaurantContext";
import { MenuProductCard, MenuQuickAddModal, rememberMenuPosition } from "@even/ui";
import { useRef, useState, useEffect, useMemo, memo } from "react";
import OutOfStockModal from "@/app/components/OutOfStockModal";
import { getItemDisplayPrice } from "@/app/utils/commissionCalculator";
import { usePersonalItemDiscounts } from "@/app/hooks/usePersonalItemDiscounts";

interface MenuItemProps {
  item: MenuItemDB | MenuItemData;
  onRestaurantClosed?: () => void;
}

function MenuItem({ item, onRestaurantClosed }: MenuItemProps) {
  const tc = useTranslations("Common");
  const tm = useTranslations("MenuItem");
  // Adaptar el item de BD al formato legacy
  const adaptedItem: MenuItemData = useMemo(() => {
    if ("images" in item && "features" in item) {
      return item as MenuItemData;
    }
    const dbItem = item as MenuItemDB;
    return {
      id: dbItem.id,
      name: dbItem.name,
      description: dbItem.description || "",
      price: Number(dbItem.price),
      display_price:
        dbItem.display_price != null
          ? Number(dbItem.display_price)
          : Number(dbItem.price),
      images: dbItem.image_url ? [dbItem.image_url] : [],
      discount: dbItem.discount,
      features: [],
    };
  }, [item]);

  const isOutOfStock = useMemo(() => {
    if ("images" in item) return false;
    return (item as MenuItemDB).is_out_of_stock === true;
  }, [item]);

  const { state, addItem, decrementItem } = useCart();
  const { navigateWithTable, getUrlWithTable } = useTableNavigation();
  const router = useRouter();
  const { flyToCart } = useFlyToCart();
  const { isOpen, restaurant, restaurantId } = useRestaurant();
  const showImages = !!restaurant && restaurant.menu_show_images !== false;
  const personalDiscounts = usePersonalItemDiscounts(restaurantId);
  const personalDiscount = personalDiscounts.get(adaptedItem.id);
  // Si el producto también tiene descuento de admin-portal, gana
  // el % mayor entre los dos — nunca se suman.
  const effectiveDiscount = Math.max(
    adaptedItem.discount || 0,
    personalDiscount?.percentage || 0,
  );
  const plusButtonRef = useRef<HTMLButtonElement>(null);
  const isAddingRef = useRef(false);
  const isRemovingRef = useRef(false);
  const [localQuantity, setLocalQuantity] = useState(0);
  const [isPulsing, setIsPulsing] = useState(false);
  const [showOutOfStockModal, setShowOutOfStockModal] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const hasRequiredCustomFields = useMemo(() => {
    const dbItem = item as MenuItemDB;
    if (dbItem.custom_fields) {
      let fields: CustomField[] = [];
      if (typeof dbItem.custom_fields === "string") {
        try {
          fields = JSON.parse(dbItem.custom_fields);
        } catch {
          return false;
        }
      } else if (Array.isArray(dbItem.custom_fields)) {
        fields = dbItem.custom_fields;
      }
      return fields.some((field: CustomField) => field.required === true);
    }
    return false;
  }, [item]);

  // Requiere configuración si tiene cualquier custom_field (obligatorio u opcional: tamaño, leche, extras...).
  // Esos productos se agregan desde /dish/[id]; el resto, desde el mini modal de la tarjeta.
  const requiresConfiguration = useMemo(() => {
    const cf = (item as MenuItemDB).custom_fields as unknown;
    if (!cf) return false;
    if (typeof cf === "string") {
      try {
        const parsed = JSON.parse(cf);
        return Array.isArray(parsed) && parsed.length > 0;
      } catch {
        return false;
      }
    }
    return Array.isArray(cf) && cf.length > 0;
  }, [item]);

  // Prefetch al entrar en pantalla (como <Link>) para que /dish abra con su loading al instante
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      router.prefetch(getUrlWithTable(`/dish/${adaptedItem.id}`));
      observer.disconnect();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [adaptedItem.id, router, getUrlWithTable, showImages]);

  // Desde el "+" no llega el elemento de la tarjeta: se toma de cardRef.
  const openDish = (card: HTMLElement | null | undefined = cardRef.current) => {
    if (card) {
      rememberMenuPosition(String(restaurantId), String(adaptedItem.id), card);
    }
    navigateWithTable(`/dish/${adaptedItem.id}`);
  };

  const handleAddToCart = async () => {
    if (isAddingRef.current) return;

    if (isOutOfStock) {
      setShowOutOfStockModal(true);
      return;
    }

    if (!isOpen) {
      onRestaurantClosed?.();
      return;
    }

    if (hasRequiredCustomFields) {
      const lastItemKey = `lastItem_${adaptedItem.id}`;
      const lastItemData = sessionStorage.getItem(lastItemKey);

      if (lastItemData) {
        try {
          const lastItem = JSON.parse(lastItemData);
          isAddingRef.current = true;
          setLocalQuantity((prev) => prev + 1);
          setIsPulsing(true);
          try {
            const flySource =
              plusButtonRef.current ??
              cardRef.current?.querySelector<HTMLElement>("img") ??
              cardRef.current;
            if (flySource) {
              flyToCart(flySource, async () => {
                await addItem(lastItem);
              });
            } else {
              await addItem(lastItem);
            }
          } finally {
            isAddingRef.current = false;
          }
        } catch (error) {
          console.error("Error parsing last item:", error);
          openDish();
        }
      } else {
        setIsPulsing(true);
        openDish();
      }
      return;
    }

    const finalPrice =
      effectiveDiscount > 0
        ? adaptedItem.price * (1 - effectiveDiscount / 100)
        : adaptedItem.price;

    const itemWithDiscount = {
      ...adaptedItem,
      price: finalPrice,
      userDiscountId: personalDiscount?.id ?? null,
    };

    isAddingRef.current = true;
    setLocalQuantity((prev) => prev + 1);
    setIsPulsing(true);

    try {
      const flySource =
        plusButtonRef.current ??
        cardRef.current?.querySelector<HTMLElement>("img") ??
        cardRef.current;
      if (flySource) {
        flyToCart(flySource, async () => {
          await addItem(itemWithDiscount);
        });
      } else {
        await addItem(itemWithDiscount);
      }
    } finally {
      isAddingRef.current = false;
    }
  };

  useEffect(() => {
    if (isPulsing) {
      const timer = setTimeout(() => setIsPulsing(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isPulsing]);

  const handleRemoveFromCart = async () => {
    if (isRemovingRef.current) return;

    const itemsWithSameId = state.items.filter(
      (cartItem) => cartItem.id === adaptedItem.id,
    );
    if (itemsWithSameId.length > 1) {
      navigateWithTable("/cart");
      return;
    }

    isRemovingRef.current = true;
    setLocalQuantity((prev) => Math.max(0, prev - 1));
    setIsPulsing(true);

    try {
      await decrementItem(adaptedItem.id);
    } finally {
      isRemovingRef.current = false;
    }
  };

  const currentQuantity = state.items
    .filter((cartItem) => cartItem.id === adaptedItem.id)
    .reduce((sum, item) => sum + item.quantity, 0);

  const displayQuantity = Math.max(localQuantity, currentQuantity);

  const formatPrice = (amount: number) => `$${amount.toFixed(2)}`;

  // Tocar la tarjeta: agotado -> modal de agotado; con configuración -> detalle; sin configuración -> mini modal.
  const handleCardOpen = (card: HTMLElement) => {
    if (isOutOfStock) {
      setShowOutOfStockModal(true);
      return;
    }
    if (requiresConfiguration) {
      openDish(card);
      return;
    }
    if (!isOpen) {
      onRestaurantClosed?.();
      return;
    }
    setShowQuickAdd(true);
  };

  // "+" de la píldora (cantidad > 0): con configuración lleva al detalle; sin ella agrega 1.
  const handlePillAdd = () => {
    if (isOutOfStock) {
      setShowOutOfStockModal(true);
      return;
    }
    if (requiresConfiguration && isOpen) {
      openDish();
      return;
    }
    void handleAddToCart();
  };

  return (
    <>
      <OutOfStockModal
        isOpen={showOutOfStockModal}
        onClose={() => setShowOutOfStockModal(false)}
        itemName={adaptedItem.name}
      />
      <MenuQuickAddModal
        open={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        onConfirm={() => void handleAddToCart()}
        name={adaptedItem.name}
        description={adaptedItem.description}
        imageUrl={adaptedItem.images[0]}
        priceLabel={formatPrice(
          effectiveDiscount > 0
              ? getItemDisplayPrice(adaptedItem.price * (1 - effectiveDiscount / 100))
              : (adaptedItem.display_price ?? adaptedItem.price),
        )}
        labels={{ add: tc("quickAddAdd"), back: tc("quickAddBack") }}
      />
      <MenuProductCard
        id={adaptedItem.id}
        name={adaptedItem.name}
        description={adaptedItem.description}
        price={showImages ? (adaptedItem.display_price ?? adaptedItem.price) : adaptedItem.price}
        finalPrice={
          showImages
            ? effectiveDiscount > 0
              ? getItemDisplayPrice(adaptedItem.price * (1 - effectiveDiscount / 100))
              : (adaptedItem.display_price ?? adaptedItem.price)
            : undefined
        }
        discountPercent={effectiveDiscount}
        imageUrl={adaptedItem.images[0]}
        variant={showImages ? "image" : "compact"}
        features={adaptedItem.features}
        outOfStock={isOutOfStock}
        quantity={displayQuantity}
        pulse={isPulsing}
        onOpen={handleCardOpen}
        cardRef={cardRef}
        onIncrement={handlePillAdd}
        onDecrement={() => void handleRemoveFromCart()}
        incrementRef={plusButtonRef}
        formatPrice={formatPrice}
        labels={{
          outOfStock: tc("outOfStockBadge"),
          discount: (percent) => tm("discountBadge", { percent }),
          increment: (name) => tm("addToCart", { name }),
          decrement: (name) => tm("removeFromCart", { name }),
          imageAlt: (name) => tm("imageAlt", { name }),
        }}
      />
    </>
  );
}

export default memo(MenuItem);
