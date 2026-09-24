-- Smoke test para la migración 20260924_50_notificaciones_ios.sql.
-- Autocontenido: crea su propio usuario Auth desechable dentro de la
-- transacción (el trigger on_auth_user_created_lestinaty aprovisiona su
-- perfil) y revierte todo al final, sin dejar datos persistentes.

begin;

do $$
declare
  v_usuario_id uuid := gen_random_uuid();
  v_habito_id uuid;
  v_resultado jsonb;
  v_dispositivos_ios jsonb;
  v_dispositivos_android jsonb;
begin
  insert into auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  values (v_usuario_id, 'smoke-notif-ios-' || v_usuario_id || '@lestinaty.invalid', crypt('smoke-password', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb);

  perform set_config('request.jwt.claims', json_build_object('role', 'authenticated', 'sub', v_usuario_id::text)::text, true);
  perform set_config('role', 'authenticated', true);

  v_habito_id := (public.crear_habito_premium(
    'Recordatorio smoke iOS', null, 'Sparkles', '#22C55E', 'cantidad', 'min',
    null, 'estandar', null, null,
    'diaria', null, null, 10, true, '00:00:00', false, current_date - 2
  )->>'id')::uuid;

  perform public.registrar_dispositivo_notificacion('smoke-subscription-ios', 'ios', 'concedido');
  perform public.registrar_dispositivo_notificacion('smoke-subscription-android', 'android', 'concedido');

  reset role;
  reset request.jwt.claims;

  v_resultado := public.reclamar_recordatorios_habitos(200);

  select notificacion -> 'dispositivos' into v_dispositivos_ios
  from jsonb_array_elements(v_resultado) notificacion
  where (notificacion ->> 'habito_id')::uuid = v_habito_id;

  if v_dispositivos_ios is null then
    raise exception 'el hábito de prueba no aparece entre los recordatorios reclamados' using errcode = 'assert_failure';
  end if;

  if not exists (
    select 1 from jsonb_array_elements(v_dispositivos_ios) d
    where d ->> 'subscription_id' = 'smoke-subscription-ios'
  ) then
    raise exception 'el dispositivo iOS no fue incluido — el filtro de plataforma sigue excluyendo iOS' using errcode = 'assert_failure';
  end if;

  if not exists (
    select 1 from jsonb_array_elements(v_dispositivos_ios) d
    where d ->> 'subscription_id' = 'smoke-subscription-android'
  ) then
    raise exception 'el dispositivo Android dejó de incluirse — regresión de plataforma' using errcode = 'assert_failure';
  end if;

  raise notice 'OK: reclamar_recordatorios_habitos incluye dispositivos iOS y Android.';
end;
$$;

rollback;
