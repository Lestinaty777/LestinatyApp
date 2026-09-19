-- Los master_pack_color de LightMoon e Ignate quedaron desalineados del arte
-- final (definido en la migración 28): LightMoon ya no es tan oscuro y el
-- rojo de Ignate necesitaba más saturación. Valores nuevos sacados por
-- muestreo directo del follaje de etapa7.png de cada paquete, no a ojo.

begin;

update public.arboles_paquetes set master_pack_color = '#0045D0' where id = 'lightmoon';
update public.arboles_paquetes set master_pack_color = '#C10208' where id = 'ignate';

commit;

notify pgrst, 'reload schema';
