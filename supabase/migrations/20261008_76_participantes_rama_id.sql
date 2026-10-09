-- Migración 76: con la 75, una misma persona puede aparecer varias veces en
-- obtener_participantes_plan (una fila por rama que tiene) — el cliente
-- necesita una key estable por fila para listas en React, y "ramaNombre" por
-- si solo no alcanza (dos ramas podrían, en teoría, compartir nombre).
-- Agrega "ramaId" junto a "ramaNombre", sin tocar nada más de la función.
begin;

create or replace function privacidad.obtener_participantes_plan(p_plan_id uuid)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_autorizado boolean;
  v_tiene_ramas boolean;
begin
  if auth.uid() is null then raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege'; end if;

  select exists(select 1 from public.planes_instancias where plan_id = p_plan_id and usuario_id = auth.uid()) into v_autorizado;
  if not v_autorizado then raise exception 'No tenés acceso a este plan.' using errcode = 'insufficient_privilege'; end if;

  select exists(select 1 from public.planes_ramas where plan_id = p_plan_id) into v_tiene_ramas;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'instanciaId', i.id,
      'usuarioId', i.usuario_id,
      'nombre', coalesce(pu.nombre_visible, 'Usuario'),
      'esCreador', i.es_creador,
      'ramaId', r.id,
      'ramaNombre', r.nombre,
      'completadas', case when v_tiene_ramas and r.id is null then 0 else (
        select count(*) from public.planes_instancia_progreso ip
        join public.planes_bloque_items bi on bi.id = ip.bloque_item_id
        join public.planes_bloques b on b.id = bi.bloque_id
        join public.planes_dias d on d.id = b.dia_id
        join public.planes_secciones s on s.id = d.seccion_id
        where s.plan_id = p_plan_id and ip.instancia_id = i.id and ip.hecho = true
          and (r.id is null or s.rama_id = r.id)
      ) end,
      'total', case when v_tiene_ramas and r.id is null then 0 else (
        select count(*) from public.planes_bloque_items bi2
        join public.planes_bloques b2 on b2.id = bi2.bloque_id
        join public.planes_dias d2 on d2.id = b2.dia_id
        join public.planes_secciones s2 on s2.id = d2.seccion_id
        where s2.plan_id = p_plan_id
          and (r.id is null or s2.rama_id = r.id)
      ) end
    ) order by i.es_creador desc, i.created_at, r.orden)
    from public.planes_instancias i
    left join public.perfiles_usuario pu on pu.id = i.usuario_id
    left join public.planes_ramas r on r.instancia_id = i.id
    where i.plan_id = p_plan_id
  ), '[]'::jsonb);
end;
$function$;

commit;

notify pgrst, 'reload schema';
