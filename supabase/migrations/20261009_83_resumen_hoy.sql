-- Migración 83: datos de la cabecera de Hoy — racha global, días activos de la
-- semana y XP. Plan: docs/superpowers/plans/2026-10-09-plan-maestro.md (tarea 3.6).
--
-- Nada de esto se guarda: se calcula desde los registros que ya existen (una
-- sola fuente de verdad). El XP no da gemas ni desbloquea nada; el nivel lo
-- deriva el cliente (src/modulos/hoy/nivelUsuario.ts).
--
-- Día activo = fecha local con al menos una acción: registro de hábito con
-- valor > 0, registro de tarea, tarea 'una_vez' hecha, paso propio de rutina
-- registrado o sesión de rutina completa.
-- Racha = días activos consecutivos que terminan hoy; si hoy aún no hay
-- acción, que terminan ayer (hoy no rompe la racha hasta que acabe el día).
-- XP = 10 por registro de hábito con avance, 10 por registro de tarea, 10 por
-- tarea 'una_vez' hecha, 15 por sesión de rutina completa.
begin;

create or replace function public.dias_activos_usuario(p_desde date, p_hasta date, p_zona text)
returns setof date
language sql
stable
security invoker
set search_path = ''
as $$
  select fecha_local from public.habitos_registros
    where usuario_id = auth.uid() and valor > 0 and fecha_local between p_desde and p_hasta
  union
  select fecha_local from public.tareas_registros
    where usuario_id = auth.uid() and fecha_local between p_desde and p_hasta
  union
  select (completada_en at time zone p_zona)::date from public.tareas_items
    where usuario_id = auth.uid() and frecuencia = 'una_vez' and estado = 'hecha' and completada_en is not null
      and (completada_en at time zone p_zona)::date between p_desde and p_hasta
  union
  select fecha_local from public.rutinas_pasos_registros
    where usuario_id = auth.uid() and fecha_local between p_desde and p_hasta
  union
  select fecha_local from public.rutinas_registros
    where usuario_id = auth.uid() and completada_en is not null and fecha_local between p_desde and p_hasta;
$$;

create or replace function public.obtener_resumen_hoy(p_fecha_referencia date default null)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_usuario uuid := auth.uid();
  v_zona text;
  v_fecha date;
  v_lunes date;
  v_racha integer;
  v_semana jsonb;
  v_xp bigint;
begin
  if v_usuario is null then raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege'; end if;

  select zona_horaria into v_zona from public.perfiles_usuario where id = v_usuario;
  v_zona := coalesce(v_zona, 'UTC');
  v_fecha := coalesce(p_fecha_referencia, (now() at time zone v_zona)::date);
  v_lunes := v_fecha - (extract(isodow from v_fecha)::int - 1);

  -- Islas de días consecutivos: fecha - número de fila es constante dentro de
  -- una misma racha. Se cuenta la isla que contiene el ancla (hoy o ayer).
  with dias as (
    select d from public.dias_activos_usuario(v_fecha - 400, v_fecha, v_zona) as d
  ), islas as (
    select d, d - (row_number() over (order by d))::int as grupo from dias
  ), ancla as (
    select case when exists (select 1 from dias where d = v_fecha) then v_fecha else v_fecha - 1 end as f
  )
  select count(*) into v_racha
  from islas
  where grupo = (select i.grupo from islas i, ancla a where i.d = a.f);

  select coalesce(jsonb_agg(extract(isodow from d)::int order by d), '[]'::jsonb) into v_semana
  from public.dias_activos_usuario(v_lunes, v_fecha, v_zona) as d;

  select
      10 * (select count(*) from public.habitos_registros where usuario_id = v_usuario and valor > 0)
    + 10 * (select count(*) from public.tareas_registros where usuario_id = v_usuario)
    + 10 * (select count(*) from public.tareas_items where usuario_id = v_usuario and frecuencia = 'una_vez' and estado = 'hecha')
    + 15 * (select count(*) from public.rutinas_registros where usuario_id = v_usuario and completada_en is not null)
  into v_xp;

  return jsonb_build_object(
    'fecha', v_fecha,
    'racha', coalesce(v_racha, 0),
    'dias_activos_semana', v_semana, -- isodow: 1 = lunes … 7 = domingo
    'xp_total', coalesce(v_xp, 0)
  );
end;
$$;

revoke all on function public.dias_activos_usuario(date, date, text) from public, anon;
revoke all on function public.obtener_resumen_hoy(date) from public, anon;
grant execute on function public.dias_activos_usuario(date, date, text) to authenticated;
grant execute on function public.obtener_resumen_hoy(date) to authenticated;

commit;
