-- Recompensa en gemas al subir de nivel un hábito: nivel 2 -> 10, 3 -> 15,
-- 4 -> 20, 5 -> 25, 6 -> 30, 7 -> 35 (fórmula: 5 * nivel_nuevo).
--
-- Deliberadamente NO existe un endpoint público "dame mi recompensa del nivel
-- X": la única llamada expuesta es `comercio.acreditar_recompensa_nivel_habito`,
-- y se invoca únicamente desde dentro de `registrar_progreso_habito()`, en el
-- mismo momento en que ese cálculo real de racha de 14 días (ya existente,
-- migración 11) confirma la subida. Aun así queda expuesta a `authenticated`
-- porque `registrar_progreso_habito` es `security invoker` (corre con los
-- privilegios de quien llama), así que se protege con dos capas:
--   1. Reconfirma contra `habitos_planes` que de verdad existe un plan de esa
--      persona en ese nivel exacto — no confía en el parámetro a ciegas.
--   2. Es idempotente por (hábito, nivel): nunca paga dos veces el mismo salto.
-- Riesgo residual conocido: como `authenticated` ya tiene INSERT/UPDATE de
-- tabla completa sobre `habitos_planes` (mismo modelo de confianza que el
-- resto de Hábitos, ver supabase/resumen.md), alguien técnico podría insertar
-- una fila de plan falsa vía REST crudo y reclamar la recompensa de un nivel
-- que no alcanzó de verdad jugando limpio. Cerrar ese hueco requeriría migrar
-- las escrituras de `habitos_planes` a funciones security definer — fuera de
-- alcance de este cambio, documentado para decidir después si vale la pena.

begin;

alter table comercio.movimientos_gemas drop constraint movimientos_gemas_motivo_check;
alter table comercio.movimientos_gemas add constraint movimientos_gemas_motivo_check
  check (motivo in ('compra_iap', 'gasto_tienda', 'ajuste_soporte', 'recompensa_nivel'));

create or replace function comercio.acreditar_recompensa_nivel_habito(p_habito_id uuid, p_nivel_nuevo integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_persona_id uuid := auth.uid();
  v_recompensa integer;
  v_referencia text;
begin
  if v_persona_id is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;
  if p_nivel_nuevo < 2 or p_nivel_nuevo > 7 then
    return 0;
  end if;

  if not exists (
    select 1
    from public.habitos_planes plan
    join public.habitos_items item on item.id = plan.habito_id
    where plan.habito_id = p_habito_id and item.usuario_id = v_persona_id and plan.nivel = p_nivel_nuevo
  ) then
    return 0;
  end if;

  v_recompensa := 5 * p_nivel_nuevo;
  v_referencia := p_habito_id::text || ':nivel:' || p_nivel_nuevo::text;

  if exists (
    select 1 from comercio.movimientos_gemas
    where persona_id = v_persona_id and motivo = 'recompensa_nivel' and referencia = v_referencia
  ) then
    return 0;
  end if;

  insert into comercio.billeteras_gemas (persona_id, saldo)
  values (v_persona_id, v_recompensa)
  on conflict (persona_id) do update
    set saldo = comercio.billeteras_gemas.saldo + excluded.saldo, actualizado_en = now();

  insert into comercio.movimientos_gemas (persona_id, cantidad, motivo, referencia)
  values (v_persona_id, v_recompensa, 'recompensa_nivel', v_referencia);

  return v_recompensa;
end;
$$;

revoke all on function comercio.acreditar_recompensa_nivel_habito(uuid, integer) from public, anon;
grant execute on function comercio.acreditar_recompensa_nivel_habito(uuid, integer) to authenticated, service_role;

do $$
begin
  if exists (
    select 1
    from pg_catalog.pg_proc as routine
    join pg_catalog.pg_roles as owner on owner.oid = routine.proowner
    where routine.oid in (
      'comercio.acreditar_recompensa_nivel_habito(uuid,integer)'::regprocedure
    )
      and not owner.rolbypassrls
  ) then
    raise exception
      'comercio security definer functions require an owner with BYPASSRLS';
  end if;
end;
$$;

-- Mismo cuerpo que la migración 11, con dos líneas nuevas: acredita la
-- recompensa real al confirmar la subida, y la reporta en la respuesta.
-- La migración 15 (aplicada justo después) mueve esta función a `privacidad`
-- como security definer y revoca la escritura directa de authenticated sobre
-- habitos_planes/habitos_registros — sin eso, cualquiera con acceso REST
-- podría insertar una fila de plan falsa y reclamar la recompensa sin haber
-- subido de nivel de verdad.
create or replace function public.registrar_progreso_habito(p_habito_id uuid, p_fecha_local date, p_valor numeric, p_nota text default null)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare v_fecha_actual date;
declare v_registro public.habitos_registros;
declare v_tipo_meta text;
declare v_plan_vigente public.habitos_planes;
declare v_prog_1 integer;
declare v_comp_1 integer;
declare v_prog_2 integer;
declare v_comp_2 integer;
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

  if v_plan_vigente.id is not null and v_plan_vigente.desde_fecha <= v_fecha_actual - 13 then
    with dias as (
      select gs::date as fecha
      from generate_series(v_fecha_actual - 13, v_fecha_actual, interval '1 day') gs
    ),
    evaluado as (
      select
        dias.fecha,
        case when dias.fecha <= v_fecha_actual - 7 then 1 else 2 end as ventana,
        public.habitos_es_dia_programado(v_plan_vigente, dias.fecha) as programado,
        coalesce(registro.valor, 0) >= v_plan_vigente.objetivo_valor as completado
      from dias
      left join public.habitos_registros registro
        on registro.habito_id = p_habito_id and registro.fecha_local = dias.fecha
    )
    select
      count(*) filter (where ventana = 1 and programado),
      count(*) filter (where ventana = 1 and programado and completado),
      count(*) filter (where ventana = 2 and programado),
      count(*) filter (where ventana = 2 and programado and completado)
    into v_prog_1, v_comp_1, v_prog_2, v_comp_2
    from evaluado;

    if v_prog_1 >= 3 and v_prog_2 >= 3
       and v_comp_1::numeric / v_prog_1 >= 0.8
       and v_comp_2::numeric / v_prog_2 >= 0.8
    then
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
