-- Bug real encontrado al auditar la Tienda: recibir-webhook-revenuecat manda
-- `evento.id` (el id del evento de RevenueCat) como `p_referencia` a
-- acreditar_gemas() pensando que servía para deduplicar reintentos del
-- webhook — pero `comercio.acreditar_gemas` nunca comprobaba esa referencia
-- antes de sumar gemas. RevenueCat reintenta un webhook automáticamente
-- cuando no recibe 200 a tiempo (timeout, 502/503 transitorio de nuestro
-- lado, etc.) — sin este fix, cualquier reintento de un evento ya procesado
-- vuelve a acreditar las mismas gemas por la misma compra real.
--
-- Fix en dos capas:
-- 1) Índice único parcial sobre (referencia) para motivo='compra_iap' — nunca
--    puede existir dos movimientos con el mismo evento de RevenueCat.
-- 2) acreditar_gemas atrapa esa violación (23505) y responde con el saldo
--    actual sin volver a sumar — PL/pgSQL crea un savepoint implícito en el
--    bloque con EXCEPTION, así que el incremento de saldo que ya se había
--    hecho en la misma llamada también se revierte junto con el insert que
--    chocó, dejando todo atómico.

begin;

create unique index if not exists movimientos_gemas_referencia_iap_uniq
  on comercio.movimientos_gemas (referencia)
  where motivo = 'compra_iap' and referencia is not null;

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
  if p_motivo not in ('compra_iap', 'ajuste_soporte') then
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
