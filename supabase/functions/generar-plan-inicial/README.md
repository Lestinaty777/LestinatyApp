# `generar-plan-inicial` / `detallar-seccion-plan` / `aceptar-propuesta-plan`

Fase 11.2 — generación de Planes con Aby (Gemini 2.5 Flash), mismo esqueleto que `generar-sendero-aby`/`aceptar-propuesta-aby` (ver sus README/código) pero para el módulo de Planes: propuesta → revisión → aceptar, nunca escritura directa en `planes_*` desde la generación.

- **`generar-plan-inicial`**: recibe `{ objetivo, bloquesPorDia }`, genera título/descripción del plan + título y resumen de TODAS las secciones + el detalle completo (días/bloques/ítems) de SOLO la primera. Guarda el resultado en `planes_propuestas` (`tipo='plan_inicial'`).
- **`detallar-seccion-plan`**: recibe `{ seccionId, contextoUsuario }` — detalla UNA sección que hoy solo tiene título (`estado='solo_titulo'`), usando el contexto que el usuario da en ese momento. Guarda en `planes_propuestas` (`tipo='seccion'`).
- **`aceptar-propuesta-plan`**: recibe `{ propuestaId }` — convierte la propuesta `'lista'` en filas reales (`planes_items`/`planes_instancias`/`planes_secciones`/`planes_dias`/`planes_bloques`/`planes_bloque_items`). La lógica de construcción vive en `aceptar-propuesta-plan/construirPlanDesdePropuesta.ts` (función pura, con tests en Vitest — correr `npm test` desde la raíz del repo, no `deno test`).

## Secretos requeridos

Ya deberían existir (los usa `generar-sendero-aby`):

```sh
supabase secrets set GEMINI_API_KEY=<tu-api-key-de-gemini>
```

**Nuevo para esta fase** — verificación server-side de Horizon (nunca se confía en el estado de suscripción que reporta el cliente): una API key **secreta** de RevenueCat (no confundir con las públicas `EXPO_PUBLIC_REVENUECAT_*` del cliente), con permiso de lectura sobre suscriptores:

```sh
supabase secrets set REVENUECAT_SECRET_API_KEY=<secret-api-key-de-revenuecat>
```

Se obtiene en el dashboard de RevenueCat → Project settings → API keys → "Secret API keys". Sin este secreto configurado, ambas funciones de generación responden `402`/`429` igual que si Horizon estuviera inactivo (no fallan silenciosamente en modo "todo permitido") — ver `_shared/accesoAbyPlanes.ts`.

## Tope de uso

`_shared/accesoAbyPlanes.ts` limita a 20 generaciones por usuario por mes (constante `TOPE_GENERACIONES_MES`), para todos los usuarios con Horizon activo — protege el costo real de Gemini. El contador vive en `planes_generaciones_uso`, solo escribible por `service_role`.

## Despliegue

```sh
supabase functions deploy generar-plan-inicial
supabase functions deploy detallar-seccion-plan
supabase functions deploy aceptar-propuesta-plan
```
