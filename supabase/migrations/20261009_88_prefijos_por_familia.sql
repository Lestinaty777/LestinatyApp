-- Migración 88: convención de nombres — toda tabla lleva el prefijo de su
-- familia: habitos_, tareas_, rutinas_, planes_ (y metas / areas_ para lo suyo).
--
-- Cuatro tablas no la cumplían:
--   plantillas_rutinas            → rutinas_plantillas
--   plantillas_rutinas_contenido  → rutinas_plantillas_contenido
--   plantillas_rutinas_compradas  → rutinas_plantillas_compradas
--   tareas_diarias_reclamadas     → habitos_tareas_diarias_reclamadas
-- La última no es del módulo Tareas: son las misiones diarias de HÁBITOS
-- (migración 47), y su prefijo tareas_ la hacía parecer de otra familia.
--
-- Solo cambian nombres de tablas y de sus índices, restricciones, policies y
-- triggers. NO cambian los RPC que usa la app (obtener_plantillas_rutinas,
-- comprar_plantilla_rutina, obtener_tareas_diarias, reclamar_tarea_diaria) ni
-- las columnas ni los datos. Las funciones que nombran esas tablas se vuelven
-- a crear con su misma definición y el nombre nuevo (conservan sus permisos).
--
-- Nota: el ejemplo comentado al inicio de la migración 80 usa los nombres
-- viejos; para añadir una plantilla hay que insertar en rutinas_plantillas y
-- rutinas_plantillas_contenido.
begin;

alter table public.plantillas_rutinas           rename to rutinas_plantillas;
alter table public.plantillas_rutinas_contenido rename to rutinas_plantillas_contenido;
alter table public.plantillas_rutinas_compradas rename to rutinas_plantillas_compradas;
alter table public.tareas_diarias_reclamadas    rename to habitos_tareas_diarias_reclamadas;

alter function public.plantillas_rutinas_validar_contenido() rename to rutinas_plantillas_validar_contenido;

do $$
declare
  r record;
  v_nuevo text;
  v_def text;
begin
  -- Restricciones (renombrar una pkey o unique renombra también su índice).
  for r in
    select c.conrelid::regclass as tabla, c.conname
    from pg_constraint c
    where c.connamespace = 'public'::regnamespace
      and (c.conname like 'plantillas\_rutinas%' or c.conname like 'tareas\_diarias%')
  loop
    v_nuevo := left(replace(replace(r.conname, 'plantillas_rutinas', 'rutinas_plantillas'), 'tareas_diarias', 'habitos_tareas_diarias'), 63);
    execute format('alter table %s rename constraint %I to %I', r.tabla, r.conname, v_nuevo);
  end loop;

  -- Índices que no pertenecen a una restricción.
  for r in
    select indexname from pg_indexes
    where schemaname = 'public' and (indexname like 'plantillas\_rutinas%' or indexname like 'tareas\_diarias%')
  loop
    v_nuevo := left(replace(replace(r.indexname, 'plantillas_rutinas', 'rutinas_plantillas'), 'tareas_diarias', 'habitos_tareas_diarias'), 63);
    execute format('alter index public.%I rename to %I', r.indexname, v_nuevo);
  end loop;

  -- Policies.
  for r in
    select tablename, policyname from pg_policies
    where schemaname = 'public' and (policyname like 'plantillas\_rutinas%' or policyname like 'tareas\_diarias%')
  loop
    v_nuevo := replace(replace(r.policyname, 'plantillas_rutinas', 'rutinas_plantillas'), 'tareas_diarias', 'habitos_tareas_diarias');
    execute format('alter policy %I on public.%I rename to %I', r.policyname, r.tablename, v_nuevo);
  end loop;

  -- Triggers.
  for r in
    select t.tgrelid::regclass as tabla, t.tgname
    from pg_trigger t
    where not t.tgisinternal and (t.tgname like 'plantillas\_rutinas%' or t.tgname like 'tareas\_diarias%')
  loop
    v_nuevo := replace(replace(r.tgname, 'plantillas_rutinas', 'rutinas_plantillas'), 'tareas_diarias', 'habitos_tareas_diarias');
    execute format('alter trigger %I on %s rename to %I', r.tgname, r.tabla, v_nuevo);
  end loop;

  -- Funciones que nombran las tablas (siempre calificadas con public.): misma
  -- definición, nombre nuevo. create or replace conserva dueño y permisos.
  for r in
    select p.oid
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'privacidad', 'comercio')
      and (p.prosrc like '%public.plantillas\_rutinas%' or p.prosrc like '%public.tareas\_diarias\_reclamadas%')
  loop
    v_def := pg_get_functiondef(r.oid);
    v_def := replace(v_def, 'public.plantillas_rutinas', 'public.rutinas_plantillas');
    v_def := replace(v_def, 'public.tareas_diarias_reclamadas', 'public.habitos_tareas_diarias_reclamadas');
    execute v_def;
  end loop;

  -- Guardas: si queda algo con el nombre viejo, la migración entera se cancela.
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'privacidad', 'comercio')
      and (p.prosrc ~ '(^|[^_a-z])plantillas_rutinas' or p.prosrc ~ '(^|[^_a-z])tareas_diarias_reclamadas')
  ) then
    raise exception 'Quedan funciones que nombran las tablas con el nombre viejo.';
  end if;
  if exists (select 1 from pg_class c where c.relnamespace = 'public'::regnamespace and (c.relname like 'plantillas\_rutinas%' or c.relname like 'tareas\_diarias%')) then
    raise exception 'Quedan tablas o índices con el nombre viejo.';
  end if;
end;
$$;

commit;
