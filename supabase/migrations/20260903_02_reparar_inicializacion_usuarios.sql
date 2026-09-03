-- Repara cuentas de Auth creadas antes de la inicializacion automatica.
-- Es segura de ejecutar varias veces: no reemplaza datos existentes.

begin;

insert into public.perfiles_usuario (id, nombre_visible)
select
  usuario.id,
  nullif(trim(coalesce(usuario.raw_user_meta_data ->> 'full_name', '')), '')
from auth.users as usuario
on conflict (id) do nothing;

insert into privacidad.usuario_permisos_datos (usuario_id, revocado_at)
select perfil.id, now()
from public.perfiles_usuario as perfil
on conflict (usuario_id) do nothing;

insert into public.preferencias_notificacion_usuario (usuario_id, catalogo_codigo)
select perfil.id, catalogo.codigo
from public.perfiles_usuario as perfil
cross join public.catalogo_notificaciones as catalogo
where catalogo.activo
on conflict (usuario_id, catalogo_codigo) do nothing;

-- Diagnostico global para confirmar que Auth y la inicializacion quedaron alineados.
select
  (select count(*) from auth.users) as usuarios_auth,
  (select count(*) from public.perfiles_usuario) as perfiles,
  (select count(*) from privacidad.usuario_permisos_datos) as permisos_datos,
  (select count(*) from public.preferencias_notificacion_usuario) as preferencias_notificacion;

commit;
