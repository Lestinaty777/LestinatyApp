-- Progresión de niveles para hábitos: la dificultad sube sola cuando el desempeño la sostiene.

begin;

alter table public.habitos_planes
  add column nivel integer not null default 1 check (nivel >= 1),
  add column origen text not null default 'usuario' check (origen in ('usuario', 'subida_nivel')),
  add column mensaje_nivel text check (mensaje_nivel is null or char_length(trim(mensaje_nivel)) <= 280);

comment on column public.habitos_planes.nivel is 'Nivel de dificultad del hábito. Se hereda del plan anterior salvo que origen = subida_nivel.';
comment on column public.habitos_planes.origen is 'usuario: la persona edito el plan a mano. subida_nivel: lo genero la regla de progresion automatica.';
comment on column public.habitos_planes.mensaje_nivel is 'Texto de celebracion para este nivel. Empieza con un mensaje generico y una funcion posterior lo puede reescribir con IA.';

-- Reemplaza registrar_progreso_habito para, tras guardar el registro del día,
-- evaluar si el hábito sostuvo ≥80% de cumplimiento en las dos ventanas de 7
-- días más recientes. Solo se evalúa si el plan vigente lleva ≥14 días activo,
-- para que ambas ventanas midan desempeño bajo la MISMA dificultad y no se
-- mezclen métricas del nivel anterior con el actual. Si se cumple, cierra el
-- plan vigente y crea uno nuevo con nivel + 1 (y, salvo en hábitos tipo
-- "check", el objetivo un 15% más alto).
create or replace function public.registrar_progreso_habito(
  p_habito_id uuid,
  p_fecha_local date,
  p_valor numeric,
  p_nota text default null
) returns jsonb
language plpgsql
security invoker
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
declare v_subio_nivel boolean := false;
declare v_nivel_actual integer;
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
      v_nuevo_objetivo := case
        when v_tipo_meta = 'check' then v_plan_vigente.objetivo_valor
        else round(v_plan_vigente.objetivo_valor * 1.15, 2)
      end;

      update public.habitos_planes set hasta_fecha = v_fecha_actual + 1 where id = v_plan_vigente.id;

      insert into public.habitos_planes (
        habito_id, frecuencia, dias_semana, veces_por_semana, objetivo_valor, desde_fecha, nivel, origen, mensaje_nivel
      ) values (
        p_habito_id, v_plan_vigente.frecuencia, v_plan_vigente.dias_semana, v_plan_vigente.veces_por_semana,
        v_nuevo_objetivo, v_fecha_actual + 1, v_plan_vigente.nivel + 1, 'subida_nivel',
        '¡Subiste al nivel ' || (v_plan_vigente.nivel + 1) || '!'
      );

      v_subio_nivel := true;
      v_nivel_actual := v_plan_vigente.nivel + 1;
    end if;
  end if;

  return jsonb_build_object(
    'id', v_registro.id, 'habito_id', v_registro.habito_id, 'fecha_local', v_registro.fecha_local,
    'valor', v_registro.valor, 'nota', v_registro.nota,
    'subio_nivel', v_subio_nivel, 'nivel', v_nivel_actual
  );
end;
$$;

commit;
