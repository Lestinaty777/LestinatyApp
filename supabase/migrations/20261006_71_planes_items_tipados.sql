-- Migración 71: ítems de Planes dejan de ser siempre un check — pueden ser
-- "contador" (una cantidad medible, ej. 5 km) o "cronometro" (minutos
-- dedicados), reusando exactamente el mismo mecanismo numérico que ya tiene
-- Tareas (meta vs. valor_actual) y el widget WidgetProgresoTarea.tsx tal
-- cual, sin ningún cambio ahí.
--
-- "cronometro" en este proyecto NO es un timer corriendo en el fondo — es un
-- contador con unidad fija en minutos (ver WidgetProgresoTarea.tsx: guarda
-- round(segundos/60) al tocar "listo"). Por eso un solo mecanismo numérico
-- (meta_valor/valor_actual) cubre los dos tipos — la diferencia es solo cuál
-- widget de entrada se muestra.
begin;

alter table public.planes_bloque_items add column tipo text not null default 'simple' check (tipo in ('simple', 'contador', 'cronometro'));
alter table public.planes_bloque_items add column meta_valor numeric check (meta_valor is null or meta_valor > 0);
alter table public.planes_bloque_items add column unidad text;
alter table public.planes_bloque_items add constraint planes_bloque_items_meta_requerida
  check (tipo = 'simple' or meta_valor is not null);

alter table public.planes_instancia_progreso add column valor_actual numeric check (valor_actual is null or valor_actual >= 0);

drop function if exists public.marcar_item_plan(uuid, uuid, boolean, text);
drop function if exists privacidad.marcar_item_plan(uuid, uuid, boolean, text);

create or replace function privacidad.marcar_item_plan(p_instancia_id uuid, p_bloque_item_id uuid, p_hecho boolean default null, p_valor numeric default null, p_nota text default null)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_plan_id uuid;
  v_seccion_id uuid;
  v_tipo text;
  v_meta numeric;
  v_hecho_final boolean;
  v_valor_final numeric;
  v_total_items integer;
  v_total_instancias integer;
  v_instancias_completas integer;
  v_seccion_completada boolean := false;
begin
  if auth.uid() is null then raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege'; end if;

  select plan_id into v_plan_id from public.planes_instancias
  where id = p_instancia_id and usuario_id = auth.uid();
  if v_plan_id is null then raise exception 'Instancia no encontrada.' using errcode = 'no_data_found'; end if;

  select s.id, bi.tipo, bi.meta_valor into v_seccion_id, v_tipo, v_meta
  from public.planes_bloque_items bi
  join public.planes_bloques b on b.id = bi.bloque_id
  join public.planes_dias d on d.id = b.dia_id
  join public.planes_secciones s on s.id = d.seccion_id
  where bi.id = p_bloque_item_id and s.plan_id = v_plan_id;
  if v_seccion_id is null then raise exception 'Ítem no encontrado en este plan.' using errcode = 'no_data_found'; end if;

  if v_tipo = 'simple' then
    v_hecho_final := coalesce(p_hecho, false);
    v_valor_final := null;
  else
    if p_valor is null then raise exception 'Este ítem necesita un valor.' using errcode = 'invalid_parameter_value'; end if;
    v_valor_final := p_valor;
    v_hecho_final := p_valor >= v_meta;
  end if;

  insert into public.planes_instancia_progreso (instancia_id, bloque_item_id, hecho, hecho_en, nota, valor_actual)
  values (p_instancia_id, p_bloque_item_id, v_hecho_final, case when v_hecho_final then now() else null end, p_nota, v_valor_final)
  on conflict (instancia_id, bloque_item_id)
  do update set
    hecho = excluded.hecho,
    hecho_en = excluded.hecho_en,
    nota = coalesce(excluded.nota, public.planes_instancia_progreso.nota),
    valor_actual = excluded.valor_actual;

  -- Desmarcar (o un contador que bajó de la meta) nunca necesita recontar:
  -- si la sección estaba completa, deja de estarlo; si no lo estaba, no
  -- cambia nada.
  if not v_hecho_final then
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

create or replace function public.marcar_item_plan(p_instancia_id uuid, p_bloque_item_id uuid, p_hecho boolean default null, p_valor numeric default null, p_nota text default null)
 returns jsonb
 language sql
 set search_path to ''
as $function$ select privacidad.marcar_item_plan(p_instancia_id, p_bloque_item_id, p_hecho, p_valor, p_nota); $function$;

grant execute on function public.marcar_item_plan(uuid, uuid, boolean, numeric, text) to authenticated;

commit;

notify pgrst, 'reload schema';
