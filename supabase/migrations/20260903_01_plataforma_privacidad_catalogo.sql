-- Lestinaty MVP: plataforma comun para caminos de aprendizaje.
-- Ejecutar despues de eliminar manualmente las tablas heredadas vacias.

create extension if not exists pgcrypto;

create schema if not exists privacidad;
revoke all on schema privacidad from public;
grant usage on schema privacidad to authenticated, service_role;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.categorias_producto (
  codigo text primary key check (codigo ~ '^[a-z_]+$'),
  nombre text not null,
  estado text not null check (estado in ('activa', 'proximamente')),
  orden_visual smallint not null unique check (orden_visual > 0),
  created_at timestamptz not null default now()
);

insert into public.categorias_producto (codigo, nombre, estado, orden_visual)
values
  ('estudio', 'Estudio', 'activa', 1),
  ('salud', 'Salud', 'proximamente', 2),
  ('finanzas', 'Finanzas', 'proximamente', 3),
  ('rutinas', 'Rutinas', 'proximamente', 4),
  ('habitos', 'Habitos', 'proximamente', 5),
  ('tareas', 'Tareas', 'proximamente', 6),
  ('relaciones', 'Relaciones', 'proximamente', 7)
on conflict (codigo) do update
set nombre = excluded.nombre,
    estado = excluded.estado,
    orden_visual = excluded.orden_visual;

create table public.perfiles_usuario (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre_visible text,
  zona_horaria text not null default 'UTC',
  idioma text not null default 'es',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(zona_horaria) between 1 and 64),
  check (char_length(idioma) between 2 and 16),
  check (nombre_visible is null or char_length(nombre_visible) between 1 and 80)
);

create table privacidad.usuario_permisos_datos (
  usuario_id uuid primary key references public.perfiles_usuario(id) on delete cascade,
  permite_contexto_aby boolean not null default false,
  permite_procesar_fuentes boolean not null default false,
  permite_analitica_producto boolean not null default false,
  version_aviso text,
  otorgado_at timestamptz,
  revocado_at timestamptz,
  updated_at timestamptz not null default now(),
  check (
    (permite_contexto_aby or permite_procesar_fuentes or permite_analitica_producto)
    or revocado_at is not null
  )
);

create table privacidad.auditoria_permisos_datos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.perfiles_usuario(id) on delete cascade,
  actor_usuario_id uuid references public.perfiles_usuario(id) on delete set null,
  cambio jsonb not null,
  version_aviso text,
  created_at timestamptz not null default now(),
  check (jsonb_typeof(cambio) = 'object')
);

create table public.documentos_legales (
  id uuid primary key default gen_random_uuid(),
  codigo text not null check (codigo in ('privacidad', 'terminos', 'uso_ia', 'comunidad')),
  version text not null,
  idioma text not null default 'es',
  url_publica text not null,
  contenido_hash text not null,
  publicado_at timestamptz not null default now(),
  retirado_at timestamptz,
  unique (codigo, version, idioma)
);

create table privacidad.aceptaciones_documentos_legales (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.perfiles_usuario(id) on delete cascade,
  documento_id uuid not null references public.documentos_legales(id) on delete restrict,
  aceptado_at timestamptz not null default now(),
  origen text not null check (origen in ('registro', 'configuracion', 'actualizacion')),
  unique (usuario_id, documento_id)
);

create table privacidad.solicitudes_privacidad (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.perfiles_usuario(id) on delete cascade,
  tipo text not null check (tipo in ('exportacion', 'eliminacion', 'correccion')),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'en_proceso', 'completada', 'rechazada', 'cancelada')),
  motivo text,
  solicitada_at timestamptz not null default now(),
  fecha_limite timestamptz,
  resuelta_at timestamptz,
  evidencia_resolucion jsonb,
  check (motivo is null or char_length(motivo) <= 1000),
  check (evidencia_resolucion is null or jsonb_typeof(evidencia_resolucion) = 'object')
);

create unique index solicitudes_privacidad_abiertas_usuario_tipo_idx
  on privacidad.solicitudes_privacidad (usuario_id, tipo)
  where estado in ('pendiente', 'en_proceso');

