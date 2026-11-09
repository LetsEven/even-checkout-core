"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

export interface UnavailableModalItem {
  key: string;
  name: string;
  image?: string | null;
  quantity: number;
  price: number;
}

export const toUnavailableModalItems = (
  items: Array<{
    id: number;
    name: string;
    images?: string[];
    price: number;
    extraPrice?: number;
    quantity: number;
    cartItemId?: string;
  }>,
): UnavailableModalItem[] =>
  items.map((i, idx) => ({
    key: i.cartItemId || `${i.id}-${idx}`,
    name: i.name,
    image: i.images?.[0],
    quantity: i.quantity,
    price: i.price + (i.extraPrice || 0),
  }));

interface UnavailableItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: UnavailableModalItem[];
  onRemove: () => Promise<void>;
  showImages?: boolean;
}

export default function UnavailableItemsModal({
  isOpen,
  onClose,
  items,
  onRemove,
  showImages = true,
}: UnavailableItemsModalProps) {
  const t = useTranslations("UnavailableItemsModal");
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await onRemove();
      onClose();
    } finally {
      setRemoving(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-end justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-4xl w-full mx-4 md:mx-6 lg:mx-8 shadow-xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 md:p-8 lg:p-10 max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-black text-center">
            {t("title")}
          </h2>
          <p className="text-gray-600 text-base md:text-lg text-center mt-2 md:mt-3">
            {t("subtitle", { count: items.length })}
          </p>

          <div className="mt-5 md:mt-6 divide-y divide-stroke/50 max-h-[40vh] overflow-y-auto">
            {items.map((item) => (
              <div
                key={item.key}
                className="flex items-center gap-3 md:gap-4 py-3"
              >
                {showImages && (
                  <div className="shrink-0 size-12 md:size-14 bg-gray-300 rounded-sm md:rounded-md flex items-center justify-center">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover rounded-sm md:rounded-md"
                      />
                    ) : (
                      <img
                        src="/even/even-asterisk-evergreen.svg"
                        alt="Logo Even"
                        className="size-8 object-contain"
                      />
                    )}
                  </div>
                )}
                <p className="flex-1 min-w-0 text-base md:text-lg text-black capitalize truncate">
                  {item.name}
                </p>
                <p className="shrink-0 text-sm md:text-base text-black/60 whitespace-nowrap">
                  {item.quantity > 1 ? `${item.quantity} × ` : ""}$
                  {item.price.toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={handleRemove}
            disabled={removing}
            className="w-full mt-6 md:mt-8 flex items-center justify-center gap-2 bg-black hover:bg-stone-950 text-white text-base md:text-lg lg:text-xl py-3 md:py-4 rounded-full transition-opacity disabled:opacity-50"
          >
            {removing && <Loader2 className="size-5 animate-spin" />}
            {t("remove", { count: items.length })}
          </button>
          <button
            onClick={onClose}
            disabled={removing}
            className="w-full mt-3 text-black/70 text-base md:text-lg py-2"
          >
            {t("cancel")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
