"use client";

import {
  MenuItem as MenuItemDB,
  MenuItemData,
  CustomField,
} from "../../interfaces/menuItemData";
import { useTranslations } from "next-intl";
import { useCart } from "../../context/CartContext";
import { useFlyToCart } from "../../hooks/useFlyToCart";
import { useNavigation } from "../../hooks/useNavigation";
import { useRestaurant } from "../../context/RestaurantContext";
import { MenuProductCard, rememberMenuPosition } from "@even/ui";
import { useRef, useState, useEffect, useMemo, memo } from "react";
import OutOfStockModal from "../OutOfStockModal";
import { usePersonalItemDiscounts } from "../../hooks/usePersonalItemDiscounts";

interface MenuItemProps {
  item: MenuItemDB | MenuItemData;
  onRestaurantClosed?: () => void;
}

function MenuItem({ item, onRestaurantClosed }: MenuItemProps) {
  const tc = useTranslations("Common");
  const t = useTranslations("MenuItem");
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
  const { state, addItem, decrementItem } = useCart();
  const { navigateToDish, navigateToCart, prefetchDish } = useNavigation();
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
  const [localQuantity, setLocalQuantity] = useState(0);
  const [isPulsing, setIsPulsing] = useState(false);
  const [showOutOfStockModal, setShowOutOfStockModal] = useState(false);

  // Verificar si el item está agotado en la sucursal actual
  const isOutOfStock = useMemo(() => {
    if ("images" in item) return false;
    return (item as MenuItemDB).is_out_of_stock === true;
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

  // Desde el "+" no llega el elemento de la tarjeta: se busca a partir del botón.
  const openDish = (
    card: HTMLElement | null | undefined = plusButtonRef.current?.closest<HTMLElement>(
      "[data-menu-item-id]",
    ),
  ) => {
    if (card) {
      rememberMenuPosition(String(restaurantId), String(adaptedItem.id), card);
    }
    navigateToDish(adaptedItem.id);
  };

  // Prefetch al entrar en pantalla (como <Link>) para que /dish abra con su loading al instante
  useEffect(() => {
    // El "+" vive dentro de la tarjeta, así que su posición es la de la tarjeta.
    const el = plusButtonRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      prefetchDish(adaptedItem.id);
      observer.disconnect();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [adaptedItem.id, prefetchDish, showImages]);

  const handleAddToCart = () => {
    if (isOutOfStock) {
      setShowOutOfStockModal(true);
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

          setLocalQuantity((prev) => prev + 1);
          setIsPulsing(true);

          if (plusButtonRef.current) {
            flyToCart(plusButtonRef.current, () => {
              addItem(lastItem);
            });
          } else {
            addItem(lastItem);
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
    setLocalQuantity((prev) => prev + 1);
    setIsPulsing(true);

    if (plusButtonRef.current) {
      flyToCart(plusButtonRef.current, () => {
        addItem(itemWithDiscount);
      });
    } else {
      addItem(itemWithDiscount);
    }
  };

  // Reset pulse animation
  useEffect(() => {
    if (isPulsing) {
      const timer = setTimeout(() => setIsPulsing(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isPulsing]);

  const handleRemoveFromCart = () => {
    // Buscar item en el carrito
    const cartItem = state.items.find((item) => item.name === adaptedItem.name);

    if (!cartItem) return;

    // Si hay múltiples variaciones, navegar al carrito
    const itemsWithSameName = state.items.filter(
      (item) => item.name === adaptedItem.name,
    );
    if (itemsWithSameName.length > 1) {
      navigateToCart();
      return;
    }

    // Update local quantity
    setLocalQuantity((prev) => Math.max(0, prev - 1));
    setIsPulsing(true);

    decrementItem(cartItem.id);
  };

  // Sumar todas las cantidades de items con el mismo nombre
  const currentQuantity = state.items
    .filter((cartItem) => cartItem.name === adaptedItem.name)
    .reduce((sum, item) => sum + item.quantity, 0);

  // Sync local quantity with state
  const displayQuantity = Math.max(localQuantity, currentQuantity);

  const formatPrice = showImages
    ? (amount: number) => `$${amount.toFixed(2)} MXN`
    : (amount: number) => `$${amount.toFixed(2)}`;

  return (
    <>
      <OutOfStockModal
        isOpen={showOutOfStockModal}
        onClose={() => setShowOutOfStockModal(false)}
        itemName={adaptedItem.name}
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
        onOpen={openDish}
        onIncrement={handleAddToCart}
        onDecrement={handleRemoveFromCart}
        incrementRef={plusButtonRef}
        formatPrice={formatPrice}
        labels={{
          outOfStock: tc("outOfStockBadge"),
          discount: (percent) => t("discountBadge", { percent }),
          increment: (name) => t("addToCart", { name }),
          decrement: (name) => t("removeFromCart", { name }),
          imageAlt: (name) => t("imageAlt", { name }),
        }}
      />
    </>
  );
}

export default memo(MenuItem);
