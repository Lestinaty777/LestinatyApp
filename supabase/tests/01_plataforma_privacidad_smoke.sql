-- Smoke test manual for 20260903_01_plataforma_privacidad_catalogo.sql.
-- Prerequisites:
--   1. Run the migration first.
--   2. Create two users in Supabase Auth and replace both UUIDs below.
-- This script rolls back all writes at the end.

begin;

-- Seed an ephemeral active document before emulating the authenticated role.
-- Its id is stored only for this transaction and disappears on rollback.
select set_config('app.smoke_documento_legal_id', documento.id::text, true)
from (
  insert into public.documentos_legales (
    codigo,
    version,
    idioma,
    url_publica,
    contenido_hash,
    retirado_at
  ) values (
    'privacidad',
    'smoke-v1',
    'es',
    'https://example.invalid/lestinaty/smoke-privacidad',
    'smoke-test-only',
    null
  )
  on conflict (codigo, version, idioma) do update
  set retirado_at = null
  returning id
) as documento;

set local role authenticated;

-- Replace with a real Auth user id. This emulates a real authenticated JWT.
set local request.jwt.claims = '{"role":"authenticated","sub":"USER_A_UUID"}';

-- User A can read initial permissions and update them through public RPCs.
select public.obtener_permisos_datos();
select public.actualizar_permisos_datos(true, false, false, 'smoke-v1');
select public.actualizar_permisos_datos(true, false, false, 'smoke-v1');

-- The same active privacy request is idempotent.
select public.crear_solicitud_privacidad('exportacion', 'smoke test');
select public.crear_solicitud_privacidad('exportacion', 'smoke test');
select public.obtener_solicitudes_privacidad_activas();

select public.aceptar_documento_legal(
  current_setting('app.smoke_documento_legal_id')::uuid,
  'configuracion'
);
select public.obtener_aceptaciones_legales();

-- Register the device as user A, then transfer it to user B.
select public.registrar_dispositivo_notificacion('smoke-subscription-id', 'android', 'concedido');

set local request.jwt.claims = '{"role":"authenticated","sub":"USER_B_UUID"}';
select public.registrar_dispositivo_notificacion('smoke-subscription-id', 'android', 'concedido');

-- A stale logout from user A cannot deactivate user B's transferred device.
set local request.jwt.claims = '{"role":"authenticated","sub":"USER_A_UUID"}';
select public.desvincular_dispositivo_notificacion('smoke-subscription-id') as stale_logout_must_be_false;

set local request.jwt.claims = '{"role":"authenticated","sub":"USER_B_UUID"}';
select public.desvincular_dispositivo_notificacion('smoke-subscription-id') as owner_logout_must_be_true;

rollback;
