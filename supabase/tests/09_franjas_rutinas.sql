-- Smoke test manual de las migraciones 77-79: franjas del día y Rutinas.
-- Se ejecuta con psql (usa \gset y \echo), NO en el editor SQL del panel:
--   psql "$DATABASE_URL" -f supabase/tests/09_franjas_rutinas.sql
-- Requisitos:
--   1. Migraciones 01-79 aplicadas.
--   2. Rol con permiso para insertar en auth.users y hacer `set local role`
--      (postgres o service_role). Crea sus propios usuarios de prueba y hace
--      rollback de todo al final de cada bloque; no deja datos.
-- Verificado el 2026-10-04 contra un Postgres 16 local con stubs mínimos de
-- Supabase (roles anon/authenticated/service_role, auth.users, auth.uid()),
-- NO contra el proyecto real: córrelo ahí antes de dar las migraciones por
-- buenas.
--
-- Bloque 1: rutinas (RLS, ownership, límites, estados de pasos de hábito/tarea/propio).
\set ON_ERROR_STOP 1
\pset format unaligned
\pset tuples_only on
begin;
insert into auth.users (id, email) values ('11111111-1111-1111-1111-111111111111', 'a@x.com'), ('22222222-2222-2222-2222-222222222222', 'b@x.com');

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

-- hábito diario (plan vigente) y tarea recurrente diaria, ambos de A
insert into public.habitos_items (usuario_id, titulo, icono_lucide, color, tipo_meta) values (auth.uid(), 'Meditar', 'meditar', '#029060', 'check') returning id as habito_id \gset
reset role;
insert into public.habitos_planes (habito_id, frecuencia, objetivo_valor, desde_fecha) values (:'habito_id', 'diaria', 1, current_date - 3);
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
insert into public.tareas_items (usuario_id, titulo, tipo, frecuencia, dias_semana, franja)
  values (auth.uid(), 'Leer', 'simple', 'dias_semana', array[1,2,3,4,5,6,7]::smallint[], 'manana') returning id as tarea_id \gset

select (public.crear_rutina(jsonb_build_object(
  'titulo', 'Mañana', 'franja', 'manana', 'icono_lucide', 'sol', 'color', '#90010D', 'frecuencia', 'diaria',
  'hora_inicio', '07:30', 'recordatorio_activo', true,
  'pasos', jsonb_build_array(
    jsonb_build_object('tipo_origen','habito','habito_id', :'habito_id'),
    jsonb_build_object('tipo_origen','tarea','tarea_id', :'tarea_id'),
    jsonb_build_object('tipo_origen','propio','titulo','Estirar','modo','contador','objetivo_valor',10,'unidad','rep')
  ))) ->> 'id') as rutina_id \gset

\echo === 1. obtener_rutinas_hoy inicial: 3 pasos, aplica=true, completo=false
select jsonb_path_query_array(public.obtener_rutinas_hoy(), '$[0].pasos[*] ? (@.aplica == true && @.completo == false).orden')::text;
select (public.obtener_rutinas_hoy() -> 0 ->> 'toca_hoy') || ' / ' || (public.obtener_rutinas_hoy() -> 0 ->> 'hora_inicio') || ' / ' || (public.obtener_rutinas_hoy() -> 0 ->> 'franja');

select id as paso_propio from public.rutinas_pasos where rutina_id = :'rutina_id' and tipo_origen = 'propio' \gset
\echo === 2. paso propio 5/10 -> completo=false; luego 10/10 -> true
select public.completar_paso_propio_rutina(:'paso_propio', 5)::text;
select public.completar_paso_propio_rutina(:'paso_propio', 10)::text;

\echo === 3. completar hábito y tarea por sus RPC reales; todos completos
select public.registrar_progreso_habito(:'habito_id', current_date, 1, null) is not null;
select public.registrar_progreso_tarea(:'tarea_id', current_date, 1, null) is not null;
select jsonb_path_query_array(public.obtener_rutinas_hoy(), '$[0].pasos[*].completo')::text;

\echo === 4. deshacer paso propio (valor 0) -> completo=false
select public.completar_paso_propio_rutina(:'paso_propio', 0)::text;
select jsonb_path_query_array(public.obtener_rutinas_hoy(), '$[0].pasos[*].completo')::text;

\echo === 5. hábito pausado -> aplica=false
reset role;
update public.habitos_items set estado = 'pausado' where id = :'habito_id';
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select jsonb_path_query_array(public.obtener_rutinas_hoy(), '$[0].pasos[*].aplica')::text;

select set_config('test.habito_a', :'habito_id', true), set_config('test.tarea_a', :'tarea_id', true), set_config('test.rutina_a', :'rutina_id', true);
\echo === 6. usuario B no ve la rutina de A (RLS) y no puede referenciar su hábito
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
select jsonb_array_length(public.obtener_rutinas_hoy())::text;
select count(*)::text from public.rutinas_items;
select count(*)::text from public.rutinas_pasos;
do $$ begin
  perform public.crear_rutina(jsonb_build_object('titulo','Robo','icono_lucide','sol','color','#000','frecuencia','diaria',
    'pasos', jsonb_build_array(jsonb_build_object('tipo_origen','habito','habito_id', current_setting('test.habito_a')))));
  raise exception 'NO DEBIÓ PERMITIRLO';
