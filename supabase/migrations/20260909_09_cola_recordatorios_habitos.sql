-- Cola privada de recordatorios de Hábitos. Expo no puede leerla ni escribirla.

begin;

create table privacidad.notificaciones_programadas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.perfiles_usuario(id) on delete cascade,
  plan_habito_id uuid not null references public.habitos_planes(id) on delete cascade,
  fecha_local date not null,
  programada_para timestamptz not null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'reclamada', 'enviada', 'cancelada', 'fallida')),
  intentos smallint not null default 0 check (intentos between 0 and 3),
  reclamada_at timestamptz,
  enviada_at timestamptz,
  error_codigo text,
  created_at timestamptz not null default now(),
  unique (plan_habito_id, fecha_local)
);

create index notificaciones_programadas_pendientes_idx
  on privacidad.notificaciones_programadas (programada_para)
  where estado = 'pendiente';

create table privacidad.notificaciones_entregas (
  id uuid primary key default gen_random_uuid(),
  notificacion_id uuid not null references privacidad.notificaciones_programadas(id) on delete cascade,
  dispositivo_id uuid references privacidad.dispositivos_notificacion(id) on delete set null,
  proveedor_id text,
  estado text not null check (estado in ('enviada', 'fallida')),
  error_codigo text,
  created_at timestamptz not null default now()
);

create index notificaciones_entregas_notificacion_idx
  on privacidad.notificaciones_entregas (notificacion_id, created_at desc);

create table privacidad.notificacion_interacciones (
  id uuid primary key default gen_random_uuid(),
  notificacion_id uuid not null references privacidad.notificaciones_programadas(id) on delete cascade,
  dispositivo_id uuid references privacidad.dispositivos_notificacion(id) on delete set null,
  tipo text not null check (tipo in ('abierta', 'descartada')),
  proveedor_evento_id text unique,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index notificacion_interacciones_notificacion_idx
  on privacidad.notificacion_interacciones (notificacion_id, occurred_at desc);

alter table privacidad.notificaciones_programadas enable row level security;
alter table privacidad.notificaciones_entregas enable row level security;
alter table privacidad.notificacion_interacciones enable row level security;

grant all privileges on privacidad.notificaciones_programadas, privacidad.notificaciones_entregas,
  privacidad.notificacion_interacciones to service_role;

create or replace function privacidad.reclamar_recordatorios_habitos(p_limite integer default 100)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_resultado jsonb;
begin
  if p_limite < 1 or p_limite > 200 then
    raise exception 'invalid reminder batch limit' using errcode = '22023';
  end if;

  insert into privacidad.notificaciones_programadas (usuario_id, plan_habito_id, fecha_local, programada_para)
  select item.usuario_id, plan.id, (now() at time zone perfil.zona_horaria)::date,
    (((now() at time zone perfil.zona_horaria)::date + plan.hora_recordatorio) at time zone perfil.zona_horaria)
  from public.habitos_planes plan
  join public.habitos_items item on item.id = plan.habito_id and item.estado = 'activo'
  join public.perfiles_usuario perfil on perfil.id = item.usuario_id
  left join public.habitos_registros registro
    on registro.habito_id = item.id
    and registro.fecha_local = (now() at time zone perfil.zona_horaria)::date
  where plan.recordatorio_activo
    and plan.hora_recordatorio is not null
    and plan.desde_fecha <= (now() at time zone perfil.zona_horaria)::date
    and (plan.hasta_fecha is null or plan.hasta_fecha > (now() at time zone perfil.zona_horaria)::date)
    and public.habitos_es_dia_programado(plan, (now() at time zone perfil.zona_horaria)::date)
    and coalesce(registro.valor, 0) < plan.objetivo_valor
  on conflict (plan_habito_id, fecha_local) do nothing;

  with candidatas as (
    select id from privacidad.notificaciones_programadas
    where estado = 'pendiente' and programada_para <= now()
    order by programada_para for update skip locked limit p_limite
  ), reclamadas as (
    update privacidad.notificaciones_programadas notificacion
    set estado = 'reclamada', reclamada_at = now(), intentos = intentos + 1, error_codigo = null
    from candidatas where notificacion.id = candidatas.id
    returning notificacion.*
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'notificacion_id', reclamada.id,
    'habito_id', item.id,
    'titulo_habito', item.titulo,
    'mostrar_nombre', plan.mostrar_nombre_notificacion,
    'preferencia_activa', coalesce(preferencia.habilitada, false),
    'dispositivos', coalesce((
      select jsonb_agg(jsonb_build_object('id', dispositivo.id, 'subscription_id', dispositivo.onesignal_subscription_id))
      from privacidad.dispositivos_notificacion dispositivo
      where dispositivo.usuario_id = reclamada.usuario_id
        and dispositivo.plataforma = 'android'
        and dispositivo.permiso_nativo = 'concedido'
        and dispositivo.dado_de_baja_at is null
    ), '[]'::jsonb)
  ) order by reclamada.programada_para), '[]'::jsonb)
  into v_resultado
  from reclamadas reclamada
  join public.habitos_planes plan on plan.id = reclamada.plan_habito_id
  join public.habitos_items item on item.id = plan.habito_id
  left join public.preferencias_notificacion_usuario preferencia
    on preferencia.usuario_id = reclamada.usuario_id and preferencia.catalogo_codigo = 'habito_recordatorio';

  return v_resultado;
