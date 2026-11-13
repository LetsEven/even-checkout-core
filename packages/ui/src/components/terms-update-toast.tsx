"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const SETTLE_MS = 600;

// true cuando la página terminó de cargar y no hay un loader de pantalla completa
// (`data-even-loader`) desde hace SETTLE_MS.
function usePageSettled() {
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let isSettled = false;

    const check = () => {
      const busy = document.readyState !== "complete" || !!document.querySelector("[data-even-loader]");
      if (busy) {
        clearTimeout(timer);
        timer = undefined;
        if (isSettled) {
          isSettled = false;
          setSettled(false);
        }
      } else if (!isSettled && !timer) {
        timer = setTimeout(() => {
          timer = undefined;
          isSettled = true;
          setSettled(true);
        }, SETTLE_MS);
      }
    };

    check();
    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("load", check);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
      window.removeEventListener("load", check);
    };
  }, []);

  return settled;
}

export interface TermsUpdateToastProps {
  /** El usuario está registrado, tiene perfil completo y falta que confirme el cambio. */
  needsAck: boolean;
  /** Registra que el usuario lo vio. `false` muestra el texto de error. */
  onAcknowledge: () => Promise<{ success: boolean }>;
  title: string;
  body: string;
  errorText: string;
  ctaLabel: string;
}

/**
 * Aviso de cambio de Términos / Aviso de Privacidad. Se queda arriba hasta que le pican al
 * check. Espera a que la página termine de cargar (y a que no haya `data-even-loader`).
 */
export function TermsUpdateToast({ needsAck, onAcknowledge, title, body, errorText, ctaLabel }: TermsUpdateToastProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [entered, setEntered] = useState(false);
  const pageSettled = usePageSettled();

  const show = pageSettled && needsAck;

  useEffect(() => {
    if (!show) return;
    const id = requestAnimationFrame(() => setEntered(true));
    return () => {
      cancelAnimationFrame(id);
      setEntered(false);
    };
  }, [show]);

  if (!show || typeof document === "undefined") return null;

  const handleCheck = async () => {
    setSaving(true);
    setError(false);
    const response = await onAcknowledge();
    if (!response.success) setError(true);
    setSaving(false);
  };

  return createPortal(
    <div className="fixed top-0 inset-x-0 z-[999999] flex justify-center px-4 pt-4 pointer-events-none">
      <div
        role="status"
        className={`pointer-events-auto w-full max-w-md flex items-center gap-4 bg-even-evergreen text-white rounded-2xl shadow-xl px-5 py-4 transition-[transform,opacity] duration-500 ease-out ${
          entered ? "translate-y-0 opacity-100" : "-translate-y-[150%] opacity-0"
        }`}
      >
        <div className="flex-1 min-w-0">
          <p className="font-semibold">{title}</p>
          <p className="text-sm text-white/80">{error ? errorText : body}</p>
        </div>
        <button
          type="button"
          onClick={handleCheck}
          disabled={saving}
          aria-label={ctaLabel}
          className="shrink-0 flex size-11 items-center justify-center rounded-full bg-even-grass text-even-evergreen transition-transform active:scale-90 disabled:opacity-60"
        >
          {saving ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-5 animate-spin"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
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
              className="size-6"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          )}
        </button>
      </div>
    </div>,
    document.body,
  );
}