create table public.responsables_privacidad (
  id uuid primary key default gen_random_uuid(),
  nombre_legal text not null,
  correo_contacto text not null,
  jurisdiccion text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table privacidad.incidentes_privacidad (
  id uuid primary key default gen_random_uuid(),
  detectado_at timestamptz not null default now(),
  estado text not null default 'abierto' check (estado in ('abierto', 'investigando', 'contenido', 'notificado', 'cerrado')),
  severidad text not null check (severidad in ('baja', 'media', 'alta', 'critica')),
  evaluacion jsonb not null default '{}'::jsonb,
  cerrado_at timestamptz,
  check (jsonb_typeof(evaluacion) = 'object')
);

create table public.catalogo_notificaciones (
  codigo text primary key,
  grupo text not null check (grupo in ('programada', 'evento', 'proactiva')),
  prioridad smallint not null check (prioridad between 1 and 10),
  es_proactiva boolean not null default false,
  descripcion text not null,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  check ((grupo = 'proactiva') = es_proactiva)
);

insert into public.catalogo_notificaciones (codigo, grupo, prioridad, es_proactiva, descripcion)
values
  ('hoy_sesion_proxima', 'programada', 6, false, 'Aviso previo a una sesion programada.'),
  ('hoy_sesion_inicio', 'programada', 8, false, 'Aviso al inicio de una sesion programada.'),
  ('hoy_repaso_pendiente', 'evento', 5, false, 'Repaso espaciado disponible.'),
  ('hoy_evaluacion_disponible', 'evento', 7, false, 'Evaluacion de seccion disponible.'),
  ('hoy_cofre_disponible', 'evento', 5, false, 'Recompensa disponible tras aprobar una seccion.'),
  ('hoy_resumen_diario', 'proactiva', 3, true, 'Resumen diario opcional.'),
  ('hoy_racha_recuperable', 'proactiva', 2, true, 'Sugerencia opcional para recuperar continuidad.')
on conflict (codigo) do update
set grupo = excluded.grupo,
    prioridad = excluded.prioridad,
    es_proactiva = excluded.es_proactiva,
    descripcion = excluded.descripcion,
    activo = true;

create table public.preferencias_notificacion_usuario (
  usuario_id uuid not null references public.perfiles_usuario(id) on delete cascade,
  catalogo_codigo text not null references public.catalogo_notificaciones(codigo) on delete restrict,
  habilitada boolean not null default false,
  anticipacion_minutos smallint,
  ventana_silenciosa_inicio time,
  ventana_silenciosa_fin time,
  updated_at timestamptz not null default now(),
  primary key (usuario_id, catalogo_codigo),
  check (anticipacion_minutos is null or anticipacion_minutos between 0 and 1440)
);

create table privacidad.dispositivos_notificacion (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.perfiles_usuario(id) on delete cascade,
  onesignal_subscription_id text not null unique,
  plataforma text not null check (plataforma in ('ios', 'android', 'web')),
  permiso_nativo text not null check (permiso_nativo in ('desconocido', 'denegado', 'provisional', 'concedido')),
  ultimo_uso_at timestamptz not null default now(),
  dado_de_baja_at timestamptz,
  created_at timestamptz not null default now()
);

create index dispositivos_notificacion_usuario_activo_idx
  on privacidad.dispositivos_notificacion (usuario_id, ultimo_uso_at desc)
  where dado_de_baja_at is null;

create table privacidad.presupuestos_notificacion_usuario (
  usuario_id uuid not null references public.perfiles_usuario(id) on delete cascade,
  fecha_local date not null,
  grupo text not null check (grupo = 'proactiva'),
  enviados smallint not null default 0 check (enviados between 0 and 2),
  ultima_reserva_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (usuario_id, fecha_local, grupo)
);

create or replace function privacidad.crear_datos_usuario_nuevo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles_usuario (id, nombre_visible)
  values (new.id, nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''))
  on conflict (id) do nothing;

  insert into privacidad.usuario_permisos_datos (usuario_id, revocado_at)
  values (new.id, now())
  on conflict (usuario_id) do nothing;

  insert into public.preferencias_notificacion_usuario (usuario_id, catalogo_codigo)
  select new.id, codigo
  from public.catalogo_notificaciones
  where activo
  on conflict (usuario_id, catalogo_codigo) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_lestinaty on auth.users;
