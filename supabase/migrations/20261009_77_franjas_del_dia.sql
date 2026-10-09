-- Migración 77: franjas del día (mañana, tarde, noche) para hábitos, tareas y,
-- en la 70, rutinas. Spec: docs/superpowers/specs/2026-10-04-franjas-del-dia-design.md
--
-- Solo organiza la vista y los insights: no toca rachas, niveles, gemas ni
-- recordatorios. Todo lo existente queda en 'cualquier_momento' hasta que la
-- persona lo configure, así que esta migración no cambia ningún comportamiento.
--
-- NOTA para la etapa de wizards: las RPCs que versionan o recrean planes de
-- hábito (migraciones 10, 20 y 42) listan columnas explícitas, así que un plan
-- nuevo nace en 'cualquier_momento' aunque el anterior tuviera franja. Hay que
-- propagarla ahí antes de exponer el selector en el wizard de hábitos.
-- planes_bloques.momento (migración 65) ya usa los mismos códigos
-- (manana/tarde/noche) y no se migra aquí.
begin;

create domain public.franja_dia as text
  check (value in ('manana', 'tarde', 'noche', 'cualquier_momento'));

alter table public.habitos_planes
  add column franja public.franja_dia not null default 'cualquier_momento';

alter table public.tareas_items
  add column franja public.franja_dia not null default 'cualquier_momento';

-- Límites configurables por persona, hora local 0–23. La noche cruza
-- medianoche: va desde franja_noche_desde hasta franja_manana_desde del día
-- siguiente.
alter table public.perfiles_usuario
  add column franja_manana_desde smallint not null default 5  check (franja_manana_desde between 0 and 23),
  add column franja_tarde_desde  smallint not null default 12 check (franja_tarde_desde  between 0 and 23),
  add column franja_noche_desde  smallint not null default 19 check (franja_noche_desde  between 0 and 23),
  add constraint perfiles_franjas_orden_check
    check (franja_manana_desde < franja_tarde_desde and franja_tarde_desde < franja_noche_desde);

-- Franja de una hora local (0–23). Espejo de franjaDeHora() en
-- src/compartido/utilidades/franjas.ts: si cambia una, cambia la otra.
create or replace function public.franja_de_hora(
  p_hora smallint,
  p_manana smallint,
  p_tarde smallint,
  p_noche smallint
) returns public.franja_dia
language sql
immutable
set search_path = ''
as $$
  select case
    when p_hora >= p_manana and p_hora < p_tarde then 'manana'
    when p_hora >= p_tarde and p_hora < p_noche then 'tarde'
    else 'noche'
  end::public.franja_dia;
$$;

commit;
