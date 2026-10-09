-- Migración 70: Fase 11 (ajuste) — captura de una nota al completar una
-- sección, para que detallar-seccion-plan arranque con contexto real en vez
-- de depender de que el usuario lo recuerde y lo re-escriba días después.
--
-- No se ata a un "ítem de reflexión" especial generado por Gemini (ya existe
-- esa convención en el prompt, pero formalizarla como un flag del contrato
-- de IA agrega riesgo sin necesidad) — en vez de eso, la nota se adjunta al
-- ÍTEM QUE COMPLETA LA SECCIÓN, sea cual sea su contenido. Funciona igual
-- para secciones armadas con Aby o a mano, sin tocar generar-plan-inicial ni
-- detallar-seccion-plan.
begin;

alter table public.planes_instancia_progreso add column nota text;

drop function if exists public.marcar_item_plan(uuid, uuid, boolean);
drop function if exists privacidad.marcar_item_plan(uuid, uuid, boolean);

create or replace function privacidad.marcar_item_plan(p_instancia_id uuid, p_bloque_item_id uuid, p_hecho boolean, p_nota text default null)
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

  insert into public.planes_instancia_progreso (instancia_id, bloque_item_id, hecho, hecho_en, nota)
  values (p_instancia_id, p_bloque_item_id, p_hecho, case when p_hecho then now() else null end, p_nota)
  on conflict (instancia_id, bloque_item_id)
  do update set
    hecho = excluded.hecho,
    hecho_en = excluded.hecho_en,
    nota = coalesce(excluded.nota, public.planes_instancia_progreso.nota);

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

create or replace function public.marcar_item_plan(p_instancia_id uuid, p_bloque_item_id uuid, p_hecho boolean, p_nota text default null)
 returns jsonb
 language sql
 set search_path to ''
as $function$ select privacidad.marcar_item_plan(p_instancia_id, p_bloque_item_id, p_hecho, p_nota); $function$;

grant execute on function public.marcar_item_plan(uuid, uuid, boolean, text) to authenticated;

commit;

notify pgrst, 'reload schema';
