-- Migración 85: editar una rutina. Plan: docs/superpowers/plans/2026-10-09-plan-maestro.md (tarea 4.1).
--
-- actualizar_rutina(p_rutina_id, p_datos) recibe la misma forma que
-- crear_rutina (migración 81), con una diferencia: cada paso puede traer su
-- "id". Un paso que llega con el id de un paso existente de ESTA rutina y el
-- mismo origen (mismo tipo, mismo hábito o tarea) se CONSERVA y se actualiza
-- en su sitio, así no se pierden sus registros (rutinas_pasos_registros de
-- pasos propios: el avance de hoy y el historial). Los pasos existentes que
-- no llegan se borran; los que llegan sin id, o con otro origen, se crean.
-- Security invoker: RLS y el trigger rutinas_pasos_validar siguen aplicando.
-- Requiere la migración 84 (reprogramar_recordatorio_rutina).
begin;

create or replace function public.actualizar_rutina(p_rutina_id uuid, p_datos jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_usuario uuid := auth.uid();
  v_pasos jsonb := coalesce(p_datos -> 'pasos', '[]'::jsonb);
  v_dias smallint[];
  v_conservados uuid[];
begin
  if v_usuario is null then raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege'; end if;
  if not exists (
    select 1 from public.rutinas_items where id = p_rutina_id and usuario_id = v_usuario and estado <> 'archivada'
  ) then
    raise exception 'Rutina no encontrada.' using errcode = 'no_data_found';
  end if;
  if jsonb_typeof(v_pasos) <> 'array' or jsonb_array_length(v_pasos) not between 1 and 20 then
    raise exception 'Una rutina necesita entre 1 y 20 pasos.' using errcode = 'check_violation';
  end if;
  if not exists (select 1 from jsonb_array_elements(v_pasos) paso where coalesce((paso ->> 'esencial')::boolean, true)) then
    raise exception 'Una rutina necesita al menos un paso esencial.' using errcode = 'check_violation';
  end if;

  if p_datos -> 'dias_semana' is not null and jsonb_typeof(p_datos -> 'dias_semana') = 'array' then
    select array_agg(dia::smallint order by dia::smallint) into v_dias from jsonb_array_elements_text(p_datos -> 'dias_semana') dia;
  end if;

  update public.rutinas_items set
    titulo = p_datos ->> 'titulo',
    descripcion = nullif(trim(coalesce(p_datos ->> 'descripcion', '')), ''),
    franja = coalesce(p_datos ->> 'franja', 'cualquier_momento'),
    icono_lucide = p_datos ->> 'icono_lucide',
    color = p_datos ->> 'color',
    frecuencia = coalesce(p_datos ->> 'frecuencia', 'dias_semana'),
    dias_semana = v_dias,
    hora_inicio = nullif(p_datos ->> 'hora_inicio', '')::time,
    recordatorio_activo = coalesce((p_datos ->> 'recordatorio_activo')::boolean, false),
    mostrar_nombre_notificacion = coalesce((p_datos ->> 'mostrar_nombre_notificacion')::boolean, true)
  where id = p_rutina_id;

  -- Pasos que se conservan: mismo id, de esta rutina, con el mismo origen.
  select coalesce(array_agg(rp.id), '{}'::uuid[]) into v_conservados
  from public.rutinas_pasos rp
  join jsonb_array_elements(v_pasos) as paso(valor) on nullif(paso.valor ->> 'id', '')::uuid = rp.id
  where rp.rutina_id = p_rutina_id
    and rp.tipo_origen = paso.valor ->> 'tipo_origen'
    and rp.habito_id is not distinct from nullif(paso.valor ->> 'habito_id', '')::uuid
    and rp.tarea_id is not distinct from nullif(paso.valor ->> 'tarea_id', '')::uuid;

  delete from public.rutinas_pasos where rutina_id = p_rutina_id and id <> all (v_conservados);

  -- unique(rutina_id, orden) es deferrable: los órdenes pueden cruzarse dentro
  -- de la transacción y se comprueban al final.
  update public.rutinas_pasos rp set
    orden = paso.posicion::smallint,
    titulo = nullif(trim(coalesce(paso.valor ->> 'titulo', '')), ''),
    modo = nullif(paso.valor ->> 'modo', ''),
    objetivo_valor = nullif(paso.valor ->> 'objetivo_valor', '')::numeric,
    unidad = nullif(trim(coalesce(paso.valor ->> 'unidad', '')), ''),
    esencial = coalesce((paso.valor ->> 'esencial')::boolean, true)
  from jsonb_array_elements(v_pasos) with ordinality as paso(valor, posicion)
  where rp.rutina_id = p_rutina_id
    and rp.id = any (v_conservados)
    and rp.id = nullif(paso.valor ->> 'id', '')::uuid;

  insert into public.rutinas_pasos (rutina_id, orden, tipo_origen, habito_id, tarea_id, titulo, modo, objetivo_valor, unidad, esencial)
  select
    p_rutina_id,
    paso.posicion::smallint,
    paso.valor ->> 'tipo_origen',
    nullif(paso.valor ->> 'habito_id', '')::uuid,
    nullif(paso.valor ->> 'tarea_id', '')::uuid,
    nullif(trim(coalesce(paso.valor ->> 'titulo', '')), ''),
    nullif(paso.valor ->> 'modo', ''),
    nullif(paso.valor ->> 'objetivo_valor', '')::numeric,
    nullif(trim(coalesce(paso.valor ->> 'unidad', '')), ''),
    coalesce((paso.valor ->> 'esencial')::boolean, true)
  from jsonb_array_elements(v_pasos) with ordinality as paso(valor, posicion)
  where not coalesce(nullif(paso.valor ->> 'id', '')::uuid = any (v_conservados), false);

  -- Si cambió la hora, el aviso de hoy que aún no salió se vuelve a programar.
  perform privacidad.reprogramar_recordatorio_rutina(p_rutina_id);

  return jsonb_build_object('id', p_rutina_id);
end;
$$;

revoke all on function public.actualizar_rutina(uuid, jsonb) from public, anon;
grant execute on function public.actualizar_rutina(uuid, jsonb) to authenticated;

commit;
