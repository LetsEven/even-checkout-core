"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "../../lib/cn";

export type CategoryTab = { id: string; label: string };

export type CategoryTabsProps = {
  /** La app inserta la pestaña "Todo" y resuelve el orden antes de pasarlas. */
  tabs: CategoryTab[];
  activeId: string;
  /** La app hace setActiveCat + startTransition(setFilter), etc. */
  onSelect: (id: string) => void;
  "aria-label": string;
  className?: string;
};

type Pill = { left: number; width: number; animate: boolean };

/** Pestañas de categoría con una píldora negra que se desliza bajo la activa. */
export function CategoryTabs({ tabs, activeId, onSelect, "aria-label": ariaLabel, className }: CategoryTabsProps) {
  const buttons = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pill, setPill] = useState<Pill | null>(null);

  // Posiciona la píldora y la re-mide si cambia el ancho del botón (fuentes, idioma).
  useLayoutEffect(() => {
    const button = buttons.current[activeId];
    if (!button) return;
    const measure = () =>
      setPill((prev) => ({ left: button.offsetLeft, width: button.offsetWidth, animate: prev !== null }));
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(button);
    return () => observer.disconnect();
  }, [activeId, tabs]);

  function select(id: string) {
    onSelect(id);
    buttons.current[id]?.scrollIntoView?.({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn("scrollbar-hide relative flex w-full gap-2 overflow-x-auto md:gap-3", className)}
    >
      {pill && (
        <span
          aria-hidden
          data-testid="category-pill"
          className={cn(
            "absolute top-0 bottom-0 rounded-full bg-black",
            pill.animate && "transition-[left,width] duration-300 ease-[cubic-bezier(0.34,1.3,0.64,1)]",
          )}
          style={{ left: pill.left, width: pill.width }}
        />
      )}
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              buttons.current[tab.id] = el;
            }}
            type="button"
            aria-pressed={active}
            onClick={() => select(tab.id)}
            className={cn(
              "relative min-h-11 shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-sm transition-colors duration-300 md:px-5 md:py-2 md:text-base lg:px-6 lg:text-lg",
              active ? "text-white" : "text-tone-500 hover:bg-tone-100",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
