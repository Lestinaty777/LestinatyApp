-- 4 paquetes de árbol 'unico' (CrimsonMoon, Eclipse, Moon, Vida). Su arte
-- completo ya está en la app (assets/.../paquetes/unicos/*) y registrado en
-- registroPaquetesArbol.ts / paqueteVisual.assets.ts, pero no tenían fila acá:
-- sin fila no aparecen en la tienda ni tienen master_pack_color, así que sus
-- hábitos caían al tono Esmeralda.
--
-- 777 gemas / 1 semilla por compra (decisión de producto: más exclusivos que
-- los legendarios, que son 500 gemas / 3 semillas). Visibles desde ya.
--
-- master_pack_color elegido a partir del color de la copa de cada árbol, más
-- saturado que el muestreo crudo (que da tonos muy oscuros) — se clampea a un
-- rango de luminosidad seguro en tiempo de uso (colorSeguroUi / MasterColor).
-- Se puede ajustar por paquete sin tocar código (solo UPDATE a esta tabla).
--
-- No requiere cambios en comercio.comprar_semillas_arbol: no distingue rareza.
-- comercio.otorgar_semilla_trial_horizon filtra 'legendario', así que los
-- únicos no entran en el regalo del trial.

begin;

insert into public.arboles_paquetes (id, nombre, master_pack_color, rareza, es_gratuito, precio_gemas, cantidad_por_compra, activo)
values
  ('crimsonmoon', 'CrimsonMoon', '#C81E4B', 'unico', false, 777, 1, true),
  ('eclipse', 'Eclipse', '#6A3FA0', 'unico', false, 777, 1, true),
  ('moon', 'Moon', '#2F5FE0', 'unico', false, 777, 1, true),
  ('vida', 'Vida', '#7CC72B', 'unico', false, 777, 1, true)
on conflict (id) do nothing;

commit;
