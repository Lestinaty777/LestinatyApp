-- Migración 87: áreas de vida y metas. Plan: docs/superpowers/plans/2026-10-09-plan-maestro.md (fase 8).
--
-- Modelo:   ÁREA  →  META  →  hábitos, tareas, rutinas y planes
--   · Un hábito, tarea, rutina o plan pertenece como mucho a UNA meta (meta_id).
--   · Una meta pertenece a UN área. El área de un elemento es la de su meta;
--     no se guarda aparte (una sola fuente de verdad).
--   · Hay 7 áreas del sistema (usuario_id null) y cada persona puede crear las suyas.
--   · Una meta puede tener un plan fijo de días (duracion_dias), opcional.
--
-- public.metas YA EXISTÍA (migración 06, núcleo de estudio: senderos.meta_id
-- la referencia y la Edge Function aceptar-propuesta-aby inserta en ella).
-- Se amplía de forma aditiva: todas las columnas nuevas son anulables o con
-- valor por defecto, así que ese flujo sigue funcionando sin cambios. Por eso
-- area_id es anulable ("sin área"); la interfaz sí la exige al crear.
begin;

-- ─── Áreas ──────────────────────────────────────────────────────────────
create table public.areas_vida (
  id uuid primary key default gen_random_uuid(),
  -- null = área del sistema, visible para todas las personas.
  usuario_id uuid references public.perfiles_usuario(id) on delete cascade,
  -- Solo en áreas del sistema: clave estable para traducir el nombre en la app.
  codigo text,
  nombre text not null check (char_length(trim(nombre)) between 1 and 40),
  color text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  icono_lucide text not null check (char_length(trim(icono_lucide)) between 1 and 40),
  orden smallint not null default 100,
  archivada_en timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((usuario_id is null) = (codigo is not null))
);

create unique index areas_vida_codigo_key on public.areas_vida (codigo) where codigo is not null;
create unique index areas_vida_nombre_por_usuario_key on public.areas_vida (usuario_id, lower(trim(nombre))) where usuario_id is not null;

alter table public.areas_vida enable row level security;

create policy areas_vida_ver on public.areas_vida
  for select using (usuario_id is null or usuario_id = auth.uid());
create policy areas_vida_crear on public.areas_vida
  for insert with check (usuario_id = auth.uid());
create policy areas_vida_editar on public.areas_vida
  for update using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
create policy areas_vida_borrar on public.areas_vida
  for delete using (usuario_id = auth.uid());

revoke all on public.areas_vida from anon, authenticated;
grant select, insert, update, delete on public.areas_vida to authenticated;
grant all on public.areas_vida to service_role;

create trigger areas_vida_updated_at before update on public.areas_vida
  for each row execute function public.set_updated_at();

-- Máximo 20 áreas propias por persona.
create or replace function public.areas_vida_limite()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.usuario_id is not null
    and (select count(*) from public.areas_vida where usuario_id = new.usuario_id) >= 20 then
    raise exception 'Puedes crear como máximo 20 áreas propias.' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
revoke all on function public.areas_vida_limite() from public, anon, authenticated;
create trigger areas_vida_limite before insert on public.areas_vida
  for each row execute function public.areas_vida_limite();

insert into public.areas_vida (codigo, nombre, color, icono_lucide, orden) values
  ('cuerpo',             'Cuerpo',              '#EF4444', 'Dumbbell',  10),
  ('mente',              'Mente',               '#3B82F6', 'Brain',     20),
  ('espiritual',         'Espiritual',          '#22C55E', 'Leaf',      30),
  ('estudios',           'Estudios',            '#8B5CF6', 'BookOpen',  40),
  ('trabajo',            'Trabajo',             '#EAB308', 'Briefcase', 50),
  ('negocios_proyectos', 'Negocios y proyectos','#EC4899', 'Rocket',    60),
  ('finanzas',           'Finanzas',            '#F97316', 'PiggyBank', 70);

