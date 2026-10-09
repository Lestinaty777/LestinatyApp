-- Migración 82: franja de un hábito sin reescribir crear_habito_premium ni
-- actualizar_habito_desde_detalle. Plan: docs/superpowers/plans/2026-10-09-plan-maestro.md (tarea 1.1).
--
-- habitos_planes no admite escritura directa del cliente (solo SELECT), y los
-- planes se versionan por rango de fechas: editar un hábito o subir de nivel
-- puede insertar un plan nuevo. Dos piezas:
--   1) trigger: un plan nuevo hereda la franja del plan más reciente del mismo
--      hábito (si no trae una propia), para que la franja no se pierda al versionar;
--   2) RPC establecer_franja_habito: cambia la franja del plan más reciente de
--      un hábito propio. El cliente lo llama después de crear o editar.
-- La franja solo organiza la vista: no entra en rachas, niveles ni gemas.
begin;

create or replace function public.habitos_planes_heredar_franja()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_franja public.franja_dia;
begin
  if new.franja = 'cualquier_momento' then
    select p.franja into v_franja
    from public.habitos_planes p
    where p.habito_id = new.habito_id
    order by p.desde_fecha desc, p.created_at desc
    limit 1;
    if v_franja is not null then new.franja := v_franja; end if;
  end if;
  return new;
end;
$$;

revoke all on function public.habitos_planes_heredar_franja() from public, anon, authenticated;

create trigger habitos_planes_heredar_franja
  before insert on public.habitos_planes
  for each row execute function public.habitos_planes_heredar_franja();

create or replace function privacidad.establecer_franja_habito(p_habito_id uuid, p_franja text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario uuid := auth.uid();
  v_plan uuid;
begin
  if v_usuario is null then raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege'; end if;
  if p_franja is null or p_franja not in ('manana', 'tarde', 'noche', 'cualquier_momento') then
    raise exception 'Franja inválida.' using errcode = 'check_violation';
  end if;

  select p.id into v_plan
  from public.habitos_planes p
  join public.habitos_items h on h.id = p.habito_id
  where p.habito_id = p_habito_id and h.usuario_id = v_usuario
  order by p.desde_fecha desc, p.created_at desc
  limit 1;
  if v_plan is null then raise exception 'Hábito no encontrado.' using errcode = 'no_data_found'; end if;

  update public.habitos_planes set franja = p_franja::public.franja_dia where id = v_plan;
end;
$$;

create or replace function public.establecer_franja_habito(p_habito_id uuid, p_franja text)
returns void
language sql
security invoker
set search_path = ''
as $$ select privacidad.establecer_franja_habito(p_habito_id, p_franja); $$;

revoke all on function privacidad.establecer_franja_habito(uuid, text) from public, anon;
revoke all on function public.establecer_franja_habito(uuid, text) from public, anon;
grant execute on function privacidad.establecer_franja_habito(uuid, text) to authenticated;
grant execute on function public.establecer_franja_habito(uuid, text) to authenticated;

commit;
