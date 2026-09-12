-- Identidad visual persistente para reproducir la tarjeta Sendero.
alter table public.habitos_items
  add column if not exists tono_visual smallint not null default 1
  check (tono_visual between 1 and 7);

-- El panel ya persiste días, frecuencia, nivel y registros. Esta vista de
-- compatibilidad expone el tono visual a las consultas nuevas.
comment on column public.habitos_items.tono_visual is 'Tono de selva 1..7 elegido al crear el hábito; determina su árbol visual.';
