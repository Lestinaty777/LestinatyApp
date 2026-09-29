-- Migración 57: cierra un hueco de doble gasto y agrega el espejo para tareas.
--
-- asignar_semilla_habito sólo exigía habito_id is null — con tarea_id nuevo
-- (migración 56), una semilla ya usada para vestir una tarea (tarea_id
-- seteado, habito_id todavía null) podía volver a asignarse a un hábito,
-- gastando la misma semilla dos veces. Se agrega "and tarea_id is null".
begin;

create or replace function privacidad.asignar_semilla_habito(p_semilla_id uuid, p_habito_id uuid)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare v_semilla public.usuario_semillas; declare v_habito_existe boolean;
begin
  if auth.uid() is null then raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege'; end if;

  select * into v_semilla from public.usuario_semillas
  where id = p_semilla_id and usuario_id = auth.uid() and habito_id is null and tarea_id is null
  for update;
  if v_semilla.id is null then raise exception 'Semilla no disponible.' using errcode = 'no_data_found'; end if;

  select exists(select 1 from public.habitos_items where id = p_habito_id and usuario_id = auth.uid()) into v_habito_existe;
  if not v_habito_existe then raise exception 'Hábito no encontrado.' using errcode = 'no_data_found'; end if;

  update public.usuario_semillas set habito_id = p_habito_id where id = p_semilla_id;
  update public.habitos_items set paquete_id = v_semilla.paquete_id where id = p_habito_id;

  return jsonb_build_object('habito_id', p_habito_id, 'paquete_id', v_semilla.paquete_id);
end;
$function$;

-- Espejo exacto para tareas: la misma semilla libre, ahora consumida por una
-- tarea en vez de un hábito. Sólo toca paquete_id de la tarea (el color y el
-- ícono los decide el cliente al crearla, igual que ya hace el wizard de
-- hábitos con habitos_items.color antes de llamar a este tipo de función).
create or replace function privacidad.asignar_semilla_tarea(p_semilla_id uuid, p_tarea_id uuid)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare v_semilla public.usuario_semillas; declare v_tarea_existe boolean;
begin
  if auth.uid() is null then raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege'; end if;

  select * into v_semilla from public.usuario_semillas
  where id = p_semilla_id and usuario_id = auth.uid() and habito_id is null and tarea_id is null
  for update;
  if v_semilla.id is null then raise exception 'Semilla no disponible.' using errcode = 'no_data_found'; end if;

  select exists(select 1 from public.tareas_items where id = p_tarea_id and usuario_id = auth.uid()) into v_tarea_existe;
  if not v_tarea_existe then raise exception 'Tarea no encontrada.' using errcode = 'no_data_found'; end if;

  update public.usuario_semillas set tarea_id = p_tarea_id where id = p_semilla_id;
  update public.tareas_items set paquete_id = v_semilla.paquete_id where id = p_tarea_id;

  return jsonb_build_object('tarea_id', p_tarea_id, 'paquete_id', v_semilla.paquete_id);
end;
$function$;

create or replace function public.asignar_semilla_tarea(p_semilla_id uuid, p_tarea_id uuid)
 returns jsonb
 language sql
 set search_path to ''
as $function$ select privacidad.asignar_semilla_tarea(p_semilla_id, p_tarea_id); $function$;

grant execute on function public.asignar_semilla_tarea(uuid, uuid) to authenticated;

commit;
