-- Lestinaty MVP: nucleo persistente para caminos de aprendizaje de Estudio.
-- Una seccion activa contiene cinco lecciones, una evaluacion y un cofre asociado.

begin;

create table public.metas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.perfiles_usuario(id) on delete cascade,
  titulo text not null,
  descripcion text,
  estado text not null default 'activa' check (estado in ('activa', 'archivada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(trim(titulo)) between 1 and 120),
  check (descripcion is null or char_length(trim(descripcion)) between 1 and 600)
);

create index metas_usuario_estado_idx on public.metas (usuario_id, estado, created_at desc);

create table public.senderos (
  id uuid primary key default gen_random_uuid(),
  meta_id uuid not null references public.metas(id) on delete cascade,
  categoria_codigo text not null references public.categorias_producto(codigo) on delete restrict,
  titulo text not null,
  descripcion text,
  estado text not null default 'borrador' check (estado in ('borrador', 'activo', 'archivado')),
  origen text not null default 'aby' check (origen in ('aby', 'manual', 'plantilla')),
  version_contenido smallint not null default 1 check (version_contenido > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(trim(titulo)) between 1 and 120),
  check (descripcion is null or char_length(trim(descripcion)) between 1 and 600)
);

create index senderos_meta_estado_idx on public.senderos (meta_id, estado, created_at desc);

create or replace function public.validar_categoria_activa_sendero()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.categorias_producto categoria
    where categoria.codigo = new.categoria_codigo
      and categoria.estado = 'activa'
  ) then
    raise exception 'La categoria % no esta activa.', new.categoria_codigo
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger senderos_validar_categoria_activa
  before insert or update of categoria_codigo on public.senderos
  for each row execute function public.validar_categoria_activa_sendero();

