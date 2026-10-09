-- Migración 89: elimina tareas_items.routine_id (migración 59).
--
-- Se añadió "para cuando existiera la tabla de rutinas", sin references y sin
-- que ninguna pantalla la usara. La relación real entre una tarea y sus
-- rutinas es rutinas_pasos (una tarea puede estar en varias rutinas), así que
-- la columna era una segunda fuente de verdad vacía.
--
-- APLICAR SOLO cuando la app instalada ya no la lea: el cliente dejó de pedir
-- routine_id en el commit "refactor(tareas): quitar routineId del cliente".
-- Una app anterior a ese commit falla al cargar Tareas si la columna no existe.
begin;

do $$
begin
  if exists (select 1 from public.tareas_items where routine_id is not null) then
    raise exception 'Hay tareas con routine_id: revisar antes de borrar la columna.';
  end if;
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'privacidad', 'comercio') and p.prosrc like '%routine_id%'
  ) then
    raise exception 'Hay funciones que nombran routine_id: revisar antes de borrar la columna.';
  end if;
end;
$$;

alter table public.tareas_items drop column routine_id;

commit;
