-- Bono de 300 gemas al iniciar el trial de Horizon, junto con la semilla que
-- ya se regalaba (otorgar_semilla_trial_horizon, migración 36). Se acredita
-- ACÁ, en el mismo paso donde el webhook marca el inicio real del trial —
-- mismo patrón de confianza que el resto del comercio: nunca el cliente,
-- siempre el webhook de RevenueCat vía service_role.
--
-- 'trial_horizon_bono' necesita agregarse en DOS lugares (no solo el check
-- constraint de la tabla) — comercio.acreditar_gemas tiene su propia
-- validación interna de motivos permitidos, separada del check de la tabla.
-- Ya nos pasó esto dos veces antes en esta sesión (gasto_semillas,
-- referido_nivel2) por actualizar solo uno de los dos.
--
-- El parámetro nuevo de marcar_trial_horizon_iniciado (p_evento_id) es la
-- referencia de idempotencia para acreditar_gemas — usa el id del evento de
-- RevenueCat en vez de inventar uno, así un reintento del mismo webhook
-- nunca acredita dos veces. Cambia la firma de la función, así que hace
-- falta el drop explícito de la versión anterior (mismo cuidado que las
-- migraciones 20/22/25 con crear_habito_premium).

begin;

alter table comercio.movimientos_gemas drop constraint movimientos_gemas_motivo_check;
alter table comercio.movimientos_gemas add constraint movimientos_gemas_motivo_check
  check (motivo in ('compra_iap', 'gasto_tienda', 'ajuste_soporte', 'recompensa_nivel', 'gasto_semillas', 'referido_nivel2', 'trial_horizon_bono'));

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
  if p_motivo not in ('compra_iap', 'ajuste_soporte', 'referido_nivel2', 'trial_horizon_bono') then
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

drop function if exists comercio.marcar_trial_horizon_iniciado(uuid);

create function comercio.marcar_trial_horizon_iniciado(p_persona_id uuid, p_evento_id text default null)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare v_marcado boolean;
begin
  update public.perfiles_usuario
  set horizon_trial_iniciado_en = now()
  where id = p_persona_id and horizon_trial_iniciado_en is null;
  v_marcado := found;

  if v_marcado then
    perform comercio.acreditar_gemas(p_persona_id, 300, 'trial_horizon_bono', coalesce(p_evento_id, p_persona_id::text));
  end if;

  return v_marcado;
end;
$$;

revoke all on function comercio.marcar_trial_horizon_iniciado(uuid, text) from public, anon, authenticated;
grant execute on function comercio.marcar_trial_horizon_iniciado(uuid, text) to service_role;

commit;

notify pgrst, 'reload schema';
