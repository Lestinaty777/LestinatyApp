-- Migración 84: envío real del recordatorio de rutina. Plan:
-- docs/superpowers/plans/2026-10-09-plan-maestro.md (tarea 4.2).
--
-- Misma cola y mismo patrón que tareas (migración 60): la cola acepta un
-- tercer origen (rutina), reclamar_recordatorios_rutinas siembra y reclama, y
-- la Edge Function despachar-recordatorios-habitos lo procesa con el mismo
-- bucle (cambia tarea_id/titulo_tarea por rutina_id/titulo_rutina).
-- Se avisa a la hora_inicio de la rutina los días que toca, si la sesión de
-- hoy no está ya completa. No reemplaza los recordatorios propios de los
-- hábitos y tareas que la rutina contiene.
--
-- A diferencia de la 60, las funciones de reclamo quedan ejecutables SOLO por
-- service_role (ver migración 86, que corrige las de tareas).
begin;

alter table privacidad.notificaciones_programadas
  add column rutina_id uuid references public.rutinas_items(id) on delete cascade;

alter table privacidad.notificaciones_programadas drop constraint notificaciones_programadas_un_solo_origen;
alter table privacidad.notificaciones_programadas add constraint notificaciones_programadas_un_solo_origen
  check (num_nonnulls(plan_habito_id, tarea_id, rutina_id) = 1);

create unique index notificaciones_programadas_rutina_id_fecha_local_key
  on privacidad.notificaciones_programadas (rutina_id, fecha_local) where rutina_id is not null;

create or replace function privacidad.reclamar_recordatorios_rutinas(p_limite integer default 100)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_resultado jsonb;
begin
  if p_limite < 1 or p_limite > 200 then
    raise exception 'invalid reminder batch limit' using errcode = '22023';
  end if;

  insert into privacidad.notificaciones_programadas (usuario_id, rutina_id, fecha_local, programada_para)
  select rutina.usuario_id, rutina.id, (now() at time zone perfil.zona_horaria)::date,
    (((now() at time zone perfil.zona_horaria)::date + rutina.hora_inicio) at time zone perfil.zona_horaria)
  from public.rutinas_items rutina
  join public.perfiles_usuario perfil on perfil.id = rutina.usuario_id
  left join public.rutinas_registros registro
    on registro.rutina_id = rutina.id
    and registro.fecha_local = (now() at time zone perfil.zona_horaria)::date
  where rutina.recordatorio_activo
    and rutina.hora_inicio is not null
    and rutina.estado = 'activa'
    and (
      rutina.frecuencia = 'diaria'
      or extract(isodow from (now() at time zone perfil.zona_horaria)::date)::smallint = any (rutina.dias_semana)
    )
    and registro.completada_en is null
  on conflict (rutina_id, fecha_local) where rutina_id is not null do nothing;

  with candidatas as (
    select id from privacidad.notificaciones_programadas
    where estado = 'pendiente' and programada_para <= now() and rutina_id is not null
    order by programada_para for update skip locked limit p_limite
  ), reclamadas as (
    update privacidad.notificaciones_programadas notificacion
    set estado = 'reclamada', reclamada_at = now(), intentos = intentos + 1, error_codigo = null
    from candidatas where notificacion.id = candidatas.id
    returning notificacion.*
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'notificacion_id', reclamada.id,
    'rutina_id', rutina.id,
    'titulo_rutina', rutina.titulo,
    'mostrar_nombre', rutina.mostrar_nombre_notificacion,
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
  join public.rutinas_items rutina on rutina.id = reclamada.rutina_id
  left join public.preferencias_notificacion_usuario preferencia
    on preferencia.usuario_id = reclamada.usuario_id and preferencia.catalogo_codigo = 'rutina_recordatorio';

  return v_resultado;
end;
$$;

create or replace function public.reclamar_recordatorios_rutinas(p_limite integer default 100)
returns jsonb
language sql
security invoker
set search_path = ''
as $$ select privacidad.reclamar_recordatorios_rutinas(p_limite); $$;

revoke all on function privacidad.reclamar_recordatorios_rutinas(integer) from public, anon, authenticated;
revoke all on function public.reclamar_recordatorios_rutinas(integer) from public, anon, authenticated;
grant execute on function privacidad.reclamar_recordatorios_rutinas(integer) to service_role;
grant execute on function public.reclamar_recordatorios_rutinas(integer) to service_role;

-- Tras cambiar la hora o apagar el recordatorio de una rutina propia: borra
-- los avisos que aún no salieron; el siguiente tick del cron los vuelve a
-- sembrar con la hora nueva (mismo arreglo que la migración 55 para hábitos).
create or replace function privacidad.reprogramar_recordatorio_rutina(p_rutina_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege'; end if;
  if not exists (select 1 from public.rutinas_items where id = p_rutina_id and usuario_id = auth.uid()) then
    raise exception 'Rutina no encontrada.' using errcode = 'no_data_found';
  end if;
  delete from privacidad.notificaciones_programadas
  where rutina_id = p_rutina_id and estado = 'pendiente';
end;
$$;

create or replace function public.reprogramar_recordatorio_rutina(p_rutina_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$ select privacidad.reprogramar_recordatorio_rutina(p_rutina_id); $$;

revoke all on function privacidad.reprogramar_recordatorio_rutina(uuid) from public, anon;
revoke all on function public.reprogramar_recordatorio_rutina(uuid) from public, anon;
grant execute on function privacidad.reprogramar_recordatorio_rutina(uuid) to authenticated;
grant execute on function public.reprogramar_recordatorio_rutina(uuid) to authenticated;

insert into public.catalogo_notificaciones (codigo, grupo, prioridad, es_proactiva, descripcion)
values ('rutina_recordatorio', 'programada', 7, false, 'Recordatorio programado para una rutina.')
on conflict (codigo) do update set activo = true, descripcion = excluded.descripcion;

insert into public.preferencias_notificacion_usuario (usuario_id, catalogo_codigo)
select perfil.id, 'rutina_recordatorio' from public.perfiles_usuario perfil
on conflict do nothing;

commit;
