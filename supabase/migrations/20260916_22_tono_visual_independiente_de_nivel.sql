-- El wizard ya elegía un "tono" (paso 0, "Tono de tu selva") y la columna
-- habitos_items.tono_visual existía desde la migración 17 exactamente para
-- guardarlo ("Tono de selva 1..7 elegido al crear el hábito; determina su
-- árbol visual") — pero crear_habito_premium nunca recibía ni escribía ese
-- valor. La migración 19 en cambio conectó el tono elegido a p_nivel_inicial,
-- mezclando dos conceptos que deben ser independientes: el tono es una
-- elección visual fija de por vida del hábito (qué paquete de árbol usa), el
-- nivel es el progreso real (siempre arranca en 1, sube con días de
-- constancia). Esta migración agrega el parámetro que faltaba para que el
-- tono por fin se persista donde ya existía la columna para eso.
--
-- Mismo cuidado que en la migración 20: se hace `drop function` explícito con
-- la firma exacta antes de crear la nueva — un `create or replace` con una
-- lista de parámetros distinta crea un overload nuevo en vez de reemplazar,
-- que es justo el bug que esa migración tuvo que arreglar.

begin;

drop function if exists privacidad.crear_habito_premium(
  text, text, text, text, text, text, text, text, text, text, text,
  smallint[], smallint, numeric, boolean, time without time zone, boolean, date, integer
);
drop function if exists public.crear_habito_premium(
  text, text, text, text, text, text, text, text, text, text, text,
  smallint[], smallint, numeric, boolean, time without time zone, boolean, date, integer
);

create function privacidad.crear_habito_premium(
  p_titulo text, p_descripcion text, p_icono_lucide text, p_color text, p_tipo_meta text, p_unidad text,
  p_categoria text, p_dificultad text, p_disparador text, p_recompensa text,
  p_frecuencia text, p_dias_semana smallint[] default null, p_veces_por_semana smallint default null,
  p_objetivo_valor numeric default 1, p_recordatorio_activo boolean default false,
  p_hora_recordatorio time without time zone default null, p_mostrar_nombre_notificacion boolean default false,
  p_desde_fecha date default current_date, p_nivel_inicial integer default 1, p_tono_visual smallint default 1
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_item public.habitos_items; declare v_plan public.habitos_planes; declare v_nivel_inicial integer; declare v_tono_visual smallint;
begin
  if auth.uid() is null then raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege'; end if;
  if p_recordatorio_activo and p_hora_recordatorio is null then raise exception 'El recordatorio necesita una hora.' using errcode = 'check_violation'; end if;
  v_nivel_inicial := greatest(1, least(7, coalesce(p_nivel_inicial, 1)));
  v_tono_visual := greatest(1, least(7, coalesce(p_tono_visual, 1)));

  insert into public.habitos_items (usuario_id,titulo,descripcion,icono_lucide,color,tipo_meta,unidad,categoria,dificultad,disparador,recompensa,tono_visual)
  values (auth.uid(),p_titulo,nullif(trim(p_descripcion),''),p_icono_lucide,p_color,p_tipo_meta,nullif(trim(p_unidad),''),nullif(trim(p_categoria),''),coalesce(p_dificultad,'estandar'),nullif(trim(p_disparador),''),nullif(trim(p_recompensa),''),v_tono_visual)
  returning * into v_item;
  insert into public.habitos_planes (habito_id,frecuencia,dias_semana,veces_por_semana,objetivo_valor,desde_fecha,recordatorio_activo,hora_recordatorio,mostrar_nombre_notificacion,nivel)
  values (v_item.id,p_frecuencia,p_dias_semana,p_veces_por_semana,p_objetivo_valor,p_desde_fecha,p_recordatorio_activo,p_hora_recordatorio,p_mostrar_nombre_notificacion,v_nivel_inicial)
  returning * into v_plan;
  return jsonb_build_object('id',v_item.id,'plan_id',v_plan.id);
end;
$$;

create function public.crear_habito_premium(
  p_titulo text, p_descripcion text, p_icono_lucide text, p_color text, p_tipo_meta text, p_unidad text,
  p_categoria text, p_dificultad text, p_disparador text, p_recompensa text,
  p_frecuencia text, p_dias_semana smallint[] default null, p_veces_por_semana smallint default null,
  p_objetivo_valor numeric default 1, p_recordatorio_activo boolean default false,
  p_hora_recordatorio time without time zone default null, p_mostrar_nombre_notificacion boolean default false,
  p_desde_fecha date default current_date, p_nivel_inicial integer default 1, p_tono_visual smallint default 1
)
returns jsonb language sql security invoker set search_path = ''
as $$
  select privacidad.crear_habito_premium(p_titulo, p_descripcion, p_icono_lucide, p_color, p_tipo_meta, p_unidad, p_categoria, p_dificultad, p_disparador, p_recompensa, p_frecuencia, p_dias_semana, p_veces_por_semana, p_objetivo_valor, p_recordatorio_activo, p_hora_recordatorio, p_mostrar_nombre_notificacion, p_desde_fecha, p_nivel_inicial, p_tono_visual);
$$;

commit;

notify pgrst, 'reload schema';
