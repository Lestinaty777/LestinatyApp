# `recibir-webhook-revenuecat`

Única forma real de que una persona reciba gemas compradas con dinero. Expo nunca la invoca ni puede acreditar gemas por sí misma — ver `supabase/comercio-schema.md`. RevenueCat valida el recibo de App Store/Play Store y avisa aquí cuando una compra ya se confirmó.

## Antes de recibir compras reales

1. Crear los productos de gemas reales en App Store Connect y Google Play Console (consumibles, no suscripciones).
2. Crearlos también en RevenueCat y anotar sus `product_id`.
3. Actualizar `public.paquetes_gemas_iap` con esos `product_id_revenuecat` reales — las filas que trae la migración 17 son placeholders (`com.tuapp.gemas.100`, etc.).
4. En el cliente (Expo), al iniciar sesión llamar `Purchases.logIn(auth.uid())` de RevenueCat **con el mismo id de Supabase** — la función usa `event.app_user_id` para saber a quién acreditarle, así que si no coincide con `auth.uid()` la compra no se puede acreditar.

## Secretos requeridos

```sh
supabase secrets set REVENUECAT_WEBHOOK_SECRET=<secreto-largo-aleatorio>
```

Ese mismo valor se configura en RevenueCat: *Project settings → Integrations → Webhooks → Authorization header value*.

## Despliegue

```sh
supabase functions deploy recibir-webhook-revenuecat --no-verify-jwt
```

La función exige el header `Authorization` con el secreto exacto, por lo que `--no-verify-jwt` no abre una ruta pública. La URL de la función es la que se registra como *Webhook URL* en RevenueCat.

## Qué hace y qué ignora

- Solo acredita gemas para los eventos `INITIAL_PURCHASE` y `NON_RENEWING_PURCHASE` (compras consumibles de una sola vez). El resto (`CANCELLATION`, `EXPIRATION`, `BILLING_ISSUE`, renovaciones de suscripción, `TEST` del dashboard) responde `200` sin acreditar nada, para que RevenueCat no reintente.
- Si `product_id` no está en `paquetes_gemas_iap` (por ejemplo, un producto futuro que no sea de gemas), también responde `200` sin acreditar.
- Es idempotente: usa `event.id` de RevenueCat como referencia en el ledger (`comercio.movimientos_gemas`), así que un reintento del mismo webhook nunca acredita dos veces.
