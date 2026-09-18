-- Resumen de referidos para la interfaz de tienda: permite a cada persona
-- consultar su código único, total de amigos invitados, cuántos ya alcanzaron
-- nivel 2 (recompensa otorgada) y el total de gemas ganadas por referidos.

begin;

create or replace function public.obtener_resumen_referidos()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_codigo text;
declare v_total integer := 0;
declare v_completados integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege';
  end if;

  select codigo_referido into v_codigo
  from public.perfiles_usuario
  where id = auth.uid();

  select
    count(*),
    count(recompensa_referido_otorgada_en)
  into v_total, v_completados
  from public.perfiles_usuario
  where referido_por = auth.uid();

  return jsonb_build_object(
    'codigo', coalesce(v_codigo, ''),
    'total_amigos', coalesce(v_total, 0),
    'amigos_completados', coalesce(v_completados, 0),
    'gemas_ganadas', coalesce(v_completados, 0) * 100
  );
end;
$$;

grant execute on function public.obtener_resumen_referidos() to authenticated;

comment on function public.obtener_resumen_referidos() is 'Devuelve el código propio del usuario y el conteo de amigos invitados y gemas ganadas por referidos.';

commit;
