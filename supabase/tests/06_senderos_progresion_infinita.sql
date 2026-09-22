-- Smoke test manual para la migración 20260922_46_progresion_senderos_infinita.sql.
-- Prerequisites:
--   1. Aplicar la migración 46 (con o sin la 36 previamente aplicada).
--   2. Reemplazar USER_A_UUID con un usuario Auth real y desechable.
-- Este script envuelve todas las fixtures en begin;...rollback; y no deja
-- datos persistentes, sin importar si las aserciones pasan o fallan.

begin;

do $$
begin
  if to_regprocedure('privacidad.obtener_resumen_sendero_habito(uuid)') is null then
    raise exception 'falta privacidad.obtener_resumen_sendero_habito' using errcode = 'assert_failure';
  end if;
  if to_regprocedure('public.obtener_resumen_sendero_habito(uuid)') is null then
    raise exception 'falta public.obtener_resumen_sendero_habito' using errcode = 'assert_failure';
  end if;
  if to_regprocedure('privacidad.reclamar_cofre_sendero(uuid,integer,integer,text,integer)') is null then
    raise exception 'falta privacidad.reclamar_cofre_sendero' using errcode = 'assert_failure';
  end if;
  if to_regprocedure('public.obtener_cofres_reclamados_habito(uuid,integer,integer)') is null then
    raise exception 'falta public.obtener_cofres_reclamados_habito' using errcode = 'assert_failure';
  end if;
  if to_regclass('public.habitos_cofres_reclamados') is null then
    raise exception 'falta la tabla habitos_cofres_reclamados' using errcode = 'assert_failure';
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'habitos_cofres_reclamados' and column_name = 'ciclo'
  ) then
    raise exception 'habitos_cofres_reclamados no tiene columna ciclo' using errcode = 'assert_failure';
  end if;
end;
$$;

set local role authenticated;
set local request.jwt.claims = '{"role":"authenticated","sub":"USER_A_UUID"}';

-- ── Fixture 1: Nivel 1 con dos días cumplidos previos y el tercero vía RPC ──
select set_config(
  'app.smoke_habito_1',
  (public.crear_habito_premium(
    'Sendero smoke N1', null, 'Sparkles', '#22C55E', 'cantidad', 'min',
    null, 'estandar', null, null,
    'diaria', null, null, 10, false, null, false, current_date - 2
  )->>'id'),
  true
);

select public.registrar_progreso_habito(current_setting('app.smoke_habito_1')::uuid, current_date - 2, 10, null);
select public.registrar_progreso_habito(current_setting('app.smoke_habito_1')::uuid, current_date - 1, 10, null);

do $$
declare v_saldo_previo integer; declare v_resultado jsonb; declare v_saldo integer; declare v_cofres integer;
begin
  select coalesce(public.obtener_saldo_gemas(), 0) into v_saldo_previo;

  v_resultado := public.registrar_progreso_habito(current_setting('app.smoke_habito_1')::uuid, current_date, 10, null);

  if not (v_resultado->>'subio_nivel')::boolean then
    raise exception 'Fixture 1: esperaba subir de nivel con 3 días cumplidos' using errcode = 'assert_failure';
  end if;
  if (v_resultado->'transicion_sendero'->>'tipo') is distinct from 'nivel' then
    raise exception 'Fixture 1: transicion_sendero.tipo esperado "nivel", fue %', v_resultado->'transicion_sendero' using errcode = 'assert_failure';
  end if;
  if (v_resultado->>'gemas_ganadas')::integer <> 10 then
    raise exception 'Fixture 1: gemas esperadas 10 (cofre final nivel 1), fue %', v_resultado->>'gemas_ganadas' using errcode = 'assert_failure';
  end if;

  select public.obtener_saldo_gemas() into v_saldo;
  if v_saldo <> v_saldo_previo + 10 then
    raise exception 'Fixture 1: saldo esperado %, fue %', v_saldo_previo + 10, v_saldo using errcode = 'assert_failure';
  end if;

  select count(*) into v_cofres from public.habitos_cofres_reclamados
  where habito_id = current_setting('app.smoke_habito_1')::uuid and nivel = 1 and tipo = 'final';
  if v_cofres <> 1 then
    raise exception 'Fixture 1: esperaba exactamente 1 fila de cofre final, hubo %', v_cofres using errcode = 'assert_failure';
  end if;

  -- Doble toque / reintento del mismo día no debe volver a pagar.
  perform public.registrar_progreso_habito(current_setting('app.smoke_habito_1')::uuid, current_date, 10, 'repetido');
  select public.obtener_saldo_gemas() into v_saldo;
  if v_saldo <> v_saldo_previo + 10 then
    raise exception 'Fixture 1: repetir el registro de hoy volvió a pagar, saldo %', v_saldo using errcode = 'assert_failure';
  end if;
end;
$$;

