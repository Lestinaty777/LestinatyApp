-- Regalo de semilla al iniciar el trial gratuito de Lestinaty Horizon:
-- además de la semilla del onboarding (otorgar_semilla_bienvenida), quien
-- inicia el trial puede elegir OTRA semilla de un árbol legendario —
-- quedando con 2 semillas en total, suficientes para 2 hábitos.
--
-- No existe hoy ninguna fuente de verdad server-side de "este usuario está
-- en trial de Horizon" (todo el estado de Pro se resuelve 100% del lado del
-- cliente contra RevenueCat). Sin eso, la función que entrega la semilla no
-- podría verificar nada real — replicaría el mismo error de confiar
-- ciegamente en el cliente que ya causó 2 bugs reales en esta sesión.
--
-- Por eso: `horizon_trial_iniciado_en` la marca ÚNICAMENTE el webhook de
-- RevenueCat (recibir-webhook-revenuecat), cuando confirma un evento real de
-- inicio de trial. `otorgar_semilla_trial_horizon` exige que esa marca ya
-- exista antes de entregar nada.

begin;

alter table public.perfiles_usuario
  add column horizon_trial_iniciado_en timestamptz,
  add column regalo_trial_horizon_reclamado_en timestamptz;

comment on column public.perfiles_usuario.horizon_trial_iniciado_en is
  'Lo marca solo el webhook de RevenueCat (service_role) al confirmar un evento real de inicio de trial de Horizon. null = nunca inició un trial. El cliente no puede escribir esta columna.';
comment on column public.perfiles_usuario.regalo_trial_horizon_reclamado_en is
  'null = todavía no reclamó su segunda semilla de regalo (la del trial). Se marca al llamar comercio.otorgar_semilla_trial_horizon — una sola vez por cuenta.';

-- Solo el service_role (la Edge Function del webhook) puede marcar el inicio
-- de trial — igual patrón de confianza que comercio.acreditar_gemas.
create function comercio.marcar_trial_horizon_iniciado(p_persona_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.perfiles_usuario
  set horizon_trial_iniciado_en = now()
  where id = p_persona_id and horizon_trial_iniciado_en is null;
  return found;
end;
$$;

revoke all on function comercio.marcar_trial_horizon_iniciado(uuid) from public, anon, authenticated;
grant execute on function comercio.marcar_trial_horizon_iniciado(uuid) to service_role;

create function comercio.otorgar_semilla_trial_horizon(p_paquete_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_persona_id uuid; declare v_perfil record; declare v_valido boolean;
begin
  v_persona_id := auth.uid();
  if v_persona_id is null then raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege'; end if;

  select horizon_trial_iniciado_en, regalo_trial_horizon_reclamado_en
  into v_perfil
  from public.perfiles_usuario where id = v_persona_id for update;

  if v_perfil.horizon_trial_iniciado_en is null then
    raise exception 'No hay una prueba de Horizon activa.' using errcode = 'insufficient_privilege';
  end if;
  if v_perfil.regalo_trial_horizon_reclamado_en is not null then
    raise exception 'Ya reclamaste tu árbol de prueba.' using errcode = 'check_violation';
  end if;

  -- Más estricto que el regalo de bienvenida: exige rareza legendario
  -- explícitamente (el de bienvenida solo exige "no gratuito").
  select true into v_valido from public.arboles_paquetes
  where id = p_paquete_id and activo and not es_gratuito and rareza = 'legendario';
  if v_valido is null then raise exception 'Paquete no disponible.' using errcode = 'no_data_found'; end if;

  insert into public.usuario_semillas (usuario_id, paquete_id) values (v_persona_id, p_paquete_id);
  update public.perfiles_usuario set regalo_trial_horizon_reclamado_en = now() where id = v_persona_id;

  return jsonb_build_object('paquete_id', p_paquete_id);
end;
$$;

grant execute on function comercio.otorgar_semilla_trial_horizon(text) to authenticated;

create function public.otorgar_semilla_trial_horizon(p_paquete_id text)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select comercio.otorgar_semilla_trial_horizon(p_paquete_id);
$$;

grant execute on function public.otorgar_semilla_trial_horizon(text) to authenticated;

comment on function public.otorgar_semilla_trial_horizon(text) is 'Regala 1 semilla de un árbol legendario al iniciar el trial de Horizon — una sola vez por cuenta, exige horizon_trial_iniciado_en marcado por el webhook. Ver comercio.otorgar_semilla_trial_horizon.';

commit;
