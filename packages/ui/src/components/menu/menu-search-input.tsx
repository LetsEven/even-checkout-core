"use client";

import { Search, X } from "lucide-react";
import { cn } from "../../lib/cn";

export type MenuSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** Nombre accesible; por defecto, el placeholder. */
  label?: string;
  /** Si se pasa, aparece una "X" cuando hay texto. */
  onClear?: () => void;
  clearLabel?: string;
  className?: string;
};

/** Buscador del menú: línea inferior negra con lupa. */
export function MenuSearchInput({
  value,
  onChange,
  placeholder,
  label,
  onClear,
  clearLabel,
  className,
}: MenuSearchInputProps) {
  return (
    <div className={cn("flex w-full items-center justify-center border-b border-black", className)}>
      <Search className="size-5 shrink-0 text-black md:size-6 lg:size-7" strokeWidth={1} aria-hidden />
      <input
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        placeholder={placeholder}
        aria-label={label ?? placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full px-3 py-2 text-base text-black placeholder:text-text-subtle focus:outline-none md:px-4 md:py-3 md:text-lg lg:text-xl [&::-webkit-search-cancel-button]:appearance-none"
      />
      {onClear && value && (
        <button
          type="button"
          onClick={onClear}
          aria-label={clearLabel ?? "Clear"}
          className="flex size-11 shrink-0 items-center justify-center text-black"
        >
          <X className="size-5" aria-hidden />
        </button>
      )}
    </div>
  );
}
