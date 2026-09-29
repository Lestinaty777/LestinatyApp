-- Migración 56: Tareas — gestor clásico (lista/kanban/agenda/eisenhower/time
-- block), un sistema aparte del de hábitos: sin árbol, sin mandala, sin nivel,
-- sin camino en Senderos. Lo único que comparte con hábitos es el INVENTARIO
-- de semillas (usuario_semillas): una semilla se puede plantar en un hábito
-- O usar para "vestir" una tarea (color/ícono del paquete), nunca las dos a
-- la vez — así 3 semillas de un mismo paquete siguen siendo 3 semillas,
-- repartibles entre hábitos y tareas, sin inflar el inventario.
begin;

create table public.tareas_items (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  titulo text not null check (char_length(trim(titulo)) between 1 and 120),
  descripcion text,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'hecha', 'archivada')),
  -- Cuadrante de Eisenhower — nullable: una tarea puede vivir solo en la
  -- lista/agenda sin haber sido clasificada todavía.
  prioridad text check (prioridad in ('urgente_importante', 'urgente_no_importante', 'no_urgente_importante', 'no_urgente_no_importante')),
  fecha_vencimiento date,
  -- Cosmético, igual que en habitos_items: color e ícono se copian del
  -- paquete al crear (o quedan null si la tarea no usa semilla), así una
  -- baja de precio o un color nuevo del paquete no le cambia el look a una
  -- tarea ya creada — mismo criterio que ya usa habitos_items.color.
  paquete_id text references public.arboles_paquetes(id),
  color text,
  icono_lucide text,
  -- Posición dentro de su columna de Kanban/estado — el cliente reordena
  -- localmente y persiste el orden final; sin índice único porque dos
  -- tareas pueden empatar durante un reordenamiento a medio hacer.
  orden integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completada_en timestamptz
);

create index tareas_items_usuario_id_idx on public.tareas_items (usuario_id, estado);

alter table public.tareas_items enable row level security;

create policy tareas_items_propias on public.tareas_items
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

grant select, insert, update, delete on public.tareas_items to authenticated;
grant all on public.tareas_items to service_role;

create trigger tareas_items_updated_at before update on public.tareas_items
  for each row execute function set_updated_at();

-- ─── Semillas compartidas: una tarea también puede "consumir" una semilla,
-- igual que un hábito, nunca ambas cosas para la misma fila.
alter table public.usuario_semillas add column tarea_id uuid references public.tareas_items(id) on delete set null;

alter table public.usuario_semillas add constraint usuario_semillas_un_solo_destino
  check (not (habito_id is not null and tarea_id is not null));

commit;
