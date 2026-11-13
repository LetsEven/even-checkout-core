// Indicador visual para distinguir de qué despliegue sale el contenido
// (por ejemplo, al probar el rewrite hacia la app nueva). No se muestra si
// NEXT_PUBLIC_ENV_BADGE está vacía o ausente. Ejemplo: NEXT_PUBLIC_ENV_BADGE=DEV
export default function EnvBadge() {
  const label = process.env.NEXT_PUBLIC_ENV_BADGE;
  if (!label) return null;

  return (
    <div
      aria-hidden="true"
      data-testid="env-badge"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 2147483647,
        pointerEvents: "none",
        background: "var(--color-env)",
        color: "var(--color-white)",
        font: "700 10px/1 var(--font-dm-mono), monospace",
        letterSpacing: "0.08em",
        padding: "3px 8px",
        borderBottomRightRadius: 6,
      }}
    >
      {label}
    </div>
  );
}