create trigger on_auth_user_created_lestinaty
  after insert on auth.users
  for each row execute procedure privacidad.crear_datos_usuario_nuevo();

-- The trigger only runs for future registrations. Backfill existing Auth users
-- so the first migration is safe to apply to a project that already has tests.
insert into public.perfiles_usuario (id, nombre_visible)
select
  usuario.id,
  nullif(trim(coalesce(usuario.raw_user_meta_data ->> 'full_name', '')), '')
from auth.users as usuario
on conflict (id) do nothing;

insert into privacidad.usuario_permisos_datos (usuario_id, revocado_at)
select perfil.id, now()
from public.perfiles_usuario as perfil
on conflict (usuario_id) do nothing;

insert into public.preferencias_notificacion_usuario (usuario_id, catalogo_codigo)
select perfil.id, catalogo.codigo
from public.perfiles_usuario as perfil
cross join public.catalogo_notificaciones as catalogo
where catalogo.activo
on conflict (usuario_id, catalogo_codigo) do nothing;

create trigger perfiles_usuario_updated_at
  before update on public.perfiles_usuario
  for each row execute procedure public.set_updated_at();

create trigger permisos_datos_updated_at
  before update on privacidad.usuario_permisos_datos
  for each row execute procedure public.set_updated_at();

create trigger preferencias_notificacion_updated_at
  before update on public.preferencias_notificacion_usuario
  for each row execute procedure public.set_updated_at();

create trigger presupuestos_notificacion_updated_at
  before update on privacidad.presupuestos_notificacion_usuario
  for each row execute procedure public.set_updated_at();

-- The client can request a consent change, but this function is the only path
-- that persists it and writes an immutable before/after audit record.
create or replace function privacidad.actualizar_permisos_datos(
  p_permite_contexto_aby boolean,
  p_permite_procesar_fuentes boolean,
  p_permite_analitica_producto boolean,
  p_version_aviso text
)
returns privacidad.usuario_permisos_datos
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid := auth.uid();
  v_anterior privacidad.usuario_permisos_datos%rowtype;
  v_actualizado privacidad.usuario_permisos_datos%rowtype;
  v_habia_permiso boolean;
  v_hay_permiso boolean;
  v_hubo_cambio boolean;
begin
  if v_usuario_id is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  if nullif(trim(p_version_aviso), '') is null then
    raise exception 'consent notice version is required' using errcode = '22023';
  end if;

  select * into v_anterior
  from privacidad.usuario_permisos_datos
  where usuario_id = v_usuario_id
  for update;

  if not found then
    raise exception 'data permissions row not found' using errcode = 'P0002';
  end if;

  v_hubo_cambio :=
    v_anterior.permite_contexto_aby is distinct from p_permite_contexto_aby
    or v_anterior.permite_procesar_fuentes is distinct from p_permite_procesar_fuentes
    or v_anterior.permite_analitica_producto is distinct from p_permite_analitica_producto
    or v_anterior.version_aviso is distinct from p_version_aviso;

  if not v_hubo_cambio then
    return v_anterior;
  end if;

  v_habia_permiso := v_anterior.permite_contexto_aby
    or v_anterior.permite_procesar_fuentes
    or v_anterior.permite_analitica_producto;
  v_hay_permiso := p_permite_contexto_aby
    or p_permite_procesar_fuentes
    or p_permite_analitica_producto;

  update privacidad.usuario_permisos_datos
  set permite_contexto_aby = p_permite_contexto_aby,
      permite_procesar_fuentes = p_permite_procesar_fuentes,
      permite_analitica_producto = p_permite_analitica_producto,
      version_aviso = p_version_aviso,
      otorgado_at = case
        when not v_habia_permiso and v_hay_permiso then now()
        else v_anterior.otorgado_at
      end,
      revocado_at = case
        when v_hay_permiso then null
        when v_habia_permiso then now()
        else v_anterior.revocado_at
      end
  where usuario_id = v_usuario_id
  returning * into v_actualizado;

  insert into privacidad.auditoria_permisos_datos (
    usuario_id,
    actor_usuario_id,
    cambio,
    version_aviso
  ) values (
    v_usuario_id,
    v_usuario_id,
    jsonb_build_object(
      'before', jsonb_build_object(
        'permite_contexto_aby', v_anterior.permite_contexto_aby,
        'permite_procesar_fuentes', v_anterior.permite_procesar_fuentes,
        'permite_analitica_producto', v_anterior.permite_analitica_producto,
        'version_aviso', v_anterior.version_aviso,
        'otorgado_at', v_anterior.otorgado_at,
        'revocado_at', v_anterior.revocado_at
      ),
      'after', jsonb_build_object(
        'permite_contexto_aby', v_actualizado.permite_contexto_aby,
        'permite_procesar_fuentes', v_actualizado.permite_procesar_fuentes,
        'permite_analitica_producto', v_actualizado.permite_analitica_producto,
        'version_aviso', v_actualizado.version_aviso,
        'otorgado_at', v_actualizado.otorgado_at,
        'revocado_at', v_actualizado.revocado_at
      )
    ),
    p_version_aviso
  );

  return v_actualizado;
