-- Migración 49: borrado de cuenta REAL (Apple 5.1.1(v)).
--
-- Hoy "Eliminar cuenta" en la app solo inserta una fila en
-- privacidad.solicitudes_privacidad (tipo 'eliminacion', estado 'pendiente')
-- y cierra sesión — nunca se procesa, la cuenta y todos sus datos siguen
-- intactos. Un revisor de Apple que pruebe el flujo y vuelva a loguearse lo
-- detecta de inmediato.
--
-- Esta migración:
-- 1. Corrige dos foreign keys a auth.users que hoy son NO ACTION y
--    bloquearían el DELETE en cascada (verificado contra el esquema real
--    antes de escribir esto, no asumido).
-- 2. Crea privacidad.eliminar_cuenta_propia(): borra auth.users del usuario
--    autenticado, lo que cascada a TODAS sus tablas (perfiles_usuario y todo
--    lo que cuelga de ella, más las que referencian auth.users directo).
-- 3. Dedja un registro mínimo, sin FK (para que no se borre a sí mismo con
--    la cascada), de que la cuenta existió y se eliminó.

begin;

-- ─── 1. FKs que bloquearían la cascada ──────────────────────────────────────

-- usuario_semillas.usuario_id: hoy NO ACTION — al borrar el usuario, su
-- inventario de semillas debe desaparecer con él.
alter table public.usuario_semillas drop constraint usuario_semillas_usuario_id_fkey;
alter table public.usuario_semillas add constraint usuario_semillas_usuario_id_fkey
  foreign key (usuario_id) references auth.users(id) on delete cascade;

-- perfiles_usuario.referido_por: hoy NO ACTION — si se borra la cuenta de
-- quien refirió a otros, esos otros usuarios NO deben perder su propia
-- cuenta; solo pierden el vínculo "quién los refirió".
alter table public.perfiles_usuario drop constraint perfiles_usuario_referido_por_fkey;
alter table public.perfiles_usuario add constraint perfiles_usuario_referido_por_fkey
  foreign key (referido_por) references auth.users(id) on delete set null;

-- ─── 2. Registro mínimo de auditoría, sin FK a auth.users a propósito ──────
create table if not exists privacidad.cuentas_eliminadas (
  id uuid primary key default gen_random_uuid(),
  usuario_id_original uuid not null,
  eliminado_en timestamptz not null default now()
);

alter table privacidad.cuentas_eliminadas enable row level security;
-- Nadie lee esto desde el cliente; es solo para auditoría interna vía service_role.
revoke all on table privacidad.cuentas_eliminadas from public, anon, authenticated;
grant all on table privacidad.cuentas_eliminadas to service_role;

-- ─── 3. Borrado real, disparado por el propio usuario ──────────────────────
create or replace function privacidad.eliminar_cuenta_propia()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid := auth.uid();
begin
  if v_usuario_id is null then
    raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege';
  end if;

  insert into privacidad.cuentas_eliminadas (usuario_id_original) values (v_usuario_id);

  -- Cascada real: perfiles_usuario y todo lo que cuelga de ella (hábitos,
  -- registros, sendero, notificaciones, permisos, solicitudes) + las tablas
  -- que referencian auth.users directo (billetera, movimientos, cofres,
  -- tareas diarias, paquetes desbloqueados, semillas) desaparecen con esto.
  delete from auth.users where id = v_usuario_id;
end;
$$;

revoke all on function privacidad.eliminar_cuenta_propia() from public, anon;
grant execute on function privacidad.eliminar_cuenta_propia() to authenticated, service_role;

create or replace function public.eliminar_cuenta_propia()
returns void
language sql
security invoker
set search_path = ''
as $$
  select privacidad.eliminar_cuenta_propia();
$$;

revoke all on function public.eliminar_cuenta_propia() from public, anon;
grant execute on function public.eliminar_cuenta_propia() to authenticated, service_role;

notify pgrst, 'reload schema';

commit;