end;
$$;

create or replace function privacidad.finalizar_recordatorio_habito(
  p_notificacion_id uuid, p_estado text, p_error_codigo text default null,
  p_proveedor_id text default null, p_dispositivos jsonb default '[]'::jsonb
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_estado not in ('enviada', 'cancelada', 'fallida') then
    raise exception 'invalid reminder terminal state' using errcode = '22023';
  end if;
  if jsonb_typeof(p_dispositivos) <> 'array' then
    raise exception 'invalid reminder devices' using errcode = '22023';
  end if;

  update privacidad.notificaciones_programadas
  set estado = p_estado,
      enviada_at = case when p_estado = 'enviada' then now() else enviada_at end,
      error_codigo = p_error_codigo
  where id = p_notificacion_id and estado = 'reclamada';
  if not found then return false; end if;

  if p_estado in ('enviada', 'fallida') then
    insert into privacidad.notificaciones_entregas (notificacion_id, dispositivo_id, proveedor_id, estado, error_codigo)
    select p_notificacion_id, (dispositivo_id)::uuid, p_proveedor_id,
      case when p_estado = 'enviada' then 'enviada' else 'fallida' end, p_error_codigo
    from jsonb_array_elements_text(p_dispositivos) as dispositivo(dispositivo_id);
  end if;
  return true;
end;
$$;

-- Solo Edge Functions con service_role pueden invocar estos wrappers. Expo no recibe EXECUTE.
create or replace function public.reclamar_recordatorios_habitos(p_limite integer default 100)
returns jsonb language sql security invoker set search_path = ''
as $$ select privacidad.reclamar_recordatorios_habitos(p_limite); $$;

create or replace function public.finalizar_recordatorio_habito(
  p_notificacion_id uuid, p_estado text, p_error_codigo text default null,
  p_proveedor_id text default null, p_dispositivos jsonb default '[]'::jsonb
)
returns boolean language sql security invoker set search_path = ''
as $$ select privacidad.finalizar_recordatorio_habito(p_notificacion_id, p_estado, p_error_codigo, p_proveedor_id, p_dispositivos); $$;

revoke all on function public.reclamar_recordatorios_habitos(integer) from public, anon, authenticated;
revoke all on function public.finalizar_recordatorio_habito(uuid, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.reclamar_recordatorios_habitos(integer) to service_role;
grant execute on function public.finalizar_recordatorio_habito(uuid, text, text, text, jsonb) to service_role;

commit;
