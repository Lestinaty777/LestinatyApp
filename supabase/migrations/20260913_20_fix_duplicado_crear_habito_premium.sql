-- La migración 19 agregó p_nivel_inicial a crear_habito_premium usando
-- `create or replace function` con una lista de parámetros distinta a la
-- existente — en Postgres eso no reemplaza la función, crea un SEGUNDO
-- overload (la identidad de una función incluye sus tipos de parámetro).
-- Quedaron dos versiones (18 y 19 parámetros) conviviendo en privacidad y
-- public, y el caché de esquema de PostgREST se quedó apuntando a la vieja de
-- 18 — por eso crear un hábito fallaba en silencio.
--
-- Se borra la versión vieja (sin p_nivel_inicial) y se notifica a PostgREST
-- que recargue su caché de esquema.

begin;

drop function if exists public.crear_habito_premium(
  text, text, text, text, text, text, text, text, text, text, text,
  smallint[], smallint, numeric, boolean, time without time zone, boolean, date
);
drop function if exists privacidad.crear_habito_premium(
  text, text, text, text, text, text, text, text, text, text, text,
  smallint[], smallint, numeric, boolean, time without time zone, boolean, date
);

commit;

notify pgrst, 'reload schema';
