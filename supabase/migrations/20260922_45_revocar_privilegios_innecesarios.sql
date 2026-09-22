-- Endurecimiento de privilegios: TRUNCATE, TRIGGER y REFERENCES son privilegios
-- SEPARADOS de SELECT/INSERT/UPDATE/DELETE, y Supabase los concede por defecto a
-- toda tabla nueva. Ningún código de la app los usa:
--
-- - PostgREST (lo que la API expone al cliente) nunca emite TRUNCATE ni DDL.
-- - Las 24 funciones RPC que corren como SECURITY INVOKER (con los privilegios
--   de `authenticated`: registrar_progreso_habito, comprar_articulo_tienda,
--   crear_habito_premium, asignar_semilla_habito...) solo hacen SELECT/INSERT/
--   UPDATE/DELETE — ninguna ejecuta TRUNCATE, CREATE TRIGGER ni agrega una
--   llave foránea en tiempo de ejecución (verificado sobre pg_get_functiondef
--   de cada una antes de esta migración).
-- - Las funciones que sí hacen operaciones delicadas (comercio.*) son
--   SECURITY DEFINER: corren con los privilegios de su dueño, no con los de
--   anon/authenticated, así que esta revocación no las afecta.
-- - Las migraciones se aplican como `postgres`, no como anon/authenticated:
--   revocarles esto a estos dos roles no impide crear tablas/triggers/FKs en
--   futuras migraciones.
--
-- Sin esto, TRUNCATE no es explotable por la API hoy, pero es una puerta
-- abierta sin motivo: solo importaría con acceso SQL directo con ese rol. Esta
-- migración la cierra, para el estado actual y para toda tabla futura.

begin;

do $$
declare esquema text;
begin
  foreach esquema in array array['public', 'comercio', 'privacidad'] loop
    execute format('revoke truncate, trigger, references on all tables in schema %I from anon, authenticated', esquema);
    -- Toda tabla FUTURA en estos esquemas tampoco los hereda (el resto de privilegios que la app
    -- necesita se sigue concediendo migración a migración, como hasta ahora).
    execute format('alter default privileges in schema %I revoke truncate, trigger, references on tables from anon, authenticated', esquema);
  end loop;
end $$;

commit;
