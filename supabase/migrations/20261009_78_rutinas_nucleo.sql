-- Migración 78: Rutinas — secuencia ordenada de pasos que se ejecuta como una
-- sesión. Un paso puede ser un hábito existente, una tarea existente o una
-- acción propia de la rutina. Spec: docs/superpowers/specs/2026-10-04-rutinas-design.md
--
-- Fuente de verdad única: completar un paso de hábito o tarea registra el
-- progreso en el hábito/tarea (sus propias tablas); la rutina NO duplica ese
-- registro. Solo los pasos 'propio' guardan progreso aquí
-- (rutinas_pasos_registros). rutinas_registros marca cuándo se inició y se
-- cerró la sesión del día.
--
-- tareas_items.routine_id (migración 59) NO se elimina todavía: el cliente
-- aún lo lee en tareas.servicio.ts. Se borra en un paso posterior, junto con
-- su limpieza en el cliente. rutinas_pasos es la relación autoritativa.
begin;

create table public.rutinas_items (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  titulo text not null check (char_length(trim(titulo)) between 1 and 80),
  descripcion text check (descripcion is null or char_length(trim(descripcion)) <= 280),
  franja public.franja_dia not null default 'cualquier_momento',
  icono_lucide text not null check (char_length(trim(icono_lucide)) between 1 and 80),
  color text not null check (char_length(trim(color)) between 1 and 32),
  estado text not null default 'activa' check (estado in ('activa', 'pausada', 'archivada')),
  frecuencia text not null default 'dias_semana' check (frecuencia in ('diaria', 'dias_semana')),
  dias_semana smallint[],
  hora_inicio time,
  recordatorio_activo boolean not null default false,
  mostrar_nombre_notificacion boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archivada_en timestamptz,
  check (
    (frecuencia = 'diaria' and dias_semana is null)
    or (frecuencia = 'dias_semana' and dias_semana is not null and cardinality(dias_semana) between 1 and 7)
  ),
  check (dias_semana is null or dias_semana <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[]),
  check (not recordatorio_activo or hora_inicio is not null),
  check ((estado = 'archivada') = (archivada_en is not null))
);

create index rutinas_items_usuario_estado_idx on public.rutinas_items (usuario_id, estado, created_at desc);

alter table public.rutinas_items enable row level security;

create policy rutinas_items_propias on public.rutinas_items
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

grant select, insert, update, delete on public.rutinas_items to authenticated;
grant all on public.rutinas_items to service_role;

create trigger rutinas_items_updated_at before update on public.rutinas_items
  for each row execute function public.set_updated_at();

-- ─── Pasos ──────────────────────────────────────────────────────────────
create table public.rutinas_pasos (
  id uuid primary key default gen_random_uuid(),
  rutina_id uuid not null references public.rutinas_items(id) on delete cascade,
  orden smallint not null check (orden >= 1),
  tipo_origen text not null check (tipo_origen in ('habito', 'tarea', 'propio')),
  habito_id uuid references public.habitos_items(id) on delete cascade,
  tarea_id uuid references public.tareas_items(id) on delete cascade,
  -- Solo para tipo_origen = 'propio': minutos (cronometro) o cantidad (contador).
  titulo text,
  modo text check (modo in ('simple', 'cronometro', 'contador')),
  objetivo_valor numeric(10, 2) check (objetivo_valor > 0),
  unidad text check (unidad is null or char_length(trim(unidad)) between 1 and 32),
  unique (rutina_id, orden) deferrable initially deferred,
  check (
    (tipo_origen = 'habito' and habito_id is not null and tarea_id is null
      and titulo is null and modo is null and objetivo_valor is null and unidad is null)
    or (tipo_origen = 'tarea' and tarea_id is not null and habito_id is null
      and titulo is null and modo is null and objetivo_valor is null and unidad is null)
    or (tipo_origen = 'propio' and habito_id is null and tarea_id is null
      and titulo is not null and char_length(trim(titulo)) between 1 and 80 and modo is not null
      and ((modo = 'simple' and objetivo_valor is null) or (modo <> 'simple' and objetivo_valor is not null)))
  )
);