exception when insufficient_privilege then raise notice 'OK referencia a hábito ajeno rechazada por el trigger'; end $$;
do $$ begin
  perform public.crear_rutina(jsonb_build_object('titulo','Robo2','icono_lucide','sol','color','#000','frecuencia','diaria',
    'pasos', jsonb_build_array(jsonb_build_object('tipo_origen','tarea','tarea_id', current_setting('test.tarea_a')))));
  raise exception 'NO DEBIÓ PERMITIRLO';
exception when insufficient_privilege then raise notice 'OK referencia a tarea ajena rechazada por el trigger'; end $$;
-- insert directo (sin RPC) al paso de la rutina de A: la policy de rutinas_pasos lo bloquea
do $$ begin
  insert into public.rutinas_pasos (rutina_id, orden, tipo_origen, titulo, modo) values (current_setting('test.rutina_a')::uuid, 9, 'propio', 'x', 'simple');
  raise exception 'NO DEBIÓ PERMITIRLO';
exception when insufficient_privilege or others then
  if sqlerrm like 'NO DEBI%' then raise; end if; raise notice 'OK insert directo en rutina ajena rechazado: %', sqlerrm; end $$;
do $$ begin
  perform public.completar_paso_propio_rutina((select id from public.rutinas_pasos limit 1), 1);
  raise exception 'NO DEBIÓ PERMITIRLO';
exception when others then raise notice 'OK rechazado (paso ajeno invisible): %', sqlerrm; end $$;

\echo === 7. validaciones: 0 pasos, 21 pasos, paso propio sin título, simple con objetivo
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
do $$ begin
  perform public.crear_rutina(jsonb_build_object('titulo','Vacía','icono_lucide','sol','color','#000','frecuencia','diaria','pasos','[]'::jsonb));
  raise exception 'NO DEBIÓ PERMITIRLO';
exception when check_violation then raise notice 'OK 0 pasos rechazado'; end $$;
do $$ declare v jsonb := '[]'::jsonb; begin
  for i in 1..21 loop v := v || jsonb_build_array(jsonb_build_object('tipo_origen','propio','titulo','p'||i,'modo','simple')); end loop;
  perform public.crear_rutina(jsonb_build_object('titulo','Larga','icono_lucide','sol','color','#000','frecuencia','diaria','pasos', v));
  raise exception 'NO DEBIÓ PERMITIRLO';
exception when check_violation then raise notice 'OK 21 pasos rechazado'; end $$;
do $$ begin
  perform public.crear_rutina(jsonb_build_object('titulo','X','icono_lucide','sol','color','#000','frecuencia','diaria',
    'pasos', jsonb_build_array(jsonb_build_object('tipo_origen','propio','titulo',' ','modo','simple'))));
  raise exception 'NO DEBIÓ PERMITIRLO';
exception when check_violation then raise notice 'OK título vacío rechazado'; end $$;
do $$ begin
  perform public.crear_rutina(jsonb_build_object('titulo','X','icono_lucide','sol','color','#000','frecuencia','dias_semana',
    'pasos', jsonb_build_array(jsonb_build_object('tipo_origen','propio','titulo','a','modo','simple'))));
  raise exception 'NO DEBIÓ PERMITIRLO';
exception when check_violation then raise notice 'OK dias_semana sin días rechazado'; end $$;
do $$ begin
  perform public.crear_rutina(jsonb_build_object('titulo','X','icono_lucide','sol','color','#000','frecuencia','diaria','franja','madrugada',
    'pasos', jsonb_build_array(jsonb_build_object('tipo_origen','propio','titulo','a','modo','simple'))));
  raise exception 'NO DEBIÓ PERMITIRLO';
exception when check_violation then raise notice 'OK franja inválida rechazada'; end $$;

\echo === 8. sin sesión
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '', true);
do $$ begin perform public.obtener_rutinas_hoy(); raise exception 'NO DEBIÓ PERMITIRLO';
exception when insufficient_privilege then raise notice 'OK sin sesión rechazado'; end $$;
set local role anon;
do $$ begin perform public.obtener_rutinas_hoy(); raise exception 'NO DEBIÓ PERMITIRLO';
exception when insufficient_privilege then raise notice 'OK anon sin permiso de ejecución'; end $$;
rollback;

