-- signInWithIdToken (login con Google) no acepta options.data como signUp
-- (el tipo de @supabase/supabase-js 2.112 solo expone captchaToken ahí), así
-- que el trigger de auth.users que lee raw_user_meta_data->>'codigo_referido'
-- nunca se activa para altas por Google. Este RPC es el equivalente
-- post-login: se llama una sola vez justo después de crear cuenta con
-- Google, si la persona cargó un código. Idempotente y seguro de llamar de
-- más: solo escribe si referido_por todavía es null y el código no es el
-- propio.

begin;

create or replace function public.aplicar_codigo_referido(p_codigo text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_referido_por uuid;
begin
  if auth.uid() is null then raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege'; end if;

  select id into v_referido_por
  from public.perfiles_usuario
  where codigo_referido = nullif(trim(p_codigo), '');

  if v_referido_por is null or v_referido_por = auth.uid() then
    return;
  end if;

  update public.perfiles_usuario
  set referido_por = v_referido_por
  where id = auth.uid() and referido_por is null;
end;
$$;

grant execute on function public.aplicar_codigo_referido(text) to authenticated;

commit;

notify pgrst, 'reload schema';
