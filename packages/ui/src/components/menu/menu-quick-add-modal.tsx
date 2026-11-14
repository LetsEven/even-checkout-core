"use client";

import { useEffect, useRef } from "react";
import { Button } from "../button";
import { EvenAsterisk } from "../even-asterisk";
import { Modal } from "../modal";

export type MenuQuickAddModalProps = {
  open: boolean;
  onClose: () => void;
  /** Agregar 1 al carrito. El modal se cierra solo; la app hace el resto (addItem, vuelo, pulso). */
  onConfirm: () => void;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  /** Precio final ya formateado. */
  priceLabel: string;
  labels: { add: string; back: string };
};

/**
 * Mini detalle para productos sin configuración: imagen, nombre, descripción y «Agregar / Regresar».
 * No toca el historial ni el router: cerrarlo no debe remontar el menú ni mover el scroll.
 */
export function MenuQuickAddModal({
  open,
  onClose,
  onConfirm,
  name,
  description,
  imageUrl,
  priceLabel,
  labels,
}: MenuQuickAddModalProps) {
  const addRef = useRef<HTMLButtonElement>(null);

  // Modal enfoca el panel al abrir; después pasamos el foco a «Agregar».
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => addRef.current?.focus(), 30);
    return () => clearTimeout(timer);
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-label={name}
      footer={
        <div className="flex gap-2">
          <Button variant="outline" fullWidth onClick={onClose}>
            {labels.back}
          </Button>
          <Button
            ref={addRef}
            variant="secondary"
            fullWidth
            onClick={() => {
              onClose();
              onConfirm();
            }}
          >
            {labels.add}
          </Button>
        </div>
      }
    >
      <div className="flex items-center gap-3">
        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-tone-300">
          {imageUrl ? (
            <img src={imageUrl} alt="" className="size-full object-cover" />
          ) : (
            <EvenAsterisk className="size-12 text-even-evergreen" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-base font-semibold capitalize leading-tight text-black">{name}</h3>
          {description && <p className="mt-1 line-clamp-3 text-[13px] leading-[18px] text-tone-600">{description}</p>}
          <p className="mt-1.5 text-[15px] font-bold text-black">{priceLabel}</p>
        </div>
      </div>
    </Modal>
  );
}
