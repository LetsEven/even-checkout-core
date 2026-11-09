# Actividad de las apps cliente en producción (al 2026-11-08)

Foto de referencia tomada del **main-portal** (dashboard `/`, filtros "30 días" y "7 días", tabla "Historial de Transacciones") por un agente de Claude en Chrome, solo lectura, el 2026-11-08 a las 21:45. Datos crudos en [`data/actividad-2026-11-08.json`](data/actividad-2026-11-08.json).

> **Alcance y límites.** La fuente es el dashboard, no la base de datos. Ninguna cifra está verificada contra Supabase, Railway ni EcartPay. Parte de los números salió de sumar a mano las 312 filas del historial. Ver [Pendientes](#pendientes-datos-que-faltan).

Ventana A = 2026-10-10 a 2026-11-08 (30 días). Ventana B = 2026-11-02 a 2026-11-08 (7 días). Montos en MXN. Totales a la fecha: 18 restaurantes listados y 691 usuarios registrados.

## Resumen por servicio

| Servicio | Órdenes A | Órdenes B | Restaurantes con actividad (A) | Primera → última orden |
|---|---|---|---|---|
| Pick & Go | **182** | **54** | 6 | 2026-10-10 → 2026-11-08 21:28 |
| Tap Order & Pay | 130 | 0 | 3 | 2026-10-15 → 2026-10-30 23:41 |
| Tap & Pay | 0 | 0 | 0 | sin órdenes |
| FlexBill | 0 | 0 | 0 | sin órdenes |
| Room Service | 0 | 0 | 0 | sin órdenes |

Solo Pick & Go tiene uso sostenido. Tap Order & Pay tuvo un pico de un solo día (110 órdenes el 2026-10-30, 126 de las 130 son de un mismo restaurante) y nada en los últimos 7 días. Tap & Pay, FlexBill y Room Service no tienen ninguna orden pagada en 30 días, lo que confirma que siguen sin uso.

## Pick & Go

- 182 órdenes y $73,848.74 de consumo en 30 días; ticket promedio $405.76 (calculado). En 7 días: 54 órdenes y $20,649.16 (ticket $382.39, calculado).
- Propinas: $2,328.62 (A) y $904 (B). Comisión Even según el portal: $1,048.32 (A) y $292.90 (B) (ver nota de comisiones).
- Días pico: viernes (51 órdenes), domingo (41), sábado (34). Horas pico: 14:00 (29), 21:00 (28), 20:00 (23).
- Última semana, por día: 2-nov 3, 3-nov 2, 4-nov 1, 5-nov 6, 6-nov 25, 7-nov 4, 8-nov 13.

| Restaurante | Órdenes (A) | Consumo (A) | Última orden |
|---|---|---|---|
| Saku By Miyako | 144 | 71,843.95 | 2026-11-08 21:28 |
| Dataframe Café | 22 | 582.53 | 2026-11-08 13:20 |
| Colibrí Café | 8 | 951.59 | 2026-11-08 18:45 |
| Sainte Marianne | 4 | 218.97 | 2026-11-06 17:53 |
| Josefina Cafe | 2 | 180.08 | 2026-11-06 19:12 |
| Polotab | 2 | 71.62 | 2026-10-27 11:57 |

**Concentración:** Saku By Miyako es el 79 % de las órdenes y el 97 % del consumo de Pick & Go. Dataframe Café y Polotab parecen restaurantes de prueba o demostración (importes muy bajos); es una inferencia, no un dato del portal.

## Tap Order & Pay

- 130 órdenes en la ventana A, todas entre 2026-10-15 y 2026-10-30; 0 en la ventana B.
- Por día: 15-oct 1, 26-oct 1, 27-oct 1, 28-oct 1, 29-oct 16, **30-oct 110**.
- Propinas $2,819; comisión Even según el portal $449.87.

| Restaurante | Órdenes (A) | Consumo (A) | Última orden |
|---|---|---|---|
| Tacos Domingo | 126 | 34,889.55 | 2026-10-30 23:41 |
| Dataframe Café | 3 | 97.93 | 2026-10-28 17:22 |
| Polotab | 1 | 51.16 | 2026-10-26 17:46 |

El pico del 30-oct (viernes) parece un evento puntual de Tacos Domingo, no uso recurrente.

## Restaurantes listados (18)

Bunker Swings & Beers, Colibrí Café, Dataframe Café, Duo Padel Park, Even Supply, Holy Cow, Josefina Cafe, La Polloteria, Las Palomas, Magnolias, Playa Bonita, Polotab, Sainte Marianne, Saku By Miyako, Sonoran Star, Steaks del Herradero, Sunora Bacanora Bar, Tacos Domingo. Solo 8 tuvieron alguna orden en los 30 días (Saku, Dataframe, Colibrí, Sainte Marianne, Josefina, Polotab, Tacos Domingo). Los otros 11 no aparecen en la actividad; no se sabe si no tienen servicios habilitados o simplemente no vendieron.

## Verificaciones de consistencia hechas

- Suma de `ordenes_por_dia` de Pick & Go = 182 y de Tap Order & Pay = 130, igual que el total del dashboard.
- Suma por restaurante: Pick & Go 144+22+8+4+2+2 = 182; Tap Order & Pay 126+3+1 = 130.
- Los 7 últimos días de Pick & Go suman 54, igual que la ventana B.
- El consumo diario de Pick & Go suma lo mismo que el consumo por restaurante ($73,848.74).

## Qué no cuadra todavía

**Comisión Even.** El portal reporta $1,048.32 en Pick & Go y $449.87 en Tap Order & Pay. Sobre consumo + propina eso es 1.38 % y 1.19 %. La tarifa de Even es 4 % + IVA (≈ 4.64 %), es decir ≈ $3,535 en Pick & Go y ≈ $1,757 en Tap Order & Pay. La tarjeta "Ingresos Even" debe usar otra definición (neta de costos, solo la parte del cliente, otra base, o un filtro distinto). Hay que aclarar qué mide antes de usarla para validar el cobro tras la migración.

**Fecha de corte.** Los datos llegan al 2026-11-08 21:45; no incluyen el 9-nov.

## Pendientes (datos que faltan)

| Dato | Para qué se necesita | Cómo obtenerlo cuando haya acceso |
|---|---|---|
| Intentos, rechazos, motivos y tasa de aprobación de pago | Línea base para comparar durante el canary | Supabase prod (`payment_transactions` agrupada por estado y motivo) o panel de EcartPay; la API de monitoreo nueva del backend ya registra rechazos por orden |
| Método de pago (tarjeta guardada / nueva / Apple Pay / Google Pay) | Priorizar pruebas de wallet y 3DS | Mismas fuentes; EcartPay distingue el método |
| Reembolsos y cobros duplicados | Línea base de doble cobro | Supabase prod y EcartPay |
| Órdenes canceladas o fallidas | Línea base de errores | Supabase prod |
| QR: formato de URL, cantidad y dominios | Confirmar que todos apuntan a `*.letseven.io` (cutover sin cambiar QR) | Supabase prod (tabla de QR) o el admin-portal; Vercel prod para el dominio asignado a cada proyecto |
| Integración con POS por restaurante | Saber qué restaurantes dependen del agente de POS | Admin-portal o tabla de sucursales en Supabase prod |
| IDs de restaurante, servicios habilitados y número de sucursales | Elegir canary y reglas de ruteo por restaurante | Supabase prod |
| Definición exacta de "Ingresos Even" | Validar comisión tras la migración | Revisar el código del main-portal o preguntar a quien lo construyó |
| Consumo total y ticket promedio oficiales | Reemplazar los calculados a mano | Supabase prod |

Si no llega acceso a la base, una segunda pasada del agente de Chrome por el admin-portal (restaurantes, servicios por restaurante, sucursales, QR, POS) puede cubrir las filas de QR, POS e IDs.
