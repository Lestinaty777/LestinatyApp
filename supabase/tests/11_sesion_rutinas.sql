-- Smoke test manual de la migración 81: sesión guiada de rutinas.
-- Se ejecuta con psql (usa \gset y \echo), NO en el editor SQL del panel:
--   psql "$DATABASE_URL" -f supabase/tests/11_sesion_rutinas.sql
-- Requisitos: migraciones 01-81 aplicadas; rol que pueda insertar en auth.users
-- y hacer `set local role` (postgres o service_role). Crea sus propios datos y
-- hace rollback al final.
-- Verificado el 2026-10-05 contra un Postgres 16 local con stubs mínimos de
-- Supabase, NO contra el proyecto real: córrelo ahí antes de dar la migración por buena.
\set ON_ERROR_STOP 1
\pset format unaligned
\pset tuples_only on
begin;
insert into auth.users (id, email) values ('11111111-1111-1111-1111-111111111111', 'a@x.com'), ('22222222-2222-2222-2222-222222222222', 'b@x.com');
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

\echo === 1. esencial por defecto; un paso opcional
select (public.crear_rutina(jsonb_build_object('titulo','Sesión','icono_lucide','sol','color','#90010D','frecuencia','diaria',
  'pasos', jsonb_build_array(
    jsonb_build_object('tipo_origen','propio','titulo','A','modo','simple'),
    jsonb_build_object('tipo_origen','propio','titulo','B opcional','modo','simple','esencial', false),
    jsonb_build_object('tipo_origen','propio','titulo','C','modo','cronometro','objetivo_valor',5))))->>'id') as r \gset
select jsonb_path_query_array(public.obtener_rutinas_hoy(), '$[0].pasos[*].esencial')::text;
select id as pa from public.rutinas_pasos where rutina_id = :'r' and orden = 1 \gset
select id as pb from public.rutinas_pasos where rutina_id = :'r' and orden = 2 \gset
select id as pc from public.rutinas_pasos where rutina_id = :'r' and orden = 3 \gset

\echo === 2. todos opcionales se rechaza
do $$ begin
  perform public.crear_rutina(jsonb_build_object('titulo','X','icono_lucide','sol','color','#000','frecuencia','diaria',
    'pasos', jsonb_build_array(jsonb_build_object('tipo_origen','propio','titulo','a','modo','simple','esencial', false))));
  raise exception 'NO DEBIÓ'; exception when check_violation then raise notice 'OK sin esenciales rechazado: %', sqlerrm; end $$;

\echo === 3. iniciar es idempotente y se refleja en obtener
select (public.iniciar_rutina(:'r')->>'iniciada_en') as t1 \gset
select pg_sleep(0.05);
select (public.iniciar_rutina(:'r')->>'iniciada_en') = :'t1' as misma_hora;
select (public.obtener_rutinas_hoy() -> 0 ->> 'sesion_iniciada_en') is not null as visible_en_obtener;

\echo === 4. solo A hecho: la sesión NO está completa (falta C esencial)
select public.completar_paso_propio_rutina(:'pa', 1) is not null;
select (public.cerrar_rutina_dia(:'r'))::text;

\echo === 5. A y C esenciales hechos, B opcional sin hacer: SÍ está completa
select public.completar_paso_propio_rutina(:'pc', 5) is not null;
select (public.cerrar_rutina_dia(:'r') ->> 'completa') || ' req=' || (public.cerrar_rutina_dia(:'r') ->> 'requeridos') || ' ok=' || (public.cerrar_rutina_dia(:'r') ->> 'requeridos_completos');
select (public.obtener_rutinas_hoy() -> 0 ->> 'sesion_completada_en') is not null as completada_en_fijada;
select (public.cerrar_rutina_dia(:'r') ->> 'completada_en') = (public.obtener_rutinas_hoy() -> 0 ->> 'sesion_completada_en') as completada_en_estable;

