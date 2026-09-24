-- Permite reclamar recordatorios de hábitos para dispositivos iOS y Android
-- (antes solo Android). registrar_dispositivo_notificacion/su CHECK ya
-- aceptaban 'ios' — el único punto que los excluía del despacho real era
-- este filtro de lectura.
create or replace function privacidad.reclamar_recordatorios_habitos(p_limite integer default 100)
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

  insert into privacidad.notificaciones_programadas (usuario_id, plan_habito_id, fecha_local, programada_para)
  select item.usuario_id, plan.id, (now() at time zone perfil.zona_horaria)::date,
    (((now() at time zone perfil.zona_horaria)::date + plan.hora_recordatorio) at time zone perfil.zona_horaria)
  from public.habitos_planes plan
  join public.habitos_items item on item.id = plan.habito_id and item.estado = 'activo'
  join public.perfiles_usuario perfil on perfil.id = item.usuario_id
  left join public.habitos_registros registro
    on registro.habito_id = item.id
    and registro.fecha_local = (now() at time zone perfil.zona_horaria)::date
  where plan.recordatorio_activo
    and plan.hora_recordatorio is not null
    and plan.desde_fecha <= (now() at time zone perfil.zona_horaria)::date
    and (plan.hasta_fecha is null or plan.hasta_fecha > (now() at time zone perfil.zona_horaria)::date)
    and public.habitos_es_dia_programado(plan, (now() at time zone perfil.zona_horaria)::date)
    and coalesce(registro.valor, 0) < plan.objetivo_valor
  on conflict (plan_habito_id, fecha_local) do nothing;

  with candidatas as (
    select id from privacidad.notificaciones_programadas
    where estado = 'pendiente' and programada_para <= now()
    order by programada_para for update skip locked limit p_limite
  ), reclamadas as (
    update privacidad.notificaciones_programadas notificacion
    set estado = 'reclamada', reclamada_at = now(), intentos = intentos + 1, error_codigo = null
    from candidatas where notificacion.id = candidatas.id
    returning notificacion.*
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'notificacion_id', reclamada.id,
    'habito_id', item.id,
    'titulo_habito', item.titulo,
    'mostrar_nombre', plan.mostrar_nombre_notificacion,
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
  join public.habitos_planes plan on plan.id = reclamada.plan_habito_id
  join public.habitos_items item on item.id = plan.habito_id
  left join public.preferencias_notificacion_usuario preferencia
    on preferencia.usuario_id = reclamada.usuario_id and preferencia.catalogo_codigo = 'habito_recordatorio';

  return v_resultado;
end;
$function$;
