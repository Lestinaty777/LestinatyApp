-- Migración 71: RPCs de Rutinas. Todas security invoker (RLS aplica) y con
-- identidad derivada de auth.uid(); nada recibe usuario_id del cliente.
--
--   obtener_rutinas_hoy      lista las rutinas no archivadas con el estado de
--                            cada paso calculado para la fecha local de hoy.
--   crear_rutina             crea rutina y pasos en una sola transacción.
--   completar_paso_propio_rutina  registra progreso de un paso 'propio'.
--
-- Los pasos de hábito y de tarea NO se completan aquí: usan los RPCs que ya
-- existen (registrar_progreso_habito, completar_tarea_dia, etc.) y esta
-- lectura simplemente refleja su estado. Cerrar la sesión del día
-- (rutinas_registros.completada_en) llega con el ejecutor de rutinas.
begin;

create or replace function public.obtener_rutinas_hoy(p_fecha_referencia date default null)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_usuario uuid := auth.uid();
  v_fecha date;
  v_resultado jsonb;
begin
  if v_usuario is null then raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege'; end if;
  select coalesce(p_fecha_referencia, (now() at time zone zona_horaria)::date) into v_fecha
  from public.perfiles_usuario where id = v_usuario;
  if v_fecha is null then v_fecha := current_date; end if;

  with base as (
    select
      p.rutina_id, p.id as paso_id, p.orden, p.tipo_origen, p.habito_id, p.tarea_id,
      -- Título, ícono y color vienen del origen para que el cliente no tenga
      -- que hacer una consulta extra por paso.
      coalesce(h.titulo, t.titulo, p.titulo) as titulo,
      coalesce(h.icono_lucide, t.icono_lucide) as icono_lucide,
      coalesce(h.color, t.color) as color,
      case p.tipo_origen
        when 'habito' then case h.tipo_meta when 'cantidad' then 'contador' when 'duracion' then 'cronometro' else 'simple' end
        when 'tarea' then case t.tipo when 'contador' then 'contador' when 'cronometro' then 'cronometro' when 'checklist' then 'checklist' else 'simple' end
        else p.modo
      end as modo,
      case p.tipo_origen when 'habito' then hp.objetivo_valor when 'tarea' then t.objetivo_valor else p.objetivo_valor end as objetivo_valor,
      case p.tipo_origen when 'habito' then h.unidad when 'tarea' then t.unidad else p.unidad end as unidad,
      -- ¿Cuenta hoy este paso?
      case p.tipo_origen
        when 'habito' then
          h.estado = 'activo' and hp.id is not null and (
            hp.frecuencia in ('diaria', 'veces_semana')
            or (hp.frecuencia = 'dias_semana' and extract(isodow from v_fecha)::smallint = any(hp.dias_semana))
          )
        when 'tarea' then
          t.estado <> 'archivada' and (t.frecuencia = 'una_vez' or public.tareas_es_dia_programado(t, v_fecha))
        else true
      end as aplica,
      case p.tipo_origen
        when 'habito' then hr.valor
        when 'tarea' then case when t.frecuencia = 'una_vez' then t.valor_actual else tr.valor end
        else pr.valor
      end as valor,
      -- ¿Está completo hoy?
      case p.tipo_origen
        when 'habito' then coalesce(hr.valor >= hp.objetivo_valor, false)
        when 'tarea' then
          case
            when t.frecuencia = 'una_vez' then t.estado = 'hecha'
            when tr.id is null then false
            when t.tipo = 'checklist' then true
            when t.tipo = 'simple' then coalesce(tr.valor, 1) > 0
            else coalesce(tr.valor >= t.objetivo_valor, false)
          end
        else coalesce(
          case when p.modo = 'simple' then pr.valor > 0 else pr.valor >= p.objetivo_valor end,
          false
        )
      end as completo
    from public.rutinas_pasos p
    join public.rutinas_items ri on ri.id = p.rutina_id and ri.usuario_id = v_usuario and ri.estado <> 'archivada'
    left join public.habitos_items h on h.id = p.habito_id
    left join lateral (
      select pl.id, pl.frecuencia, pl.dias_semana, pl.objetivo_valor
      from public.habitos_planes pl
      where pl.habito_id = h.id and pl.desde_fecha <= v_fecha and (pl.hasta_fecha is null or pl.hasta_fecha > v_fecha)
      limit 1
    ) hp on true
    left join public.habitos_registros hr on hr.habito_id = h.id and hr.fecha_local = v_fecha
    left join public.tareas_items t on t.id = p.tarea_id
    left join public.tareas_registros tr on tr.tarea_id = t.id and tr.fecha_local = v_fecha
    left join public.rutinas_pasos_registros pr on pr.paso_id = p.id and pr.fecha_local = v_fecha and pr.usuario_id = v_usuario
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', ri.id,
    'titulo', ri.titulo,
    'descripcion', ri.descripcion,
    'franja', ri.franja,
    'icono_lucide', ri.icono_lucide,
    'color', ri.color,
    'estado', ri.estado,
    'frecuencia', ri.frecuencia,
    'dias_semana', ri.dias_semana,
    'hora_inicio', to_char(ri.hora_inicio, 'HH24:MI'),
    'recordatorio_activo', ri.recordatorio_activo,
    'mostrar_nombre_notificacion', ri.mostrar_nombre_notificacion,
    'toca_hoy', ri.frecuencia = 'diaria' or extract(isodow from v_fecha)::smallint = any(ri.dias_semana),
    'pasos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', b.paso_id, 'orden', b.orden, 'origen', b.tipo_origen,
        'habito_id', b.habito_id, 'tarea_id', b.tarea_id,
        'titulo', b.titulo, 'icono_lucide', b.icono_lucide, 'color', b.color,
        'modo', b.modo, 'objetivo_valor', b.objetivo_valor, 'unidad', b.unidad,
        'aplica', b.aplica, 'completo', b.completo, 'valor', b.valor
      ) order by b.orden)
      from base b where b.rutina_id = ri.id
    ), '[]'::jsonb)
  ) order by ri.created_at), '[]'::jsonb)
  into v_resultado
  from public.rutinas_items ri
  where ri.usuario_id = v_usuario and ri.estado <> 'archivada';

  return v_resultado;
