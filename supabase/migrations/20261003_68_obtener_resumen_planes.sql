-- Migración 68: Fase 11.3 — lectura agregada para la lista "Mis planes".
--
-- Contar ítems totales/completados por plan cruza 4 niveles de join
-- (plan→sección→día→bloque→ítem) más la instancia propia — pedirlo con el
-- cliente REST tal cual haría obtenerResumenSubitemsTareas (un solo nivel)
-- implicaría traer el árbol completo de cada plan solo para contar. Esta
-- función resuelve el conteo en SQL en vez de eso.
--
-- security invoker (no definer): es una lectura pura, sin ninguna regla que
-- necesite privilegios elevados — RLS de cada tabla involucrada ya limita el
-- resultado a lo del usuario autenticado, así que basta con dejar que corra
-- con los privilegios normales de quien la llama.
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
  where p.usuario_id = auth.uid()
  group by p.id;
$$;

grant execute on function public.obtener_resumen_planes() to authenticated;

commit;

notify pgrst, 'reload schema';
