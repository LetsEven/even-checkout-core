import { ShoppingCart } from "lucide-react";

export type FloatingCartButtonProps = {
  /** Con 0 no se muestra. */
  count: number;
  /** Texto ya con el contador: "Ver el carrito • 3". */
  label: string;
  onClick: () => void;
  /** Oculto mientras hay detalle o bienvenida encima. */
  hidden?: boolean;
};

/** Botón flotante "Ver el carrito" al pie del menú. */
export function FloatingCartButton({ count, label, onClick, hidden = false }: FloatingCartButtonProps) {
  if (count <= 0 || hidden) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center md:bottom-8 lg:bottom-10">
      <button
        type="button"
        onClick={onClick}
        className="pointer-events-auto flex animate-bounce-in items-center gap-3 rounded-full bg-even-grass px-6 py-4 text-even-evergreen shadow-lg transition-all hover:scale-105 active:scale-90 md:gap-4 md:px-8 md:py-5 lg:px-10 lg:py-6"
      >
        <ShoppingCart className="size-5 md:size-6 lg:size-7" aria-hidden />
        <span className="text-base font-medium md:text-lg lg:text-xl">{label}</span>
      </button>
    </div>
  );
}
