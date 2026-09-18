-- Regalo de bienvenida: un usuario nuevo elige UN paquete premium (de
-- cualquiera de los reales, su elección libre) y recibe exactamente 1
-- semilla gratis — una sola vez por cuenta, sin usar cantidad_por_compra.
-- Como una semilla se ata para siempre a un solo hábito, esto solo resuelve
-- el primer hábito del usuario; cualquier hábito adicional sigue
-- necesitando comprar más semillas en la Tienda.

begin;

alter table public.perfiles_usuario
  add column regalo_bienvenida_reclamado_en timestamptz;

comment on column public.perfiles_usuario.regalo_bienvenida_reclamado_en is
  'null = todavía no reclamó su árbol de bienvenida gratis. Se marca al llamar comercio.otorgar_semilla_bienvenida — una sola vez por cuenta, para siempre.';

-- Backfill obligatorio: las cuentas que ya existen NO deben ver el gate de
-- bienvenida de golpe en su próximo login. Solo las cuentas nuevas (el
-- trigger de alta no toca esta columna, así que nacen en null) lo ven.
update public.perfiles_usuario
set regalo_bienvenida_reclamado_en = now()
where regalo_bienvenida_reclamado_en is null;

create function comercio.otorgar_semilla_bienvenida(p_paquete_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_persona_id uuid; declare v_ya_reclamado timestamptz; declare v_valido boolean;
begin
  v_persona_id := auth.uid();
  if v_persona_id is null then raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege'; end if;

  select regalo_bienvenida_reclamado_en into v_ya_reclamado
  from public.perfiles_usuario where id = v_persona_id for update;
  if v_ya_reclamado is not null then
    raise exception 'Ya reclamaste tu árbol de bienvenida.' using errcode = 'check_violation';
  end if;

  select true into v_valido from public.arboles_paquetes
  where id = p_paquete_id and activo and not es_gratuito;
  if v_valido is null then raise exception 'Paquete no disponible.' using errcode = 'no_data_found'; end if;

  insert into public.usuario_semillas (usuario_id, paquete_id) values (v_persona_id, p_paquete_id);
  update public.perfiles_usuario set regalo_bienvenida_reclamado_en = now() where id = v_persona_id;

  return jsonb_build_object('paquete_id', p_paquete_id);
end;
$$;

grant execute on function comercio.otorgar_semilla_bienvenida(text) to authenticated;

create function public.otorgar_semilla_bienvenida(p_paquete_id text)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select comercio.otorgar_semilla_bienvenida(p_paquete_id);
$$;

grant execute on function public.otorgar_semilla_bienvenida(text) to authenticated;

comment on function public.otorgar_semilla_bienvenida(text) is 'Regala exactamente 1 semilla del paquete elegido — una sola vez de por vida por cuenta. Ver comercio.otorgar_semilla_bienvenida.';

commit;
