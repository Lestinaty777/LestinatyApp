# `despachar-recordatorios-habitos`

Función privada que genera, reclama y envía los recordatorios de hábitos vencidos. Expo no la invoca.

## Secretos requeridos

Estos secretos ya están configurados en Supabase; ninguno pertenece a `.env` de Expo:

```sh
supabase secrets set ONESIGNAL_APP_ID=<id-de-la-app-onesignal>
supabase secrets set SCHEDULER_SECRET=<secreto-largo-aleatorio>
```

También existe `ONESIGNAL_REST_API_KEY` como secreto de Supabase.

## Despliegue

```sh
supabase functions deploy despachar-recordatorios-habitos --no-verify-jwt
```

La función exige `x-scheduler-secret`, por lo que `--no-verify-jwt` no abre una ruta pública.

## Programación

`pg_cron` y `pg_net` están habilitados. Vault conserva la URL de proyecto y el secreto interno; el trabajo `despachar-recordatorios-habitos-cada-5-min` invoca la función cada cinco minutos.

La petición debe incluir los headers `Content-Type: application/json` y `x-scheduler-secret: <valor-de-vault>`.
