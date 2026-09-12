-- Base técnica de la tienda: billetera de gemas, catálogo de artículos y
-- compras. El saldo y su ledger viven en `comercio` (privilegio elevado, sin
-- exponer a la Data API) para que ni una llamada REST cruda pueda auto-
-- otorgarse gemas o desbloquear un artículo sin pasar por la lógica
-- transaccional. `acreditar_gemas` (compra real con dinero) queda reservada a
-- `service_role`: la validará una futura Edge Function contra el recibo de
-- App Store/Play Store — no se expone ningún wrapper público para ella.

begin;

create schema if not exists comercio;
grant usage on schema comercio to authenticated, service_role;

create table comercio.billeteras_gemas (
  persona_id uuid primary key references auth.users(id) on delete cascade,
  saldo integer not null default 0 check (saldo >= 0),
  actualizado_en timestamptz not null default now()
);

create table comercio.movimientos_gemas (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references auth.users(id) on delete cascade,
  cantidad integer not null check (cantidad <> 0),
  motivo text not null check (motivo in ('compra_iap', 'gasto_tienda', 'ajuste_soporte')),
  referencia text,
  creado_en timestamptz not null default now()
);

create index movimientos_gemas_persona_idx
  on comercio.movimientos_gemas (persona_id, creado_en desc);