-- ─── Metas: ampliación de la tabla existente ────────────────────────────
alter table public.metas
  add column area_id uuid references public.areas_vida(id) on delete set null,
  add column icono_lucide text check (icono_lucide is null or char_length(trim(icono_lucide)) between 1 and 40),
  -- null = usa el color de su área.
  add column color text check (color is null or color ~ '^#[0-9A-Fa-f]{6}$'),
  add column fecha_inicio date not null default current_date,
  -- Plan fijo de días, opcional: null = meta sin plazo.
  add column duracion_dias integer check (duracion_dias is null or duracion_dias between 1 and 3650),
  add column lograda_en timestamptz,
  add column orden integer not null default 0;

alter table public.metas drop constraint metas_estado_check;
alter table public.metas add constraint metas_estado_check
  check (estado in ('activa', 'pausada', 'lograda', 'archivada'));
alter table public.metas add constraint metas_lograda_check
  check ((estado = 'lograda') = (lograda_en is not null));

-- (usuario_id, estado) ya está cubierto por metas_usuario_estado_idx, de la migración 06.
create index metas_area_idx on public.metas (area_id) where area_id is not null;

-- El área de una meta debe ser del sistema o de la misma persona. La FK sola
-- no lo garantiza (las FK no pasan por RLS).
create or replace function public.metas_validar_area()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.area_id is not null and not exists (
    select 1 from public.areas_vida a
    where a.id = new.area_id and (a.usuario_id is null or a.usuario_id = new.usuario_id)
  ) then
    raise exception 'El área no existe o no es tuya.' using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;
revoke all on function public.metas_validar_area() from public, anon, authenticated;
create trigger metas_validar_area before insert or update of area_id, usuario_id on public.metas
  for each row execute function public.metas_validar_area();

-- ─── Enlace de cada elemento con su meta ────────────────────────────────
alter table public.habitos_items add column meta_id uuid references public.metas(id) on delete set null;
alter table public.tareas_items  add column meta_id uuid references public.metas(id) on delete set null;
alter table public.rutinas_items add column meta_id uuid references public.metas(id) on delete set null;
alter table public.planes_items  add column meta_id uuid references public.metas(id) on delete set null;

create index habitos_items_meta_idx on public.habitos_items (meta_id) where meta_id is not null;
create index tareas_items_meta_idx  on public.tareas_items  (meta_id) where meta_id is not null;
create index rutinas_items_meta_idx on public.rutinas_items (meta_id) where meta_id is not null;
create index planes_items_meta_idx  on public.planes_items  (meta_id) where meta_id is not null;

-- La meta enlazada debe ser de la misma persona que el elemento. Un mismo
-- trigger para las cuatro tablas (todas tienen usuario_id y meta_id).
create or replace function public.validar_meta_propia()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.meta_id is not null and not exists (
    select 1 from public.metas m where m.id = new.meta_id and m.usuario_id = new.usuario_id
  ) then
    raise exception 'La meta no existe o no es tuya.' using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;
revoke all on function public.validar_meta_propia() from public, anon, authenticated;

create trigger habitos_items_validar_meta before insert or update of meta_id on public.habitos_items
  for each row execute function public.validar_meta_propia();
create trigger tareas_items_validar_meta before insert or update of meta_id on public.tareas_items
  for each row execute function public.validar_meta_propia();
create trigger rutinas_items_validar_meta before insert or update of meta_id on public.rutinas_items
  for each row execute function public.validar_meta_propia();
create trigger planes_items_validar_meta before insert or update of meta_id on public.planes_items
  for each row execute function public.validar_meta_propia();

