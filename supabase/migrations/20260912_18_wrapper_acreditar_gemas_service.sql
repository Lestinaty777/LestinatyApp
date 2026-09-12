-- comercio.acreditar_gemas no es alcanzable por supabase-js .rpc(): `comercio`
-- nunca está en los schemas expuestos de PostgREST. La Edge Function de
-- RevenueCat necesita un wrapper en `public`, igual que
-- reclamar_recordatorios_habitos/finalizar_recordatorio_habito — con EXECUTE
-- exclusivo para service_role, así que no abre ninguna vía nueva para el
-- cliente autenticado.

begin;

create or replace function public.acreditar_gemas(
  p_persona_id uuid, p_cantidad integer, p_motivo text, p_referencia text default null
)
returns integer language sql security invoker set search_path = ''
as $$ select comercio.acreditar_gemas(p_persona_id, p_cantidad, p_motivo, p_referencia); $$;

revoke all on function public.acreditar_gemas(uuid, integer, text, text) from public, anon, authenticated;
grant execute on function public.acreditar_gemas(uuid, integer, text, text) to service_role;

commit;
