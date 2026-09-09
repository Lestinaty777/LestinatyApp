-- Núcleo persistente y analítico de Hábitos.

begin;

create extension if not exists btree_gist;

update public.categorias_producto
set estado = 'activa'
where codigo = 'habitos';

create table public.habitos_items (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.perfiles_usuario(id) on delete cascade,
  titulo text not null,
  descripcion text,
  icono_lucide text not null,
  color text not null,
  tipo_meta text not null check (tipo_meta in ('check', 'cantidad', 'duracion')),
  unidad text,
  estado text not null default 'activo' check (estado in ('activo', 'pausado', 'archivado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archivado_at timestamptz,
  check (char_length(trim(titulo)) between 1 and 80),
  check (descripcion is null or char_length(trim(descripcion)) <= 280),
  check (char_length(trim(icono_lucide)) between 1 and 80),
  check (char_length(trim(color)) between 1 and 32),
  check (
    (tipo_meta = 'check' and unidad is null)
    or (tipo_meta in ('cantidad', 'duracion') and char_length(trim(unidad)) between 1 and 32)
  ),
  check ((estado = 'archivado') = (archivado_at is not null))
);

create index habitos_items_usuario_estado_idx
  on public.habitos_items (usuario_id, estado, created_at desc);

create table public.habitos_planes (
  id uuid primary key default gen_random_uuid(),
  habito_id uuid not null references public.habitos_items(id) on delete cascade,
  frecuencia text not null check (frecuencia in ('diaria', 'dias_semana', 'veces_semana')),
  dias_semana smallint[],
  veces_por_semana smallint,
  objetivo_valor numeric(10,2) not null check (objetivo_valor > 0),
  desde_fecha date not null,
  hasta_fecha date,
  created_at timestamptz not null default now(),
  check (hasta_fecha is null or hasta_fecha > desde_fecha),
  check (
    (frecuencia = 'diaria' and dias_semana is null and veces_por_semana is null)
    or (frecuencia = 'dias_semana' and cardinality(dias_semana) between 1 and 7 and veces_por_semana is null)
    or (frecuencia = 'veces_semana' and dias_semana is null and veces_por_semana between 1 and 7)
  ),
  check (dias_semana is null or dias_semana <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[]),
  exclude using gist (
    habito_id with =,
    daterange(desde_fecha, coalesce(hasta_fecha, 'infinity'::date), '[)') with &&
  )
);

create index habitos_planes_habito_fecha_idx
  on public.habitos_planes (habito_id, desde_fecha desc);

create table public.habitos_registros (
  id uuid primary key default gen_random_uuid(),
  habito_id uuid not null references public.habitos_items(id) on delete cascade,
  usuario_id uuid not null references public.perfiles_usuario(id) on delete cascade,
  fecha_local date not null,
  valor numeric(10,2) not null check (valor >= 0),
  registrado_at timestamptz not null default now(),
  nota text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (habito_id, fecha_local),
  check (nota is null or char_length(trim(nota)) <= 500)
);

create index habitos_registros_usuario_fecha_idx
  on public.habitos_registros (usuario_id, fecha_local desc);
create index habitos_registros_habito_fecha_idx
  on public.habitos_registros (habito_id, fecha_local desc);

create table public.habitos_contextos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.perfiles_usuario(id) on delete cascade,
  nombre text not null,
  icono_lucide text,
  created_at timestamptz not null default now(),
  unique (usuario_id, nombre),
  check (char_length(trim(nombre)) between 1 and 80),
  check (icono_lucide is null or char_length(trim(icono_lucide)) between 1 and 80)
);

create table public.habitos_registro_contextos (
  registro_id uuid not null references public.habitos_registros(id) on delete cascade,
  contexto_id uuid not null references public.habitos_contextos(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (registro_id, contexto_id)
);

create table public.habitos_conexiones (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.perfiles_usuario(id) on delete cascade,
  origen_habito_id uuid not null references public.habitos_items(id) on delete cascade,
  destino_habito_id uuid not null references public.habitos_items(id) on delete cascade,
  tipo text not null check (tipo in ('refuerza', 'dificulta')),
  origen text not null default 'manual' check (origen in ('manual', 'sugerida')),
  activa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (usuario_id, origen_habito_id, destino_habito_id, tipo),
  check (origen_habito_id <> destino_habito_id)
);

create index habitos_conexiones_usuario_activa_idx
  on public.habitos_conexiones (usuario_id, activa, origen_habito_id);

create or replace function public.habitos_validar_propiedad_registro()
returns trigger
language plpgsql
set search_path = ''
as $$
declare propietario uuid;
begin
  select usuario_id into propietario
  from public.habitos_items
  where id = new.habito_id;

  if propietario is null or propietario <> new.usuario_id then
    raise exception 'El registro debe pertenecer a la persona propietaria del hábito.'
      using errcode = 'foreign_key_violation';
  end if;
  return new;
end;
$$;

create or replace function public.habitos_validar_propiedad_conexion()
returns trigger
language plpgsql
set search_path = ''
as $$
declare propietario_origen uuid;
declare propietario_destino uuid;
begin
  select usuario_id into propietario_origen from public.habitos_items where id = new.origen_habito_id;
  select usuario_id into propietario_destino from public.habitos_items where id = new.destino_habito_id;

  if propietario_origen is null or propietario_destino is null
    or propietario_origen <> new.usuario_id or propietario_destino <> new.usuario_id then
    raise exception 'Una conexión debe unir hábitos de la misma persona.'
      using errcode = 'foreign_key_violation';
  end if;
  return new;
end;
$$;

create or replace function public.habitos_validar_contexto_registro()
returns trigger
language plpgsql
set search_path = ''
as $$
declare usuario_registro uuid;
declare usuario_contexto uuid;
begin
  select usuario_id into usuario_registro from public.habitos_registros where id = new.registro_id;
  select usuario_id into usuario_contexto from public.habitos_contextos where id = new.contexto_id;
  if usuario_registro is null or usuario_contexto is null or usuario_registro <> usuario_contexto then
    raise exception 'El contexto debe pertenecer a la persona del registro.' using errcode = 'foreign_key_violation';
  end if;
  return new;
end;
$$;

create trigger habitos_registros_validar_propiedad
  before insert or update of habito_id, usuario_id on public.habitos_registros
  for each row execute function public.habitos_validar_propiedad_registro();
create trigger habitos_conexiones_validar_propiedad
  before insert or update of usuario_id, origen_habito_id, destino_habito_id on public.habitos_conexiones
  for each row execute function public.habitos_validar_propiedad_conexion();
create trigger habitos_registro_contextos_validar_propiedad
  before insert or update on public.habitos_registro_contextos
  for each row execute function public.habitos_validar_contexto_registro();

create trigger habitos_items_updated_at before update on public.habitos_items
  for each row execute function public.set_updated_at();
create trigger habitos_registros_updated_at before update on public.habitos_registros
  for each row execute function public.set_updated_at();
create trigger habitos_conexiones_updated_at before update on public.habitos_conexiones
  for each row execute function public.set_updated_at();

alter table public.habitos_items enable row level security;
alter table public.habitos_planes enable row level security;
alter table public.habitos_registros enable row level security;
alter table public.habitos_contextos enable row level security;
alter table public.habitos_registro_contextos enable row level security;
alter table public.habitos_conexiones enable row level security;

create policy habitos_items_propios on public.habitos_items for all
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
create policy habitos_planes_propios on public.habitos_planes for all
  using (exists (select 1 from public.habitos_items item where item.id = habito_id and item.usuario_id = auth.uid()))
  with check (exists (select 1 from public.habitos_items item where item.id = habito_id and item.usuario_id = auth.uid()));
create policy habitos_registros_propios on public.habitos_registros for all
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
create policy habitos_contextos_propios on public.habitos_contextos for all
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
create policy habitos_registro_contextos_propios on public.habitos_registro_contextos for all
  using (exists (select 1 from public.habitos_registros registro where registro.id = registro_id and registro.usuario_id = auth.uid()))
  with check (exists (select 1 from public.habitos_registros registro where registro.id = registro_id and registro.usuario_id = auth.uid()));
create policy habitos_conexiones_propias on public.habitos_conexiones for all
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

grant select, insert, update, delete on public.habitos_items, public.habitos_planes,
  public.habitos_registros, public.habitos_contextos, public.habitos_registro_contextos,
  public.habitos_conexiones to authenticated;
grant all privileges on public.habitos_items, public.habitos_planes,
  public.habitos_registros, public.habitos_contextos, public.habitos_registro_contextos,
  public.habitos_conexiones to service_role;

create or replace function public.habitos_es_dia_programado(plan public.habitos_planes, fecha date)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case plan.frecuencia
    when 'diaria' then true
    when 'dias_semana' then extract(isodow from fecha)::smallint = any(plan.dias_semana)
    when 'veces_semana' then true
  end;
$$;

create or replace function public.crear_habito(
  p_titulo text,
  p_descripcion text,
  p_icono_lucide text,
  p_color text,
  p_tipo_meta text,
  p_unidad text,
  p_frecuencia text,
  p_dias_semana smallint[] default null,
  p_veces_por_semana smallint default null,
  p_objetivo_valor numeric default 1,
  p_desde_fecha date default current_date
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare v_item public.habitos_items;
declare v_plan public.habitos_planes;
begin
  if auth.uid() is null then raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege'; end if;
  insert into public.habitos_items (usuario_id, titulo, descripcion, icono_lucide, color, tipo_meta, unidad)
  values (auth.uid(), p_titulo, p_descripcion, p_icono_lucide, p_color, p_tipo_meta, nullif(trim(p_unidad), ''))
  returning * into v_item;
  insert into public.habitos_planes (habito_id, frecuencia, dias_semana, veces_por_semana, objetivo_valor, desde_fecha)
  values (v_item.id, p_frecuencia, p_dias_semana, p_veces_por_semana, p_objetivo_valor, p_desde_fecha)
  returning * into v_plan;
  return jsonb_build_object('id', v_item.id, 'plan_id', v_plan.id);
end;
$$;

create or replace function public.registrar_progreso_habito(
  p_habito_id uuid,
  p_fecha_local date,
  p_valor numeric,
  p_nota text default null
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare v_fecha_actual date;
declare v_registro public.habitos_registros;
begin
  if auth.uid() is null then raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege'; end if;
  select (now() at time zone perfil.zona_horaria)::date into v_fecha_actual
  from public.perfiles_usuario perfil where perfil.id = auth.uid();
  if p_fecha_local > coalesce(v_fecha_actual, current_date) then
    raise exception 'No puedes registrar progreso en una fecha futura.' using errcode = 'check_violation';
  end if;
  if not exists (select 1 from public.habitos_items item where item.id = p_habito_id and item.usuario_id = auth.uid()) then
    raise exception 'Hábito no encontrado.' using errcode = 'no_data_found';
  end if;
  insert into public.habitos_registros (habito_id, usuario_id, fecha_local, valor, nota)
  values (p_habito_id, auth.uid(), p_fecha_local, p_valor, p_nota)
  on conflict (habito_id, fecha_local) do update
  set valor = excluded.valor, nota = excluded.nota, registrado_at = now(), updated_at = now()
  returning * into v_registro;
  return jsonb_build_object('id', v_registro.id, 'habito_id', v_registro.habito_id, 'fecha_local', v_registro.fecha_local, 'valor', v_registro.valor, 'nota', v_registro.nota);
end;
$$;

create or replace function public.actualizar_plan_habito(
  p_habito_id uuid, p_frecuencia text, p_dias_semana smallint[], p_veces_por_semana smallint,
  p_objetivo_valor numeric, p_desde_fecha date
) returns jsonb
language plpgsql security invoker set search_path = ''
as $$
declare v_plan public.habitos_planes;
begin
  if not exists (select 1 from public.habitos_items where id = p_habito_id and usuario_id = auth.uid()) then
    raise exception 'Hábito no encontrado.' using errcode = 'no_data_found';
  end if;
  update public.habitos_planes set hasta_fecha = p_desde_fecha
  where habito_id = p_habito_id and hasta_fecha is null;
  insert into public.habitos_planes (habito_id, frecuencia, dias_semana, veces_por_semana, objetivo_valor, desde_fecha)
  values (p_habito_id, p_frecuencia, p_dias_semana, p_veces_por_semana, p_objetivo_valor, p_desde_fecha)
  returning * into v_plan;
  return jsonb_build_object('id', v_plan.id, 'habito_id', v_plan.habito_id);
end;
$$;

create or replace function public.obtener_panel_habitos(p_fecha_referencia date default null)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare v_usuario uuid := auth.uid();
declare v_fecha date;
declare v_habitos jsonb;
declare v_patrones jsonb;
declare v_conexiones jsonb;
declare v_riesgo jsonb;
declare v_impacto jsonb;
declare v_total integer;
begin
  if v_usuario is null then raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege'; end if;
  select coalesce(p_fecha_referencia, (now() at time zone zona_horaria)::date) into v_fecha
  from public.perfiles_usuario where id = v_usuario;

  select count(*) into v_total from public.habitos_items where usuario_id = v_usuario and estado = 'activo';
  if v_total = 0 then
    return jsonb_build_object(
      'hoy', jsonb_build_object('estado', 'sin_habitos', 'datos', '[]'::jsonb),
      'patrones', jsonb_build_object('estado', 'sin_habitos', 'datos', '[]'::jsonb),
      'conexiones', jsonb_build_object('estado', 'sin_habitos', 'datos', '[]'::jsonb),
      'riesgo', jsonb_build_object('estado', 'sin_habitos', 'datos', '[]'::jsonb),
      'impacto', jsonb_build_object('estado', 'sin_habitos', 'datos', '[]'::jsonb)
    );
  end if;

  with vigentes as (
    select item.*, plan.objetivo_valor, plan.frecuencia, plan.dias_semana, plan.veces_por_semana,
      coalesce(registro.valor, 0) as valor_hoy
    from public.habitos_items item
    join public.habitos_planes plan on plan.habito_id = item.id and plan.desde_fecha <= v_fecha and (plan.hasta_fecha is null or plan.hasta_fecha > v_fecha)
    left join public.habitos_registros registro on registro.habito_id = item.id and registro.fecha_local = v_fecha
    where item.usuario_id = v_usuario and item.estado = 'activo' and public.habitos_es_dia_programado(plan, v_fecha)
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', id, 'titulo', titulo, 'descripcion', descripcion, 'icono_lucide', icono_lucide, 'color', color,
    'tipo_meta', tipo_meta, 'unidad', unidad, 'meta', objetivo_valor, 'valor_hoy', valor_hoy,
    'completado', valor_hoy >= objetivo_valor
  ) order by created_at), '[]'::jsonb) into v_habitos from vigentes;

  with actividad as (
    select extract(isodow from registro.fecha_local)::integer as dia_semana,
      count(*) filter (where registro.valor >= plan.objetivo_valor)::integer as completados,
      count(*)::integer as muestras
    from public.habitos_registros registro
    join public.habitos_planes plan on plan.habito_id = registro.habito_id and plan.desde_fecha <= registro.fecha_local and (plan.hasta_fecha is null or plan.hasta_fecha > registro.fecha_local)
    where registro.usuario_id = v_usuario and registro.fecha_local between v_fecha - 27 and v_fecha
    group by 1
  )
  select coalesce(jsonb_agg(jsonb_build_object('dia_semana', dia_semana, 'completados', completados, 'muestras', muestras, 'porcentaje', round(100.0 * completados / nullif(muestras, 0), 1)) order by dia_semana), '[]'::jsonb)
  into v_patrones from actividad;

  with pares as (
    select a.habito_id origen_habito_id, b.habito_id destino_habito_id,
      count(*)::integer comparables,
      count(*) filter (where a.valor >= pa.objetivo_valor and b.valor >= pb.objetivo_valor)::integer juntos
    from public.habitos_registros a
    join public.habitos_registros b on b.usuario_id = a.usuario_id and b.fecha_local = a.fecha_local and b.habito_id > a.habito_id
    join public.habitos_planes pa on pa.habito_id = a.habito_id and pa.desde_fecha <= a.fecha_local and (pa.hasta_fecha is null or pa.hasta_fecha > a.fecha_local)
    join public.habitos_planes pb on pb.habito_id = b.habito_id and pb.desde_fecha <= b.fecha_local and (pb.hasta_fecha is null or pb.hasta_fecha > b.fecha_local)
    where a.usuario_id = v_usuario and a.fecha_local between v_fecha - 27 and v_fecha
    group by 1, 2
  )
  select coalesce(jsonb_agg(jsonb_build_object('origen_habito_id', pares.origen_habito_id, 'destino_habito_id', pares.destino_habito_id, 'comparables', comparables, 'juntos', juntos, 'fuerza', round(100.0 * juntos / nullif(comparables, 0), 1)) order by juntos desc), '[]'::jsonb)
  into v_conexiones from pares where comparables >= 7;

  with tasas as (
    select item.id, item.titulo, item.icono_lucide, item.color,
      count(*) filter (where registro.fecha_local between v_fecha - 6 and v_fecha and registro.valor >= plan.objetivo_valor)::numeric / nullif(count(*) filter (where registro.fecha_local between v_fecha - 6 and v_fecha), 0) reciente,
      count(*) filter (where registro.fecha_local between v_fecha - 34 and v_fecha - 7 and registro.valor >= plan.objetivo_valor)::numeric / nullif(count(*) filter (where registro.fecha_local between v_fecha - 34 and v_fecha - 7), 0) base,
      count(*) filter (where registro.fecha_local between v_fecha - 6 and v_fecha)::integer muestras_recientes,
      count(*) filter (where registro.fecha_local between v_fecha - 34 and v_fecha - 7)::integer muestras_base
    from public.habitos_items item
    left join public.habitos_registros registro on registro.habito_id = item.id and registro.fecha_local between v_fecha - 34 and v_fecha
    left join public.habitos_planes plan on plan.habito_id = item.id and plan.desde_fecha <= registro.fecha_local and (plan.hasta_fecha is null or plan.hasta_fecha > registro.fecha_local)
    where item.usuario_id = v_usuario and item.estado = 'activo'
    group by item.id
  )
  select coalesce(jsonb_agg(jsonb_build_object('habito_id', id, 'titulo', titulo, 'icono_lucide', icono_lucide, 'color', color, 'reciente', round(100 * reciente, 1), 'base', round(100 * base, 1), 'nivel', case when reciente < base - 0.25 then 'alto' when reciente < base - 0.10 then 'medio' else 'bajo' end) order by (base - reciente) desc), '[]'::jsonb)
  into v_riesgo from tasas where muestras_recientes >= 3 and muestras_base >= 7;

  with efecto as (
    select conexion.origen_habito_id, conexion.destino_habito_id,
      count(*) filter (where origen.valor >= plan_origen.objetivo_valor)::integer origen_cumplido,
      count(*) filter (where origen.valor < plan_origen.objetivo_valor)::integer origen_no_cumplido,
      count(*) filter (where origen.valor >= plan_origen.objetivo_valor and destino.valor >= plan_destino.objetivo_valor)::integer destino_con_origen,
      count(*) filter (where origen.valor < plan_origen.objetivo_valor and destino.valor >= plan_destino.objetivo_valor)::integer destino_sin_origen
    from public.habitos_conexiones conexion
    join public.habitos_registros origen on origen.habito_id = conexion.origen_habito_id and origen.fecha_local between v_fecha - 27 and v_fecha
    join public.habitos_registros destino on destino.habito_id = conexion.destino_habito_id and destino.fecha_local = origen.fecha_local
    join public.habitos_planes plan_origen on plan_origen.habito_id = origen.habito_id and plan_origen.desde_fecha <= origen.fecha_local and (plan_origen.hasta_fecha is null or plan_origen.hasta_fecha > origen.fecha_local)
    join public.habitos_planes plan_destino on plan_destino.habito_id = destino.habito_id and plan_destino.desde_fecha <= destino.fecha_local and (plan_destino.hasta_fecha is null or plan_destino.hasta_fecha > destino.fecha_local)
    where conexion.usuario_id = v_usuario and conexion.activa
    group by 1, 2
  )
  select coalesce(jsonb_agg(jsonb_build_object('origen_habito_id', origen_habito_id, 'destino_habito_id', destino_habito_id, 'con_origen', round(100.0 * destino_con_origen / nullif(origen_cumplido, 0), 1), 'sin_origen', round(100.0 * destino_sin_origen / nullif(origen_no_cumplido, 0), 1), 'impacto', round(100.0 * destino_con_origen / nullif(origen_cumplido, 0) - 100.0 * destino_sin_origen / nullif(origen_no_cumplido, 0), 1)) order by (destino_con_origen::numeric / nullif(origen_cumplido, 0) - destino_sin_origen::numeric / nullif(origen_no_cumplido, 0)) desc), '[]'::jsonb)
  into v_impacto from efecto where origen_cumplido >= 7 and origen_no_cumplido >= 7;

  return jsonb_build_object(
    'hoy', jsonb_build_object('estado', 'listo', 'datos', v_habitos),
    'patrones', jsonb_build_object('estado', case when jsonb_array_length(v_patrones) = 0 then 'sin_historial' when exists (select 1 from jsonb_array_elements(v_patrones) patron where (patron->>'muestras')::integer >= 7) then 'listo' else 'en_observacion' end, 'datos', v_patrones),
    'conexiones', jsonb_build_object('estado', case when jsonb_array_length(v_conexiones) > 0 then 'listo' else 'en_observacion' end, 'datos', v_conexiones),
    'riesgo', jsonb_build_object('estado', case when jsonb_array_length(v_riesgo) > 0 then 'listo' else 'en_observacion' end, 'datos', v_riesgo),
    'impacto', jsonb_build_object('estado', case when jsonb_array_length(v_impacto) > 0 then 'listo' else 'en_observacion' end, 'datos', v_impacto)
  );
end;
$$;

grant execute on function public.crear_habito(text, text, text, text, text, text, text, smallint[], smallint, numeric, date) to authenticated;
grant execute on function public.registrar_progreso_habito(uuid, date, numeric, text) to authenticated;
grant execute on function public.actualizar_plan_habito(uuid, text, smallint[], smallint, numeric, date) to authenticated;
grant execute on function public.obtener_panel_habitos(date) to authenticated;

commit;
