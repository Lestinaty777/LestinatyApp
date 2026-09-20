begin;

create or replace function privacidad.actualizar_habito_desde_detalle(
  p_habito_id uuid, p_titulo text, p_descripcion text, p_icono_lucide text,
  p_tipo_meta text, p_unidad text, p_frecuencia text, p_dias_semana smallint[],
  p_veces_por_semana smallint, p_objetivo_valor numeric,
  p_recordatorio_activo boolean, p_hora_recordatorio time without time zone,
  p_mostrar_nombre_notificacion boolean, p_desde_fecha date
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_plan public.habitos_planes;
begin
  if auth.uid() is null then raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege'; end if;
  if p_recordatorio_activo and p_hora_recordatorio is null then raise exception 'El recordatorio necesita una hora.' using errcode = 'check_violation'; end if;
  select * into v_plan from public.habitos_planes
  where habito_id = p_habito_id and desde_fecha <= p_desde_fecha and (hasta_fecha is null or hasta_fecha > p_desde_fecha)
  order by desde_fecha desc limit 1 for update;
  if v_plan.id is null then raise exception 'Plan activo no encontrado.' using errcode = 'no_data_found'; end if;
  update public.habitos_items set titulo = trim(p_titulo), descripcion = nullif(trim(p_descripcion), ''),
    icono_lucide = p_icono_lucide, tipo_meta = p_tipo_meta,
    unidad = case when p_tipo_meta = 'check' then null else nullif(trim(p_unidad), '') end,
    updated_at = now()
  where id = p_habito_id and usuario_id = auth.uid();
  if not found then raise exception 'Hábito no encontrado.' using errcode = 'no_data_found'; end if;
  update public.habitos_planes set hasta_fecha = p_desde_fecha where id = v_plan.id;
  insert into public.habitos_planes (habito_id, frecuencia, dias_semana, veces_por_semana, objetivo_valor, desde_fecha, recordatorio_activo, hora_recordatorio, mostrar_nombre_notificacion, nivel)
  values (p_habito_id, p_frecuencia, p_dias_semana, p_veces_por_semana, p_objetivo_valor, p_desde_fecha, p_recordatorio_activo, p_hora_recordatorio, p_mostrar_nombre_notificacion, v_plan.nivel)
  returning * into v_plan;
  return jsonb_build_object('id', p_habito_id, 'plan_id', v_plan.id);
end;
$$;

create or replace function public.actualizar_habito_desde_detalle(
  p_habito_id uuid, p_titulo text, p_descripcion text, p_icono_lucide text,
  p_tipo_meta text, p_unidad text, p_frecuencia text, p_dias_semana smallint[],
  p_veces_por_semana smallint, p_objetivo_valor numeric,
  p_recordatorio_activo boolean, p_hora_recordatorio time without time zone,
  p_mostrar_nombre_notificacion boolean, p_desde_fecha date
) returns jsonb language sql security invoker set search_path = '' as $$
  select privacidad.actualizar_habito_desde_detalle(p_habito_id,p_titulo,p_descripcion,p_icono_lucide,p_tipo_meta,p_unidad,p_frecuencia,p_dias_semana,p_veces_por_semana,p_objetivo_valor,p_recordatorio_activo,p_hora_recordatorio,p_mostrar_nombre_notificacion,p_desde_fecha);
$$;

create or replace function privacidad.archivar_habito(p_habito_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege'; end if;
  update public.habitos_items set estado = 'archivado', archivado_at = now(), updated_at = now()
  where id = p_habito_id and usuario_id = auth.uid() and estado <> 'archivado';
  if not found then raise exception 'Hábito activo no encontrado.' using errcode = 'no_data_found'; end if;
  return jsonb_build_object('id', p_habito_id, 'estado', 'archivado');
end;
$$;

create or replace function public.archivar_habito(p_habito_id uuid)
returns jsonb language sql security invoker set search_path = '' as $$ select privacidad.archivar_habito(p_habito_id); $$;

grant execute on function public.actualizar_habito_desde_detalle(uuid,text,text,text,text,text,text,smallint[],smallint,numeric,boolean,time without time zone,boolean,date) to authenticated;
grant execute on function public.archivar_habito(uuid) to authenticated;
commit;
notify pgrst, 'reload schema';
