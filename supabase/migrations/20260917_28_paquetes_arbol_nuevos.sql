-- 11 paquetes de árbol nuevos con arte real completo (7 etapas + arbusto +
-- flor + semilla), en el mismo formato que aurelia/diamante. Todos arrancan
-- como 'legendario' a 500 gemas / 3 semillas por compra — mismo precio que
-- aurelia/diamante; se puede ajustar por paquete más adelante sin tocar
-- código (solo UPDATE a esta tabla).
--
-- master_pack_color sacado por muestreo del color dominante de cada arte
-- (mismo método que se usó para aurelia #FFD000 y diamante #80B0E0) — se
-- clampea a un rango de luminosidad seguro en tiempo de uso
-- (obtenerProgresoNivelHabito / colorSeguroUi), así que un color crudo muy
-- oscuro o muy claro acá no rompe el contraste de la UI.

begin;

insert into public.arboles_paquetes (id, nombre, master_pack_color, rareza, es_gratuito, precio_gemas, cantidad_por_compra, activo)
values
  ('abyss', 'Abyss', '#21232F', 'legendario', false, 500, 3, true),
  ('amber', 'Amber', '#F04D01', 'legendario', false, 500, 3, true),
  ('celesthia', 'Celesthia', '#01B0CF', 'legendario', false, 500, 3, true),
  ('esmeralda', 'Esmeralda', '#029060', 'legendario', false, 500, 3, true),
  ('golden', 'Golden', '#FCB103', 'legendario', false, 500, 3, true),
  ('ignate', 'Ignate', '#90010D', 'legendario', false, 500, 3, true),
  ('lightmoon', 'LightMoon', '#03103E', 'legendario', false, 500, 3, true),
  ('mathist', 'Mathist', '#B25FFB', 'legendario', false, 500, 3, true),
  ('nevalhi', 'Nevalhi', '#C0DFFC', 'legendario', false, 500, 3, true),
  ('sakura', 'Sakura', '#FC70AF', 'legendario', false, 500, 3, true),
  ('valvery', 'Valvery', '#02A0B0', 'legendario', false, 500, 3, true)
on conflict (id) do nothing;

commit;
