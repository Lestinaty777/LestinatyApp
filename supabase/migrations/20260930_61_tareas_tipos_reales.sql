-- Decisión de producto (ver plan): Kanban y Eisenhower NO son un "tipo" de
-- tarea con su propia mecánica de completar — son VISTAS de organización
-- sobre cualquiera de los 4 tipos reales (simple/checklist/contador/
-- cronómetro). Antes de esta migración no había ninguna fila de tareas_items
-- creada todavía (el frontend seguía en mock), así que no hay nada que
-- migrar de datos — solo se corrige el esquema antes de que el primero se
-- escriba de verdad.
begin;

alter table public.tareas_items drop constraint tareas_items_columna_kanban_coherente;
alter table public.tareas_items drop constraint tareas_items_tipo_check;

alter table public.tareas_items add constraint tareas_items_tipo_check
  check (tipo in ('simple', 'checklist', 'contador', 'cronometro'));

commit;