end;
$$;

create or replace function public.crear_rutina(p_datos jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_rutina public.rutinas_items;
  v_pasos jsonb := coalesce(p_datos -> 'pasos', '[]'::jsonb);
  v_dias smallint[];
begin
  if auth.uid() is null then raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege'; end if;
  if jsonb_typeof(v_pasos) <> 'array' or jsonb_array_length(v_pasos) not between 1 and 20 then
    raise exception 'Una rutina necesita entre 1 y 20 pasos.' using errcode = 'check_violation';
  end if;

  if p_datos -> 'dias_semana' is not null and jsonb_typeof(p_datos -> 'dias_semana') = 'array' then
    select array_agg(dia::smallint order by dia::smallint) into v_dias from jsonb_array_elements_text(p_datos -> 'dias_semana') dia;
  end if;

  insert into public.rutinas_items (
    usuario_id, titulo, descripcion, franja, icono_lucide, color, frecuencia, dias_semana,
    hora_inicio, recordatorio_activo, mostrar_nombre_notificacion
  ) values (
    auth.uid(),
    p_datos ->> 'titulo',
    nullif(trim(coalesce(p_datos ->> 'descripcion', '')), ''),
    coalesce(p_datos ->> 'franja', 'cualquier_momento'),
    p_datos ->> 'icono_lucide',
    p_datos ->> 'color',
    coalesce(p_datos ->> 'frecuencia', 'dias_semana'),
    v_dias,
    nullif(p_datos ->> 'hora_inicio', '')::time,
    coalesce((p_datos ->> 'recordatorio_activo')::boolean, false),
    coalesce((p_datos ->> 'mostrar_nombre_notificacion')::boolean, true)
  ) returning * into v_rutina;

  -- orden = posición en el arreglo (1..n). La restricción unique(rutina_id,
  -- orden) es deferrable, así que no importa el orden de inserción interno.
  insert into public.rutinas_pasos (rutina_id, orden, tipo_origen, habito_id, tarea_id, titulo, modo, objetivo_valor, unidad)
  select
    v_rutina.id,
    paso.posicion::smallint,
    paso.valor ->> 'tipo_origen',
    nullif(paso.valor ->> 'habito_id', '')::uuid,
    nullif(paso.valor ->> 'tarea_id', '')::uuid,
    nullif(trim(coalesce(paso.valor ->> 'titulo', '')), ''),
    nullif(paso.valor ->> 'modo', ''),
    nullif(paso.valor ->> 'objetivo_valor', '')::numeric,
    nullif(trim(coalesce(paso.valor ->> 'unidad', '')), '')
  from jsonb_array_elements(v_pasos) with ordinality as paso(valor, posicion);

  return jsonb_build_object('id', v_rutina.id);
end;
$$;

create or replace function public.completar_paso_propio_rutina(
  p_paso_id uuid,
  p_valor numeric default 1,
  p_fecha_local date default null
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_usuario uuid := auth.uid();
  v_paso public.rutinas_pasos;
  v_fecha date;
  v_registro public.rutinas_pasos_registros;
  v_completo boolean;
begin
  if v_usuario is null then raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege'; end if;
  if p_valor is null or p_valor < 0 then raise exception 'El valor no puede ser negativo.' using errcode = 'check_violation'; end if;

  select p.* into v_paso
  from public.rutinas_pasos p
  join public.rutinas_items r on r.id = p.rutina_id
  where p.id = p_paso_id and r.usuario_id = v_usuario and p.tipo_origen = 'propio';
  if not found then raise exception 'Paso no encontrado.' using errcode = 'no_data_found'; end if;

  select coalesce(p_fecha_local, (now() at time zone zona_horaria)::date) into v_fecha
  from public.perfiles_usuario where id = v_usuario;
  if v_fecha is null then v_fecha := coalesce(p_fecha_local, current_date); end if;

  -- Reemplaza el valor del día (como registrar_progreso_*): permite también
  -- deshacer con 0.
  insert into public.rutinas_pasos_registros (paso_id, usuario_id, fecha_local, valor)
  values (p_paso_id, v_usuario, v_fecha, p_valor)
  on conflict (paso_id, fecha_local) do update
    set valor = excluded.valor, completado_en = now()
  returning * into v_registro;

  v_completo := case when v_paso.modo = 'simple' then v_registro.valor > 0 else v_registro.valor >= v_paso.objetivo_valor end;
  return jsonb_build_object('paso_id', p_paso_id, 'valor', v_registro.valor, 'completo', v_completo);
end;
$$;

revoke all on function public.obtener_rutinas_hoy(date) from public, anon;
revoke all on function public.crear_rutina(jsonb) from public, anon;
revoke all on function public.completar_paso_propio_rutina(uuid, numeric, date) from public, anon;
grant execute on function public.obtener_rutinas_hoy(date) to authenticated;
grant execute on function public.crear_rutina(jsonb) to authenticated;
grant execute on function public.completar_paso_propio_rutina(uuid, numeric, date) to authenticated;

commit;
