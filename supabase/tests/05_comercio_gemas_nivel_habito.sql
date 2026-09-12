-- Smoke test manual for migrations 13-15 (tienda de gemas, recompensa de
-- nivel, y el endurecimiento de escrituras de habitos_planes/registros).
-- Prerequisites:
--   1. Apply migrations 11-15.
--   2. Replace USER_A_UUID with a real Auth user.
-- This script rolls back all fixture writes at the end.

begin;

set local role authenticated;
set local request.jwt.claims = '{"role":"authenticated","sub":"USER_A_UUID"}';

-- ── 1. Catálogo y saldo inicial ──────────────────────────────────────────────
do $$
declare v_precio integer;
begin
  select precio_gemas into v_precio from public.articulos_tienda where id = 'paquete_arcoiris' and activo;
  if v_precio is null then
    raise exception 'paquete_arcoiris no aparece en el catálogo activo' using errcode = 'assert_failure';
  end if;
end;
$$;

do $$
declare v_saldo integer;
begin
  select public.obtener_saldo_gemas() into v_saldo;
  if v_saldo <> 0 then
    raise exception 'saldo inicial esperado 0, fue %', v_saldo using errcode = 'assert_failure';
  end if;
end;
$$;

do $$
declare v_cantidad integer;
begin
  select cantidad_gemas into v_cantidad from public.paquetes_gemas_iap where id = 'gemas_100' and activo;
  if v_cantidad <> 100 then
    raise exception 'gemas_100 no aparece en el catálogo IAP activo con 100 gemas' using errcode = 'assert_failure';
  end if;
end;
$$;

-- Comprar sin fondos suficientes debe fallar y no cobrar nada.
do $$
begin
  begin
    perform public.comprar_articulo_tienda('paquete_arcoiris');
    raise exception 'la compra sin gemas suficientes fue aceptada' using errcode = 'assert_failure';
  exception when others then
    if sqlerrm not ilike '%insuficientes%' then raise; end if;
  end;
end;
$$;

-- ── 2. Acreditar gemas (solo service_role) y comprar ─────────────────────────
reset role;
set local role service_role;
select comercio.acreditar_gemas('USER_A_UUID'::uuid, 400, 'ajuste_soporte', 'fixture-test-05');

-- Reintentar el mismo crédito con la misma referencia (simula un webhook de
-- RevenueCat reintentado) no debe acreditar una segunda vez.
do $$
declare v_saldo integer;
begin
  v_saldo := comercio.acreditar_gemas('USER_A_UUID'::uuid, 400, 'ajuste_soporte', 'fixture-test-05');
  if v_saldo <> 400 then
    raise exception 'un crédito repetido con la misma referencia acreditó de nuevo: saldo %', v_saldo using errcode = 'assert_failure';
  end if;
end;
$$;

set local role authenticated;
set local request.jwt.claims = '{"role":"authenticated","sub":"USER_A_UUID"}';

do $$
declare v_resultado jsonb; declare v_saldo integer;
begin
  v_resultado := public.comprar_articulo_tienda('paquete_arcoiris');
  if (v_resultado->>'ya_poseido')::boolean is distinct from false then
    raise exception 'primera compra no debería reportar ya_poseido=true' using errcode = 'assert_failure';
  end if;
  if (v_resultado->>'saldo_restante')::integer <> 50 then
    raise exception 'saldo esperado 50 (400-350), fue %', v_resultado->>'saldo_restante' using errcode = 'assert_failure';
  end if;

  -- Repetir la compra debe ser idempotente: no cobra de nuevo.
  v_resultado := public.comprar_articulo_tienda('paquete_arcoiris');
  if (v_resultado->>'ya_poseido')::boolean is distinct from true then
    raise exception 'segunda compra debería reportar ya_poseido=true' using errcode = 'assert_failure';
  end if;
  if (v_resultado->>'saldo_restante')::integer <> 50 then
    raise exception 'la segunda compra volvió a cobrar: saldo %', v_resultado->>'saldo_restante' using errcode = 'assert_failure';
  end if;

  select public.obtener_saldo_gemas() into v_saldo;
  if v_saldo <> 50 then
    raise exception 'saldo final esperado 50 tras comprar el paquete, fue %', v_saldo using errcode = 'assert_failure';
  end if;