\echo === 6. deshacer C: ya no está completa, pero completada_en no se borra
select public.completar_paso_propio_rutina(:'pc', 0) is not null;
select (public.cerrar_rutina_dia(:'r') ->> 'completa') as completa_tras_deshacer;
select (public.obtener_rutinas_hoy() -> 0 ->> 'sesion_completada_en') is not null as completada_en_se_conserva;

\echo === 7. sin esenciales aplicables hoy: se requieren todos los que aplican
insert into public.habitos_items (usuario_id, titulo, icono_lucide, color, tipo_meta) values (auth.uid(), 'Mañana', 'x', '#000', 'check') returning id as h \gset
reset role;
insert into public.habitos_planes (habito_id, frecuencia, dias_semana, objetivo_valor, desde_fecha)
  values (:'h', 'dias_semana', array[(extract(isodow from current_date + 1))::smallint], 1, current_date - 3);
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select (public.crear_rutina(jsonb_build_object('titulo','Solo opcionales hoy','icono_lucide','sol','color','#000','frecuencia','diaria',
  'pasos', jsonb_build_array(
    jsonb_build_object('tipo_origen','habito','habito_id', :'h'),
    jsonb_build_object('tipo_origen','propio','titulo','Opcional','modo','simple','esencial', false))))->>'id') as r2 \gset
select (public.cerrar_rutina_dia(:'r2') ->> 'completa') || ' req=' || (public.cerrar_rutina_dia(:'r2') ->> 'requeridos') as antes;
select id as po from public.rutinas_pasos where rutina_id = :'r2' and tipo_origen = 'propio' \gset
select public.completar_paso_propio_rutina(:'po', 1) is not null;
select (public.cerrar_rutina_dia(:'r2') ->> 'completa') || ' req=' || (public.cerrar_rutina_dia(:'r2') ->> 'requeridos') as despues;

\echo === 8. obtener expone tarea_tipo y tarea_frecuencia
insert into public.tareas_items (usuario_id, titulo, tipo, frecuencia, dias_semana, objetivo_valor, unidad)
  values (auth.uid(), 'Agua', 'contador', 'dias_semana', array[1,2,3,4,5,6,7]::smallint[], 8, 'vasos') returning id as t \gset
select (public.crear_rutina(jsonb_build_object('titulo','Con tarea','icono_lucide','sol','color','#000','frecuencia','diaria',
  'pasos', jsonb_build_array(jsonb_build_object('tipo_origen','tarea','tarea_id', :'t'))))->>'id') as r3 \gset
select e -> 'pasos' -> 0 ->> 'tarea_tipo' || ' / ' || (e -> 'pasos' -> 0 ->> 'tarea_frecuencia') from jsonb_array_elements(public.obtener_rutinas_hoy()) e where e->>'id' = :'r3';

\echo === 9. aislamiento: B no puede iniciar ni cerrar la rutina de A, ni escribir su registro
select set_config('test.r', :'r', true), set_config('test.r3', :'r3', true);
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
do $$ begin perform public.iniciar_rutina(current_setting('test.r')::uuid); raise exception 'NO DEBIÓ'; exception when no_data_found then raise notice 'OK B no puede iniciar la de A'; end $$;
do $$ begin perform public.cerrar_rutina_dia(current_setting('test.r')::uuid); raise exception 'NO DEBIÓ'; exception when no_data_found then raise notice 'OK B no puede cerrar la de A'; end $$;
do $$ begin insert into public.rutinas_registros (rutina_id, usuario_id, fecha_local) values (current_setting('test.r')::uuid, auth.uid(), current_date); raise exception 'NO DEBIÓ'; exception when insufficient_privilege or others then if sqlerrm like 'NO DEBI%' then raise; end if; raise notice 'OK insert directo de registro en rutina ajena rechazado'; end $$;
select count(*) || ' registros visibles para B' from public.rutinas_registros;

\echo === 10. rutina archivada no se puede iniciar
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
update public.rutinas_items set estado = 'archivada', archivada_en = now() where id = :'r3';
do $$ begin perform public.iniciar_rutina(current_setting('test.r3')::uuid); raise exception 'NO DEBIÓ'; exception when no_data_found then raise notice 'OK archivada no se inicia'; end $$;
rollback;
