-- Migración 75: una persona puede reclamar MÁS DE UNA rama del mismo plan
-- (ej. un plan de marketing dividido en 6 canales — YouTube/Reddit/Facebook/
-- SEO/etc. — que en la práctica lleva una sola persona, repartido en partes
-- independientes solo para que Aby las arme y detalle una por una). Lo único
-- que de verdad cambiaba era "una persona, una rama" — "esta rama específica
-- sigue libre" lo sigue validando reclamarRama() atómicamente igual que
-- siempre, sin tocar nada ahí.
begin;

-- Antes: una instancia no podía aparecer en más de una fila de planes_ramas.
-- Ahora: puede tener varias — solo se mantiene el índice (sin unicidad) para
-- que seguir filtrando "mis ramas" por instancia_id siga siendo rápido.
drop index public.planes_ramas_instancia_unica;
create index planes_ramas_instancia_idx on public.planes_ramas (instancia_id) where instancia_id is not null;

-- obtener_participantes_plan: con el left join a planes_ramas, una instancia
-- con N ramas reclamadas ya sale como N filas (una por rama, mismo
-- instanciaId/nombre repetido) en vez de 1 — es el comportamiento que
-- queremos (progreso POR RAMA, no por persona) sin tener que reescribir la
-- consulta entera. Lo único que había que corregir: una instancia SIN
-- ninguna rama todavía, en un plan que SÍ tiene ramas, contaba como "total"
-- todos los ítems del plan completo (porque "r.id is null" dejaba pasar
-- todo) — ahora en ese caso queda en 0/0 (nada que mostrar todavía) en vez
-- de un número que no le corresponde a nadie.
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
