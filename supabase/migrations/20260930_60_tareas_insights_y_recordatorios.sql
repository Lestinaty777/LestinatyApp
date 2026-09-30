-- Tareas — Fase 1 (insights + recordatorios): recorte de obtener_panel_habitos
-- a solo 'patrones' y 'riesgo' (las secciones 'conexiones'/'impacto' comparan
-- pares de hábitos distintos entre sí — no aplican igual a una lista de
-- tareas y son las más caras de portar; se agregan después si hace falta).
-- Solo mira tareas con frecuencia = 'dias_semana' — una tarea 'una_vez' no
-- tiene rastro de días para patrones/riesgo.
begin;

create or replace function public.obtener_panel_tareas(p_fecha_referencia date default null)
returns jsonb
language plpgsql
set search_path to ''
as $function$
declare v_usuario uuid := auth.uid();
declare v_fecha date;
declare v_total integer;
declare v_patrones jsonb;
declare v_riesgo jsonb;
declare v_patrones_progreso integer;
declare v_riesgo_progreso integer;
begin
  if v_usuario is null then raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege'; end if;
  select coalesce(p_fecha_referencia, (now() at time zone zona_horaria)::date) into v_fecha
  from public.perfiles_usuario where id = v_usuario;

  select count(*) into v_total from public.tareas_items
  where usuario_id = v_usuario and estado <> 'archivada' and frecuencia = 'dias_semana';
  if v_total = 0 then
    return jsonb_build_object(
      'patrones', jsonb_build_object('estado', 'sin_tareas', 'datos', '[]'::jsonb, 'progreso', jsonb_build_object('actual', 0, 'requerido', 7)),
      'riesgo', jsonb_build_object('estado', 'sin_tareas', 'datos', '[]'::jsonb, 'progreso', jsonb_build_object('actual', 0, 'requerido', 7))
    );
  end if;

  with dias as (
    select d::date as fecha, item.id as tarea_id
    from public.tareas_items item
    cross join generate_series(v_fecha - 27, v_fecha, interval '1 day') as d
    where item.usuario_id = v_usuario and item.estado <> 'archivada' and item.frecuencia = 'dias_semana'
      and public.tareas_es_dia_programado(item, d::date)
  ), actividad as (
    select extract(isodow from dias.fecha)::integer as dia_semana,
      count(*) filter (where registro.id is not null)::integer as completados,
      count(*)::integer as muestras
    from dias
    left join public.tareas_registros registro on registro.tarea_id = dias.tarea_id and registro.fecha_local = dias.fecha
    group by 1
  )
  select
    coalesce(jsonb_agg(jsonb_build_object('dia_semana', dia_semana, 'completados', completados, 'muestras', muestras, 'porcentaje', round(100.0 * completados / nullif(muestras, 0), 1)) order by dia_semana), '[]'::jsonb),
    coalesce(max(least(muestras, 7)), 0)
  into v_patrones, v_patrones_progreso
  from actividad;

  with dias as (
    select d::date as fecha, item.id as tarea_id, item.titulo, item.icono_lucide, item.color
    from public.tareas_items item
    cross join generate_series(v_fecha - 34, v_fecha, interval '1 day') as d
    where item.usuario_id = v_usuario and item.estado <> 'archivada' and item.frecuencia = 'dias_semana'
      and public.tareas_es_dia_programado(item, d::date)
  ), tasas as (
    select dias.tarea_id, max(dias.titulo) as titulo, max(dias.icono_lucide) as icono_lucide, max(dias.color) as color,
      count(*) filter (where dias.fecha between v_fecha - 6 and v_fecha and registro.id is not null)::numeric
        / nullif(count(*) filter (where dias.fecha between v_fecha - 6 and v_fecha), 0) as reciente,
      count(*) filter (where dias.fecha between v_fecha - 34 and v_fecha - 7 and registro.id is not null)::numeric
        / nullif(count(*) filter (where dias.fecha between v_fecha - 34 and v_fecha - 7), 0) as base,
      count(*) filter (where dias.fecha between v_fecha - 6 and v_fecha)::integer as muestras_recientes,
      count(*) filter (where dias.fecha between v_fecha - 34 and v_fecha - 7)::integer as muestras_base
    from dias
    left join public.tareas_registros registro on registro.tarea_id = dias.tarea_id and registro.fecha_local = dias.fecha
    group by dias.tarea_id
  )
  select
    coalesce(jsonb_agg(jsonb_build_object(
      'tarea_id', tarea_id, 'titulo', titulo, 'icono_lucide', icono_lucide, 'color', color,
      'reciente', round(100 * reciente, 1), 'base', round(100 * base, 1),
      'nivel', case when reciente < base - 0.25 then 'alto' when reciente < base - 0.10 then 'medio' else 'bajo' end
    ) order by (base - reciente) desc) filter (where muestras_recientes >= 3 and muestras_base >= 7), '[]'::jsonb),
    coalesce(max(least(muestras_base, 7)), 0)
  into v_riesgo, v_riesgo_progreso
  from tasas;

  return jsonb_build_object(
    'patrones', jsonb_build_object(
      'estado', case when jsonb_array_length(v_patrones) = 0 then 'sin_historial' when exists (select 1 from jsonb_array_elements(v_patrones) patron where (patron->>'muestras')::integer >= 7) then 'listo' else 'en_observacion' end,
      'datos', v_patrones,
      'progreso', jsonb_build_object('actual', v_patrones_progreso, 'requerido', 7)
    ),
    'riesgo', jsonb_build_object(
      'estado', case when jsonb_array_length(v_riesgo) > 0 then 'listo' else 'en_observacion' end,
      'datos', v_riesgo,
      'progreso', jsonb_build_object('actual', v_riesgo_progreso, 'requerido', 7)
    )
  );