end;
$$;

-- ON CONFLICT takes an exclusive row lock when the same subscription is moved
-- between accounts, so device registration and a concurrent logout serialize.
create or replace function privacidad.registrar_dispositivo_notificacion(
  p_onesignal_subscription_id text,
  p_plataforma text,
  p_permiso_nativo text
)
returns privacidad.dispositivos_notificacion
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid := auth.uid();
  v_dispositivo privacidad.dispositivos_notificacion%rowtype;
begin
  if v_usuario_id is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  if nullif(trim(p_onesignal_subscription_id), '') is null
    or p_plataforma is null
    or p_plataforma not in ('ios', 'android', 'web')
    or p_permiso_nativo is null
    or p_permiso_nativo not in ('desconocido', 'denegado', 'provisional', 'concedido') then
    raise exception 'invalid notification device payload' using errcode = '22023';
  end if;

  insert into privacidad.dispositivos_notificacion (
    usuario_id,
    onesignal_subscription_id,
    plataforma,
    permiso_nativo,
    ultimo_uso_at,
    dado_de_baja_at
  ) values (
    v_usuario_id,
    p_onesignal_subscription_id,
    p_plataforma,
    p_permiso_nativo,
    now(),
    null
  )
  on conflict (onesignal_subscription_id) do update
  set usuario_id = excluded.usuario_id,
      plataforma = excluded.plataforma,
      permiso_nativo = excluded.permiso_nativo,
      ultimo_uso_at = excluded.ultimo_uso_at,
      dado_de_baja_at = null
  returning * into v_dispositivo;

  return v_dispositivo;
end;
$$;

