-- Smoke test manual de la migración 72: plantillas de rutinas (gratis y de pago con gemas).
-- Se ejecuta con psql (usa \echo y set_config), NO en el editor SQL del panel:
--   psql "$DATABASE_URL" -f supabase/tests/10_plantillas_rutinas.sql
-- Requisitos: migraciones 01-72 aplicadas; rol que pueda insertar en auth.users
-- y hacer `set local role` (postgres o service_role). Crea sus propios
-- usuarios, plantilla premium y saldo, y hace rollback al final.
-- Verificado el 2026-10-04 contra un Postgres 16 local con stubs mínimos de
-- Supabase, NO contra el proyecto real: córrelo ahí antes de dar la migración por buena.
\set ON_ERROR_STOP 1
\pset format unaligned
\pset tuples_only on
begin;
insert into auth.users (id, email) values ('11111111-1111-1111-1111-111111111111', 'a@x.com'), ('22222222-2222-2222-2222-222222222222', 'b@x.com');

\echo === 1. contenido: validación y cálculo de num_pasos / duracion_min (como admin)
insert into public.plantillas_rutinas (id, titulo, descripcion, franja, icono_id, precio_gemas, orden)
  values ('estudio-examen-30d', 'Examen en 30 días', 'Plan diario de repaso', 'tarde', 'estudiar', 100, 50);
insert into public.plantillas_rutinas_contenido (plantilla_id, pasos) values ('estudio-examen-30d', '[
  {"titulo": "Repasar apuntes", "modo": "cronometro", "objetivo_valor": 25, "unidad": "min"},
  {"titulo": "Ejercicios del tema", "modo": "contador", "objetivo_valor": 15, "unidad": "ejercicios"},
  {"titulo": "Resumen en una hoja", "modo": "simple"},
  {"titulo": "Repaso rápido", "modo": "cronometro", "objetivo_valor": 5}]'::jsonb);
select num_pasos || ' pasos / ' || duracion_min || ' min' from public.plantillas_rutinas where id = 'estudio-examen-30d';
insert into public.plantillas_rutinas (id, titulo, descripcion, icono_id) values ('mala', 'Mala', 'x', 'sol');
do $$ begin insert into public.plantillas_rutinas_contenido values ('mala', '[{"titulo":"x","modo":"cronometro"}]'); raise exception 'NO DEBIÓ'; exception when check_violation then raise notice 'OK cronómetro sin objetivo rechazado'; end $$;
do $$ begin insert into public.plantillas_rutinas_contenido values ('mala', '[{"titulo":"x","modo":"simple","objetivo_valor":3}]'); raise exception 'NO DEBIÓ'; exception when check_violation then raise notice 'OK simple con objetivo rechazado'; end $$;
do $$ begin insert into public.plantillas_rutinas_contenido values ('mala', '[{"titulo":" ","modo":"simple"}]'); raise exception 'NO DEBIÓ'; exception when check_violation then raise notice 'OK título vacío rechazado'; end $$;
do $$ begin insert into public.plantillas_rutinas_contenido values ('mala', '[{"titulo":"x","modo":"raro"}]'); raise exception 'NO DEBIÓ'; exception when check_violation then raise notice 'OK modo inválido rechazado'; end $$;
do $$ begin insert into public.plantillas_rutinas_contenido values ('mala', '[]'); raise exception 'NO DEBIÓ'; exception when check_violation then raise notice 'OK sin pasos rechazado'; end $$;
do $$ begin insert into public.plantillas_rutinas (id, titulo, descripcion, icono_id) values ('Mala Id', 'x', 'x', 'sol'); raise exception 'NO DEBIÓ'; exception when check_violation then raise notice 'OK id con mayúsculas/espacios rechazado'; end $$;
delete from public.plantillas_rutinas where id = 'mala';
-- saldo inicial de A: 50 gemas
insert into comercio.billeteras_gemas (persona_id, saldo) values ('11111111-1111-1111-1111-111111111111', 50);

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

\echo === 2. A lista: 4 gratis con pasos, 1 premium bloqueada sin pasos
select count(*) || ' plantillas' from jsonb_array_elements(public.obtener_plantillas_rutinas());
select e->>'id' || ' desbloqueada=' || (e->>'desbloqueada') || ' pasos=' || (case when jsonb_typeof(e->'pasos') = 'array' then jsonb_array_length(e->'pasos')::text else 'null' end) || ' n=' || (e->>'num_pasos') || ' min=' || (e->>'duracion_min')
  from jsonb_array_elements(public.obtener_plantillas_rutinas()) e order by (e->>'precio_gemas')::int, e->>'id';

\echo === 3. A no puede leer el contenido premium directamente ni escribir nada
select count(*) || ' filas de contenido premium visibles' from public.plantillas_rutinas_contenido where plantilla_id = 'estudio-examen-30d';
select count(*) || ' filas de contenido gratis visibles' from public.plantillas_rutinas_contenido where plantilla_id = 'sesion-de-estudio';
do $$ begin insert into public.plantillas_rutinas_compradas (usuario_id, plantilla_id, precio_pagado) values (auth.uid(), 'estudio-examen-30d', 1); raise exception 'NO DEBIÓ'; exception when insufficient_privilege then raise notice 'OK insert directo en compras rechazado'; end $$;
do $$ begin update public.plantillas_rutinas set precio_gemas = 0 where id = 'estudio-examen-30d'; raise exception 'NO DEBIÓ'; exception when insufficient_privilege then raise notice 'OK update de precio rechazado'; end $$;
do $$ begin insert into public.plantillas_rutinas_contenido (plantilla_id, pasos) values ('estudio-examen-30d', '[{"titulo":"x","modo":"simple"}]'); raise exception 'NO DEBIÓ'; exception when insufficient_privilege then raise notice 'OK insert de contenido rechazado'; end $$;
do $$ begin perform comercio.obtener_saldo_gemas(); exception when others then null; end $$;

