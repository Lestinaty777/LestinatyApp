-- Esmeralda pasa a ser EL paquete gratuito por defecto para hábitos nuevos —
-- reemplaza a los 7 tonos verde-N como default (que seguían el sistema viejo
-- sin progresión real de 7 etapas). Los verde-N no se borran ni se
-- desactivan: los hábitos ya existentes que los usan siguen funcionando
-- igual, solo cambia qué se asigna a los hábitos NUEVOS de acá en adelante.

begin;

update public.arboles_paquetes
set es_gratuito = true, rareza = null, precio_gemas = null, cantidad_por_compra = null
where id = 'esmeralda';

-- Mismo cuerpo que la versión anterior (migración 25) — solo cambia el
-- default de p_paquete_id. No hace falta "drop" primero: la lista de
-- parámetros no cambia, solo un valor default, así que create or replace
-- alcanza (la regla de "drop primero" es para cuando cambian los parámetros).
create or replace function privacidad.crear_habito_premium(
  p_titulo text, p_descripcion text, p_icono_lucide text, p_color text, p_tipo_meta text, p_unidad text,
  p_categoria text, p_dificultad text, p_disparador text, p_recompensa text,
  p_frecuencia text, p_dias_semana smallint[] default null, p_veces_por_semana smallint default null,
  p_objetivo_valor numeric default 1, p_recordatorio_activo boolean default false,
  p_hora_recordatorio time without time zone default null, p_mostrar_nombre_notificacion boolean default false,
  p_desde_fecha date default current_date, p_nivel_inicial integer default 1, p_paquete_id text default 'esmeralda'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_item public.habitos_items; declare v_plan public.habitos_planes; declare v_nivel_inicial integer;
begin
  if auth.uid() is null then raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege'; end if;
  if p_recordatorio_activo and p_hora_recordatorio is null then raise exception 'El recordatorio necesita una hora.' using errcode = 'check_violation'; end if;
  v_nivel_inicial := greatest(1, least(7, coalesce(p_nivel_inicial, 1)));

  insert into public.habitos_items (usuario_id,titulo,descripcion,icono_lucide,color,tipo_meta,unidad,categoria,dificultad,disparador,recompensa,paquete_id)
  values (auth.uid(),p_titulo,nullif(trim(p_descripcion),''),p_icono_lucide,p_color,p_tipo_meta,nullif(trim(p_unidad),''),nullif(trim(p_categoria),''),coalesce(p_dificultad,'estandar'),nullif(trim(p_disparador),''),nullif(trim(p_recompensa),''),coalesce(p_paquete_id,'esmeralda'))
  returning * into v_item;
  insert into public.habitos_planes (habito_id,frecuencia,dias_semana,veces_por_semana,objetivo_valor,desde_fecha,recordatorio_activo,hora_recordatorio,mostrar_nombre_notificacion,nivel)
  values (v_item.id,p_frecuencia,p_dias_semana,p_veces_por_semana,p_objetivo_valor,p_desde_fecha,p_recordatorio_activo,p_hora_recordatorio,p_mostrar_nombre_notificacion,v_nivel_inicial)
  returning * into v_plan;
  return jsonb_build_object('id',v_item.id,'plan_id',v_plan.id);
end;
$$;

create or replace function public.crear_habito_premium(
  p_titulo text, p_descripcion text, p_icono_lucide text, p_color text, p_tipo_meta text, p_unidad text,
  p_categoria text, p_dificultad text, p_disparador text, p_recompensa text,
  p_frecuencia text, p_dias_semana smallint[] default null, p_veces_por_semana smallint default null,
  p_objetivo_valor numeric default 1, p_recordatorio_activo boolean default false,
  p_hora_recordatorio time without time zone default null, p_mostrar_nombre_notificacion boolean default false,
  p_desde_fecha date default current_date, p_nivel_inicial integer default 1, p_paquete_id text default 'esmeralda'
)
returns jsonb language sql security invoker set search_path = ''
as $$
  select privacidad.crear_habito_premium(p_titulo, p_descripcion, p_icono_lucide, p_color, p_tipo_meta, p_unidad, p_categoria, p_dificultad, p_disparador, p_recompensa, p_frecuencia, p_dias_semana, p_veces_por_semana, p_objetivo_valor, p_recordatorio_activo, p_hora_recordatorio, p_mostrar_nombre_notificacion, p_desde_fecha, p_nivel_inicial, p_paquete_id);
$$;

commit;

notify pgrst, 'reload schema';
