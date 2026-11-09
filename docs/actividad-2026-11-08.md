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

**Concentración:** Saku By Miyako es el 79 % de las órdenes y el 97 % del consumo de Pick & Go. Dataframe Café y Polotab son restaurantes de **prueba** (confirmado por Arturo el 2026-11-09; no son negocios reales). Sin ellos, Pick & Go tiene 158 órdenes reales en 30 días (Saku 144, Colibrí Café 8, Sainte Marianne 4, Josefina Cafe 2) y Saku es el 91 % de ellas.

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

**Comisión Even (resuelto con la base).** "Ingresos Even" del dashboard es `even_net_income` de `payment_transactions`, es decir la comisión de Even **neta del costo de EcartPay**, no la comisión bruta. Verificado: Tap Order & Pay $449.87 coincide exacto; Pick & Go $1,038.09 en la base contra $1,048.32 del portal (3 órdenes de diferencia por el corte de zona horaria del 8-nov). La comisión bruta es 4 % + IVA: $1,625.67 en Tap Order & Pay y $3,317.90 en Pick & Go, con costo de EcartPay de $1,175.80 y $2,279.81.

**Fecha de corte.** Los datos llegan al 2026-11-08 21:45; no incluyen el 9-nov.

## Datos de la base de producción (Supabase "Even", consultados el 2026-11-09)

Fuente: proyecto Supabase `Even` (`lpddleurgayjgstywysr`), solo lectura, solo agregados, sin datos personales. Se asume que es la base de producción (tiene datos desde junio, 691 perfiles y 21 restaurantes, y coincide con el dashboard). Hay una rama `DEV` aparte. Ventana: 2026-10-10 a 2026-11-08.

### Pagos (`payment_transactions`, 30 días)

| Servicio | Pagos | Base | Propinas | Comisión bruta | Costo EcartPay | Ingreso neto Even |
|---|---|---|---|---|---|---|
| Pick & Go | 179 | 69,175.68 | 2,331.62 | 3,317.90 | 2,279.81 | 1,038.09 |
| Tap Order & Pay | 130 | 32,216.26 | 2,819.00 | 1,625.67 | 1,175.80 | 449.87 |

Histórico completo: Pick & Go 719 pagos en 9 restaurantes (desde 2026-07-07), Tap Order & Pay 154 en 4 (desde 2026-06-25, último 2026-10-31), y 65 de mesa (FlexBill o Tap & Pay) entre julio y el 2026-09-11 sin actividad desde entonces. Room Service y Tap & Pay: sin pagos.

### Método de pago (30 días)

| Método | Pick & Go | Tap Order & Pay | Total |
|---|---|---|---|
| **Apple Pay** | 96 | 86 | **182 (58 %)** |
| Tarjeta guardada | 87 | 43 | 130 (crédito 96, débito 34) |
| Google Pay | 2 | 1 | 3 |

Apple Pay es más de la mitad del volumen: el archivo `apple-developer-merchantid-domain-association` y el dominio registrado con Apple y EcartPay deben seguir funcionando tras la migración. Las 5 apps del monorepo traen el archivo en `public/.well-known`.

### Intentos de pago (`payment_intents`, 30 días)

| Estado | Intentos |
|---|---|
| confirmed | 136 |
| failed | 14 (≈ 8 %) |
| charging | 18 (sin resolver) |
| unknown | 7 (resultado ambiguo tras llamar a EcartPay: timeout o red) |

Motivos de rechazo: tarjeta inválida (9), "No se puede procesar, intente más tarde" (2), fondos insuficientes (1), "use una tarjeta digital" (1), validación previa fallida (1). Los 18 intentos en `charging` y los 7 en `unknown` merecen revisión antes del cutover: pueden ser intentos que nunca se resolvieron o cobros ambiguos. No se investigó su antigüedad ni si hubo cargo.

### QR

