-- Migración 58: cada tarea nace de un TIPO (igual que el wizard de hábitos
-- ofrece plantillas en el paso 0) — el tipo decide cómo se comporta/se ve la
-- tarea, no es una pestaña de la pantalla:
--   simple      → solo título + checkbox, lo más liviano.
--   checklist   → título + lista de sub-ítems propios, cada uno con su check.
--   kanban      → título + columna (por_hacer/en_progreso/hecho).
--   eisenhower  → título + cuadrante urgente/importante (columna prioridad,
--                 que ya existía para esto).
begin;

alter table public.tareas_items add column tipo text not null default 'simple'
  check (tipo in ('simple', 'checklist', 'kanban', 'eisenhower'));

alter table public.tareas_items add column columna_kanban text
  check (columna_kanban in ('por_hacer', 'en_progreso', 'hecho'));

-- Una tarea kanban siempre tiene columna; el resto de tipos, nunca.
alter table public.tareas_items add constraint tareas_items_columna_kanban_coherente
  check ((tipo = 'kanban') = (columna_kanban is not null));

create table public.tareas_subitems (
  id uuid primary key default gen_random_uuid(),
  tarea_id uuid not null references public.tareas_items(id) on delete cascade,
  titulo text not null check (char_length(trim(titulo)) between 1 and 120),
  hecho boolean not null default false,
  orden integer not null default 0,
  created_at timestamptz not null default now()
);

create index tareas_subitems_tarea_id_idx on public.tareas_subitems (tarea_id);

alter table public.tareas_subitems enable row level security;

-- Sin acceso directo a usuario_id en esta tabla — la propiedad se resuelve
-- por join contra tareas_items, igual patrón que habitos_registros/planes
-- respecto de habitos_items.
create policy tareas_subitems_de_tareas_propias on public.tareas_subitems
  for all using (
    exists (select 1 from public.tareas_items t where t.id = tarea_id and t.usuario_id = auth.uid())
  ) with check (
    exists (select 1 from public.tareas_items t where t.id = tarea_id and t.usuario_id = auth.uid())
  );

grant select, insert, update, delete on public.tareas_subitems to authenticated;
grant all on public.tareas_subitems to service_role;

commit;