\echo === 4. gemas insuficientes (50 < 100): rechaza y no deja rastro
do $$ begin perform public.comprar_plantilla_rutina('estudio-examen-30d'); raise exception 'NO DEBIÓ'; exception when check_violation then raise notice 'OK gemas insuficientes: %', sqlerrm; end $$;
select public.obtener_saldo_gemas() || ' saldo';
select count(*) || ' compras' from public.plantillas_rutinas_compradas;

\echo === 5. con 250 gemas: compra, descuenta 100, queda registrada
reset role;
update comercio.billeteras_gemas set saldo = 250 where persona_id = '11111111-1111-1111-1111-111111111111';
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select public.comprar_plantilla_rutina('estudio-examen-30d')::text;
select public.obtener_saldo_gemas() || ' saldo';
select count(*) || ' compras propias, pagado=' || max(precio_pagado) from public.plantillas_rutinas_compradas;
select e->>'id' || ' desbloqueada=' || (e->>'desbloqueada') || ' pasos=' || (case when jsonb_typeof(e->'pasos') = 'array' then jsonb_array_length(e->'pasos')::text else 'null' end)
  from jsonb_array_elements(public.obtener_plantillas_rutinas()) e where e->>'id' = 'estudio-examen-30d';
select count(*) || ' filas de contenido premium visibles tras comprar' from public.plantillas_rutinas_contenido where plantilla_id = 'estudio-examen-30d';

\echo === 6. comprar de nuevo no cobra otra vez; la gratuita no cobra
select public.comprar_plantilla_rutina('estudio-examen-30d')::text;
select public.comprar_plantilla_rutina('sesion-de-estudio')::text;
select public.obtener_saldo_gemas() || ' saldo';
reset role;
select count(*) || ' movimiento(s) en el ledger: ' || string_agg(motivo || ' ' || cantidad || ' ' || referencia, ' | ') from comercio.movimientos_gemas where motivo = 'gasto_plantilla_rutina';

\echo === 7. B no ve el contenido premium de A, ni la compra de A
set local role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
select e->>'id' || ' desbloqueada=' || (e->>'desbloqueada') || ' pasos=' || (case when jsonb_typeof(e->'pasos') = 'array' then jsonb_array_length(e->'pasos')::text else 'null' end)
  from jsonb_array_elements(public.obtener_plantillas_rutinas()) e where e->>'id' = 'estudio-examen-30d';
select count(*) || ' compras visibles para B' from public.plantillas_rutinas_compradas;
select count(*) || ' contenido premium visible para B' from public.plantillas_rutinas_contenido where plantilla_id = 'estudio-examen-30d';
do $$ begin perform public.comprar_plantilla_rutina('estudio-examen-30d'); raise exception 'NO DEBIÓ'; exception when check_violation then raise notice 'OK B sin gemas: %', sqlerrm; end $$;

\echo === 8. plantilla apagada: dueño A la conserva, B no la ve ni puede comprarla
reset role;
update public.plantillas_rutinas set activa = false where id = 'estudio-examen-30d';
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select count(*) || ' visible para A (dueño)' from jsonb_array_elements(public.obtener_plantillas_rutinas()) e where e->>'id' = 'estudio-examen-30d';
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
select count(*) || ' visible para B' from jsonb_array_elements(public.obtener_plantillas_rutinas()) e where e->>'id' = 'estudio-examen-30d';
do $$ begin perform public.comprar_plantilla_rutina('estudio-examen-30d'); raise exception 'NO DEBIÓ'; exception when sqlstate '22023' then raise notice 'OK no disponible: %', sqlerrm; end $$;
do $$ begin perform public.comprar_plantilla_rutina('no-existe'); raise exception 'NO DEBIÓ'; exception when sqlstate '22023' then raise notice 'OK inexistente: %', sqlerrm; end $$;

\echo === 9. sin sesión y anon
select set_config('request.jwt.claim.sub', '', true);
do $$ begin perform public.obtener_plantillas_rutinas(); raise exception 'NO DEBIÓ'; exception when insufficient_privilege then raise notice 'OK sin sesión rechazado'; end $$;
do $$ begin perform public.comprar_plantilla_rutina('sesion-de-estudio'); raise exception 'NO DEBIÓ'; exception when sqlstate '28000' then raise notice 'OK compra sin sesión rechazada'; end $$;
reset role;
set local role anon;
do $$ begin perform public.obtener_plantillas_rutinas(); raise exception 'NO DEBIÓ'; exception when insufficient_privilege then raise notice 'OK anon sin permiso de ejecución'; end $$;
do $$ begin perform 1 from public.plantillas_rutinas; raise exception 'NO DEBIÓ'; exception when insufficient_privilege then raise notice 'OK anon sin lectura de tabla'; end $$;
rollback;