-- ── Fixture 2: dos segmentos de plan contiguos del mismo nivel, el total conjunto cuenta ──
select set_config(
  'app.smoke_habito_2',
  (public.crear_habito_premium(
    'Sendero smoke segmentos', null, 'Sparkles', '#22C55E', 'cantidad', 'min',
    null, 'estandar', null, null,
    'diaria', null, null, 10, false, null, false, current_date - 7, 2
  )->>'id'),
  true
);

select public.registrar_progreso_habito(current_setting('app.smoke_habito_2')::uuid, current_date - 7, 10, null);
select public.registrar_progreso_habito(current_setting('app.smoke_habito_2')::uuid, current_date - 6, 10, null);
select public.registrar_progreso_habito(current_setting('app.smoke_habito_2')::uuid, current_date - 5, 10, null);

-- Simula un cambio de meta a mitad de nivel: cierra el segmento vigente y
-- abre uno nuevo del MISMO nivel (2) — el conteo de días no debe reiniciarse.
-- La escritura directa sobre habitos_planes está bloqueada para
-- `authenticated` a propósito (todo pasa por RPCs); se hace como service_role.
reset role;
set local role service_role;

do $$
declare v_plan_id uuid;
begin
  select id into v_plan_id from public.habitos_planes
  where habito_id = current_setting('app.smoke_habito_2')::uuid order by desde_fecha desc limit 1;

  update public.habitos_planes set hasta_fecha = current_date - 4 where id = v_plan_id;
  insert into public.habitos_planes (habito_id, frecuencia, objetivo_valor, desde_fecha, nivel, origen)
  select habito_id, frecuencia, 12, current_date - 4, nivel, 'usuario'
  from public.habitos_planes where id = v_plan_id;
end;
$$;

set local role authenticated;
set local request.jwt.claims = '{"role":"authenticated","sub":"USER_A_UUID"}';

select public.registrar_progreso_habito(current_setting('app.smoke_habito_2')::uuid, current_date - 4, 12, null);
select public.registrar_progreso_habito(current_setting('app.smoke_habito_2')::uuid, current_date - 3, 12, null);
select public.registrar_progreso_habito(current_setting('app.smoke_habito_2')::uuid, current_date - 2, 12, null);

do $$
declare v_resultado jsonb;
begin
  -- Nivel 2 pide 7 días: 3 en el primer segmento + 4 en el segundo = 7.
  v_resultado := public.registrar_progreso_habito(current_setting('app.smoke_habito_2')::uuid, current_date - 1, 12, null);
  if not (v_resultado->>'subio_nivel')::boolean then
    raise exception 'Fixture 2: un cambio de meta dentro del nivel no debe reiniciar el conteo de días' using errcode = 'assert_failure';
  end if;
end;
$$;

-- ── Fixture 3: nivel 7 con 41 y después 42 días ──
do $$
declare v_habito_id uuid; declare v_dia integer; declare v_resultado jsonb; declare v_resumen jsonb; declare v_seccion7 jsonb;
begin
  v_habito_id := (public.crear_habito_premium(
    'Sendero smoke N7', null, 'Sparkles', '#22C55E', 'check', null,
    null, 'estandar', null, null,
    'diaria', null, null, 1, false, null, false, current_date - 41, 7
  )->>'id')::uuid;

  for v_dia in 0..40 loop
    perform public.registrar_progreso_habito(v_habito_id, current_date - 41 + v_dia, 1, null);
  end loop;

  select public.obtener_resumen_sendero_habito(v_habito_id) into v_resumen;
  select value into v_seccion7 from jsonb_array_elements(v_resumen->'secciones') where (value->>'nivel')::integer = 7;
  if (v_seccion7->>'dias_completados')::integer <> 41 then
    raise exception 'Fixture 3: esperaba 41 días completados en el ciclo 1, fue %', v_seccion7->>'dias_completados' using errcode = 'assert_failure';
  end if;
  if (v_seccion7->>'ciclo')::integer <> 1 then
    raise exception 'Fixture 3: esperaba ciclo 1 con 41 días, fue %', v_seccion7->>'ciclo' using errcode = 'assert_failure';
  end if;

  v_resultado := public.registrar_progreso_habito(v_habito_id, current_date, 1, null);
  if (v_resultado->'transicion_sendero'->>'tipo') is distinct from 'ciclo_maestria' then
    raise exception 'Fixture 3: el día 42 debe pagar cofre final de ciclo, transicion %', v_resultado->'transicion_sendero' using errcode = 'assert_failure';
  end if;
  if (v_resultado->>'gemas_ganadas')::integer <> 35 then
    raise exception 'Fixture 3: el cofre final de ciclo de nivel 7 paga 35, fue %', v_resultado->>'gemas_ganadas' using errcode = 'assert_failure';
  end if;

  select public.obtener_resumen_sendero_habito(v_habito_id) into v_resumen;
  select value into v_seccion7 from jsonb_array_elements(v_resumen->'secciones') where (value->>'nivel')::integer = 7;
  if (v_seccion7->>'ciclo')::integer <> 2 then
    raise exception 'Fixture 3: tras 42 días debe mostrar ciclo 2, fue %', v_seccion7->>'ciclo' using errcode = 'assert_failure';
  end if;
  if (v_seccion7->>'dias_completados')::integer <> 0 then
    raise exception 'Fixture 3: el ciclo 2 debe arrancar en 0 días, fue %', v_seccion7->>'dias_completados' using errcode = 'assert_failure';
  end if;