end;
$function$;

-- ─── Gema de hito de racha: mismo mecanismo que ya usan los cofres, se
-- agrega 'racha_tarea' a las DOS listas blancas de motivos válidos (la
-- función y el check de la tabla lo validan por separado).
alter table comercio.movimientos_gemas drop constraint movimientos_gemas_motivo_check;
alter table comercio.movimientos_gemas add constraint movimientos_gemas_motivo_check
  check (motivo = any(array['compra_iap', 'gasto_tienda', 'ajuste_soporte', 'recompensa_nivel', 'gasto_semillas', 'referido_nivel2', 'trial_horizon_bono', 'cofre_intermedio', 'cofre_final', 'tarea_diaria', 'racha_tarea']));

create or replace function comercio.acreditar_gemas(p_persona_id uuid, p_cantidad integer, p_motivo text, p_referencia text default null)
returns integer
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_movimiento_id uuid;
  v_saldo integer;
begin
  if p_cantidad <= 0 then
    raise exception 'invalid credit amount' using errcode = '22023';
  end if;
  if p_motivo not in ('compra_iap', 'ajuste_soporte', 'referido_nivel2', 'trial_horizon_bono', 'cofre_intermedio', 'cofre_final', 'tarea_diaria', 'racha_tarea') then
    raise exception 'invalid credit reason' using errcode = '22023';
  end if;

  insert into comercio.movimientos_gemas (persona_id, cantidad, motivo, referencia)
  values (p_persona_id, p_cantidad, p_motivo, p_referencia)
  on conflict (persona_id, motivo, referencia) where cantidad > 0 and referencia is not null do nothing
  returning id into v_movimiento_id;

  if v_movimiento_id is null and p_referencia is not null then
    select saldo into v_saldo from comercio.billeteras_gemas where persona_id = p_persona_id;
    return coalesce(v_saldo, 0);
  end if;

  insert into comercio.billeteras_gemas (persona_id, saldo)
  values (p_persona_id, p_cantidad)
  on conflict (persona_id) do update
    set saldo = comercio.billeteras_gemas.saldo + excluded.saldo, actualizado_en = now()
  returning saldo into v_saldo;

  return v_saldo;
end;
$function$;

-- ─── Cola de recordatorios compartida: notificaciones_programadas pasa a
-- aceptar un origen de tarea además de un plan de hábito — exactamente uno de
-- los dos, nunca ninguno ni los dos.
alter table privacidad.notificaciones_programadas alter column plan_habito_id drop not null;
alter table privacidad.notificaciones_programadas add column tarea_id uuid references public.tareas_items(id) on delete cascade;
alter table privacidad.notificaciones_programadas add constraint notificaciones_programadas_un_solo_origen
  check ((plan_habito_id is not null) <> (tarea_id is not null));
create unique index notificaciones_programadas_tarea_id_fecha_local_key
  on privacidad.notificaciones_programadas (tarea_id, fecha_local) where tarea_id is not null;

