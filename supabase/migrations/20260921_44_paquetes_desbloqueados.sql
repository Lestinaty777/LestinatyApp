-- Paquetes de árbol "desbloqueados" por usuario: la propiedad de un paquete
-- premium, INDEPENDIENTE de las semillas. El usuario puede personalizar la app
-- con el tono de cualquier paquete que haya tenido alguna vez, aunque ya haya
-- gastado la semilla (plantándola en un hábito) — o aunque, en el futuro, las
-- semillas se devuelvan, se transfieran o se borren.
--
-- Por qué no derivarlo de usuario_semillas: (1) hoy nada la borra, pero eso es
-- un accidente del diseño, no una garantía; (2) ya hay hábitos con paquete
-- premium (diamante, aurelia, mathist) sin una semilla que los respalde, así
-- que "tener el paquete" no se puede reconstruir solo desde las semillas.
--
-- Solo guarda paquetes NO gratuitos: Esmeralda y los verdes siempre están
-- disponibles. Se llena sola (triggers) cuando una semilla premium se inserta
-- (compra, semilla de bienvenida, regalo del trial de Horizon) o cuando un
-- hábito recibe un paquete premium, y se rellena con lo que ya existe.
-- El cliente solo puede LEER sus filas; nada las borra.

begin;

create table if not exists public.usuario_paquetes_desbloqueados (
  usuario_id uuid not null references auth.users (id) on delete cascade,
  paquete_id text not null references public.arboles_paquetes (id),
  origen text not null check (origen in ('semilla', 'habito')),
  desbloqueado_en timestamptz not null default now(),
  primary key (usuario_id, paquete_id)
);

alter table public.usuario_paquetes_desbloqueados enable row level security;

drop policy if exists usuario_paquetes_desbloqueados_propios on public.usuario_paquetes_desbloqueados;
create policy usuario_paquetes_desbloqueados_propios on public.usuario_paquetes_desbloqueados
  for select to authenticated using (usuario_id = (select auth.uid()));

revoke all on table public.usuario_paquetes_desbloqueados from public, anon, authenticated;
grant select on table public.usuario_paquetes_desbloqueados to authenticated;

create or replace function public.desbloquear_paquete_de_semilla()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.usuario_paquetes_desbloqueados (usuario_id, paquete_id, origen)
  select new.usuario_id, p.id, 'semilla' from public.arboles_paquetes p where p.id = new.paquete_id and not p.es_gratuito
  on conflict (usuario_id, paquete_id) do nothing;
  return new;
end;
$$;

create or replace function public.desbloquear_paquete_de_habito()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.usuario_paquetes_desbloqueados (usuario_id, paquete_id, origen)
  select new.usuario_id, p.id, 'habito' from public.arboles_paquetes p where p.id = new.paquete_id and not p.es_gratuito
  on conflict (usuario_id, paquete_id) do nothing;
  return new;
end;
$$;

revoke all on function public.desbloquear_paquete_de_semilla() from public, anon, authenticated;
revoke all on function public.desbloquear_paquete_de_habito() from public, anon, authenticated;

drop trigger if exists usuario_semillas_desbloquea_paquete on public.usuario_semillas;
create trigger usuario_semillas_desbloquea_paquete
  after insert on public.usuario_semillas
  for each row execute function public.desbloquear_paquete_de_semilla();

drop trigger if exists habitos_items_desbloquea_paquete on public.habitos_items;
create trigger habitos_items_desbloquea_paquete
  after insert or update of paquete_id on public.habitos_items
  for each row execute function public.desbloquear_paquete_de_habito();

-- Relleno con lo que ya existe (semillas adquiridas — plantadas o no — y hábitos con paquete premium).
insert into public.usuario_paquetes_desbloqueados (usuario_id, paquete_id, origen, desbloqueado_en)
select s.usuario_id, s.paquete_id, 'semilla', min(s.adquirida_en)
from public.usuario_semillas s join public.arboles_paquetes p on p.id = s.paquete_id and not p.es_gratuito
group by s.usuario_id, s.paquete_id
on conflict (usuario_id, paquete_id) do nothing;

insert into public.usuario_paquetes_desbloqueados (usuario_id, paquete_id, origen, desbloqueado_en)
select h.usuario_id, h.paquete_id, 'habito', min(h.created_at)
from public.habitos_items h join public.arboles_paquetes p on p.id = h.paquete_id and not p.es_gratuito
group by h.usuario_id, h.paquete_id
on conflict (usuario_id, paquete_id) do nothing;

commit;
