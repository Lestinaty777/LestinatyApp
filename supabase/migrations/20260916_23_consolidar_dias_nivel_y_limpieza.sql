-- Consolida la secuencia de días-por-nivel y limpia código/tablas muertas
-- detectadas en la auditoría del backend de hábitos:
--
-- 1) Nueva secuencia de días acumulados por nivel: 3,7,12,18,25,33 (antes
--    3,7,14,30,60,90). Misma fuente que ya usa el frontend
--    (DIAS_REQUERIDOS_POR_NIVEL en iconosHabitos.ts) y los 7 mapas de
--    src/modulos/senderos/Mapas/ — nivel 7 sigue siendo el máximo absoluto,
--    no hay un "día 42 real" en el backend (esos 42 nodos son solo el mapa
--    visual de quien ya llegó al tope).
-- 2) habitos_niveles_plan: se creó en la migración 12 para un roadmap de
--    metas por nivel generado por IA/fórmula, pero nada en todo el repo
--    (frontend ni backend) inserta filas ahí — confirmado en 0 filas. Cada
--    reescritura de registrar_progreso_habito desde entonces (14, 15, 16, 21)
--    arrastró fielmente una rama que nunca se ejecuta. Se quita esa rama y se
--    borra la tabla (recuperable desde la migración 12 si se retoma la idea).
-- 3) crear_habito (la versión no-premium): duplica el insert de
--    crear_habito_premium y no tiene ningún caller en el frontend — el wizard
--    siempre usa crear_habito_premium. Se elimina.

begin;

create or replace function privacidad.registrar_progreso_habito(p_habito_id uuid, p_fecha_local date, p_valor numeric, p_nota text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_fecha_actual date;
declare v_registro public.habitos_registros;
declare v_tipo_meta text;
declare v_plan_vigente public.habitos_planes;
declare v_dias_requeridos_por_nivel integer[] := array[3,7,12,18,25,33];
declare v_dias_requeridos integer;
declare v_dias_completados integer := 0;
declare v_nuevo_objetivo numeric;
declare v_mensaje_nivel text;
declare v_subio_nivel boolean := false;
declare v_nivel_actual integer;
declare v_gemas_ganadas integer := 0;
begin
  if auth.uid() is null then raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege'; end if;
  select (now() at time zone perfil.zona_horaria)::date into v_fecha_actual
  from public.perfiles_usuario perfil where perfil.id = auth.uid();
  if p_fecha_local > coalesce(v_fecha_actual, current_date) then
    raise exception 'No puedes registrar progreso en una fecha futura.' using errcode = 'check_violation';
  end if;

  select item.tipo_meta into v_tipo_meta
  from public.habitos_items item where item.id = p_habito_id and item.usuario_id = auth.uid();
  if v_tipo_meta is null then
    raise exception 'Hábito no encontrado.' using errcode = 'no_data_found';
  end if;

  insert into public.habitos_registros (habito_id, usuario_id, fecha_local, valor, nota)
  values (p_habito_id, auth.uid(), p_fecha_local, p_valor, p_nota)
  on conflict (habito_id, fecha_local) do update
  set valor = excluded.valor, nota = excluded.nota, registrado_at = now(), updated_at = now()
  returning * into v_registro;

  select plan.* into v_plan_vigente
  from public.habitos_planes plan
  where plan.habito_id = p_habito_id
    and plan.desde_fecha <= v_fecha_actual
    and (plan.hasta_fecha is null or plan.hasta_fecha > v_fecha_actual)
  order by plan.desde_fecha desc
  limit 1;

  v_nivel_actual := coalesce(v_plan_vigente.nivel, 1);

  if v_plan_vigente.id is not null
    and v_nivel_actual < 7
    -- Idempotencia: si el plan de mañana ya existe, esta subida ya se aplicó
    -- en una llamada anterior el mismo día (ver migración 16).
    and not exists (
      select 1 from public.habitos_planes
      where habito_id = p_habito_id and desde_fecha = v_fecha_actual + 1
    )
  then
    v_dias_requeridos := v_dias_requeridos_por_nivel[v_nivel_actual];

    select count(*) into v_dias_completados
    from generate_series(v_plan_vigente.desde_fecha, v_fecha_actual, interval '1 day') as dia(fecha)
    join public.habitos_registros registro
      on registro.habito_id = p_habito_id and registro.fecha_local = dia.fecha::date
    where public.habitos_es_dia_programado(v_plan_vigente, dia.fecha::date)
      and (case when v_tipo_meta = 'check' then registro.valor > 0 else registro.valor >= v_plan_vigente.objetivo_valor end);

    if v_dias_completados >= v_dias_requeridos then
      v_nuevo_objetivo := case
        when v_tipo_meta = 'check' then v_plan_vigente.objetivo_valor
        else round(v_plan_vigente.objetivo_valor * 1.15, 2)
      end;
      v_mensaje_nivel := '¡Subiste al nivel ' || (v_plan_vigente.nivel + 1) || '!';

      update public.habitos_planes set hasta_fecha = v_fecha_actual + 1 where id = v_plan_vigente.id;

      insert into public.habitos_planes (
        habito_id, frecuencia, dias_semana, veces_por_semana, objetivo_valor, desde_fecha, nivel, origen, mensaje_nivel
      ) values (
        p_habito_id, v_plan_vigente.frecuencia, v_plan_vigente.dias_semana, v_plan_vigente.veces_por_semana,
        v_nuevo_objetivo, v_fecha_actual + 1, v_plan_vigente.nivel + 1, 'subida_nivel', v_mensaje_nivel
      );

      v_subio_nivel := true;
      v_nivel_actual := v_plan_vigente.nivel + 1;
      v_gemas_ganadas := comercio.acreditar_recompensa_nivel_habito(p_habito_id, v_nivel_actual);
    end if;
  end if;

  return jsonb_build_object(
    'id', v_registro.id, 'habito_id', v_registro.habito_id, 'fecha_local', v_registro.fecha_local,
    'valor', v_registro.valor, 'nota', v_registro.nota,
    'subio_nivel', v_subio_nivel, 'nivel', v_nivel_actual, 'gemas_ganadas', v_gemas_ganadas
  );
end;
$$;

drop function if exists privacidad.crear_habito(text,text,text,text,text,text,text,smallint[],smallint,numeric,date);
drop function if exists public.crear_habito(text,text,text,text,text,text,text,smallint[],smallint,numeric,date);

drop table if exists public.habitos_niveles_plan;

commit;

notify pgrst, 'reload schema';
