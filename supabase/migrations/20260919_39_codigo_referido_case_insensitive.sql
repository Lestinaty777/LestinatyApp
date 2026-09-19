-- Bug real encontrado al auditar el flujo de referidos: los códigos se
-- generan con md5(...) (siempre minúscula), pero el campo de la UI usa
-- autoCapitalize="characters", así que el teclado escribe lo que tipea el
-- usuario en MAYÚSCULA. Tanto el trigger de alta como el RPC de Google
-- comparaban con `=` (sensible a mayúsculas), así que el código de un amigo
-- nunca hacía match si se escribía como el teclado lo autocompleta — se
-- perdía en silencio, sin ningún error visible. Se arregla del lado del
-- servidor (lower() en ambos lados) para que no dependa de cómo lo escriba
-- la persona ni de la UI.

begin;

create or replace function privacidad.crear_datos_usuario_nuevo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles_usuario (id, nombre_visible, referido_por)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    (select id from public.perfiles_usuario where lower(codigo_referido) = lower(nullif(trim(new.raw_user_meta_data ->> 'codigo_referido'), '')))
  )
  on conflict (id) do nothing;
  insert into privacidad.usuario_permisos_datos (usuario_id, revocado_at) values (new.id, now()) on conflict (usuario_id) do nothing;
  insert into public.preferencias_notificacion_usuario (usuario_id, catalogo_codigo)
  select new.id, codigo from public.catalogo_notificaciones where activo
  on conflict (usuario_id, catalogo_codigo) do nothing;
  return new;
end;
$$;

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
  where lower(codigo_referido) = lower(nullif(trim(p_codigo), ''));

  if v_referido_por is null or v_referido_por = auth.uid() then
    return;
  end if;

  update public.perfiles_usuario
  set referido_por = v_referido_por
  where id = auth.uid() and referido_por is null;
end;
$$;

commit;

notify pgrst, 'reload schema';
