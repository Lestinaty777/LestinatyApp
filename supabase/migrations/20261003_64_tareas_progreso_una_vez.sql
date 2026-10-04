-- Progreso numérico real para tareas 'una_vez' tipo contador/cronómetro.
--
-- Hasta ahora esas tareas tenían un objetivo_valor (meta descriptiva, ej.
-- "8 vasos de agua") pero completar_tarea_dia las trataba como un simple
-- toggle hecha/pendiente, sin guardar ningún avance parcial — el valor
-- nunca se persistía. registrar_progreso_tarea (el RPC con niveles/sendero
-- de días/figuras) rechaza explícitamente cualquier tarea 'una_vez': ese
-- motor calcula rachas a través de varios días, no aplica a algo que pasa
-- una sola vez.
--
-- Esta es la versión simple: el progreso vive en la tarea misma (no hay
-- "por día" para 'una_vez', así que no tiene sentido en tareas_registros),
-- sin niveles, sin figuras, sin gemas — mismo criterio sin-recompensa que ya
-- tiene completar_tarea_dia para 'una_vez'. Al llegar a la meta, marca
-- estado='hecha' sola — mismo campo que ya usa completar_tarea_dia, así que
-- el resto de la app (Mis tareas, racha, etc.) no necesita enterarse de que
-- existe este RPC nuevo.

alter table public.tareas_items
  add column valor_actual numeric not null default 0 check (valor_actual >= 0);

create or replace function privacidad.registrar_progreso_tarea_unica(
  p_tarea_id uuid,
  p_valor numeric
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tarea public.tareas_items;
  v_valor numeric;
  v_cumple_meta boolean;
begin
  if auth.uid() is null then
    raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege';
  end if;

  select * into v_tarea
  from public.tareas_items
  where id = p_tarea_id and usuario_id = auth.uid() and estado <> 'archivada'
  for update;

  if not found then
    raise exception 'Tarea no encontrada.' using errcode = 'no_data_found';
  end if;
  if v_tarea.frecuencia <> 'una_vez' or v_tarea.tipo not in ('contador', 'cronometro') then
    raise exception 'Esta tarea no usa progreso de una vez; usa registrar_progreso_tarea o completar_tarea_dia.' using errcode = 'check_violation';
  end if;

  v_valor := greatest(0, p_valor);
  v_cumple_meta := v_valor >= v_tarea.objetivo_valor;

  update public.tareas_items
  set
    valor_actual = v_valor,
    estado = case when v_cumple_meta then 'hecha' else 'pendiente' end,
    completada_en = case when v_cumple_meta then now() else null end
  where id = p_tarea_id
  returning * into v_tarea;

  return jsonb_build_object(
    'id', v_tarea.id,
    'valor_actual', v_tarea.valor_actual,
    'objetivo_valor', v_tarea.objetivo_valor,
    'completada', v_cumple_meta
  );
end;
$$;

create or replace function public.registrar_progreso_tarea_unica(
  p_tarea_id uuid, p_valor numeric
)
returns jsonb
language sql
set search_path = ''
as $$
  select privacidad.registrar_progreso_tarea_unica(p_tarea_id, p_valor);
$$;