create or replace function privacidad.desvincular_dispositivo_notificacion(
  p_onesignal_subscription_id text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid := auth.uid();
  v_filas_actualizadas integer;
begin
  if v_usuario_id is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  update privacidad.dispositivos_notificacion
  set dado_de_baja_at = now()
  where onesignal_subscription_id = p_onesignal_subscription_id
    and usuario_id = v_usuario_id
    and dado_de_baja_at is null;

  get diagnostics v_filas_actualizadas = row_count;
  return v_filas_actualizadas = 1;
end;
$$;

create or replace function privacidad.obtener_mis_permisos_datos()
returns privacidad.usuario_permisos_datos
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid := auth.uid();
  v_permisos privacidad.usuario_permisos_datos%rowtype;
begin
  if v_usuario_id is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  select * into v_permisos
  from privacidad.usuario_permisos_datos
  where usuario_id = v_usuario_id;

  if not found then
    raise exception 'data permissions row not found' using errcode = 'P0002';
  end if;

  return v_permisos;
end;
$$;

create or replace function privacidad.aceptar_documento_legal(
  p_documento_id uuid,
  p_origen text
)
returns privacidad.aceptaciones_documentos_legales
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid := auth.uid();
  v_aceptacion privacidad.aceptaciones_documentos_legales%rowtype;
begin
  if v_usuario_id is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  if p_origen not in ('registro', 'configuracion', 'actualizacion') then
    raise exception 'invalid legal acceptance origin' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.documentos_legales
    where id = p_documento_id
      and retirado_at is null
  ) then
    raise exception 'legal document is not active' using errcode = '22023';
  end if;

  insert into privacidad.aceptaciones_documentos_legales (
    usuario_id,
    documento_id,
    origen
  ) values (
    v_usuario_id,
    p_documento_id,
    p_origen
  )
  on conflict (usuario_id, documento_id) do nothing
  returning * into v_aceptacion;

  if v_aceptacion.id is null then
    select * into v_aceptacion
    from privacidad.aceptaciones_documentos_legales
    where usuario_id = v_usuario_id
      and documento_id = p_documento_id;
  end if;

  return v_aceptacion;
end;
$$;

create or replace function privacidad.crear_solicitud_privacidad(
  p_tipo text,
  p_motivo text default null
)
returns privacidad.solicitudes_privacidad
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid := auth.uid();
  v_solicitud privacidad.solicitudes_privacidad%rowtype;
begin
  if v_usuario_id is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  if p_tipo not in ('exportacion', 'eliminacion', 'correccion') then
    raise exception 'invalid privacy request type' using errcode = '22023';
  end if;

  if p_motivo is not null and char_length(p_motivo) > 1000 then
    raise exception 'privacy request reason is too long' using errcode = '22023';
  end if;

  insert into privacidad.solicitudes_privacidad (
    usuario_id,
    tipo,
    motivo
  ) values (
    v_usuario_id,
    p_tipo,
    p_motivo
  )
  on conflict (usuario_id, tipo) where estado in ('pendiente', 'en_proceso') do update
  set motivo = excluded.motivo
  returning * into v_solicitud;

  return v_solicitud;
end;
$$;

create or replace function privacidad.obtener_mis_aceptaciones_legales()
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'documento_id', aceptacion.documento_id,
        'aceptado_at', aceptacion.aceptado_at,
        'origen', aceptacion.origen
      ) order by aceptacion.aceptado_at desc
    ),
    '[]'::jsonb
  )
  from privacidad.aceptaciones_documentos_legales as aceptacion
  where aceptacion.usuario_id = auth.uid();
$$;

create or replace function privacidad.obtener_mis_solicitudes_privacidad_activas()
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', solicitud.id,
        'tipo', solicitud.tipo,
        'estado', solicitud.estado,
        'solicitada_at', solicitud.solicitada_at,
        'fecha_limite', solicitud.fecha_limite
      ) order by solicitud.solicitada_at desc
    ),
    '[]'::jsonb
  )
  from privacidad.solicitudes_privacidad as solicitud
  where solicitud.usuario_id = auth.uid()
    and solicitud.estado in ('pendiente', 'en_proceso');
$$;

-- Private tables intentionally have no client policies. Fail during migration
-- instead of later returning misleading empty results if a non-bypass owner
-- creates one of these security definer functions.
do $$
begin
  if exists (
    select 1
    from pg_catalog.pg_proc as routine
    join pg_catalog.pg_roles as owner on owner.oid = routine.proowner
    where routine.oid in (
      'privacidad.crear_datos_usuario_nuevo()'::regprocedure,
      'privacidad.actualizar_permisos_datos(boolean,boolean,boolean,text)'::regprocedure,
      'privacidad.registrar_dispositivo_notificacion(text,text,text)'::regprocedure,
      'privacidad.desvincular_dispositivo_notificacion(text)'::regprocedure,
      'privacidad.obtener_mis_permisos_datos()'::regprocedure,
      'privacidad.aceptar_documento_legal(uuid,text)'::regprocedure,
      'privacidad.crear_solicitud_privacidad(text,text)'::regprocedure,
      'privacidad.obtener_mis_aceptaciones_legales()'::regprocedure,
      'privacidad.obtener_mis_solicitudes_privacidad_activas()'::regprocedure
    )
      and not owner.rolbypassrls
  ) then
    raise exception
      'privacy security definer functions require an owner with BYPASSRLS';
  end if;
