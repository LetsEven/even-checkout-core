"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface UnavailableCartRowProps {
  name: string;
  image?: string | null;
  quantity: number;
  showImages: boolean;
  onRemove: () => Promise<void>;
}

// Fila del carrito para un platillo que ya no está en su horario.
export default function UnavailableCartRow({
  name,
  image,
  quantity,
  showImages,
  onRemove,
}: UnavailableCartRowProps) {
  const t = useTranslations("CartView");
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await onRemove();
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="py-3 md:py-4 lg:py-5 flex items-center gap-3 md:gap-4 lg:gap-5">
      {showImages && (
        <div className="shrink-0 size-16 md:size-20 lg:size-24 bg-tone-300 rounded-sm md:rounded-md flex items-center justify-center opacity-50">
          {image ? (
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover rounded-sm md:rounded-md grayscale"
            />
          ) : (
            <img
              src="/even/even-asterisk-evergreen.svg"
              alt="Logo Even"
              className="size-10 md:size-12 lg:size-14 object-contain"
            />
          )}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="text-base md:text-lg lg:text-xl text-black/40 capitalize truncate">
          {quantity > 1 ? `${quantity} × ${name}` : name}
        </h3>
        <p className="text-sm md:text-base text-danger-600">
          {t("unavailableBadge")}
        </p>
      </div>
      <button
        onClick={handleRemove}
        disabled={removing}
        className="shrink-0 text-sm md:text-base text-black border border-black/20 rounded-full px-4 py-1.5 active:scale-95 transition disabled:opacity-50"
      >
        {t("removeItem")}
      </button>
    </div>
  );
}
