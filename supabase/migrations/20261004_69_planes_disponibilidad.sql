-- Migración 69: Fase 11.2 (ajuste) — "bloques por día" (1/2/3) se reemplaza
-- por disponibilidad real por momento: qué momentos del día tiene el
-- usuario (mañana/tarde/noche) y cuánto tiempo en cada uno (poco/moderado/
-- bastante). Esto reemplaza un selector abstracto por una pregunta real de
-- horario, y le da a Aby una instrucción concreta de densidad por bloque en
-- vez de un techo opcional — verificado contra Gemini real antes de este
-- cambio: con la instrucción vieja ("hasta N bloques") el modelo a veces
-- omitía bloques; con disponibilidad explícita + "incluí siempre estos
-- momentos" el resultado fue 0 momentos faltantes en las pruebas.
--
-- disponibilidad se persiste en planes_items (no solo en el momento de
-- crear) para que detallar-seccion-plan respete la misma disponibilidad en
-- las secciones siguientes, no solo en la primera.
begin;

alter table public.planes_items drop column bloques_por_dia;
alter table public.planes_items add column disponibilidad jsonb
  check (disponibilidad is null or jsonb_typeof(disponibilidad) = 'object');

alter table public.planes_propuestas drop column bloques_por_dia;
alter table public.planes_propuestas add column disponibilidad jsonb
  check (disponibilidad is null or jsonb_typeof(disponibilidad) = 'object');

commit;

notify pgrst, 'reload schema';
