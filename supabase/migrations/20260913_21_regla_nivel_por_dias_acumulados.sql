-- Reemplaza la regla de subida de nivel: en vez de "14 días, dos ventanas de
-- 7 días al 80% cada una" (igual para cualquier nivel), ahora cada nivel pide
-- una cantidad de días cumplidos ACUMULADOS (no consecutivos, nunca se
-- resetea) desde que empezó el plan actual — los mismos números que ya
-- mostraba el paso 6 del wizard (RutaNiveles/DIAS_CONSISTENCIA_NIVEL) como
-- texto decorativo, ahora sí conectados a la regla real:
--   nivel 1->2: 3 días · 2->3: 7 · 3->4: 14 · 4->5: 30 · 5->6: 60 · 6->7: 90
--
-- "Acumulado, no se resetea" significa: cuenta cualquier día programado y
-- cumplido desde el desde_fecha del plan vigente hasta hoy, sin importar si
-- hubo días perdidos en medio — perdonavidas a propósito (confirmado con el
-- usuario). Esto también hace innecesaria la exigencia de "el plan lleva
-- ≥14 días activo" de la regla vieja: con la nueva regla puedes subir de
-- nivel el mismo día en que completas el día-cuenta N, sin importar cuántos
-- días de calendario reales hayan pasado.
--
-- La recompensa de gemas (comercio.acreditar_recompensa_nivel_habito) no
-- cambia: sigue siendo 5 × nivel_nuevo, y no depende de qué regla decidió la
-- subida.

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
declare v_dias_requeridos_por_nivel integer[] := array[3,7,14,30,60,90];
declare v_dias_requeridos integer;
declare v_dias_completados integer := 0;
declare v_nuevo_objetivo numeric;
declare v_mensaje_nivel text;
declare v_siguiente_generado public.habitos_niveles_plan;
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
      select * into v_siguiente_generado
      from public.habitos_niveles_plan
      where habito_id = p_habito_id and nivel = v_plan_vigente.nivel + 1;

      if v_siguiente_generado.id is not null then
        v_nuevo_objetivo := v_siguiente_generado.objetivo_valor;
        v_mensaje_nivel := coalesce(v_siguiente_generado.mensaje, '¡Subiste al nivel ' || (v_plan_vigente.nivel + 1) || '!');
      else
        v_nuevo_objetivo := case
          when v_tipo_meta = 'check' then v_plan_vigente.objetivo_valor
          else round(v_plan_vigente.objetivo_valor * 1.15, 2)
        end;
        v_mensaje_nivel := '¡Subiste al nivel ' || (v_plan_vigente.nivel + 1) || '!';
      end if;

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

commit;
