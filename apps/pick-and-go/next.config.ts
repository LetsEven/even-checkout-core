import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Prefijo de los archivos estáticos (/_next/...). Vacío por defecto. Se usa
// cuando el dominio actual enruta (rewrite) a este proyecto, ver
// docs/plan-despliegue-migracion.md. Ejemplo: ASSET_PREFIX=/_pgv2
const assetPrefix = process.env.ASSET_PREFIX || undefined;

const nextConfig: NextConfig = {
  // Apple Pay valida el dominio pidiendo este archivo sin extensión; en public/
  // vive con .txt, así que se reescribe al estático (sin código en runtime).
  async rewrites() {
    return [
      {
        source: "/.well-known/apple-developer-merchantid-domain-association",
        destination: "/.well-known/apple-developer-merchantid-domain-association.txt",
      },
    ];
  },
  assetPrefix,
  async headers() {
    return [
      {
        source: "/.well-known/apple-developer-merchantid-domain-association",
        headers: [
          {
            key: "Content-Type",
            value: "text/plain",
          },
        ],
      },
    ];
  },
  devIndicators: false,
  // Los tests E2E construyen en su propio directorio para no pisar el build normal.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Los paquetes @even/* se publican como TypeScript fuente; Next los compila.
  transpilePackages: [
    "@even/api-client",
    "@even/cart",
    "@even/payments",
    "@even/ui",
  ],
};

export default withNextIntl(nextConfig);