-- ─── Siembra + reclamo de recordatorios de tareas — hermana de
-- reclamar_recordatorios_habitos, misma forma de retorno (cambia habito_id/
-- titulo_habito por tarea_id/titulo_tarea) para que el Edge Function los
-- procese con el mismo bucle. Solo siembra tareas 'dias_semana' sin completar
-- hoy; una tarea 'una_vez' no encola nada (no tiene tareas_registros).
create or replace function privacidad.reclamar_recordatorios_tareas(p_limite integer default 100)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare v_resultado jsonb;
begin
  if p_limite < 1 or p_limite > 200 then
    raise exception 'invalid reminder batch limit' using errcode = '22023';
  end if;

  insert into privacidad.notificaciones_programadas (usuario_id, tarea_id, fecha_local, programada_para)
  select item.usuario_id, item.id, (now() at time zone perfil.zona_horaria)::date,
    (((now() at time zone perfil.zona_horaria)::date + item.hora_recordatorio) at time zone perfil.zona_horaria)
  from public.tareas_items item
  join public.perfiles_usuario perfil on perfil.id = item.usuario_id
  left join public.tareas_registros registro
    on registro.tarea_id = item.id
    and registro.fecha_local = (now() at time zone perfil.zona_horaria)::date
  where item.recordatorio_activo
    and item.hora_recordatorio is not null
    and item.estado <> 'archivada'
    and item.frecuencia = 'dias_semana'
    and public.tareas_es_dia_programado(item, (now() at time zone perfil.zona_horaria)::date)
    and registro.id is null
  on conflict (tarea_id, fecha_local) where tarea_id is not null do nothing;

  with candidatas as (
    select id from privacidad.notificaciones_programadas
    where estado = 'pendiente' and programada_para <= now() and tarea_id is not null
    order by programada_para for update skip locked limit p_limite
  ), reclamadas as (
    update privacidad.notificaciones_programadas notificacion
    set estado = 'reclamada', reclamada_at = now(), intentos = intentos + 1, error_codigo = null
    from candidatas where notificacion.id = candidatas.id
    returning notificacion.*
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'notificacion_id', reclamada.id,
    'tarea_id', item.id,
    'titulo_tarea', item.titulo,
    'mostrar_nombre', item.mostrar_nombre_notificacion,
    'preferencia_activa', coalesce(preferencia.habilitada, false),
    'dispositivos', coalesce((
      select jsonb_agg(jsonb_build_object('id', dispositivo.id, 'subscription_id', dispositivo.onesignal_subscription_id))
      from privacidad.dispositivos_notificacion dispositivo
      where dispositivo.usuario_id = reclamada.usuario_id
        and dispositivo.plataforma in ('ios', 'android')
        and dispositivo.permiso_nativo = 'concedido'
        and dispositivo.dado_de_baja_at is null
    ), '[]'::jsonb)
  ) order by reclamada.programada_para), '[]'::jsonb)
  into v_resultado
  from reclamadas reclamada
  join public.tareas_items item on item.id = reclamada.tarea_id
  left join public.preferencias_notificacion_usuario preferencia
    on preferencia.usuario_id = reclamada.usuario_id and preferencia.catalogo_codigo = 'tarea_recordatorio';

  return v_resultado;
end;
$function$;

create or replace function public.reclamar_recordatorios_tareas(p_limite integer default 100)
returns jsonb
language sql
set search_path to ''
as $function$ select privacidad.reclamar_recordatorios_tareas(p_limite); $function$;

-- ─── Reprograma el recordatorio de hoy — para llamar tras un UPDATE directo
-- de tareas_items cuando cambia hora_recordatorio (mismo arreglo que ya tiene
-- actualizar_habito_desde_detalle, ver 20260927_55).
create or replace function privacidad.reprogramar_recordatorio_tarea(p_tarea_id uuid, p_fecha_local date)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if auth.uid() is null then raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege'; end if;
  if not exists (select 1 from public.tareas_items where id = p_tarea_id and usuario_id = auth.uid()) then
    raise exception 'Tarea no encontrada.' using errcode = 'no_data_found';
  end if;
  delete from privacidad.notificaciones_programadas
  where tarea_id = p_tarea_id and fecha_local = p_fecha_local and estado = 'pendiente';
end;
$function$;

create or replace function public.reprogramar_recordatorio_tarea(p_tarea_id uuid, p_fecha_local date)
returns void
language sql
set search_path to ''
as $function$ select privacidad.reprogramar_recordatorio_tarea(p_tarea_id, p_fecha_local); $function$;

insert into public.catalogo_notificaciones (codigo, grupo, prioridad, es_proactiva, descripcion)
values ('tarea_recordatorio', 'programada', 7, false, 'Recordatorio programado para una tarea.')
on conflict (codigo) do update set activo = true, descripcion = excluded.descripcion;

insert into public.preferencias_notificacion_usuario (usuario_id, catalogo_codigo)
select perfil.id, 'tarea_recordatorio' from public.perfiles_usuario perfil
on conflict do nothing;

commit;
