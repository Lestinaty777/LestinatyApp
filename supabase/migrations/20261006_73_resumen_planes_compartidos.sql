-- Migración 73: Fase 12 (ajuste) — obtener_resumen_planes() filtraba
-- "where p.usuario_id = auth.uid()", así que un plan al que alguien se SUMÓ
-- (no lo creó) aparecía en la lista con 0/0 siempre, aunque el JOIN a
-- planes_instancias de abajo ya está bien hecho por instancia propia. Se
-- cambia el filtro para incluir "o tengo una instancia en este plan".
begin;

create or replace function public.obtener_resumen_planes()
returns table (plan_id uuid, completadas bigint, total bigint)
language sql
security invoker
set search_path = ''
as $$
  select
    p.id as plan_id,
    count(ip.id) filter (where ip.hecho) as completadas,
    count(bi.id) as total
  from public.planes_items p
  left join public.planes_secciones s on s.plan_id = p.id
  left join public.planes_dias d on d.seccion_id = s.id
  left join public.planes_bloques b on b.dia_id = d.id
  left join public.planes_bloque_items bi on bi.bloque_id = b.id
  left join public.planes_instancias i on i.plan_id = p.id and i.usuario_id = auth.uid()
  left join public.planes_instancia_progreso ip on ip.bloque_item_id = bi.id and ip.instancia_id = i.id
  where p.usuario_id = auth.uid() or i.id is not null
  group by p.id;
$$;

commit;

notify pgrst, 'reload schema';