create table public.sendero_niveles (
  id uuid primary key default gen_random_uuid(),
  sendero_id uuid not null references public.senderos(id) on delete cascade,
  numero smallint not null check (numero > 0),
  titulo text not null,
  estado text not null default 'borrador' check (estado in ('borrador', 'activo', 'cerrado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sendero_id, numero),
  check (char_length(trim(titulo)) between 1 and 120)
);

create index sendero_niveles_sendero_numero_idx on public.sendero_niveles (sendero_id, numero);

create table public.sendero_nodos (
  id uuid primary key default gen_random_uuid(),
  nivel_id uuid not null references public.sendero_niveles(id) on delete cascade,
  orden smallint not null check (orden > 0),
  tipo text not null check (tipo in ('leccion', 'evaluacion')),
  titulo text not null,
  descripcion text,
  objetivo text,
  tiempo_estimado_minutos smallint not null check (tiempo_estimado_minutos between 1 and 180),
  lesson_pack_version smallint not null default 1 check (lesson_pack_version > 0),
  lesson_pack jsonb not null default '{"version":1,"bloques":[]}'::jsonb,
  criterio_aprobado jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (nivel_id, orden),
  check (char_length(trim(titulo)) between 1 and 120),
  check (descripcion is null or char_length(trim(descripcion)) between 1 and 600),
  check (objetivo is null or char_length(trim(objetivo)) between 1 and 300),
  check (jsonb_typeof(lesson_pack) = 'object'),
  check (jsonb_typeof(criterio_aprobado) = 'object')
);

create unique index sendero_nodos_una_evaluacion_por_seccion_idx
  on public.sendero_nodos (nivel_id)
  where tipo = 'evaluacion';
create index sendero_nodos_nivel_orden_idx on public.sendero_nodos (nivel_id, orden);

create table public.sendero_conexiones (
  id uuid primary key default gen_random_uuid(),
  sendero_id uuid not null references public.senderos(id) on delete cascade,
  nodo_origen_id uuid not null references public.sendero_nodos(id) on delete cascade,
  nodo_destino_id uuid not null references public.sendero_nodos(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (nodo_origen_id, nodo_destino_id),
  check (nodo_origen_id <> nodo_destino_id)
);

create index sendero_conexiones_sendero_origen_idx on public.sendero_conexiones (sendero_id, nodo_origen_id);

create or replace function public.validar_conexion_sendero()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  sendero_origen uuid;
  sendero_destino uuid;
begin
  select nivel.sendero_id into sendero_origen
  from public.sendero_nodos nodo
  join public.sendero_niveles nivel on nivel.id = nodo.nivel_id
  where nodo.id = new.nodo_origen_id;

  select nivel.sendero_id into sendero_destino
  from public.sendero_nodos nodo
  join public.sendero_niveles nivel on nivel.id = nodo.nivel_id
  where nodo.id = new.nodo_destino_id;

  if sendero_origen is null or sendero_destino is null
    or sendero_origen <> new.sendero_id
    or sendero_destino <> new.sendero_id then
    raise exception 'Una conexion debe unir nodos del mismo sendero.'
      using errcode = 'foreign_key_violation';
  end if;

  return new;
end;
$$;

create trigger sendero_conexiones_validar_pertenencia
  before insert or update on public.sendero_conexiones
  for each row execute function public.validar_conexion_sendero();

create table public.sendero_cofres (
  id uuid primary key default gen_random_uuid(),
  nivel_id uuid not null unique references public.sendero_niveles(id) on delete cascade,
  nodo_evaluacion_id uuid not null unique references public.sendero_nodos(id) on delete cascade,
  gemas smallint not null default 10 check (gemas > 0 and gemas <= 100),
  created_at timestamptz not null default now()
);

create or replace function public.validar_cofre_seccion()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  nivel_evaluacion uuid;
begin
  select nodo.nivel_id into nivel_evaluacion
  from public.sendero_nodos nodo
  where nodo.id = new.nodo_evaluacion_id
    and nodo.tipo = 'evaluacion';

  if nivel_evaluacion is null or nivel_evaluacion <> new.nivel_id then
    raise exception 'El cofre debe vincularse a la evaluacion de su misma seccion.'
      using errcode = 'foreign_key_violation';
  end if;

  return new;
end;
$$;

create trigger sendero_cofres_validar_evaluacion
  before insert or update on public.sendero_cofres
  for each row execute function public.validar_cofre_seccion();

create or replace function public.validar_activacion_seccion()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  lecciones integer;
  evaluaciones integer;
  cofres integer;
begin
  if new.estado <> 'activo' or old.estado = 'activo' then
    return new;
  end if;

  select
    count(*) filter (where nodo.tipo = 'leccion'),
    count(*) filter (where nodo.tipo = 'evaluacion')
  into lecciones, evaluaciones
  from public.sendero_nodos nodo
  where nodo.nivel_id = new.id;

  select count(*) into cofres
  from public.sendero_cofres cofre
  where cofre.nivel_id = new.id;

  if lecciones <> 5 or evaluaciones <> 1 or cofres <> 1 then
    raise exception 'Una seccion activa requiere cinco lecciones, una evaluacion y un cofre.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger sendero_niveles_validar_activacion
  before update of estado on public.sendero_niveles
  for each row execute function public.validar_activacion_seccion();

create or replace function public.bloquear_contenido_activo()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  nivel uuid;
  estado_nivel text;
begin
  nivel := coalesce(new.nivel_id, old.nivel_id);

  select estado into estado_nivel
  from public.sendero_niveles
  where id = nivel;

  if estado_nivel = 'activo' then
    raise exception 'El contenido de una seccion activa es inmutable.'
      using errcode = 'check_violation';
  end if;

  return coalesce(new, old);
end;
$$;

create trigger sendero_nodos_bloquear_edicion_activa
  before update or delete on public.sendero_nodos
  for each row execute function public.bloquear_contenido_activo();

create table public.aby_propuestas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.perfiles_usuario(id) on delete cascade,
  estado text not null default 'lista' check (estado in ('generando', 'lista', 'aceptada', 'rechazada', 'fallida', 'expirada')),
  configuracion jsonb not null,
  propuesta jsonb,
  modelo text,
  error_codigo text,
  expira_at timestamptz not null default (now() + interval '24 hours'),
  aceptada_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(configuracion) = 'object'),
  check (propuesta is null or jsonb_typeof(propuesta) = 'object'),
  check ((estado = 'aceptada') = (aceptada_at is not null))
);

create index aby_propuestas_usuario_estado_idx on public.aby_propuestas (usuario_id, estado, created_at desc);

create table public.aby_generation_locks (
  user_id uuid primary key references public.perfiles_usuario(id) on delete cascade,
  created_at timestamptz not null default now()
);

create trigger metas_set_updated_at
  before update on public.metas
  for each row execute function public.set_updated_at();
create trigger senderos_set_updated_at
  before update on public.senderos
  for each row execute function public.set_updated_at();
create trigger sendero_niveles_set_updated_at
  before update on public.sendero_niveles
  for each row execute function public.set_updated_at();
create trigger sendero_nodos_set_updated_at
  before update on public.sendero_nodos
  for each row execute function public.set_updated_at();
create trigger aby_propuestas_set_updated_at
  before update on public.aby_propuestas
  for each row execute function public.set_updated_at();

alter table public.metas enable row level security;
alter table public.senderos enable row level security;
alter table public.sendero_niveles enable row level security;
alter table public.sendero_nodos enable row level security;
alter table public.sendero_conexiones enable row level security;
alter table public.sendero_cofres enable row level security;
alter table public.aby_propuestas enable row level security;
alter table public.aby_generation_locks enable row level security;

create policy metas_usuario_propio on public.metas
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

create policy senderos_usuario_propio on public.senderos
  for select using (exists (
    select 1 from public.metas meta
    where meta.id = meta_id and meta.usuario_id = auth.uid()
  ));

create policy sendero_niveles_usuario_propio on public.sendero_niveles
  for select using (exists (
    select 1
    from public.senderos sendero
    join public.metas meta on meta.id = sendero.meta_id
    where sendero.id = sendero_id and meta.usuario_id = auth.uid()
  ));

create policy sendero_nodos_usuario_propio on public.sendero_nodos
  for select using (exists (
    select 1
    from public.sendero_niveles nivel
    join public.senderos sendero on sendero.id = nivel.sendero_id
    join public.metas meta on meta.id = sendero.meta_id
    where nivel.id = nivel_id and meta.usuario_id = auth.uid()
  ));

create policy sendero_conexiones_usuario_propio on public.sendero_conexiones
  for select using (exists (
    select 1
    from public.senderos sendero
    join public.metas meta on meta.id = sendero.meta_id
    where sendero.id = sendero_id and meta.usuario_id = auth.uid()
  ));

create policy sendero_cofres_usuario_propio on public.sendero_cofres
  for select using (exists (
    select 1
    from public.sendero_niveles nivel
    join public.senderos sendero on sendero.id = nivel.sendero_id
    join public.metas meta on meta.id = sendero.meta_id
    where nivel.id = nivel_id and meta.usuario_id = auth.uid()
  ));

create policy aby_propuestas_usuario_propio on public.aby_propuestas
  for select using (usuario_id = auth.uid());

grant select, insert, update, delete on public.metas to authenticated;
grant select on public.senderos, public.sendero_niveles, public.sendero_nodos,
  public.sendero_conexiones, public.sendero_cofres, public.aby_propuestas to authenticated;
grant all privileges on public.metas, public.senderos, public.sendero_niveles,
  public.sendero_nodos, public.sendero_conexiones, public.sendero_cofres,
  public.aby_propuestas, public.aby_generation_locks to service_role;

commit;
