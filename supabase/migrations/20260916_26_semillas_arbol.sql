-- Inventario de semillas: cada fila es UNA semilla comprada, sin usar hasta
-- que se asigna a un hábito (y ahí queda fija para siempre — un hábito solo
-- puede tener un paquete de por vida, confirmado con el usuario). Compra vía
-- comercio.comprar_semillas_arbol (mismo patrón que comercio.comprar_articulo:
-- security definer, cobra de la billetera, deja registro en el ledger), no
-- vía compras_tienda (esa tabla es ownership booleano por artículo, no sirve
-- para "comprar 3 unidades").

begin;

create table public.usuario_semillas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id),
  paquete_id text not null references public.arboles_paquetes(id),
  adquirida_en timestamptz not null default now(),
  habito_id uuid references public.habitos_items(id)
);

comment on table public.usuario_semillas is 'Inventario individual de semillas de árbol compradas — una fila por semilla. habito_id null = sin usar; se fija una sola vez al asignarla a un hábito y nunca se libera.';

create unique index usuario_semillas_habito_unico on public.usuario_semillas (habito_id) where habito_id is not null;
create index usuario_semillas_disponibles on public.usuario_semillas (usuario_id) where habito_id is null;

alter table public.usuario_semillas enable row level security;
create policy "usuario_semillas_propias" on public.usuario_semillas for select to authenticated using (usuario_id = auth.uid());
grant select on public.usuario_semillas to authenticated;

-- comprar_semillas_arbol: cobra precio_gemas de la billetera y crea
-- cantidad_por_compra filas nuevas en usuario_semillas. A diferencia de
-- comprar_articulo, cada llamada SÍ cobra de nuevo (no es idempotente por
-- ownership) — comprar semillas es repetible por diseño.
create function comercio.comprar_semillas_arbol(p_paquete_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_persona_id uuid; declare v_precio integer; declare v_cantidad integer; declare v_saldo integer; declare v_indice integer;
begin
  v_persona_id := auth.uid();
  if v_persona_id is null then raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege'; end if;

  select precio_gemas, cantidad_por_compra into v_precio, v_cantidad
  from public.arboles_paquetes where id = p_paquete_id and activo and not es_gratuito;
  if v_precio is null then raise exception 'Paquete no disponible.' using errcode = 'no_data_found'; end if;

  insert into comercio.billeteras_gemas (persona_id, saldo) values (v_persona_id, 0)
  on conflict (persona_id) do nothing;

  select saldo into v_saldo from comercio.billeteras_gemas where persona_id = v_persona_id for update;
  if v_saldo < v_precio then raise exception 'No tienes gemas suficientes.' using errcode = 'check_violation'; end if;

  update comercio.billeteras_gemas set saldo = saldo - v_precio, actualizado_en = now() where persona_id = v_persona_id;
  insert into comercio.movimientos_gemas (persona_id, cantidad, motivo, referencia)
  values (v_persona_id, -v_precio, 'gasto_semillas', p_paquete_id || ':' || gen_random_uuid()::text);

  for v_indice in 1..v_cantidad loop
    insert into public.usuario_semillas (usuario_id, paquete_id) values (v_persona_id, p_paquete_id);
  end loop;

  return jsonb_build_object('paquete_id', p_paquete_id, 'semillas_compradas', v_cantidad, 'saldo_restante', v_saldo - v_precio);
end;
$$;

create function public.comprar_semillas_arbol(p_paquete_id text)
returns jsonb language sql security invoker set search_path = ''
as $$ select comercio.comprar_semillas_arbol(p_paquete_id); $$;

grant execute on function public.comprar_semillas_arbol(text) to authenticated;

-- asignar_semilla_habito: valida dueño + semilla libre, la consume y fija el
-- paquete del hábito. Se llama al crear un hábito eligiendo una semilla propia
-- en el wizard (Fase 6 del plan) — no reemplaza crear_habito_premium, se
-- encadena después con el habito_id recién creado.
create function privacidad.asignar_semilla_habito(p_semilla_id uuid, p_habito_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_semilla public.usuario_semillas; declare v_habito_existe boolean;
begin
  if auth.uid() is null then raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege'; end if;

  select * into v_semilla from public.usuario_semillas
  where id = p_semilla_id and usuario_id = auth.uid() and habito_id is null
  for update;
  if v_semilla.id is null then raise exception 'Semilla no disponible.' using errcode = 'no_data_found'; end if;

  select exists(select 1 from public.habitos_items where id = p_habito_id and usuario_id = auth.uid()) into v_habito_existe;
  if not v_habito_existe then raise exception 'Hábito no encontrado.' using errcode = 'no_data_found'; end if;

  update public.usuario_semillas set habito_id = p_habito_id where id = p_semilla_id;
  update public.habitos_items set paquete_id = v_semilla.paquete_id where id = p_habito_id;

  return jsonb_build_object('habito_id', p_habito_id, 'paquete_id', v_semilla.paquete_id);
end;
$$;

create function public.asignar_semilla_habito(p_semilla_id uuid, p_habito_id uuid)
returns jsonb language sql security invoker set search_path = ''
as $$ select privacidad.asignar_semilla_habito(p_semilla_id, p_habito_id); $$;

grant execute on function public.asignar_semilla_habito(uuid, uuid) to authenticated;

commit;

notify pgrst, 'reload schema';
