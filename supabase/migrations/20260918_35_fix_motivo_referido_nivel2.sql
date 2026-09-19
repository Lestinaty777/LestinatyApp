-- Bug crítico encontrado auditando el core de Hábitos: cuando un usuario
-- referido llega a nivel 2 en cualquier hábito, privacidad.registrar_progreso_habito
-- llama comercio.acreditar_gemas(..., 'referido_nivel2', ...) para pagarle
-- 100 gemas a él y a quien lo refirió (20260916_24_referidos.sql). Pero:
--   1. acreditar_gemas() rechaza cualquier motivo que no sea 'compra_iap' o
--      'ajuste_soporte' — nunca se actualizó esa lista al agregar referidos.
--   2. Se llama con `perform`, así que la excepción no se atrapa: revienta
--      TODA la transacción de registrar_progreso_habito, incluyendo el
--      registro del hábito que el usuario acababa de marcar.
-- Resultado real: para cualquier persona que entró con un código de
-- referido, la primera vez que uno de sus hábitos sube a nivel 2, tocar el
-- check falla por completo (no solo se pierde la recompensa).
--
-- Fix: permitir 'referido_nivel2' tanto en el check constraint de la tabla
-- como en la validación interna de acreditar_gemas.

begin;

alter table comercio.movimientos_gemas drop constraint movimientos_gemas_motivo_check;
alter table comercio.movimientos_gemas add constraint movimientos_gemas_motivo_check
  check (motivo in ('compra_iap', 'gasto_tienda', 'ajuste_soporte', 'recompensa_nivel', 'gasto_semillas', 'referido_nivel2'));

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
  if p_motivo not in ('compra_iap', 'ajuste_soporte', 'referido_nivel2') then
    raise exception 'invalid credit reason' using errcode = '22023';
  end if;

  begin
    insert into comercio.billeteras_gemas (persona_id, saldo)
    values (p_persona_id, p_cantidad)
    on conflict (persona_id) do update
      set saldo = comercio.billeteras_gemas.saldo + excluded.saldo, actualizado_en = now()
    returning saldo into v_saldo;

    insert into comercio.movimientos_gemas (persona_id, cantidad, motivo, referencia)
    values (p_persona_id, p_cantidad, p_motivo, p_referencia);
  exception when unique_violation then
    -- Evento de RevenueCat repetido (reintento de webhook) — ya se acreditó
    -- antes con esta misma referencia, no volver a sumar gemas.
    select saldo into v_saldo from comercio.billeteras_gemas where persona_id = p_persona_id;
    return coalesce(v_saldo, 0);
  end;

  return v_saldo;
end;
$$;

commit;