end;
$$;

revoke all on function privacidad.actualizar_permisos_datos(boolean, boolean, boolean, text) from public, anon;
revoke all on function privacidad.registrar_dispositivo_notificacion(text, text, text) from public, anon;
revoke all on function privacidad.desvincular_dispositivo_notificacion(text) from public, anon;
revoke all on function privacidad.obtener_mis_permisos_datos() from public, anon;
revoke all on function privacidad.aceptar_documento_legal(uuid, text) from public, anon;
revoke all on function privacidad.crear_solicitud_privacidad(text, text) from public, anon;
revoke all on function privacidad.obtener_mis_aceptaciones_legales() from public, anon;
revoke all on function privacidad.obtener_mis_solicitudes_privacidad_activas() from public, anon;
grant execute on function privacidad.actualizar_permisos_datos(boolean, boolean, boolean, text) to authenticated, service_role;
grant execute on function privacidad.registrar_dispositivo_notificacion(text, text, text) to authenticated, service_role;
grant execute on function privacidad.desvincular_dispositivo_notificacion(text) to authenticated, service_role;
grant execute on function privacidad.obtener_mis_permisos_datos() to authenticated, service_role;
grant execute on function privacidad.aceptar_documento_legal(uuid, text) to authenticated, service_role;
grant execute on function privacidad.crear_solicitud_privacidad(text, text) to authenticated, service_role;
grant execute on function privacidad.obtener_mis_aceptaciones_legales() to authenticated, service_role;
grant execute on function privacidad.obtener_mis_solicitudes_privacidad_activas() to authenticated, service_role;

