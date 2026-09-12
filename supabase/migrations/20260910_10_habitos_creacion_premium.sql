-- Amplía la creación de Hábitos sin añadir tablas.
begin;

create or replace function public.crear_habito_premium(
  p_titulo text, p_descripcion text, p_icono_lucide text, p_color text,
  p_tipo_meta text, p_unidad text, p_categoria text, p_dificultad text,
  p_disparador text, p_recompensa text, p_frecuencia text,
  p_dias_semana smallint[] default null, p_veces_por_semana smallint default null,
  p_objetivo_valor numeric default 1, p_recordatorio_activo boolean default false,
  p_hora_recordatorio time default null, p_mostrar_nombre_notificacion boolean default false,
  p_desde_fecha date default current_date
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_item public.habitos_items; declare v_plan public.habitos_planes;
begin
  if auth.uid() is null then raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege'; end if;
  if p_recordatorio_activo and p_hora_recordatorio is null then raise exception 'El recordatorio necesita una hora.' using errcode = 'check_violation'; end if;
  insert into public.habitos_items (usuario_id,titulo,descripcion,icono_lucide,color,tipo_meta,unidad,categoria,dificultad,disparador,recompensa)
  values (auth.uid(),p_titulo,nullif(trim(p_descripcion),''),p_icono_lucide,p_color,p_tipo_meta,nullif(trim(p_unidad),''),nullif(trim(p_categoria),''),coalesce(p_dificultad,'estandar'),nullif(trim(p_disparador),''),nullif(trim(p_recompensa),''))
  returning * into v_item;
  insert into public.habitos_planes (habito_id,frecuencia,dias_semana,veces_por_semana,objetivo_valor,desde_fecha,recordatorio_activo,hora_recordatorio,mostrar_nombre_notificacion)
  values (v_item.id,p_frecuencia,p_dias_semana,p_veces_por_semana,p_objetivo_valor,p_desde_fecha,p_recordatorio_activo,p_hora_recordatorio,p_mostrar_nombre_notificacion)
  returning * into v_plan;
  return jsonb_build_object('id',v_item.id,'plan_id',v_plan.id);
end; $$;

grant execute on function public.crear_habito_premium(text,text,text,text,text,text,text,text,text,text,text,smallint[],smallint,numeric,boolean,time,boolean,date) to authenticated;
commit;
