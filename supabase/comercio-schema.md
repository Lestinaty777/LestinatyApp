# Schema `comercio`

## Proposito

`comercio` contiene la billetera de gemas y su ledger de movimientos. No se expone mediante PostgREST ni se consulta con `supabase.from(...)` desde Expo — ni siquiera para lectura del saldo, que pasa por un wrapper RPC en `public`.

## Tablas

| Tabla | Proposito | Regla principal |
| --- | --- | --- |
| `billeteras_gemas` | Saldo actual de gemas por persona. | Una fila por persona; nunca baja de cero (`check`). |
| `movimientos_gemas` | Historial inmutable de créditos y gastos. | Solo lo escriben `comprar_articulo` y `acreditar_gemas`. |

`public.paquetes_gemas_iap` (paquete lógico: cantidad de gemas y precio de referencia, lectura pública de filas activas) vive en `public`, no en `comercio`, porque el cliente necesita leerlo para saber qué ofrecer al comprar gemas — pero solo la Edge Function (vía `service_role`) puede escribir en él. Sus identificadores de tienda reales viven aparte, uno por plataforma, en `public.paquetes_gemas_iap_productos` (`paquete_id`, `plataforma` ios|android, `product_id_revenuecat`) — el webhook de RevenueCat resuelve el paquete por esa tabla hija, nunca por el `product_id_revenuecat` legado que aún conserva `paquetes_gemas_iap` para rollback de esta primera entrega iOS.

## Funciones Privadas

Todas son `security definer`, usan `search_path = ''` y su propietario requiere `BYPASSRLS` (verificado al final de la migración que las crea).

- `obtener_saldo_gemas()` — deriva la persona de `auth.uid()`; expuesta a `authenticated` vía wrapper público.
- `comprar_articulo(p_articulo_id)` — cobra gemas y crea la fila en `public.compras_tienda`; idempotente si el artículo ya se posee. Expuesta a `authenticated` vía wrapper público.
- `acreditar_gemas(p_persona_id, p_cantidad, p_motivo, p_referencia)` — única forma genérica de aumentar un saldo (motivos `compra_iap`/`ajuste_soporte`). Reservada a `service_role`, invocada por la Edge Function `recibir-webhook-revenuecat` tras un webhook de compra confirmada. Idempotente por `(persona, motivo, referencia)` desde la migración 17 — usa `event.id` de RevenueCat como referencia, así que un webhook reintentado nunca acredita dos veces. Tiene un wrapper en `public.acreditar_gemas` (migración 18) con `EXECUTE` exclusivo para `service_role` — necesario porque `comercio` no es alcanzable vía `supabase-js .rpc()` directamente, pero sigue sin ninguna vía para `authenticated`/`anon`.
- `acreditar_recompensa_nivel_habito(p_habito_id, p_nivel_nuevo)` — recompensa por subir de nivel un hábito (5 × nivel nuevo: 10/15/20/25/30/35 para niveles 2-7). Se invoca únicamente desde `privacidad.registrar_progreso_habito()` (security definer) en el mismo momento en que confirma una subida real — desde la migración 15 ya **no** tiene `EXECUTE` para `authenticated`, solo se alcanza por esa vía interna. Se protege además reconfirmando contra `habitos_planes` que ese nivel existe de verdad para esa persona, y es idempotente por `(hábito, nivel)` vía `referencia` en el ledger. El riesgo de insertar una fila de plan falsa por REST directo (que existía cuando `habitos_planes` era escribible por `authenticated`) quedó cerrado en la migración 15: esa escritura ahora solo ocurre dentro de funciones `security definer` en `privacidad`.

## Restricciones Operativas

- No agregar `comercio` a schemas expuestos de Supabase.
- No otorgar `insert`/`update`/`delete` sobre sus tablas a `authenticated` ni `anon` — toda mutación pasa por las funciones de arriba.
- `public.articulos_tienda` (catálogo) y `public.compras_tienda` (qué posee cada persona) sí son de lectura pública/propia, pero sus escrituras también quedan reservadas a `comercio.comprar_articulo`.
- Cualquier ajuste manual de saldo (soporte a un usuario) debe pasar por `acreditar_gemas` con `motivo = 'ajuste_soporte'`, nunca por un `UPDATE` directo — así queda en el ledger.
