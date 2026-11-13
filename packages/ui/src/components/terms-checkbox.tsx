import type { ReactNode } from "react";

export const TERMS_URL = "https://www.letseven.io/terminos";
export const PRIVACY_URL = "https://www.letseven.io/privacidad";

/** Enlaces de términos y privacidad para `t.rich(...)`, con la clase del enlace que pida la variante. */
export function termsLinks(linkClassName: string) {
  return {
    terms: (chunks: ReactNode) => (
      <a href={TERMS_URL} target="_blank" rel="noopener noreferrer" className={linkClassName}>
        {chunks}
      </a>
    ),
    privacy: (chunks: ReactNode) => (
      <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer" className={linkClassName}>
        {chunks}
      </a>
    ),
  };
}

export interface TermsCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  variant?: "dark" | "light";
  /** Texto traducido; recibe la clase que deben llevar los enlaces (ver `termsLinks`). */
  label: (linkClassName: string) => ReactNode;
}

export function TermsCheckbox({ checked, onChange, disabled, variant = "dark", label }: TermsCheckboxProps) {
  const dark = variant === "dark";
  const textClass = dark ? "text-white" : "text-black/70";
  const linkClass = dark ? "text-even-grass underline" : "text-even-evergreen underline font-medium";
  // Caja dibujada a mano: los globals.css ponen `appearance: none` a todo input.
  const boxClass = checked ? "bg-even-grass border-even-grass" : dark ? "bg-white border-white" : "bg-white border-tone-400";

  return (
    <label
      className={`flex items-start gap-3 text-sm ${textClass} ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-sm border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-even-grass ${boxClass}`}
      >
        {checked && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-3.5 text-even-evergreen"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        )}
      </span>
      <span>{label(linkClass)}</span>
    </label>
  );
}
