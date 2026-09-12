-- Prepara el lado de "comprar gemas con dinero real" para la Edge Function de
-- RevenueCat: catálogo de paquetes IAP -> cantidad de gemas, e idempotencia en
-- acreditar_gemas (los webhooks de RevenueCat se reintentan ante cualquier
-- respuesta que no sea 2xx, así que sin esto un reintento duplicaría el
-- crédito real de dinero).
--
-- Los product_id de RevenueCat de abajo son placeholders — hay que crear los
-- productos reales en App Store Connect / Play Console + RevenueCat y
-- actualizar estas filas antes de vender de verdad.

begin;

create table public.paquetes_gemas_iap (
  id text primary key check (id ~ '^[a-z0-9_]+$'),
  product_id_revenuecat text not null unique,
  cantidad_gemas integer not null check (cantidad_gemas > 0),
  precio_referencia_usd numeric(10,2),
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

insert into public.paquetes_gemas_iap (id, product_id_revenuecat, cantidad_gemas, precio_referencia_usd)
values
  ('gemas_100', 'com.tuapp.gemas.100', 100, 0.99),
  ('gemas_550', 'com.tuapp.gemas.550', 550, 4.99),
  ('gemas_1200', 'com.tuapp.gemas.1200', 1200, 9.99);

alter table public.paquetes_gemas_iap enable row level security;

create policy "public_read_active_gem_packs"
  on public.paquetes_gemas_iap for select using (activo);

grant select on public.paquetes_gemas_iap to anon, authenticated;
grant all privileges on public.paquetes_gemas_iap to service_role;

-- Igual que acreditar_recompensa_nivel_habito: si ya existe un movimiento con
-- este (persona, motivo, referencia), no se vuelve a acreditar — el
-- `event.id` de RevenueCat es la referencia natural para 'compra_iap'.
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

  if p_referencia is not null and exists (
    select 1 from comercio.movimientos_gemas
    where persona_id = p_persona_id and motivo = p_motivo and referencia = p_referencia
  ) then
    return coalesce((select saldo from comercio.billeteras_gemas where persona_id = p_persona_id), 0);
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

commit;