-- Bloque 2: franjas del día y estado de pasos por origen.
\set ON_ERROR_STOP 1
\pset format unaligned
\pset tuples_only on
begin;
insert into auth.users (id, email) values ('11111111-1111-1111-1111-111111111111', 'a@x.com');
\echo === A. franja_de_hora por defecto, horas 0..23
select string_agg(left(public.franja_de_hora(h::smallint, 5::smallint, 12::smallint, 19::smallint)::text, 1), '') from generate_series(0, 23) h;
\echo === B. defaults del perfil y existentes en cualquier_momento
select franja_manana_desde || '/' || franja_tarde_desde || '/' || franja_noche_desde from public.perfiles_usuario;
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
\echo === C. usuario edita sus límites (válidos) y se rechazan los inválidos
update public.perfiles_usuario set franja_manana_desde = 6, franja_tarde_desde = 13, franja_noche_desde = 20 where id = auth.uid();
select franja_manana_desde || '/' || franja_tarde_desde || '/' || franja_noche_desde from public.perfiles_usuario where id = auth.uid();
do $$ begin update public.perfiles_usuario set franja_manana_desde = 15 where id = auth.uid(); raise exception 'NO DEBIÓ'; exception when check_violation then raise notice 'OK orden inválido rechazado'; end $$;
do $$ begin update public.perfiles_usuario set franja_noche_desde = 24 where id = auth.uid(); raise exception 'NO DEBIÓ'; exception when check_violation then raise notice 'OK fuera de rango rechazado'; end $$;
\echo === D. franja en tareas y habitos_planes: default y dominio
insert into public.tareas_items (usuario_id, titulo) values (auth.uid(), 'T1') returning franja;
do $$ begin insert into public.tareas_items (usuario_id, titulo, franja) values (auth.uid(), 'T2', 'madrugada'); raise exception 'NO DEBIÓ'; exception when check_violation then raise notice 'OK dominio rechaza valor inválido'; end $$;
insert into public.tareas_items (usuario_id, titulo, franja) values (auth.uid(), 'T3', 'noche') returning franja;

\echo === E. estados por origen: tarea una_vez, hábito dias_semana no programado, contador de tarea
insert into public.habitos_items (usuario_id, titulo, icono_lucide, color, tipo_meta) values (auth.uid(), 'Solo ayer', 'x', '#000', 'check') returning id as h_ayer \gset
insert into public.tareas_items (usuario_id, titulo, tipo, frecuencia, fecha_vencimiento, estado) values (auth.uid(), 'Una vez hecha', 'simple', 'una_vez', current_date, 'hecha') returning id as t_hecha \gset
insert into public.tareas_items (usuario_id, titulo, tipo, frecuencia, fecha_vencimiento) values (auth.uid(), 'Una vez pendiente', 'simple', 'una_vez', current_date) returning id as t_pend \gset
insert into public.tareas_items (usuario_id, titulo, tipo, frecuencia, dias_semana, objetivo_valor, unidad)
  values (auth.uid(), 'Agua', 'contador', 'dias_semana', array[1,2,3,4,5,6,7]::smallint[], 8, 'vasos') returning id as t_cont \gset
reset role;
-- plan solo en el día de la semana de MAÑANA: hoy no toca
insert into public.habitos_planes (habito_id, frecuencia, dias_semana, objetivo_valor, desde_fecha)
  values (:'h_ayer', 'dias_semana', array[(extract(isodow from current_date + 1))::smallint], 1, current_date - 3);
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select (public.crear_rutina(jsonb_build_object('titulo','Mix','icono_lucide','sol','color','#000','frecuencia','dias_semana',
  'dias_semana', jsonb_build_array(1,2,3,4,5,6,7),
  'pasos', jsonb_build_array(
    jsonb_build_object('tipo_origen','habito','habito_id', :'h_ayer'),
    jsonb_build_object('tipo_origen','tarea','tarea_id', :'t_hecha'),
    jsonb_build_object('tipo_origen','tarea','tarea_id', :'t_pend'),
    jsonb_build_object('tipo_origen','tarea','tarea_id', :'t_cont'),
    jsonb_build_object('tipo_origen','propio','titulo','Tiempo','modo','cronometro','objetivo_valor',5))))->>'id') as r \gset
\echo aplica / completo de [hábito no programado hoy, una_vez hecha, una_vez pendiente, contador 0/8, propio]
select jsonb_path_query_array(public.obtener_rutinas_hoy(), '$[0].pasos[*].aplica')::text;
select jsonb_path_query_array(public.obtener_rutinas_hoy(), '$[0].pasos[*].completo')::text;
select public.registrar_progreso_tarea(:'t_cont', current_date, 5, null) is not null;
\echo contador 5/8 -> completo=false; luego 8/8 -> true
select jsonb_path_query_array(public.obtener_rutinas_hoy(), '$[0].pasos[2,3].completo')::text;
select public.registrar_progreso_tarea(:'t_cont', current_date, 8, null) is not null;
select jsonb_path_query_array(public.obtener_rutinas_hoy(), '$[0].pasos[3].completo')::text;
\echo valor reportado del contador:
select jsonb_path_query_array(public.obtener_rutinas_hoy(), '$[0].pasos[3].valor')::text;

\echo === F. archivar: la rutina desaparece de obtener_rutinas_hoy
update public.rutinas_items set estado = 'archivada', archivada_en = now() where id = :'r';
select jsonb_array_length(public.obtener_rutinas_hoy())::text;
\echo === G. recordatorio activo sin hora se rechaza
do $$ begin update public.rutinas_items set recordatorio_activo = true, hora_inicio = null; raise exception 'NO DEBIÓ'; exception when check_violation then raise notice 'OK recordatorio sin hora rechazado'; end $$;
rollback;
