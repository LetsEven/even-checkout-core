"use client";

import {
  MenuItem as MenuItemDB,
  MenuItemData,
  CustomField,
} from "../../interfaces/menuItemData";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCart } from "../../context/CartContext";
import { useRoomNavigation } from "../../hooks/useRoomNavigation";
import { useFlyToCart } from "../../hooks/useFlyToCart";
import { useRestaurant } from "../../context/RestaurantContext";
import { MenuProductCard, MenuQuickAddModal, rememberMenuPosition } from "@even/ui";
import { useRef, useState, useEffect, useMemo, memo } from "react";
import OutOfStockModal from "../OutOfStockModal";
import { usePersonalItemDiscounts } from "../../hooks/usePersonalItemDiscounts";

interface MenuItemProps {
  item: MenuItemDB | MenuItemData;
  onRestaurantClosed?: () => void;
}

function MenuItem({ item, onRestaurantClosed }: MenuItemProps) {
  const tc = useTranslations("Common");
  const tm = useTranslations("MenuItem");
  // Adaptar el item de BD al formato legacy
  const adaptedItem: MenuItemData = useMemo(() => {
    // Si ya tiene el formato legacy, devolverlo tal cual
    if ("images" in item && "features" in item) {
      return item as MenuItemData;
    }

    // Convertir de formato BD a formato legacy
    const dbItem = item as MenuItemDB;
    return {
      id: dbItem.id,
      name: dbItem.name,
      description: dbItem.description || "",
      price: Number(dbItem.price),
      images: dbItem.image_url ? [dbItem.image_url] : [],
      discount: dbItem.discount,
      features: [], // Los custom_fields podrían mapearse aquí si es necesario
    };
  }, [item]);
  const { state: cartState, addItem, decrementItem } = useCart();
  const { navigateWithRoom, getUrlWithRoom } = useRoomNavigation();
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

  const isOutOfStock = useMemo(() => {
    if ("images" in item) return false;
    return (item as MenuItemDB).is_available === false;
  }, [item]);

  // Verificar si el item tiene custom fields obligatorios
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
      // Solo retorna true si hay al menos un campo obligatorio
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
      router.prefetch(getUrlWithRoom(`/dish/${adaptedItem.id}`));
      observer.disconnect();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [adaptedItem.id, router, getUrlWithRoom, showImages]);

  // Desde el "+" no llega el elemento de la tarjeta: se toma de cardRef.
  const openDish = (card: HTMLElement | null | undefined = cardRef.current) => {
    if (card) {
      rememberMenuPosition(String(restaurantId), String(adaptedItem.id), card);
    }
    navigateWithRoom(`/dish/${adaptedItem.id}`);
  };

  const handleAddToCart = async () => {
    // Evitar clicks múltiples mientras se está agregando (usando ref para check síncrono)
    if (isAddingRef.current) {
      return;
    }

    // Verificar si el restaurante está abierto
    if (!isOpen) {
      onRestaurantClosed?.();
      return;
    }

    // Si tiene custom fields obligatorios, verificar si hay un último item guardado
    if (hasRequiredCustomFields) {
      const lastItemKey = `lastItem_${adaptedItem.id}`;
      const lastItemData = sessionStorage.getItem(lastItemKey);

      if (lastItemData) {
        // Si hay un último item guardado, agregarlo al carrito
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
        // Si no hay último item, navegar a la página de detalle
        setIsPulsing(true);
        openDish();
      }
      return;
    }

    // Calcular precio con descuento aplicado (admin-portal y/o personal,
    // el que sea mayor — effectiveDiscount ya resuelve eso)
    const finalPrice =
      effectiveDiscount > 0
        ? adaptedItem.price * (1 - effectiveDiscount / 100)
        : adaptedItem.price;

    // Crear item con precio con descuento
    const itemWithDiscount = {
      ...adaptedItem,
      price: finalPrice,
      userDiscountId: personalDiscount?.id ?? null,
    };

    // Si no tiene custom fields, agregar directamente al carrito
    // Bloquear SÍNCRONAMENTE con ref antes de cualquier async
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

  // Reset pulse animation
  useEffect(() => {
    if (isPulsing) {
      const timer = setTimeout(() => setIsPulsing(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isPulsing]);

  const handleRemoveFromCart = async () => {
    // Evitar clicks múltiples mientras se está removiendo (usando ref para check síncrono)
    if (isRemovingRef.current) {
      return;
    }

    // Si hay múltiples variaciones, navegar al carrito
    const itemsWithSameId = cartState.items.filter(
      (cartItem) => cartItem.id === adaptedItem.id,
    );
    if (itemsWithSameId.length > 1) {
      navigateWithRoom("/cart");
      return;
    }

    // Bloquear SÍNCRONAMENTE con ref antes de cualquier async
    isRemovingRef.current = true;

    // Update local quantity
    setLocalQuantity((prev) => Math.max(0, prev - 1));
    setIsPulsing(true);

    try {
      await decrementItem(adaptedItem.id);
    } finally {
      isRemovingRef.current = false;
    }
  };

  // Sumar todas las cantidades de items con el mismo id (considerando diferentes custom fields)
  const currentQuantity = cartState.items
    .filter((cartItem) => cartItem.id === adaptedItem.id)
    .reduce((sum, item) => sum + item.quantity, 0);

  // Sync local quantity with state
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
          adaptedItem.price * (1 - effectiveDiscount / 100),
        )}
        labels={{ add: tc("quickAddAdd"), back: tc("quickAddBack") }}
      />
      <MenuProductCard
        id={adaptedItem.id}
        name={adaptedItem.name}
        description={adaptedItem.description}
        price={adaptedItem.price}
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
