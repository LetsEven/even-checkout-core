import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Config compartida: todo el código del monorepo termina corriendo dentro de una app Next.
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Todas las apps usan App Router; sin esto la regla busca un directorio pages/ en cada paquete.
    rules: { "@next/next/no-html-link-for-pages": "off" },
  },
  {
    // Fase 0 del rediseño: el color vive en los tokens de @even/ui/theme.css. Sin hex sueltos ni
    // paleta genérica de Tailwind (gray/green…), para que cambiar un token cambie todas las apps.
    files: ["**/*.{ts,tsx}"],
    ignores: [
      "**/*.{test,spec}.{ts,tsx}",
      "**/e2e/**",
      // Arte de marca y logos de terceros: sus colores no son del tema.
      "**/PepperMascots.tsx",
      "**/cardIcons.tsx",
      "**/GlassSurface.tsx",
      "**/card-selection/page.tsx", // logo de Google en el botón de Google Pay
      // Única fuente de colores en JS (verificada contra theme.css en su test).
      "packages/ui/src/lib/colors.ts",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: `Literal[value=/(^|[\\s\\[(:"'])#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})(?![\\w])/]`,
          message: "Hex suelto: usa un token de @even/ui/theme.css (p. ej. bg-even-evergreen, var(--color-line)).",
        },
        {
          selector: `:matches(Literal, TemplateElement)[value.raw=/(^|[^\\w-])(?:[a-z]+:)*[a-z-]+-(?:slate|gray|zinc|neutral|stone|green|emerald|teal|lime)-[0-9]{2,3}(?![\\w])/]`,
          message: "Paleta genérica de Tailwind: usa un token (tone-*, positive-*, even-*) de @even/ui/theme.css.",
        },
        {
          selector: `Literal[value=/(^|[^\\w-])(?:[a-z]+:)*[a-z-]+-(?:slate|gray|zinc|neutral|stone|green|emerald|teal|lime)-[0-9]{2,3}(?![\\w])/]`,
          message: "Paleta genérica de Tailwind: usa un token (tone-*, positive-*, even-*) de @even/ui/theme.css.",
        },
      ],
    },
  },
  globalIgnores([".next/**", ".next-e2e/**", "out/**", "build/**", "dist/**", "next-env.d.ts", "playwright-report/**", "test-results/**"]),
]);