-- ─── RPC: asignar o quitar la meta de un elemento ───────────────────────
-- Una sola puerta para los cuatro tipos. p_meta_id null = quitar la meta.
-- Security definer con comprobación explícita de propiedad: así no depende de
-- las policies de update de cada tabla (habitos_items se escribe por RPC).
create or replace function privacidad.asignar_meta(p_tipo text, p_elemento_id uuid, p_meta_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario uuid := auth.uid();
  v_filas integer;
begin
  if v_usuario is null then raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege'; end if;
  if p_meta_id is not null and not exists (select 1 from public.metas where id = p_meta_id and usuario_id = v_usuario) then
    raise exception 'Meta no encontrada.' using errcode = 'no_data_found';
  end if;

  if p_tipo = 'habito' then
    update public.habitos_items set meta_id = p_meta_id where id = p_elemento_id and usuario_id = v_usuario;
  elsif p_tipo = 'tarea' then
    update public.tareas_items set meta_id = p_meta_id where id = p_elemento_id and usuario_id = v_usuario;
  elsif p_tipo = 'rutina' then
    update public.rutinas_items set meta_id = p_meta_id where id = p_elemento_id and usuario_id = v_usuario;
  elsif p_tipo = 'plan' then
    update public.planes_items set meta_id = p_meta_id where id = p_elemento_id and usuario_id = v_usuario;
  else
    raise exception 'Tipo inválido.' using errcode = 'check_violation';
  end if;

  get diagnostics v_filas = row_count;
  if v_filas = 0 then raise exception 'Elemento no encontrado.' using errcode = 'no_data_found'; end if;
end;
$$;

create or replace function public.asignar_meta(p_tipo text, p_elemento_id uuid, p_meta_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$ select privacidad.asignar_meta(p_tipo, p_elemento_id, p_meta_id); $$;

revoke all on function privacidad.asignar_meta(text, uuid, uuid) from public, anon;
revoke all on function public.asignar_meta(text, uuid, uuid) from public, anon;
grant execute on function privacidad.asignar_meta(text, uuid, uuid) to authenticated;
grant execute on function public.asignar_meta(text, uuid, uuid) to authenticated;

-- ─── RPC: metas de la persona con su área, sus días y lo que contienen ──
-- dia_actual / dias_restantes solo tienen sentido con duracion_dias; sin
-- plazo, dia_actual son los días transcurridos y dias_restantes es null.
-- El avance NO se guarda: la persona marca la meta como lograda (estado).
create or replace function public.obtener_metas(p_fecha_referencia date default null)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_usuario uuid := auth.uid();
  v_fecha date;
  v_resultado jsonb;
begin
  if v_usuario is null then raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege'; end if;
  select coalesce(p_fecha_referencia, (now() at time zone zona_horaria)::date) into v_fecha
  from public.perfiles_usuario where id = v_usuario;
  if v_fecha is null then v_fecha := coalesce(p_fecha_referencia, current_date); end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', m.id,
    'titulo', m.titulo,
    'descripcion', m.descripcion,
    'estado', m.estado,
    'icono_lucide', m.icono_lucide,
    'color', coalesce(m.color, a.color),
    'fecha_inicio', m.fecha_inicio,
    'duracion_dias', m.duracion_dias,
    'dia_actual', case
      when v_fecha < m.fecha_inicio then 0
      when m.duracion_dias is null then (v_fecha - m.fecha_inicio) + 1
      else least((v_fecha - m.fecha_inicio) + 1, m.duracion_dias)
    end,
    'dias_restantes', case
      when m.duracion_dias is null then null
      else greatest(m.duracion_dias - greatest((v_fecha - m.fecha_inicio) + 1, 0), 0)
    end,
    'lograda_en', m.lograda_en,
    'orden', m.orden,
    'area', case when a.id is null then null else jsonb_build_object(
      'id', a.id, 'codigo', a.codigo, 'nombre', a.nombre, 'color', a.color, 'icono_lucide', a.icono_lucide
    ) end,
    'conteos', jsonb_build_object(
      'habitos', (select count(*) from public.habitos_items h where h.meta_id = m.id and h.estado = 'activo'),
      'tareas',  (select count(*) from public.tareas_items t  where t.meta_id = m.id and t.estado <> 'archivada'),
      'rutinas', (select count(*) from public.rutinas_items r where r.meta_id = m.id and r.estado <> 'archivada'),
      'planes',  (select count(*) from public.planes_items p  where p.meta_id = m.id)
    )
  ) order by m.orden, m.created_at), '[]'::jsonb)
  into v_resultado
  from public.metas m
  left join public.areas_vida a on a.id = m.area_id
  where m.usuario_id = v_usuario and m.estado <> 'archivada';

  return v_resultado;
end;
$$;

revoke all on function public.obtener_metas(date) from public, anon;
grant execute on function public.obtener_metas(date) to authenticated;

commit;
