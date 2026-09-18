-- Insights funcional: patrones/riesgo/conexiones ya traían un `estado` (sin_historial
-- / en_observacion / listo) pero cuando no llegaba a 'listo' el cliente no tenía forma
-- de saber CUÁNTO faltaba — riesgo/conexiones filtran candidatos por debajo del umbral
-- antes de devolver `datos`, así que el array queda vacío sin ninguna pista. Se agrega
-- un campo `progreso: {actual, requerido}` por sección, aditivo (no cambia nada
-- existente) — reutiliza las mismas CTEs `tasas`/`pares` que ya calculaban todo esto,
-- solo se consultan una vez más SIN el filtro final para sacar el mejor candidato aunque
-- todavía no alcance el umbral.
--
-- Mismos parámetros que la versión anterior (migración 20260909_07) — no hace falta
-- `drop function` primero, la regla de "drop antes" es solo para cuando cambia la lista
-- de parámetros.

begin;

create or replace function public.obtener_panel_habitos(p_fecha_referencia date default null)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare v_usuario uuid := auth.uid();
declare v_fecha date;
declare v_habitos jsonb;
declare v_patrones jsonb;
declare v_conexiones jsonb;
declare v_riesgo jsonb;
declare v_impacto jsonb;
declare v_total integer;
declare v_patrones_progreso_actual integer;
declare v_riesgo_progreso_actual integer;
declare v_conexiones_progreso_actual integer;
begin
  if v_usuario is null then raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege'; end if;
  select coalesce(p_fecha_referencia, (now() at time zone zona_horaria)::date) into v_fecha
  from public.perfiles_usuario where id = v_usuario;

  select count(*) into v_total from public.habitos_items where usuario_id = v_usuario and estado = 'activo';
  if v_total = 0 then
    return jsonb_build_object(
      'hoy', jsonb_build_object('estado', 'sin_habitos', 'datos', '[]'::jsonb),
      'patrones', jsonb_build_object('estado', 'sin_habitos', 'datos', '[]'::jsonb, 'progreso', jsonb_build_object('actual', 0, 'requerido', 7)),
      'conexiones', jsonb_build_object('estado', 'sin_habitos', 'datos', '[]'::jsonb, 'progreso', jsonb_build_object('actual', 0, 'requerido', 7)),
      'riesgo', jsonb_build_object('estado', 'sin_habitos', 'datos', '[]'::jsonb, 'progreso', jsonb_build_object('actual', 0, 'requerido', 7)),
      'impacto', jsonb_build_object('estado', 'sin_habitos', 'datos', '[]'::jsonb)
    );
  end if;

  with vigentes as (
    select item.*, plan.objetivo_valor, plan.frecuencia, plan.dias_semana, plan.veces_por_semana,
      coalesce(registro.valor, 0) as valor_hoy
    from public.habitos_items item
    join public.habitos_planes plan on plan.habito_id = item.id and plan.desde_fecha <= v_fecha and (plan.hasta_fecha is null or plan.hasta_fecha > v_fecha)
    left join public.habitos_registros registro on registro.habito_id = item.id and registro.fecha_local = v_fecha
    where item.usuario_id = v_usuario and item.estado = 'activo' and public.habitos_es_dia_programado(plan, v_fecha)
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', id, 'titulo', titulo, 'descripcion', descripcion, 'icono_lucide', icono_lucide, 'color', color,
    'tipo_meta', tipo_meta, 'unidad', unidad, 'meta', objetivo_valor, 'valor_hoy', valor_hoy,
    'completado', valor_hoy >= objetivo_valor
  ) order by created_at), '[]'::jsonb) into v_habitos from vigentes;

  with actividad as (
    select extract(isodow from registro.fecha_local)::integer as dia_semana,
      count(*) filter (where registro.valor >= plan.objetivo_valor)::integer as completados,
      count(*)::integer as muestras
    from public.habitos_registros registro
    join public.habitos_planes plan on plan.habito_id = registro.habito_id and plan.desde_fecha <= registro.fecha_local and (plan.hasta_fecha is null or plan.hasta_fecha > registro.fecha_local)
    where registro.usuario_id = v_usuario and registro.fecha_local between v_fecha - 27 and v_fecha
    group by 1
  )
  select coalesce(jsonb_agg(jsonb_build_object('dia_semana', dia_semana, 'completados', completados, 'muestras', muestras, 'porcentaje', round(100.0 * completados / nullif(muestras, 0), 1)) order by dia_semana), '[]'::jsonb)
  into v_patrones from actividad;

  select coalesce(max(least(muestras, 7)), 0) into v_patrones_progreso_actual from actividad;

  with pares as (
    select a.habito_id origen_habito_id, b.habito_id destino_habito_id,
      count(*)::integer comparables,
      count(*) filter (where a.valor >= pa.objetivo_valor and b.valor >= pb.objetivo_valor)::integer juntos
    from public.habitos_registros a
    join public.habitos_registros b on b.usuario_id = a.usuario_id and b.fecha_local = a.fecha_local and b.habito_id > a.habito_id
    join public.habitos_planes pa on pa.habito_id = a.habito_id and pa.desde_fecha <= a.fecha_local and (pa.hasta_fecha is null or pa.hasta_fecha > a.fecha_local)
    join public.habitos_planes pb on pb.habito_id = b.habito_id and pb.desde_fecha <= b.fecha_local and (pb.hasta_fecha is null or pb.hasta_fecha > b.fecha_local)
    where a.usuario_id = v_usuario and a.fecha_local between v_fecha - 27 and v_fecha
    group by 1, 2
  )
  select coalesce(jsonb_agg(jsonb_build_object('origen_habito_id', pares.origen_habito_id, 'destino_habito_id', pares.destino_habito_id, 'comparables', comparables, 'juntos', juntos, 'fuerza', round(100.0 * juntos / nullif(comparables, 0), 1)) order by juntos desc), '[]'::jsonb)
  into v_conexiones from pares where comparables >= 7;

  select coalesce(max(least(comparables, 7)), 0) into v_conexiones_progreso_actual from pares;

  with tasas as (
    select item.id, item.titulo, item.icono_lucide, item.color,
      count(*) filter (where registro.fecha_local between v_fecha - 6 and v_fecha and registro.valor >= plan.objetivo_valor)::numeric / nullif(count(*) filter (where registro.fecha_local between v_fecha - 6 and v_fecha), 0) reciente,
      count(*) filter (where registro.fecha_local between v_fecha - 34 and v_fecha - 7 and registro.valor >= plan.objetivo_valor)::numeric / nullif(count(*) filter (where registro.fecha_local between v_fecha - 34 and v_fecha - 7), 0) base,
      count(*) filter (where registro.fecha_local between v_fecha - 6 and v_fecha)::integer muestras_recientes,
      count(*) filter (where registro.fecha_local between v_fecha - 34 and v_fecha - 7)::integer muestras_base
    from public.habitos_items item
    left join public.habitos_registros registro on registro.habito_id = item.id and registro.fecha_local between v_fecha - 34 and v_fecha
    left join public.habitos_planes plan on plan.habito_id = item.id and plan.desde_fecha <= registro.fecha_local and (plan.hasta_fecha is null or plan.hasta_fecha > registro.fecha_local)
    where item.usuario_id = v_usuario and item.estado = 'activo'
    group by item.id
  )
  select coalesce(jsonb_agg(jsonb_build_object('habito_id', id, 'titulo', titulo, 'icono_lucide', icono_lucide, 'color', color, 'reciente', round(100 * reciente, 1), 'base', round(100 * base, 1), 'nivel', case when reciente < base - 0.25 then 'alto' when reciente < base - 0.10 then 'medio' else 'bajo' end) order by (base - reciente) desc), '[]'::jsonb)
  into v_riesgo from tasas where muestras_recientes >= 3 and muestras_base >= 7;

  -- El requisito que más tarda en cumplirse es muestras_base (7 registros dentro de
  -- una ventana de 27 días, no los 3 recientes que se logran rápido) — es el cuello
  -- de botella real para que la sección aparezca, por eso es el que se expone.
  select coalesce(max(least(muestras_base, 7)), 0) into v_riesgo_progreso_actual from tasas;

  with efecto as (
    select conexion.origen_habito_id, conexion.destino_habito_id,
      count(*) filter (where origen.valor >= plan_origen.objetivo_valor)::integer origen_cumplido,
      count(*) filter (where origen.valor < plan_origen.objetivo_valor)::integer origen_no_cumplido,
      count(*) filter (where origen.valor >= plan_origen.objetivo_valor and destino.valor >= plan_destino.objetivo_valor)::integer destino_con_origen,
      count(*) filter (where origen.valor < plan_origen.objetivo_valor and destino.valor >= plan_destino.objetivo_valor)::integer destino_sin_origen
    from public.habitos_conexiones conexion
    join public.habitos_registros origen on origen.habito_id = conexion.origen_habito_id and origen.fecha_local between v_fecha - 27 and v_fecha
    join public.habitos_registros destino on destino.habito_id = conexion.destino_habito_id and destino.fecha_local = origen.fecha_local
    join public.habitos_planes plan_origen on plan_origen.habito_id = origen.habito_id and plan_origen.desde_fecha <= origen.fecha_local and (plan_origen.hasta_fecha is null or plan_origen.hasta_fecha > origen.fecha_local)
    join public.habitos_planes plan_destino on plan_destino.habito_id = destino.habito_id and plan_destino.desde_fecha <= destino.fecha_local and (plan_destino.hasta_fecha is null or plan_destino.hasta_fecha > destino.fecha_local)
    where conexion.usuario_id = v_usuario and conexion.activa
    group by 1, 2
  )
  select coalesce(jsonb_agg(jsonb_build_object('origen_habito_id', origen_habito_id, 'destino_habito_id', destino_habito_id, 'con_origen', round(100.0 * destino_con_origen / nullif(origen_cumplido, 0), 1), 'sin_origen', round(100.0 * destino_sin_origen / nullif(origen_no_cumplido, 0), 1), 'impacto', round(100.0 * destino_con_origen / nullif(origen_cumplido, 0) - 100.0 * destino_sin_origen / nullif(origen_no_cumplido, 0), 1)) order by (destino_con_origen::numeric / nullif(origen_cumplido, 0) - destino_sin_origen::numeric / nullif(origen_no_cumplido, 0)) desc), '[]'::jsonb)
  into v_impacto from efecto where origen_cumplido >= 7 and origen_no_cumplido >= 7;

  return jsonb_build_object(
    'hoy', jsonb_build_object('estado', 'listo', 'datos', v_habitos),
    'patrones', jsonb_build_object(
      'estado', case when jsonb_array_length(v_patrones) = 0 then 'sin_historial' when exists (select 1 from jsonb_array_elements(v_patrones) patron where (patron->>'muestras')::integer >= 7) then 'listo' else 'en_observacion' end,
      'datos', v_patrones,
      'progreso', jsonb_build_object('actual', v_patrones_progreso_actual, 'requerido', 7)
    ),
    'conexiones', jsonb_build_object(
      'estado', case when jsonb_array_length(v_conexiones) > 0 then 'listo' else 'en_observacion' end,
      'datos', v_conexiones,
      'progreso', jsonb_build_object('actual', v_conexiones_progreso_actual, 'requerido', 7)
    ),
    'riesgo', jsonb_build_object(
      'estado', case when jsonb_array_length(v_riesgo) > 0 then 'listo' else 'en_observacion' end,
      'datos', v_riesgo,
      'progreso', jsonb_build_object('actual', v_riesgo_progreso_actual, 'requerido', 7)
    ),
    'impacto', jsonb_build_object('estado', case when jsonb_array_length(v_impacto) > 0 then 'listo' else 'en_observacion' end, 'datos', v_impacto)
  );
end;
$$;

commit;

notify pgrst, 'reload schema';
