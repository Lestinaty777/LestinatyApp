# Generar sendero con Aby

La funcion recibe una conversacion ya autenticada y llama a Gemini exclusivamente desde Supabase Edge Functions. La clave nunca se agrega a Expo, `app.json` ni a variables `EXPO_PUBLIC_*`.

## Secretos requeridos

```bash
supabase secrets set GEMINI_API_KEY=valor-secreto
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=valor-service-role
supabase functions deploy generar-sendero-aby
```

Aplica antes la migracion `20260830000000_aby_generation_locks.sql`. La app movil debe usar `supabase.functions.invoke('generar-sendero-aby', payload)` con una sesion autenticada.