create table public.articulos_tienda (
  id text primary key check (id ~ '^[a-z_]+$'),
  tipo text not null check (tipo in ('paquete_tema')),
  nombre text not null,
  descripcion text not null,
  precio_gemas integer not null check (precio_gemas > 0),
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

-- Precio provisional: ajustar cuando se defina el valor real del paquete.
insert into public.articulos_tienda (id, tipo, nombre, descripcion, precio_gemas)
values (
  'paquete_arcoiris',
  'paquete_tema',
  'Paquete Arcoíris',
  'Un tema distinto cada día de la semana: azul, verde, amarillo, naranja, rojo, rosa y morado.',
  350
);

create table public.compras_tienda (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references auth.users(id) on delete cascade,
  articulo_id text not null references public.articulos_tienda(id),
  comprado_en timestamptz not null default now(),
  unique (persona_id, articulo_id)
);

alter table comercio.billeteras_gemas enable row level security;
alter table comercio.movimientos_gemas enable row level security;
alter table public.articulos_tienda enable row level security;
alter table public.compras_tienda enable row level security;

-- `comercio` nunca se agrega a schemas expuestos: sin políticas para
-- authenticated, solo las funciones security definer (bypassrls) escriben aquí.
grant all privileges on comercio.billeteras_gemas, comercio.movimientos_gemas to service_role;

create policy "public_read_active_shop_items"
  on public.articulos_tienda for select using (activo);

create policy "users_read_own_purchases"
  on public.compras_tienda for select using (auth.uid() = persona_id);

-- Privilegios SQL: sin insert/update/delete para authenticated en ninguna de
-- las dos — las compras solo se crean desde comercio.comprar_articulo().
grant select on public.articulos_tienda to anon, authenticated;
grant select on public.compras_tienda to authenticated;
grant all privileges on public.articulos_tienda, public.compras_tienda to service_role;

create or replace function comercio.obtener_saldo_gemas()
returns integer
language sql
security definer
set search_path = ''
as $$
  select coalesce((select saldo from comercio.billeteras_gemas where persona_id = auth.uid()), 0);
$$;

create or replace function comercio.comprar_articulo(p_articulo_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_persona_id uuid := auth.uid();
  v_precio integer;
  v_saldo integer;
begin
  if v_persona_id is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  select precio_gemas into v_precio
  from public.articulos_tienda
  where id = p_articulo_id and activo;
  if not found then
    raise exception 'articulo no disponible' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.compras_tienda
    where persona_id = v_persona_id and articulo_id = p_articulo_id
  ) then
    return jsonb_build_object(
      'articulo_id', p_articulo_id,
      'ya_poseido', true,
      'saldo_restante', comercio.obtener_saldo_gemas()
    );
  end if;

  insert into comercio.billeteras_gemas (persona_id, saldo)
  values (v_persona_id, 0)
  on conflict (persona_id) do nothing;

  select saldo into v_saldo
  from comercio.billeteras_gemas
  where persona_id = v_persona_id
  for update;

  if v_saldo < v_precio then
    raise exception 'gemas insuficientes' using errcode = '22023';
  end if;

  update comercio.billeteras_gemas
  set saldo = saldo - v_precio, actualizado_en = now()
  where persona_id = v_persona_id;

  insert into comercio.movimientos_gemas (persona_id, cantidad, motivo, referencia)
  values (v_persona_id, -v_precio, 'gasto_tienda', p_articulo_id);

  insert into public.compras_tienda (persona_id, articulo_id)
  values (v_persona_id, p_articulo_id);

  return jsonb_build_object(
    'articulo_id', p_articulo_id,
    'ya_poseido', false,
    'saldo_restante', v_saldo - v_precio
  );
end;
$$;

-- Solo una futura Edge Function con service_role (tras validar el recibo de
-- App Store/Play Store) puede acreditar gemas. Ningún wrapper público la expone.
create or replace function comercio.acreditar_gemas(
  p_persona_id uuid,
  p_cantidad integer,
  p_motivo text,
  p_referencia text default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare v_saldo integer;
begin
  if p_cantidad <= 0 then
    raise exception 'invalid credit amount' using errcode = '22023';
  end if;
  if p_motivo not in ('compra_iap', 'ajuste_soporte') then
    raise exception 'invalid credit reason' using errcode = '22023';
  end if;

  insert into comercio.billeteras_gemas (persona_id, saldo)
  values (p_persona_id, p_cantidad)
  on conflict (persona_id) do update
    set saldo = comercio.billeteras_gemas.saldo + excluded.saldo, actualizado_en = now()
  returning saldo into v_saldo;

  insert into comercio.movimientos_gemas (persona_id, cantidad, motivo, referencia)
  values (p_persona_id, p_cantidad, p_motivo, p_referencia);

  return v_saldo;
end;
$$;

revoke all on function comercio.obtener_saldo_gemas() from public, anon;
revoke all on function comercio.comprar_articulo(text) from public, anon;
revoke all on function comercio.acreditar_gemas(uuid, integer, text, text) from public, anon, authenticated;
grant execute on function comercio.obtener_saldo_gemas() to authenticated, service_role;
grant execute on function comercio.comprar_articulo(text) to authenticated, service_role;
grant execute on function comercio.acreditar_gemas(uuid, integer, text, text) to service_role;

-- Tablas privadas sin políticas para authenticated: falla en migración en vez
-- de devolver más tarde resultados engañosos si un dueño sin bypass crea
-- alguna de estas funciones security definer.
do $$
begin
  if exists (
    select 1
    from pg_catalog.pg_proc as routine
    join pg_catalog.pg_roles as owner on owner.oid = routine.proowner
    where routine.oid in (
      'comercio.obtener_saldo_gemas()'::regprocedure,
      'comercio.comprar_articulo(text)'::regprocedure,
      'comercio.acreditar_gemas(uuid,integer,text,text)'::regprocedure
    )
      and not owner.rolbypassrls
  ) then
    raise exception
      'comercio security definer functions require an owner with BYPASSRLS';
  end if;
end;
$$;

-- La app llama estos wrappers invoker a través de la Data API pública; la
-- lógica privilegiada real vive en el schema comercio, no expuesto.
create or replace function public.obtener_saldo_gemas()
returns integer language sql security invoker set search_path = ''
as $$ select comercio.obtener_saldo_gemas(); $$;

create or replace function public.comprar_articulo_tienda(p_articulo_id text)
returns jsonb language sql security invoker set search_path = ''
as $$ select comercio.comprar_articulo(p_articulo_id); $$;

revoke all on function public.obtener_saldo_gemas() from public, anon;
revoke all on function public.comprar_articulo_tienda(text) from public, anon;
grant execute on function public.obtener_saldo_gemas() to authenticated, service_role;
grant execute on function public.comprar_articulo_tienda(text) to authenticated, service_role;

commit;
