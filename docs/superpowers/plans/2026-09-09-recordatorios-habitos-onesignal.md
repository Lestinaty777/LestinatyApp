# Recordatorios de Hábitos con OneSignal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Programar y despachar recordatorios privados de hábitos mediante OneSignal y auditar su resultado.

**Architecture:** La base conserva el catálogo, preferencias, dispositivos y presupuestos existentes. Una migración completa la cola privada, y una Edge Function con `service_role` reclama, valida y entrega las notificaciones sin que Expo acceda a secretos o identificadores de dispositivo.

**Tech Stack:** Supabase Postgres/RLS, Supabase Edge Functions (Deno), OneSignal REST API, TypeScript, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-09-recordatorios-habitos-onesignal-design.md`

## Global Constraints

- Reutilizar `catalogo_notificaciones`, `preferencias_notificacion_usuario`, `dispositivos_notificacion` y `presupuestos_notificacion_usuario`; no crear duplicados.
- Mantener las nuevas tablas dentro del schema no expuesto `privacidad` y bloquear su acceso desde Expo.
- Solo una notificación por plan y fecha local; no incluir título de hábito si `mostrar_nombre_notificacion` es falso.
- Las claves de OneSignal permanecen exclusivamente en secretos de Supabase.
- Android es la única plataforma objetivo actual.

---

### Task 1: Completar la cola privada y auditoría

**Files:**
- Modify: `supabase/migrations/20260909_09_cola_recordatorios_habitos.sql`
- Modify: `supabase/privacidad-schema.md`
- Test: `supabase/tests/03_recordatorios_habitos.sql`

**Interfaces:**
- Consumes: `public.habitos_planes`, `public.habitos_items`, `privacidad.dispositivos_notificacion` y preferencias existentes.
- Produces: `privacidad.notificaciones_programadas`, `privacidad.notificaciones_entregas`, `privacidad.notificacion_interacciones` y una RPC privada para reclamar filas.

- [ ] **Step 1: Write the failing SQL smoke test**

```sql
select to_regclass('privacidad.notificaciones_programadas') is not null as cola_existe;
select to_regclass('privacidad.notificacion_interacciones') is not null as interacciones_existe;
```

- [ ] **Step 2: Run it to verify it fails before the migration**

Run: `supabase db reset && supabase test db supabase/tests/03_recordatorios_habitos.sql`
Expected: FAIL because the private queue tables do not exist.

- [ ] **Step 3: Add the minimal schema**

```sql
create table privacidad.notificacion_interacciones (
  id uuid primary key default gen_random_uuid(),
  notificacion_id uuid not null references privacidad.notificaciones_programadas(id) on delete cascade,
  tipo text not null check (tipo in ('abierta','descartada')),
  occurred_at timestamptz not null default now(),
  proveedor_evento_id text unique
);
```

- [ ] **Step 4: Run the smoke test again**

Run: `supabase db reset && supabase test db supabase/tests/03_recordatorios_habitos.sql`
Expected: PASS.

### Task 2: Extraer y probar decisiones puras de despacho

**Files:**
- Create: `supabase/functions/despachar-recordatorios-habitos/decisiones.ts`
- Create: `supabase/functions/despachar-recordatorios-habitos/decisiones_test.ts`

**Interfaces:**
- Consumes: el plan recordatorio, preferencias, dispositivos y una notificación reclamada.
- Produces: `decidirDespacho(entrada): { accion: 'enviar' | 'cancelar'; razon?: string; contenido?: { titulo: string; cuerpo: string } }`.

- [ ] **Step 1: Write the failing Deno tests**

```ts
Deno.test('oculta el título del hábito si el plan no permite mostrarlo', () => {
  const decision = decidirDespacho({ dispositivoConcedido: true, nombre: 'Meditar', preferenciaActiva: true, mostrarNombre: false });
  assertEquals(decision.contenido?.titulo, 'Es momento de tu hábito');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `deno test supabase/functions/despachar-recordatorios-habitos/decisiones_test.ts`
Expected: FAIL because `decidirDespacho` is missing.

- [ ] **Step 3: Implement the pure decision helper**

```ts
export function decidirDespacho(input: EntradaDespacho): DecisionDespacho {
  if (!input.preferenciaActiva) return { accion: 'cancelar', razon: 'preferencia_inactiva' };
  if (!input.dispositivoConcedido) return { accion: 'cancelar', razon: 'sin_dispositivo' };
  return { accion: 'enviar', contenido: input.mostrarNombre
    ? { titulo: input.nombre, cuerpo: 'Es momento de cumplir tu hábito.' }
    : { titulo: 'Es momento de tu hábito', cuerpo: 'Una pequeña acción cuenta hoy.' } };
}
```

- [ ] **Step 4: Run the helper tests**

Run: `deno test supabase/functions/despachar-recordatorios-habitos/decisiones_test.ts`
Expected: PASS.

### Task 3: Implementar Edge Function segura

**Files:**
- Create: `supabase/functions/despachar-recordatorios-habitos/index.ts`
- Create: `supabase/functions/despachar-recordatorios-habitos/README.md`
- Modify: `supabase/config.toml` only if the existing project has function configuration there.

**Interfaces:**
- Consumes: cola privada reclamada, `ONESIGNAL_REST_API_KEY`, `ONESIGNAL_APP_ID`, la decisión pura de Task 2.
- Produces: envío OneSignal y registros de entrega/estado de cola.

- [ ] **Step 1: Write a failing request test around the handler**

```ts
Deno.test('rechaza invocaciones sin token de cron', async () => {
  const response = await manejarDespacho(new Request('https://local/functions/v1/despachar-recordatorios-habitos', { method: 'POST' }), deps);
  assertEquals(response.status, 401);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `deno test supabase/functions/despachar-recordatorios-habitos/index_test.ts`
Expected: FAIL because the handler is missing.

- [ ] **Step 3: Implement minimal authenticated handler**

```ts
const respuesta = await fetch('https://api.onesignal.com/notifications?c=push', {
  method: 'POST',
  headers: { Authorization: `Key ${restKey}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ app_id: appId, include_subscription_ids: subscriptionIds, headings: { en: titulo }, contents: { en: cuerpo }, data: { ruta: `/habitos/${habitoId}`, notification_id: id } }),
});
```

- [ ] **Step 4: Run unit checks**

Run: `deno test supabase/functions/despachar-recordatorios-habitos && deno check supabase/functions/despachar-recordatorios-habitos/index.ts`
Expected: PASS.

### Task 4: Validar y documentar despliegue

**Files:**
- Modify: `supabase/privacidad-schema.md`
- Modify: `supabase/resumen.md`
- Modify: `supabase/functions/despachar-recordatorios-habitos/README.md`

**Interfaces:**
- Consumes: migración y Edge Function terminadas.
- Produces: instrucciones para secretos, despliegue, invocación cada cinco minutos y prueba controlada.

- [ ] **Step 1: Run database and function validation**

Run: `supabase db reset && supabase test db supabase/tests/03_recordatorios_habitos.sql && deno test supabase/functions/despachar-recordatorios-habitos && deno check supabase/functions/despachar-recordatorios-habitos/index.ts`
Expected: PASS.

- [ ] **Step 2: Document exact runtime requirements**

```md
supabase secrets set ONESIGNAL_APP_ID=<app-id>
supabase functions deploy despachar-recordatorios-habitos --no-verify-jwt
```

- [ ] **Step 3: Verify Expo remains independent of server secrets**

Run: `rg -n "ONESIGNAL_REST_API_KEY|SUPABASE_SERVICE_ROLE_KEY" src app.json`
Expected: no matches.