-- The app calls these invoker wrappers through the public Data API. Privileged
-- implementations stay in the unexposed privacidad schema.
create or replace function public.actualizar_permisos_datos(
  p_permite_contexto_aby boolean,
  p_permite_procesar_fuentes boolean,
  p_permite_analitica_producto boolean,
  p_version_aviso text
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select to_jsonb(privacidad.actualizar_permisos_datos(
    p_permite_contexto_aby,
    p_permite_procesar_fuentes,
    p_permite_analitica_producto,
    p_version_aviso
  ));
$$;

create or replace function public.registrar_dispositivo_notificacion(
  p_onesignal_subscription_id text,
  p_plataforma text,
  p_permiso_nativo text
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select to_jsonb(privacidad.registrar_dispositivo_notificacion(
    p_onesignal_subscription_id,
    p_plataforma,
    p_permiso_nativo
  ));
$$;

create or replace function public.desvincular_dispositivo_notificacion(
  p_onesignal_subscription_id text
)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  select privacidad.desvincular_dispositivo_notificacion(p_onesignal_subscription_id);
$$;

create or replace function public.obtener_permisos_datos()
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select to_jsonb(privacidad.obtener_mis_permisos_datos());
$$;

create or replace function public.aceptar_documento_legal(
  p_documento_id uuid,
  p_origen text
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select to_jsonb(privacidad.aceptar_documento_legal(p_documento_id, p_origen));
$$;

create or replace function public.crear_solicitud_privacidad(
  p_tipo text,
  p_motivo text default null
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select to_jsonb(privacidad.crear_solicitud_privacidad(p_tipo, p_motivo));
$$;

create or replace function public.obtener_aceptaciones_legales()
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select privacidad.obtener_mis_aceptaciones_legales();
$$;

create or replace function public.obtener_solicitudes_privacidad_activas()
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select privacidad.obtener_mis_solicitudes_privacidad_activas();
$$;

revoke all on function public.actualizar_permisos_datos(boolean, boolean, boolean, text) from public, anon;
revoke all on function public.registrar_dispositivo_notificacion(text, text, text) from public, anon;
revoke all on function public.desvincular_dispositivo_notificacion(text) from public, anon;
revoke all on function public.obtener_permisos_datos() from public, anon;
revoke all on function public.aceptar_documento_legal(uuid, text) from public, anon;
revoke all on function public.crear_solicitud_privacidad(text, text) from public, anon;
revoke all on function public.obtener_aceptaciones_legales() from public, anon;
revoke all on function public.obtener_solicitudes_privacidad_activas() from public, anon;
grant execute on function public.actualizar_permisos_datos(boolean, boolean, boolean, text) to authenticated, service_role;
grant execute on function public.registrar_dispositivo_notificacion(text, text, text) to authenticated, service_role;
grant execute on function public.desvincular_dispositivo_notificacion(text) to authenticated, service_role;
grant execute on function public.obtener_permisos_datos() to authenticated, service_role;
grant execute on function public.aceptar_documento_legal(uuid, text) to authenticated, service_role;
grant execute on function public.crear_solicitud_privacidad(text, text) to authenticated, service_role;
grant execute on function public.obtener_aceptaciones_legales() to authenticated, service_role;
grant execute on function public.obtener_solicitudes_privacidad_activas() to authenticated, service_role;

alter table public.categorias_producto enable row level security;
alter table public.perfiles_usuario enable row level security;
alter table privacidad.usuario_permisos_datos enable row level security;
alter table privacidad.auditoria_permisos_datos enable row level security;
alter table public.documentos_legales enable row level security;
alter table privacidad.aceptaciones_documentos_legales enable row level security;
alter table privacidad.solicitudes_privacidad enable row level security;
alter table public.responsables_privacidad enable row level security;
alter table privacidad.incidentes_privacidad enable row level security;
alter table public.catalogo_notificaciones enable row level security;
alter table public.preferencias_notificacion_usuario enable row level security;
alter table privacidad.dispositivos_notificacion enable row level security;
alter table privacidad.presupuestos_notificacion_usuario enable row level security;

create policy "public_read_product_categories"
  on public.categorias_producto for select using (true);

create policy "users_read_own_profile"
  on public.perfiles_usuario for select using (auth.uid() = id);
create policy "users_update_own_profile"
  on public.perfiles_usuario for update using (auth.uid() = id) with check (auth.uid() = id);

-- Privilegios SQL: RLS sigue siendo la capa que limita las filas accesibles.
grant select, update on public.perfiles_usuario to authenticated;
grant select on public.categorias_producto to anon, authenticated;
grant select on public.documentos_legales to anon, authenticated;
grant select on public.responsables_privacidad to anon, authenticated;
grant select on public.catalogo_notificaciones to anon, authenticated;
grant select, update on public.preferencias_notificacion_usuario to authenticated;
grant all privileges on public.categorias_producto to service_role;
grant all privileges on public.perfiles_usuario to service_role;
grant all privileges on public.documentos_legales to service_role;
grant all privileges on public.responsables_privacidad to service_role;
grant all privileges on public.catalogo_notificaciones to service_role;
grant all privileges on public.preferencias_notificacion_usuario to service_role;
grant all privileges on privacidad.usuario_permisos_datos to service_role;
grant all privileges on privacidad.auditoria_permisos_datos to service_role;
grant all privileges on privacidad.aceptaciones_documentos_legales to service_role;
grant all privileges on privacidad.solicitudes_privacidad to service_role;
grant all privileges on privacidad.incidentes_privacidad to service_role;
grant all privileges on privacidad.dispositivos_notificacion to service_role;
grant all privileges on privacidad.presupuestos_notificacion_usuario to service_role;

create policy "public_read_active_legal_documents"
  on public.documentos_legales for select using (retirado_at is null);

create policy "public_read_active_privacy_contact"
  on public.responsables_privacidad for select using (activo);

create policy "public_read_notification_catalog"
  on public.catalogo_notificaciones for select using (activo);
create policy "users_read_own_notification_preferences"
  on public.preferencias_notificacion_usuario for select using (auth.uid() = usuario_id);
create policy "users_update_own_notification_preferences"
  on public.preferencias_notificacion_usuario for update using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);
