# Canary de Pick & Go: Sainte Marianne (id 29)

Base: `docs/plan-despliegue-migracion.md` (secciones 4, 6 y 7).

## Decisión

- **Primer restaurante real del canary: Sainte Marianne (id 29).** Fecha: 2026-11-11. Confirmado por el equipo, según Arturo.
- Dataframe Café (id 15) sigue siendo el restaurante de pruebas del paralelo interno (fase 2) y no cuenta como canary real.
- Esta decisión resuelve el pendiente 2 de la sección 8 del plan (qué restaurante hace de canary). Este documento solo registra la decisión: **el rewrite del 29 todavía no está activo** y no se ha cambiado ningún `vercel.json`.

## Por qué Sainte Marianne

- Es Pick & Go, sin POS, así que no depende de integraciones de mesa.
- Pocas órdenes: 4 en 30 días, por lo que el riesgo económico es mínimo.
- Con ese volumen el canary no valida estadística: valida que la app cargue, pague con Apple Pay y con tarjeta guardada, y confirme la orden.

## Orden posterior

1. Sainte Marianne (29)
2. Colibrí Café (35), después de Sainte Marianne porque tiene POS Soft Restaurant
3. Josefina Cafe (36) y los demás restaurantes con poco volumen
4. Saku By Miyako (12) **al final**, con alguien de guardia el primer día y fuera de viernes a domingo (concentra el 91 % de las órdenes reales)

## Cómo se activa

En el `vercel.json` del proyecto de `even-pick-and-go` que hoy sirve el dominio, agregar un rewrite por restaurante junto con el de los archivos de la app:

```json
{
  "rewrites": [
    { "source": "/29/:path*", "destination": "https://even-checkout-core.vercel.app/29/:path*" },
    { "source": "/_pgv2/:path*", "destination": "https://even-checkout-core.vercel.app/:path*" }
  ]
}
```

- El comensal sigue viendo la misma URL (por ejemplo `pg.letseven.io/29/menu`); no cambia el dominio, así que Apple Pay, CORS y las sesiones del navegador no se afectan.
- `/_pgv2/:path*` sirve los archivos de la app (`/_next/...`) desde el proyecto nuevo; requiere que el proyecto nuevo compile con `ASSET_PREFIX=/_pgv2`.
- Prerrequisitos: fase 1 del plan (acceso a Vercel, variables de producción separadas, prueba del rewrite en staging) y fase 2 (paralelo interno con Dataframe Café, id 15).
- Re-sincronizar con los repos originales justo antes de activarlo (C1 del plan).

## Criterios para avanzar

Avanzar al siguiente restaurante cuando, tras el canary (lunes a miércoles):

- Haya **al menos 5 órdenes sin incidentes**.
- La **tasa de pago exitoso sea igual o mejor** que la del resto de restaurantes (comparar con la API de monitoreo del backend).
- **Apple Pay y tarjeta guardada** hayan sido probados (también con una compra real de monto mínimo propia).
- Cero 5xx en Vercel y conciliación EcartPay = `payment_transactions`.

Regla: ningún cambio de backend durante el canary.

## Rollback

Quitar `/29/:path*` del rewrite y redesplegar el proyecto viejo: **menos de 2 minutos**. Si falla algo en el proyecto nuevo, también se puede hacer rollback de despliegue en Vercel al anterior `READY`. Si hay montos o cobros incorrectos: quitar el rewrite, revisar cobros en EcartPay y pausar el restaurante (< 10 min).

## Comunicación

El cambio es **transparente**: no se avisa al restaurante.
