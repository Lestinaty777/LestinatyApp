-- Fase 8.4: guarda defensiva en completar_tarea_dia, diferida a propósito en
-- la Fase 8.1 hasta que el cliente dejara de llamarla para tareas
-- gamificadas — ya se verificó que MapaSenderosPantalla.tsx y
-- TareasPantalla.tsx rutean simple/contador/cronometro + dias_semana a
-- registrar_progreso_tarea. Sin esta guarda, un futuro call site equivocado
-- podría volver a escribir en tareas_registros sin pasar por el nivel/figura
-- (mismo tipo de bug de doble-tracking ya cazado dos veces en la Fase 1).
create or replace function privacidad.completar_tarea_dia(
  p_tarea_id uuid,
  p_fecha_local date,
  p_nota text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tarea public.tareas_items;
  v_completada boolean;
  v_racha integer := 0;
  v_fecha date;
  v_gemas_ganadas integer := 0;
begin
  if auth.uid() is null then raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege'; end if;
  select * into v_tarea from public.tareas_items where id = p_tarea_id and usuario_id = auth.uid() and estado <> 'archivada';
  if not found then raise exception 'Tarea no encontrada.' using errcode = 'no_data_found'; end if;

  if v_tarea.frecuencia = 'dias_semana' and v_tarea.tipo in ('simple', 'contador', 'cronometro') then
    raise exception 'Esta tarea usa el sendero de días; usa registrar_progreso_tarea.' using errcode = 'check_violation';
  end if;

  if v_tarea.frecuencia = 'una_vez' then
    v_completada := v_tarea.estado <> 'hecha';
    update public.tareas_items
      set estado = case when v_completada then 'hecha' else 'pendiente' end,
        completada_en = case when v_completada then now() else null end
      where id = p_tarea_id;
    return jsonb_build_object('id', p_tarea_id, 'completada', v_completada, 'racha', null, 'gemas_ganadas', 0);
  end if;

  if exists (select 1 from public.tareas_registros where tarea_id = p_tarea_id and fecha_local = p_fecha_local) then
    delete from public.tareas_registros where tarea_id = p_tarea_id and fecha_local = p_fecha_local;
    v_completada := false;
  else
    insert into public.tareas_registros (tarea_id, usuario_id, fecha_local, nota)
    values (p_tarea_id, auth.uid(), p_fecha_local, nullif(trim(coalesce(p_nota, '')), ''));
    v_completada := true;
  end if;

  v_fecha := p_fecha_local;
  for v_vueltas in 1..366 loop
    if public.tareas_es_dia_programado(v_tarea, v_fecha) then
      exit when not exists (select 1 from public.tareas_registros where tarea_id = p_tarea_id and fecha_local = v_fecha);
      v_racha := v_racha + 1;
    end if;
    v_fecha := v_fecha - 1;
  end loop;

  if v_completada and v_racha > 0 and v_racha % 7 = 0
    and not exists (
      select 1 from comercio.movimientos_gemas
      where persona_id = auth.uid() and motivo = 'racha_tarea'
        and referencia = 'racha_tarea:' || p_tarea_id::text || ':' || v_racha::text
    ) then
    v_gemas_ganadas := 10;
    perform comercio.acreditar_gemas(auth.uid(), v_gemas_ganadas, 'racha_tarea', 'racha_tarea:' || p_tarea_id::text || ':' || v_racha::text);
  end if;

  return jsonb_build_object('id', p_tarea_id, 'completada', v_completada, 'racha', v_racha, 'gemas_ganadas', v_gemas_ganadas);
end;
$$;
