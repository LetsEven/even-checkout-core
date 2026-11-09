# Plan de despliegue y migración a producción (v2)

Fecha: 2026-11-09. Reemplaza la versión del 6-nov. Base: monorepo `main` @ 89ec425 (incluye el PR #25), repos originales y backend al 2026-11-09, datos del main-portal al 8-nov y lectura de solo lectura de la base de producción (Supabase `Even`). Referencias en el repo: `docs/comisiones.md` y `docs/actividad-2026-11-08.md`.

## 1. Dónde estamos

**Hecho**
- PR #25 mergeado (8-nov): cambios de los 5 repos originales hasta el 7-nov integrados al monorepo y comisión por servicio (Pick & Go y Room Service 2 % + 2 %; Tap Order & Pay, FlexBill y Tap & Pay 4 % restaurante, 0 % cliente), idéntica a la del backend.
- Datos de actividad de producción documentados (main-portal y Supabase).
- Decidido por Arturo: **Pick & Go es el primer servicio**; FlexBill y Room Service quedan solo en pruebas; Dataframe Café y Polotab son restaurantes de prueba; el cambio debe ser **transparente** para los restaurantes (sin avisarles).

**Abierto**
- Acceso a Railway, Vercel y Supabase de producción para el equipo de migración (Arturo espera tenerlo lunes o martes). Hoy solo se leyó Supabase.
- Los repos originales siguen fusionando cambios; hay que re-sincronizar antes del cutover.
- Detalle de pendientes en la sección 8.

## 2. Qué dicen los datos de producción

| Servicio | Órdenes 30 d | Órdenes 7 d | Restaurantes reales | Última orden |
|---|---|---|---|---|
| **Pick & Go** | 182 (158 sin pruebas) | 54 | 4 con ventas (de 9 con QR) | 8-nov |
| Tap Order & Pay | 130 (126 de Tacos Domingo, 110 el 30-oct) | 0 | 1 | 30-oct |
| Tap & Pay, FlexBill, Room Service | 0 | 0 | 0 | sin pagos en 30 días |

- **Concentración:** Saku By Miyako es el 91 % de las órdenes reales de Pick & Go (144 de 158) y no tiene POS. Los demás con ventas: Colibrí Café (8, POS Soft Restaurant), Sainte Marianne (4, sin POS) y Josefina Cafe (2, sin POS).
- **Picos:** viernes (51 órdenes), domingo (41) y sábado (34); horas 14:00, 20:00 y 21:00.
- **Apple Pay es el 58 % de los pagos** (182 de 315 en 30 días; Pick & Go 96, Tap Order & Pay 86), tarjeta guardada 41 % y Google Pay 1 %. Que Apple Pay funcione en el dominio nuevo es la prueba más importante.
- **Rechazos:** 14 de 175 intentos fallidos en 30 días (≈ 8 %), la mayoría "tarjeta inválida".
- **Ingresos Even del dashboard** es el ingreso neto después del costo de EcartPay, no la comisión bruta (la bruta es 4 % + IVA). Para validar cobros se compara contra la bruta.
- **Backend:** la tabla de comisión del backend ya coincide con el monorepo. Los 25 commits nuevos del backend (6 a 8-nov) son de monitoreo, cocina y caché de CORS; no cambian el contrato de pago.

### Intentos en `charging` (la duda de Arturo)

`payment_intents` guarda un registro por cada intento de cobro: `charging` = se creó el cobro en EcartPay y todavía no hay resultado. Hay **18 en `charging` y 9 en `unknown`**:
- Los 18 `charging` son todos del 8-nov (desde las 16:29 hora de México) al 9-nov, suman $7,921.12, ninguno tiene transacción ni confirmación en la base, y casi todos son de Saku (17) y uno de Colibrí. Aparecen **en parejas** con el mismo monto y el mismo minuto (por ejemplo dos de $885.07 a las 16:29).
- Eso encaja con la pantalla de pago: al cargar crea **una orden de Apple Pay y otra de Google Pay** de forma anticipada, y quien paga con otro método (o abandona) deja esas órdenes sin cobrar. El backend empezó a registrar intentos de wallet el 8-nov, por eso solo hay datos desde esa fecha. **Es una hipótesis, no está comprobada:** no hay forma de saber desde la base si hubo cargo. Verificación: revisar esos 18 ids de orden en el panel de EcartPay y confirmar que están "sin pagar".
- Los 9 `unknown` son del 2 al 25-oct: el resultado fue ambiguo (timeout o red al llamar a EcartPay), suman $4,778.35 y ninguno tiene id de EcartPay, es decir que probablemente el cobro nunca se creó. Conviene confirmarlo en EcartPay.

## 3. Primer servicio: Pick & Go

Decisión confirmada por Arturo (9-nov). Por qué: es lo único con uso real sostenido; no depende de POS de mesa; su comisión (2 % + 2 %, línea "Comisión de servicio" visible) no cambió; sus pruebas de pago en dev pasaron; y la deriva de código ya está integrada.

Riesgos: la concentración en Saku (migra al final), los picos de viernes a domingo, y que el menú con "ventana siguiente" depende del backend (`orderable_from`, PR #589 del backend, hay que confirmar que prod lo tiene).

Orden: **Pick & Go → Tap Order & Pay → Tap & Pay**. FlexBill y Room Service solo en dev y preview.

## 4. Cómo migrar solo un restaurante (sin que se note)

**Cómo llega hoy un comensal.** El QR trae un código corto (`EVEN-XXXXXX`). El backend lo resuelve y devuelve la URL de destino armada con la variable `PICK_AND_GO_URL` (respaldo `https://pc.letseven.io`; el CORS permite `pg.letseven.io`, hay que ver en Railway cuál es el real): `{dominio}/{restaurantId}/menu?branch={n}`. **Todas las pantallas de Pick & Go viven bajo `/{restaurantId}/...`**, así que el id del restaurante siempre va en la ruta.

**Qué se necesita: que el dominio no cambie.** Si el comensal sigue en el mismo dominio no se rompe Apple Pay (58 % de los pagos), ni el CORS, ni las sesiones guardadas en el navegador, y el restaurante no nota nada.

### Opción recomendada: rewrite por restaurante en el proyecto Vercel actual

Un *rewrite* no es una redirección: el comensal sigue viendo la misma URL (por ejemplo `pg.letseven.io/29/menu`), pero Vercel pide el contenido al proyecto nuevo. Se agrega en el `vercel.json` del proyecto de Pick & Go que hoy sirve el dominio:

```json
{
  "rewrites": [
    { "source": "/29/:path*", "destination": "https://<proyecto-nuevo>.vercel.app/29/:path*" },
    { "source": "/_pgv2/:path*", "destination": "https://<proyecto-nuevo>.vercel.app/:path*" }
  ]
}
```

- La primera línea manda al proyecto nuevo solo al restaurante 29 (Sainte Marianne). Para migrar otro, se agrega su id; para deshacerlo, se quita y se redespliega (menos de 2 minutos). El resto de restaurantes sigue en el proyecto actual.
- La segunda línea es para los archivos de la app (`/_next/...`): el proyecto nuevo se compila con un prefijo (`assetPrefix: "/_pgv2"`, controlado por una variable de entorno) para que esos archivos también salgan del proyecto nuevo. Sin esto, la página nueva buscaría archivos con nombres que el proyecto viejo no tiene.
- Es el patrón de "multi-zonas" de Next.js en Vercel. Requiere un cambio pequeño en el monorepo (leer `assetPrefix` de una variable, vacía por defecto) y acceso a editar el proyecto viejo de Vercel.
- Límites a probar antes: el service worker (`sw.js`, en la raíz), los archivos públicos compartidos (logos) y el archivo de Apple Pay (`.well-known`) se siguen sirviendo del proyecto viejo, lo que está bien porque son iguales.

### Alternativas descartadas por ahora

- **Resolvedor del backend por restaurante hacia un subdominio nuevo.** Cambiaría el dominio del comensal para ese restaurante: hay que registrar el dominio nuevo con Apple Pay y EcartPay, agregarlo al CORS, y se pierde la sesión del navegador. No es transparente.
- **Cambiar el dominio completo a la vez.** Es la fase final (cutover); no sirve para un restaurante.
- **Porcentaje de tráfico (Rolling Release de Vercel).** Es por tráfico, no por restaurante, y con ~5 órdenes al día no da señal estadística.

### Restaurante para el canary

Como el cambio es transparente, no se avisa al restaurante. Candidatos: **Sainte Marianne (id 29)** o **Josefina Cafe (id 36)**: Pick & Go, sin POS, pocas órdenes (4 y 2 en 30 días), así que el riesgo económico es mínimo. Colibrí Café (id 35) va después porque tiene POS Soft Restaurant. Saku (id 12) al final.

Con tan poco volumen, el canary no valida estadística: valida que **cargue, pague con Apple Pay y con tarjeta guardada, y confirme la orden**. Por eso se hace antes un paralelo interno con Dataframe Café (de pruebas) y una compra real de monto mínimo propia.

## 5. Checklist por área

Leyenda: ✅ listo · ⚠️ parcial o por verificar · ❌ falta

| # | Tema | Estado | Qué falta |
|---|---|---|---|
| C1 | Paridad con los repos originales | ⚠️ | Integrada hasta el 7-nov (PR #25). Los originales siguen fusionando: re-sincronizar justo antes del canary y del cutover. |
| C2 | Comisiones | ✅ | `docs/comisiones.md`; coincide con el backend. Falta confirmar que el backend de prod tenga esa versión. |
| C3 | Backend de producción | ⚠️ | Corre en Railway (según Arturo). Sin acceso todavía. Verificar versión (¿trae #561, #587, #589?), `PICK_AND_GO_URL` y `CORS_EXTRA_ORIGINS`. |
| C4 | EcartPay y Apple Pay | ⚠️ | Producción ya cobra (938 transacciones). Verificar que el archivo `apple-developer-merchantid-domain-association` se sirva en el dominio de Pick & Go con el proyecto nuevo (las 5 apps lo traen en `public/.well-known`). |
| C5 | Variables en Vercel | ❌ | Los proyectos nuevos (`even-*`) apuntan a `even-backend-dev` en todos los entornos. Separar Production (backend de prod) de Preview y Development (dev). `NEXT_PUBLIC_SHOW_TEST_CARD` ausente en prod. |
| C6 | CSP y headers | ⚠️ | No son iguales entre apps (Tap Order & Pay incluye `sandbox.ecartpay.com`; FlexBill trae `strict-dynamic`, 3DS y `payment=`). Unificar y probar 3DS y Apple/Google Pay con el CSP real. |
| C7 | CORS | ✅ para el mismo dominio | Con el rewrite o el cutover en el mismo dominio no cambia nada. Solo un dominio de staging requiere `CORS_EXTRA_ORIGINS`. |
| C8 | Dominios y QR | ✅ conocidos | Dominios de prod en `letseven.io` (`pg`/`pc`, `top`, `tp`, `fb`, `rs`). Los QR no llevan dominio: el backend arma la URL. Falta confirmar qué proyecto de Vercel sirve cada dominio hoy. |
| C9 | Proyectos de Vercel | ⚠️ | 5 proyectos `even-*` con deploy solo desde `main`. Verificar Root Directory, Node 22 y Vercel Auth/bypass. |
| C10 | Pruebas | ⚠️ | CI verde (typecheck, lint, test, build, e2e). Falta repetir la matriz de pago manual de Pick & Go en dev después del PR #25, Apple Pay en un iPhone real y 3DS. |
| C11 | Datos de prueba en la base principal | ✅ | `QA-TEST-1` ya no existe. |
| C12 | Rollback | ⚠️ | Quitar el rewrite o reasignar el dominio, ver sección 7. Ensayar uno en staging. |
| C13 | Monitoreo | ⚠️ | El backend tiene una API de monitoreo nueva (intentos de pago, rechazos, salud de sucursales). Faltan alertas y un tablero. |
| C14 | Intentos `charging` y `unknown` | ⚠️ | Verificar en EcartPay (sección 2). |
| C15 | Rama `main` de Supabase | ⚠️ | Aparece como `MIGRATIONS_FAILED` en la lista de ramas; revisar en el panel. |
| C16 | `transpilePackages` manual por app | ⚠️ | Agregar un check de CI. |

Por app (solo lo propio): Pick & Go: confirmar `orderable_from` en el backend de prod y `assetPrefix` por variable. Tap Order & Pay: quitar `sandbox.ecartpay.com` del CSP. Tap & Pay: depende del POS y no tiene uso. FlexBill y Room Service: solo pruebas.

## 6. Fases

### Fase 0: Paridad (hecha en su mayoría)
PR #25 mergeado. Pendiente: el PR de documentación (actividad y plan) y una re-sincronización con los originales antes del canary.

### Fase 1: Preparación (sin tráfico real)
1. Acceso a Railway, Vercel y Supabase de producción.
2. Confirmar `PICK_AND_GO_URL`, el proyecto de Vercel que sirve el dominio hoy y la versión del backend (C3, C8).
3. Variables de Vercel por entorno, CSP unificado (C5, C6).
4. Agregar `assetPrefix` por variable al monorepo y probar el rewrite en un proyecto de staging.
5. Verificar en EcartPay los 18 ids en `charging` (C14).

### Fase 2: Paralelo interno
Apuntar el rewrite solo a **Dataframe Café (id 15)**, que es de pruebas. Una compra real de monto mínimo con tarjeta propia y reembolso, con Apple Pay, tarjeta guardada y Google Pay. Salida: cero 5xx, la conciliación EcartPay = `payment_transactions` al 100 %.

### Fase 3: Canary de un restaurante real
Agregar el id 29 (Sainte Marianne) o 36 (Josefina Cafe) al rewrite, de lunes a miércoles. Se avanza cuando haya al menos 5 órdenes sin incidentes y la tasa de pago exitoso sea igual o mejor que la del resto. Comparar con la API de monitoreo del backend (intentos y rechazos por restaurante).

### Fase 4: Ampliar
Agregar Colibrí Café (35) y los demás restaurantes con poco volumen. **Saku (12) al final**, con alguien de guardia el primer día y fuera de viernes a domingo.

### Fase 5: Cutover
Reasignar el dominio al proyecto del monorepo (o desplegar el monorepo en el proyecto actual), quitar los rewrites y la variable `assetPrefix`. Dejar el proyecto viejo sin tocar 2 semanas. Luego repetir fases 1 a 5 con Tap Order & Pay y Tap & Pay.

### Fase 6: Cierre
Archivar el repo original de cada app tras 2 semanas estables.

## 7. Rollback y monitoreo

| Situación | Acción | Tiempo |
|---|---|---|
| Falla un restaurante en el canary | Quitar su id del rewrite y redesplegar el proyecto viejo | < 2 min |
| Falla algo en el proyecto nuevo | Rollback de despliegue en Vercel al anterior `READY` | < 2 min |
| Dominio ya movido y falla algo grave | Reasignar el dominio al proyecto original (vivo 2 semanas) | < 5 min |
| Montos o cobros incorrectos | Quitar el rewrite, revisar cobros en EcartPay y pausar el restaurante afectado | < 10 min |
| Cambio de backend incompatible | No se revierte con Vercel; el backend tiene su rollback en Railway. Regla: ningún cambio de backend durante el canary | n/a |

Monitoreo: Vercel (errores de runtime por proyecto), Railway (tasa de error y latencia, vigilar `/payments` y `/confirm`), API de monitoreo del backend (intentos y rechazos por restaurante), conciliación diaria EcartPay contra `payment_transactions`, y pedidos por restaurante contra la semana anterior. Un responsable por turno durante el canary y las primeras 48 h del cutover.

## 8. Decisiones y pendientes

Respondido: prod en Railway y Vercel; Pick & Go primero (Arturo, 9-nov); Dataframe Café y Polotab son de prueba; el cambio debe ser transparente para los restaurantes.

1. **Acceso de solo lectura** a Railway y Vercel de prod (lunes o martes) para fases 1 y 2.
2. **Aprobar el enfoque de rewrite por restaurante** (sección 4) y qué restaurante hará de canary: propongo Sainte Marianne (29).
3. **Revisar en EcartPay los 18 ids en `charging`** (los ids están en la base; puedo darte la lista).
4. **La rama `main` de Supabase en `MIGRATIONS_FAILED`**: ¿es esperado?
5. **Valor de `PICK_AND_GO_URL`** en Railway prod: `pg.` o `pc.letseven.io`.
