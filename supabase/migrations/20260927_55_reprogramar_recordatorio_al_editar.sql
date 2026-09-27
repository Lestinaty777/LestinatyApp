-- El cron de recordatorios (cada 5 min) inserta la notificación de HOY apenas
-- se cumplen las condiciones, con `on conflict (plan_habito_id, fecha_local)
-- do nothing`. Si el usuario edita la hora del recordatorio DESPUÉS de que ya
-- se insertó la de hoy (muy probable: basta que pase un tick de 5 min entre
-- crear/editar el hábito y ajustar la hora), la fila 'pendiente' se queda con
-- la hora vieja para siempre — el conflicto bloquea el recálculo, así que la
-- notificación llega a la hora anterior, no a la nueva.
-- Arreglo: al guardar la edición, borrar la fila 'pendiente' de HOY del plan
-- que se está tocando (el mismo si el plan se actualiza en el mismo registro,
-- o el que se cierra si se abre uno nuevo) — el próximo tick del cron la
-- vuelve a insertar ya con la hora correcta. Si ya se envió o está en curso
-- de envío ('reclamada'/'enviada'), no se toca: nunca se cancela algo que ya
-- salió o está saliendo.
create or replace function privacidad.actualizar_habito_desde_detalle(p_habito_id uuid, p_titulo text, p_descripcion text, p_icono_lucide text, p_tipo_meta text, p_unidad text, p_frecuencia text, p_dias_semana smallint[], p_veces_por_semana smallint, p_objetivo_valor numeric, p_recordatorio_activo boolean, p_hora_recordatorio time without time zone, p_mostrar_nombre_notificacion boolean, p_desde_fecha date)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
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

  -- Borra la notificación de hoy que haya quedado pendiente con la hora
  -- vieja de ESTE plan (funciona igual si el plan se actualiza en el mismo
  -- registro o si el que se está cerrando ya tenía una fila para hoy).
  delete from privacidad.notificaciones_programadas
  where plan_habito_id = v_plan.id and fecha_local = p_desde_fecha and estado = 'pendiente';

  if v_plan.desde_fecha = p_desde_fecha then
    update public.habitos_planes set frecuencia = p_frecuencia, dias_semana = p_dias_semana, veces_por_semana = p_veces_por_semana,
      objetivo_valor = p_objetivo_valor, recordatorio_activo = p_recordatorio_activo, hora_recordatorio = p_hora_recordatorio,
      mostrar_nombre_notificacion = p_mostrar_nombre_notificacion
    where id = v_plan.id;
    return jsonb_build_object('id', p_habito_id, 'plan_id', v_plan.id);
  end if;
  update public.habitos_planes set hasta_fecha = p_desde_fecha where id = v_plan.id;
  insert into public.habitos_planes (habito_id, frecuencia, dias_semana, veces_por_semana, objetivo_valor, desde_fecha, recordatorio_activo, hora_recordatorio, mostrar_nombre_notificacion, nivel)
  values (p_habito_id, p_frecuencia, p_dias_semana, p_veces_por_semana, p_objetivo_valor, p_desde_fecha, p_recordatorio_activo, p_hora_recordatorio, p_mostrar_nombre_notificacion, v_plan.nivel)
  returning * into v_plan;
  return jsonb_build_object('id', p_habito_id, 'plan_id', v_plan.id);
end;
$function$;