end;
$$;

-- ── Fixture 4: nivel 7 con 83 y después 84 días (segundo cruce de ciclo) ──
do $$
declare v_habito_id uuid; declare v_dia integer; declare v_resultado jsonb; declare v_saldo_previo integer; declare v_saldo integer;
begin
  v_habito_id := (public.crear_habito_premium(
    'Sendero smoke N7 ciclo2', null, 'Sparkles', '#22C55E', 'check', null,
    null, 'estandar', null, null,
    'diaria', null, null, 1, false, null, false, current_date - 83, 7
  )->>'id')::uuid;

  for v_dia in 0..82 loop
    perform public.registrar_progreso_habito(v_habito_id, current_date - 83 + v_dia, 1, null);
  end loop;

  select coalesce(public.obtener_saldo_gemas(), 0) into v_saldo_previo;
  v_resultado := public.registrar_progreso_habito(v_habito_id, current_date, 1, null);

  if (v_resultado->'transicion_sendero'->>'tipo') is distinct from 'ciclo_maestria' then
    raise exception 'Fixture 4: el día 84 debe cerrar el segundo ciclo, transicion %', v_resultado->'transicion_sendero' using errcode = 'assert_failure';
  end if;
  if (v_resultado->'transicion_sendero'->>'ciclo_actual')::integer <> 3 then
    raise exception 'Fixture 4: tras cerrar el ciclo 2 el próximo ciclo es 3, fue %', v_resultado->'transicion_sendero'->>'ciclo_actual' using errcode = 'assert_failure';
  end if;

  select public.obtener_saldo_gemas() into v_saldo;
  if v_saldo <> v_saldo_previo + 35 then
    raise exception 'Fixture 4: saldo esperado %, fue %', v_saldo_previo + 35, v_saldo using errcode = 'assert_failure';
  end if;
end;
$$;

-- ── Fixture 5: registro ya completo actualizado con un valor menor ──
do $$
declare v_habito_id uuid; declare v_valor numeric;
begin
  v_habito_id := (public.crear_habito_premium(
    'Sendero smoke monotonico', null, 'Sparkles', '#22C55E', 'cantidad', 'min',
    null, 'estandar', null, null,
    'diaria', null, null, 10, false, null, false, current_date
  )->>'id')::uuid;

  perform public.registrar_progreso_habito(v_habito_id, current_date, 10, null);
  perform public.registrar_progreso_habito(v_habito_id, current_date, 3, 'correccion menor');

  select valor into v_valor from public.habitos_registros
  where habito_id = v_habito_id and fecha_local = current_date;

  if v_valor <> 10 then
    raise exception 'Fixture 5: reducir un registro ya cumplido no debe perder el cumplimiento (valor %)', v_valor using errcode = 'assert_failure';
  end if;
end;
$$;

-- ── Fixture 6: reclamo intermedio repetido ──
do $$
declare v_habito_id uuid; declare v_saldo_previo integer; declare v_saldo integer; declare v_primero jsonb; declare v_segundo jsonb;
begin
  v_habito_id := (public.crear_habito_premium(
    'Sendero smoke cofre intermedio', null, 'Sparkles', '#22C55E', 'cantidad', 'min',
    null, 'estandar', null, null,
    'diaria', null, null, 10, false, null, false, current_date - 2, 2
  )->>'id')::uuid;

  perform public.registrar_progreso_habito(v_habito_id, current_date - 2, 10, null);
  perform public.registrar_progreso_habito(v_habito_id, current_date - 1, 10, null);
  perform public.registrar_progreso_habito(v_habito_id, current_date, 10, null);

  select coalesce(public.obtener_saldo_gemas(), 0) into v_saldo_previo;
  v_primero := public.reclamar_cofre_sendero(v_habito_id, 2, 1, 'intermedio', 3);
  select public.obtener_saldo_gemas() into v_saldo;
  if v_saldo = v_saldo_previo then
    raise exception 'Fixture 6: el primer reclamo del cofre intermedio no acreditó gemas' using errcode = 'assert_failure';
  end if;

  v_segundo := public.reclamar_cofre_sendero(v_habito_id, 2, 1, 'intermedio', 3);
  if (v_segundo->>'gemas')::integer <> (v_primero->>'gemas')::integer then
    raise exception 'Fixture 6: el reclamo repetido debe devolver las mismas gemas guardadas' using errcode = 'assert_failure';
  end if;

  select public.obtener_saldo_gemas() into v_saldo;
  if v_saldo <> v_saldo_previo + (v_primero->>'gemas')::integer then
    raise exception 'Fixture 6: el reclamo repetido volvió a acreditar gemas, saldo %', v_saldo using errcode = 'assert_failure';
  end if;
end;
$$;

rollback;
