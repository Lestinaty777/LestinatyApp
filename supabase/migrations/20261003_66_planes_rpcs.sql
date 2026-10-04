-- Migración 66: Fase 11.1 — RPCs de Planes.
--
-- asignar_semilla_plan es el espejo exacto de asignar_semilla_tarea
-- (migración 57), apuntado a planes_items.
--
-- marcar_item_plan es la única pieza de lógica de servidor real de Planes:
-- marca el progreso de UNA instancia sobre UN ítem, y evalúa si con eso la
-- sección quedó completa — no "para esta instancia", sino PARA EL PLAN
-- (todas las instancias activas la tienen completa). En la Fase 11 cada plan
-- tiene siempre una sola instancia, así que esto ya se comporta como "la
-- marca el creador y queda completa" sin ningún caso especial; la Fase 12
-- (compartir) solo agrega más filas a planes_instancias — esta función no
-- se vuelve a tocar.
begin;

create or replace function privacidad.asignar_semilla_plan(p_semilla_id uuid, p_plan_id uuid)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare v_semilla public.usuario_semillas; declare v_plan_existe boolean;
begin
  if auth.uid() is null then raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege'; end if;

  select * into v_semilla from public.usuario_semillas
  where id = p_semilla_id and usuario_id = auth.uid() and habito_id is null and tarea_id is null and plan_id is null
  for update;
  if v_semilla.id is null then raise exception 'Semilla no disponible.' using errcode = 'no_data_found'; end if;

  select exists(select 1 from public.planes_items where id = p_plan_id and usuario_id = auth.uid()) into v_plan_existe;
  if not v_plan_existe then raise exception 'Plan no encontrado.' using errcode = 'no_data_found'; end if;

  update public.usuario_semillas set plan_id = p_plan_id where id = p_semilla_id;
  update public.planes_items set paquete_id = v_semilla.paquete_id where id = p_plan_id;

  return jsonb_build_object('plan_id', p_plan_id, 'paquete_id', v_semilla.paquete_id);
end;
$function$;

create or replace function public.asignar_semilla_plan(p_semilla_id uuid, p_plan_id uuid)
 returns jsonb
 language sql
 set search_path to ''
as $function$ select privacidad.asignar_semilla_plan(p_semilla_id, p_plan_id); $function$;

grant execute on function public.asignar_semilla_plan(uuid, uuid) to authenticated;

create or replace function privacidad.marcar_item_plan(p_instancia_id uuid, p_bloque_item_id uuid, p_hecho boolean)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_plan_id uuid;
  v_seccion_id uuid;
  v_total_items integer;
  v_total_instancias integer;
  v_instancias_completas integer;
  v_seccion_completada boolean := false;
begin
  if auth.uid() is null then raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege'; end if;

  select plan_id into v_plan_id from public.planes_instancias
  where id = p_instancia_id and usuario_id = auth.uid();
  if v_plan_id is null then raise exception 'Instancia no encontrada.' using errcode = 'no_data_found'; end if;

  select s.id into v_seccion_id
  from public.planes_bloque_items bi
  join public.planes_bloques b on b.id = bi.bloque_id
  join public.planes_dias d on d.id = b.dia_id
  join public.planes_secciones s on s.id = d.seccion_id
  where bi.id = p_bloque_item_id and s.plan_id = v_plan_id;
  if v_seccion_id is null then raise exception 'Ítem no encontrado en este plan.' using errcode = 'no_data_found'; end if;

  insert into public.planes_instancia_progreso (instancia_id, bloque_item_id, hecho, hecho_en)
  values (p_instancia_id, p_bloque_item_id, p_hecho, case when p_hecho then now() else null end)
  on conflict (instancia_id, bloque_item_id)
  do update set hecho = excluded.hecho, hecho_en = excluded.hecho_en;

  -- Desmarcar un ítem nunca necesita recontar: si la sección estaba
  -- completa, deja de estarlo; si no lo estaba, no cambia nada.
  if not p_hecho then
    update public.planes_secciones set estado = 'detallada' where id = v_seccion_id and estado = 'completada';
    return jsonb_build_object('seccionCompletada', false, 'seccionId', v_seccion_id);
  end if;

  select count(*) into v_total_items
  from public.planes_bloque_items bi2
  join public.planes_bloques b2 on b2.id = bi2.bloque_id
  join public.planes_dias d2 on d2.id = b2.dia_id
  where d2.seccion_id = v_seccion_id;

  select count(*) into v_total_instancias from public.planes_instancias where plan_id = v_plan_id;

  -- Una instancia "completó" la sección cuando TODOS sus ítems están hechos
  -- para ella; la sección queda completa PARA EL PLAN cuando todas las
  -- instancias cumplen eso — con una sola instancia (Fase 11) es solo "¿el
  -- creador terminó todo?".
  select count(*) into v_instancias_completas
  from public.planes_instancias pi
  where pi.plan_id = v_plan_id
    and (
      select count(*) from public.planes_instancia_progreso ip
      join public.planes_bloque_items bi3 on bi3.id = ip.bloque_item_id
      join public.planes_bloques b3 on b3.id = bi3.bloque_id
      join public.planes_dias d3 on d3.id = b3.dia_id
      where d3.seccion_id = v_seccion_id and ip.instancia_id = pi.id and ip.hecho = true
    ) = v_total_items;

  if v_total_items > 0 and v_instancias_completas = v_total_instancias then
    update public.planes_secciones set estado = 'completada' where id = v_seccion_id and estado <> 'completada';
    v_seccion_completada := true;
  end if;

  return jsonb_build_object('seccionCompletada', v_seccion_completada, 'seccionId', v_seccion_id);
end;
$function$;

create or replace function public.marcar_item_plan(p_instancia_id uuid, p_bloque_item_id uuid, p_hecho boolean)
 returns jsonb
 language sql
 set search_path to ''
as $function$ select privacidad.marcar_item_plan(p_instancia_id, p_bloque_item_id, p_hecho); $function$;

grant execute on function public.marcar_item_plan(uuid, uuid, boolean) to authenticated;

commit;

notify pgrst, 'reload schema';
