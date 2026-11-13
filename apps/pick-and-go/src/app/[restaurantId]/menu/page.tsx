"use client";

import MenuView from "@/components/menu/MenuView";
import Loader from "@/components/UI/Loader";
import PromoActivationBanner from "@/components/PromoActivationBanner";
import ValidationError from "@/components/ValidationError";
import { useRestaurant } from "@/context/RestaurantContext";
import { usePickAndGoContext } from "@/context/PickAndGoContext";
import { useValidateAccess } from "@/hooks/useValidateAccess";
import { useEffect, useState } from "react";

const LOADER_FADE_MS = 500;

const MenuPage = () => {
  const { validationError, restaurantId } = useValidateAccess();
  const { setRestaurantId: setPickAndGoRestaurantId } = usePickAndGoContext();
  const { restaurant, error } = useRestaurant();
  const ready = !!restaurant && !!restaurantId;

  // La pantalla de carga no desaparece de golpe: cuando los datos llegan, el
  // menú (con su bienvenida) se monta debajo y el Loader se desvanece encima.
  const [showLoader, setShowLoader] = useState(!ready);
  useEffect(() => {
    if (!ready || !showLoader) return;
    const timer = setTimeout(() => setShowLoader(false), LOADER_FADE_MS + 50);
    return () => clearTimeout(timer);
  }, [ready, showLoader]);

  useEffect(() => {
    if (restaurantId && !isNaN(restaurantId)) {
      setPickAndGoRestaurantId(restaurantId.toString());
    }
  }, [restaurantId, setPickAndGoRestaurantId]);

  useEffect(() => {
    if (restaurant?.name) {
      document.title = restaurant.name + " | Pick & Go";
      return () => {
        document.title = "Even Pick & Go";
      };
    }
  }, [restaurant?.name]);

  // Mostrar error de validación
  if (validationError) {
    return <ValidationError errorType={validationError as any} />;
  }

  // Mostrar error si falla la carga del restaurante
  if (error) {
    return <ValidationError errorType="VALIDATION_ERROR" />;
  }

  return (
    <>
      {ready && (
        <>
          <MenuView />
          <PromoActivationBanner />
        </>
      )}
      {showLoader && (
        <div
          className="reduce-motion-fade fixed inset-0 z-[70]"
          style={{
            opacity: ready ? 0 : 1,
            pointerEvents: ready ? "none" : "auto",
            transition: `opacity ${LOADER_FADE_MS}ms ease`,
          }}
        >
          <Loader />
        </div>
      )}
    </>
  );
};

export default MenuPage;
