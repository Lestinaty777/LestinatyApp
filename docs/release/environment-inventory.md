# Inventario de variables de entorno

Solo nombres — nunca valores. Ver Global Constraints del plan de adaptación
iOS: ningún secreto de Supabase, APNs, RevenueCat, OneSignal o Apple se
guarda en Git.

## EAS / cliente (production)

Embebidas en el bundle, públicas por diseño (`EXPO_PUBLIC_*`). Su seguridad
depende de RLS en Supabase, no de mantenerlas ocultas.

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` (migrar a publishable key cuando se programe)
- `EXPO_PUBLIC_REVENUECAT_APPLE_KEY` — requerida solo en builds iOS
- `EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY` — requerida solo en builds Android
- `EXPO_PUBLIC_ABY_REMOTO` — debe ser `"true"`
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` — Android únicamente, no se exige en iOS

## Supabase Edge Functions / backend únicamente

Nunca deben llegar a EAS, Xcode, `.env.example` versionado ni al bundle
cliente. `scripts/validar-entorno-release.mjs` falla si detecta cualquiera
de estos nombres presentes en el entorno del cliente.

- `GEMINI_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_SECRET_KEY`
- `REVENUECAT_WEBHOOK_SECRET`
- `ONESIGNAL_REST_API_KEY`
- `SCHEDULER_SECRET`

## Verificación

```bash
eas env:list --environment production
node scripts/validar-entorno-release.mjs
npx vitest run src/nucleo/configuracion/entorno.test.ts
supabase secrets list
supabase functions list
```

Ninguno de estos comandos debe imprimir un valor de secreto — solo nombres
y, en el caso del validador, la plataforma y el resultado.