- `qr_codes.code` es un identificador corto (`EVEN-XXXXXX`), no una URL. **El QR no lleva el dominio del frontend:** el backend (`qrCodeController`) resuelve el código y arma la URL de destino por servicio, usando las variables `FLEX_BILL_URL`, `TAP_ORDER_PAY_URL`, `ROOM_SERVICE_URL`, `PICK_AND_GO_URL`, `TAP_AND_PAY_GO_URL`, con respaldo en `fb.`, `top.`, `rs.`, `pc.` y `tp.letseven.io`. Ojo: el respaldo de Pick & Go es `pc.letseven.io`, pero el CORS permite `pg.letseven.io`; hay que confirmar en Railway cuál dominio sirve realmente Pick & Go.
- Cambiar a dónde apunta un servicio no requiere reimprimir QR: basta la variable de entorno del backend (o, por restaurante, un cambio en el resolvedor).
- QR activos: Room Service 750, FlexBill 56, Tap Order & Pay 49 (más 5 inactivos), Tap & Pay 28, Pick & Go 16.
- Formato de ruta destino (código): Pick & Go `/{restaurantId}/menu?branch={n}`, Tap Order & Pay y Room Service `/{restaurantId}/{branch}/menu?table=|room=`, Tap & Pay `/{restaurantId}/{branch}/order?table=`.

### Restaurantes y POS

18 activos (más 3 eliminados). Pick & Go tiene QR activos en 9 restaurantes.

| Restaurante (id) | Sucursales | Servicios con QR activo | POS |
|---|---|---|---|
| Saku By Miyako (12) | 1 | Pick & Go | ninguno |
| Dataframe Café (15) | 1 | los 5 servicios | ninguno |
| Colibrí Café (35) | 1 | Pick & Go | Soft Restaurant |
| Sainte Marianne (29) | 1 | Pick & Go | ninguno |
| Josefina Cafe (36) | 1 | Pick & Go | ninguno |
| Sunora Bacanora Bar (16) | 1 | Pick & Go | ninguno |
| Magnolias (30) | 4 | Pick & Go | ninguno |
| Even Supply (32) | 1 | Pick & Go | ninguno |
| La Polloteria (22) | 1 | Pick & Go, Tap Order & Pay | Soft Restaurant |
| Las Palomas (31) | 1 | Pick & Go, Room Service | Givex |
| Polotab (39) | 1 | Pick & Go, Tap Order & Pay | PoloTab |
| Tacos Domingo (37) | 1 | Tap Order & Pay | PoloTab |
| Duo Padel Park (8) | 1 | FlexBill, Tap Order & Pay, Tap & Pay | Soft Restaurant |
| Bunker Swings & Beers (19) | 1 | Tap & Pay | Soft Restaurant |
| Holy Cow (21) | 2 | FlexBill | Soft Restaurant |
| Steaks del Herradero (23) | 2 | FlexBill | Soft Restaurant |
| Sonoran Star (28) | 1 | Room Service | Soft Restaurant |
| Playa Bonita (38) | 1 | Room Service | Soft Restaurant |

### Otros hallazgos de la base

- La fila de prueba `tap_pay_orders.folio = 'QA-TEST-1'` **ya no existe** en este proyecto (queda resuelto el pendiente de las pruebas de pago).
- La rama `main` del proyecto Supabase muestra estado `MIGRATIONS_FAILED` en la lista de ramas (la rama `DEV` está bien). Conviene revisarlo antes de tocar migraciones.
- El proyecto `Xquisito-back` está inactivo (el anterior).

## Pendientes (lo que sigue sin dato)

| Dato | Estado | Cómo obtenerlo |
|---|---|---|
| Valor real de `PICK_AND_GO_URL` y demás URLs de servicio, dominio asignado a cada proyecto de Vercel, y variables de entorno de prod | Falta | Railway prod y Vercel prod (acceso esperado lunes o martes) |
| Antigüedad e impacto de los 18 intentos `charging` y 7 `unknown` | Falta | Consulta a `payment_intents` por fecha y cruce con `payment_transactions` y EcartPay |
| Canceladas / fallidas de órdenes (`pick_and_go_orders.payment_status`) | Falta | Consulta a Supabase |
| Reembolsos y cobros duplicados | Falta | Cruce de `ecartpay_order_id` repetidos en `payment_transactions` y panel de EcartPay |
| Estado del agente POS por sucursal (`pos_integrations.agent_last_connected_at`) | Falta | Consulta a Supabase |
| Si Dataframe Café y Polotab son restaurantes de prueba | Resuelto: sí son de prueba (Arturo, 2026-11-09) | n/a |
| Rama `main` de Supabase en `MIGRATIONS_FAILED` | Por revisar | Panel de Supabase |
