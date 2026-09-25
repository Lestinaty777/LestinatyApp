-- Filas iOS reales para los 3 paquetes de gemas, creados en App Store
-- Connect con estos mismos Product ID exactos.
insert into public.paquetes_gemas_iap_productos (paquete_id, plataforma, product_id_revenuecat, activo)
values
  ('gemas_100', 'ios', 'com.lestinaty.app.gemas.100', true),
  ('gemas_550', 'ios', 'com.lestinaty.app.gemas.550', true),
  ('gemas_1200', 'ios', 'com.lestinaty.app.gemas.1200', true)
on conflict (paquete_id, plataforma) do update
set product_id_revenuecat = excluded.product_id_revenuecat, activo = excluded.activo;