end;
$$;

-- ── 3. Endurecimiento: escritura directa debe estar bloqueada ────────────────
do $$
begin
  begin
    insert into public.compras_tienda (persona_id, articulo_id) values (auth.uid(), 'paquete_arcoiris');
    raise exception 'insertar una compra directo fue aceptado' using errcode = 'assert_failure';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

do $$
begin
  begin
    insert into public.habitos_planes (habito_id, frecuencia, objetivo_valor, desde_fecha)
    values (gen_random_uuid(), 'diaria', 1, current_date);
    raise exception 'insertar un plan directo fue aceptado' using errcode = 'assert_failure';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

do $$
begin
  begin
    perform comercio.acreditar_recompensa_nivel_habito(gen_random_uuid(), 7);
    raise exception 'llamar la recompensa de nivel directo fue aceptado' using errcode = 'assert_failure';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

do $$
begin
  begin
    perform public.acreditar_gemas(auth.uid(), 999999, 'ajuste_soporte', 'exploit-test');
    raise exception 'authenticated pudo llamar acreditar_gemas (solo service_role debería poder)' using errcode = 'assert_failure';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

-- ── 4. Nivel real (14 días, 80%/80%) y recompensa en gemas ───────────────────
select set_config(
  'app.smoke_habito_b',
  (public.crear_habito_premium(
    'Meditar (smoke)', null, 'Sparkles', '#22C55E', 'cantidad', 'min',
    null, 'estandar', null, null,
    'diaria', null, null, 10, false, null, false, current_date - 13
  )->>'id'),
  true
);

-- El umbral de 80%/80% puede cumplirse un día antes de completar los 14 (el
-- 80% permite 1-2 días perdidos por ventana), así que la subida puede
-- disparar en cualquier iteración, no necesariamente en la última.
do $$
declare v_dia date; declare v_resultado jsonb; declare v_subio boolean := false; declare v_nivel integer; declare v_gemas integer;
begin
  for v_dia in select generate_series(current_date - 13, current_date, interval '1 day')::date loop
    v_resultado := public.registrar_progreso_habito(current_setting('app.smoke_habito_b')::uuid, v_dia, 10, null);
    if (v_resultado->>'subio_nivel')::boolean then
      v_subio := true;
      v_nivel := (v_resultado->>'nivel')::integer;
      v_gemas := (v_resultado->>'gemas_ganadas')::integer;
    end if;
  end loop;

  if not v_subio then
    raise exception 'nunca se reportó una subida de nivel en las 14 llamadas' using errcode = 'assert_failure';
  end if;
  if v_nivel <> 2 then
    raise exception 'nivel esperado 2 tras cumplir la racha, fue %', v_nivel using errcode = 'assert_failure';
  end if;
  if v_gemas <> 10 then
    raise exception 'recompensa esperada 10 gemas (5 * nivel 2), fue %', v_gemas using errcode = 'assert_failure';
  end if;
end;
$$;

do $$
declare v_saldo integer;
begin
  select public.obtener_saldo_gemas() into v_saldo;
  if v_saldo <> 60 then
    raise exception 'saldo esperado 60 (50 + 10 por subir a nivel 2), fue %', v_saldo using errcode = 'assert_failure';
  end if;
end;
$$;

-- Repetir el registro de hoy no debe volver a pagar la recompensa del mismo nivel.
do $$
declare v_saldo integer;
begin
  perform public.registrar_progreso_habito(current_setting('app.smoke_habito_b')::uuid, current_date, 10, 'repetido');
  select public.obtener_saldo_gemas() into v_saldo;
  if v_saldo <> 60 then
    raise exception 'repetir el registro de hoy volvió a pagar la recompensa: saldo %', v_saldo using errcode = 'assert_failure';
  end if;
end;
$$;

rollback;
