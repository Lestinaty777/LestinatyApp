-- Separa el paquete lógico de gemas (id, cantidad, precio de referencia) de
-- sus identificadores App Store/Play Store reales, uno por plataforma. La
-- columna paquetes_gemas_iap.product_id_revenuecat se conserva como legado
-- para rollback durante esta primera entrega iOS.
create table public.paquetes_gemas_iap_productos (
  paquete_id text not null references public.paquetes_gemas_iap(id) on delete cascade,
  plataforma text not null check (plataforma in ('ios', 'android')),
  product_id_revenuecat text not null,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  primary key (paquete_id, plataforma),
  unique (plataforma, product_id_revenuecat)
);

insert into public.paquetes_gemas_iap_productos (paquete_id, plataforma, product_id_revenuecat, activo)
select id, 'android', product_id_revenuecat, activo
from public.paquetes_gemas_iap;

alter table public.paquetes_gemas_iap_productos enable row level security;

create policy "public_read_active_gem_pack_products"
  on public.paquetes_gemas_iap_productos
  for select
  using (activo);

grant select on public.paquetes_gemas_iap_productos to anon, authenticated;
grant select, insert, update, delete on public.paquetes_gemas_iap_productos to service_role;
