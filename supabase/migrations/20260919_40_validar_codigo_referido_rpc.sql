-- Para validar el código de un amigo en vivo desde el onboarding (antes de
-- crear la cuenta, sin sesión todavía) hace falta un RPC propio: `anon` no
-- tiene SELECT en perfiles_usuario (a propósito, esa tabla tiene datos de
-- perfil que no deberían quedar expuestos sin autenticación). security
-- definer expone SOLO la existencia del código (un booleano), nada más de la
-- fila — mismo patrón que aplicar_codigo_referido (migración 38).

begin;

create or replace function public.existe_codigo_referido(p_codigo text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfiles_usuario
    where lower(codigo_referido) = lower(nullif(trim(p_codigo), ''))
  );
$$;

grant execute on function public.existe_codigo_referido(text) to anon, authenticated;

commit;

notify pgrst, 'reload schema';