-- Un mismo hábito o tarea no se repite dentro de una rutina.
create unique index rutinas_pasos_habito_unico_idx on public.rutinas_pasos (rutina_id, habito_id) where habito_id is not null;
create unique index rutinas_pasos_tarea_unica_idx on public.rutinas_pasos (rutina_id, tarea_id) where tarea_id is not null;
create index rutinas_pasos_habito_idx on public.rutinas_pasos (habito_id) where habito_id is not null;
create index rutinas_pasos_tarea_idx on public.rutinas_pasos (tarea_id) where tarea_id is not null;

alter table public.rutinas_pasos enable row level security;

create policy rutinas_pasos_de_rutinas_propias on public.rutinas_pasos
  for all
  using (exists (select 1 from public.rutinas_items r where r.id = rutina_id and r.usuario_id = auth.uid()))
  with check (exists (select 1 from public.rutinas_items r where r.id = rutina_id and r.usuario_id = auth.uid()));

grant select, insert, update, delete on public.rutinas_pasos to authenticated;
grant all on public.rutinas_pasos to service_role;

-- RLS por sí sola no impide referenciar el hábito o la tarea de OTRA persona
-- desde una rutina propia (el with check solo mira la rutina). Este trigger lo
-- cierra, y de paso limita a 20 pasos por rutina. Es security invoker a
-- propósito: para un usuario normal, RLS ya oculta hábitos/tareas ajenos; para
-- service_role (que se salta RLS) la comparación explícita de usuario_id basta.
create or replace function public.rutinas_pasos_validar()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_usuario uuid;
begin
  select usuario_id into v_usuario from public.rutinas_items where id = new.rutina_id;
  if v_usuario is null then
    raise exception 'La rutina no existe.' using errcode = 'foreign_key_violation';
  end if;
  if new.habito_id is not null and not exists (
    select 1 from public.habitos_items h where h.id = new.habito_id and h.usuario_id = v_usuario
  ) then
    raise exception 'El hábito no pertenece a la persona dueña de la rutina.' using errcode = 'insufficient_privilege';
  end if;
  if new.tarea_id is not null and not exists (
    select 1 from public.tareas_items t where t.id = new.tarea_id and t.usuario_id = v_usuario
  ) then
    raise exception 'La tarea no pertenece a la persona dueña de la rutina.' using errcode = 'insufficient_privilege';
  end if;
  if tg_op = 'INSERT' and (select count(*) from public.rutinas_pasos where rutina_id = new.rutina_id) >= 20 then
    raise exception 'Una rutina admite como máximo 20 pasos.' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger rutinas_pasos_validar before insert or update on public.rutinas_pasos
  for each row execute function public.rutinas_pasos_validar();

-- ─── Progreso de pasos propios ──────────────────────────────────────────
create table public.rutinas_pasos_registros (
  id uuid primary key default gen_random_uuid(),
  paso_id uuid not null references public.rutinas_pasos(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  fecha_local date not null,
  valor numeric(10, 2) not null default 1 check (valor >= 0),
  completado_en timestamptz not null default now(),
  unique (paso_id, fecha_local)
);

create index rutinas_pasos_registros_usuario_fecha_idx on public.rutinas_pasos_registros (usuario_id, fecha_local);

alter table public.rutinas_pasos_registros enable row level security;

-- El with check exige además que el paso pertenezca a una rutina propia: sin
-- eso alguien podría registrar progreso contra el paso de otra persona.
create policy rutinas_pasos_registros_propios on public.rutinas_pasos_registros
  for all using (usuario_id = auth.uid())
  with check (
    usuario_id = auth.uid()
    and exists (
      select 1 from public.rutinas_pasos p
      join public.rutinas_items r on r.id = p.rutina_id
      where p.id = paso_id and r.usuario_id = auth.uid()
    )
  );

grant select, insert, update, delete on public.rutinas_pasos_registros to authenticated;
grant all on public.rutinas_pasos_registros to service_role;

-- ─── Sesión del día ─────────────────────────────────────────────────────
create table public.rutinas_registros (
  id uuid primary key default gen_random_uuid(),
  rutina_id uuid not null references public.rutinas_items(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  fecha_local date not null,
  iniciada_en timestamptz not null default now(),
  completada_en timestamptz,
  unique (rutina_id, fecha_local)
);

create index rutinas_registros_usuario_fecha_idx on public.rutinas_registros (usuario_id, fecha_local);

alter table public.rutinas_registros enable row level security;

create policy rutinas_registros_propios on public.rutinas_registros
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

grant select, insert, update, delete on public.rutinas_registros to authenticated;
grant all on public.rutinas_registros to service_role;

commit;
