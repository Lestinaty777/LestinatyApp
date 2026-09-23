-- Migración 48: Mandalas persistentes para nodos de Senderos.
--
-- Cada día que ya cumple la meta real de un hábito puede convertirse en una
-- mandala única, con el color del paquete del hábito (no el tema global).
-- No crea tablas nuevas: sólo agrega columnas snapshot a
-- public.habitos_registros. La app decide "completado"; el servidor decide
-- cuándo hay mandala pendiente y valida el guardado de sus trazos.
--
-- Verificado en vivo antes de escribirla (proyecto nzwkiffbircixvznnjek):
-- el cuerpo vigente de privacidad.registrar_progreso_habito coincide byte a
-- byte con el de la migración 46 (nunca se tocó desde entonces); esta
-- migración lo reemplaza agregando únicamente el bloque de mandala.

begin;

-- ─── 1. Columnas snapshot en habitos_registros.
alter table public.habitos_registros
  add column if not exists mandala_estado text,
  add column if not exists mandala_semilla text,
  add column if not exists mandala_trazos jsonb,
  add column if not exists mandala_paquete_id text,
  add column if not exists mandala_color text,
  add column if not exists mandala_nivel smallint,
  add column if not exists mandala_ciclo integer,
  add column if not exists mandala_nodo_dia smallint,
  add column if not exists mandala_creada_en timestamptz;

alter table public.habitos_registros drop constraint if exists habitos_registros_mandala_estado_check;
alter table public.habitos_registros add constraint habitos_registros_mandala_estado_check
  check (mandala_estado is null or mandala_estado in ('pendiente', 'creada'));

-- ─── 2. registrar_progreso_habito: mismo cuerpo vigente + bloque de mandala
--        pendiente, insertado justo después del upsert del registro (con el
--        plan vigente EN p_fecha_local, antes de que v_plan_vigente se
--        reasigne más abajo para v_fecha_actual). La guarda
--        `mandala_estado is null` es la que evita que un reintento o una
--        edición posterior del mismo día resetee una mandala ya `creada`.
create or replace function privacidad.registrar_progreso_habito(
  p_habito_id uuid,
  p_fecha_local date,
  p_valor numeric,
  p_nota text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_fecha_actual date;
  v_registro public.habitos_registros;
  v_tipo_meta text;
  v_plan_vigente public.habitos_planes;
  v_dias_requeridos_por_nivel integer[] := array[3, 7, 12, 18, 25, 33, 42];
  v_dias_requeridos integer;
  v_dias_completados integer := 0;
  v_nuevo_objetivo numeric;
  v_mensaje_nivel text;
  v_subio_nivel boolean := false;
  v_nivel_actual integer;
  v_gemas_ganadas integer := 0;
  v_referido_por uuid;
  v_recompensa_referido_otorgada_en timestamptz;
  v_transicion jsonb;
  v_referencia_cofre text;
  v_ciclo_completado integer;
  v_cumple_meta boolean;
  v_mandala_dias_nivel integer;
  v_mandala_nivel integer;
  v_mandala_ciclo integer;
  v_mandala_nodo_dia integer;
  v_mandala_paquete_id text;
  v_mandala_color text;
  v_mandala jsonb;
begin
  if auth.uid() is null then raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege'; end if;
  select (now() at time zone perfil.zona_horaria)::date into v_fecha_actual
  from public.perfiles_usuario perfil where perfil.id = auth.uid();
  v_fecha_actual := coalesce(v_fecha_actual, current_date);
  if p_fecha_local > v_fecha_actual then
    raise exception 'No puedes registrar progreso en una fecha futura.' using errcode = 'check_violation';
  end if;

  -- Bloquea el hábito para serializar llamadas concurrentes del mismo día:
  -- dos toques simultáneos no deben poder subir de nivel/ciclo ni pagar
  -- cofre final dos veces (ver Review Focus del plan).
  select item.tipo_meta into v_tipo_meta
  from public.habitos_items item
  where item.id = p_habito_id and item.usuario_id = auth.uid()
  for update;
  if v_tipo_meta is null then
    raise exception 'Hábito no encontrado.' using errcode = 'no_data_found';
  end if;

  -- Upsert monotónico: si el valor ya guardado cumplía la meta histórica del
  -- plan vigente en esa fecha, una corrección menor no lo puede "des-cumplir".
  select plan.* into v_plan_vigente
  from public.habitos_planes plan
  where plan.habito_id = p_habito_id
    and plan.desde_fecha <= p_fecha_local
    and (plan.hasta_fecha is null or plan.hasta_fecha > p_fecha_local)
  order by plan.desde_fecha desc
  limit 1;

  insert into public.habitos_registros (habito_id, usuario_id, fecha_local, valor, nota)
  values (p_habito_id, auth.uid(), p_fecha_local, p_valor, p_nota)
  on conflict (habito_id, fecha_local) do update
  set
    valor = case
      when v_plan_vigente.id is not null
        and (case when v_tipo_meta = 'check' then public.habitos_registros.valor > 0 else public.habitos_registros.valor >= v_plan_vigente.objetivo_valor end)
      then greatest(public.habitos_registros.valor, excluded.valor)
      else excluded.valor
    end,
    nota = excluded.nota, registrado_at = now(), updated_at = now()
  returning * into v_registro;

  -- ─── Mandala pendiente: sólo si ESTE registro (p_fecha_local) ya cumple
  --     la meta de su propio plan vigente. Snapshot de nivel/ciclo/nodo_dia
  --     y paquete/color — nunca se recalculan después de creada.
  v_cumple_meta := v_plan_vigente.id is not null
    and (case when v_tipo_meta = 'check' then v_registro.valor > 0 else v_registro.valor >= v_plan_vigente.objetivo_valor end);

  if v_cumple_meta then
    v_mandala_nivel := v_plan_vigente.nivel;
    v_mandala_dias_nivel := privacidad.contar_dias_completados_nivel(p_habito_id, v_tipo_meta, v_mandala_nivel);

    if v_mandala_nivel = 7 then
      v_mandala_ciclo := (v_mandala_dias_nivel / v_dias_requeridos_por_nivel[7]) + 1;
      v_mandala_nodo_dia := v_mandala_dias_nivel % v_dias_requeridos_por_nivel[7];
      -- Múltiplo exacto de 42 (último día de un ciclo): el módulo da 0,
      -- hay que corregirlo al día 42 del ciclo anterior, no al día 0 del
      -- siguiente.
      if v_mandala_nodo_dia = 0 then
        v_mandala_ciclo := v_mandala_ciclo - 1;
        v_mandala_nodo_dia := v_dias_requeridos_por_nivel[7];
      end if;
    else
      v_mandala_ciclo := 1;
      v_mandala_nodo_dia := v_mandala_dias_nivel;
    end if;

    select item.paquete_id, item.color into v_mandala_paquete_id, v_mandala_color
    from public.habitos_items item where item.id = p_habito_id;

    update public.habitos_registros
    set mandala_estado = 'pendiente',
        mandala_semilla = md5(v_registro.id::text || ':' || p_fecha_local::text),
        mandala_paquete_id = v_mandala_paquete_id,
        mandala_color = v_mandala_color,
        mandala_nivel = v_mandala_nivel,
        mandala_ciclo = v_mandala_ciclo,
        mandala_nodo_dia = v_mandala_nodo_dia
    where id = v_registro.id and mandala_estado is null
    returning jsonb_build_object(
      'registro_id', id, 'estado', mandala_estado, 'semilla', mandala_semilla,
      'paquete_id', mandala_paquete_id, 'color', mandala_color,
      'nivel', mandala_nivel, 'ciclo', mandala_ciclo, 'nodo_dia', mandala_nodo_dia
    ) into v_mandala;

    -- Reintento: la guarda de arriba no actualizó nada (ya tenía
    -- mandala_estado) — se reporta igual el estado ya guardado, sin
    -- resetear nada.
    if v_mandala is null then
      select jsonb_build_object(
        'registro_id', id, 'estado', mandala_estado, 'semilla', mandala_semilla,
        'paquete_id', mandala_paquete_id, 'color', mandala_color,
        'nivel', mandala_nivel, 'ciclo', mandala_ciclo, 'nodo_dia', mandala_nodo_dia
      ) into v_mandala
      from public.habitos_registros where id = v_registro.id;
    end if;
  end if;

  select plan.* into v_plan_vigente
  from public.habitos_planes plan
  where plan.habito_id = p_habito_id
    and plan.desde_fecha <= v_fecha_actual
    and (plan.hasta_fecha is null or plan.hasta_fecha > v_fecha_actual)
  order by plan.desde_fecha desc
  limit 1;

  v_nivel_actual := coalesce(v_plan_vigente.nivel, 1);

  if v_plan_vigente.id is not null and v_nivel_actual < 7
    and not exists (
      select 1 from public.habitos_planes
      where habito_id = p_habito_id and desde_fecha = v_fecha_actual + 1
    )
  then
    v_dias_requeridos := v_dias_requeridos_por_nivel[v_nivel_actual];
    v_dias_completados := privacidad.contar_dias_completados_nivel(p_habito_id, v_tipo_meta, v_nivel_actual);

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

      -- Cofre final del nivel recién completado — reemplaza a
      -- comercio.acreditar_recompensa_nivel_habito (no se vuelve a llamar).
      v_gemas_ganadas := case v_plan_vigente.nivel
        when 1 then 10 when 2 then 15 when 3 then 20
        when 4 then 25 when 5 then 30 when 6 then 35
        else 5 * (v_plan_vigente.nivel + 1)
      end;
      v_referencia_cofre := 'cofre:' || p_habito_id::text || ':nivel:' || v_plan_vigente.nivel || ':ciclo:1:final';

      insert into public.habitos_cofres_reclamados (usuario_id, habito_id, nivel, ciclo, tipo, nodo_dia, gemas)
      values (auth.uid(), p_habito_id, v_plan_vigente.nivel, 1, 'final', v_dias_requeridos, v_gemas_ganadas)
      on conflict on constraint habitos_cofres_unicidad do nothing;

      -- comercio.acreditar_gemas devuelve el saldo total de la billetera, no
      -- el crédito aplicado; se reporta la recompensa nominal del nivel
      -- (acreditar_gemas ya es idempotente por referencia).
      perform comercio.acreditar_gemas(auth.uid(), v_gemas_ganadas, 'cofre_final', v_referencia_cofre);

      v_transicion := jsonb_build_object(
        'tipo', 'nivel',
        'nivel_anterior', v_plan_vigente.nivel,
        'nivel_actual', v_nivel_actual,
        'ciclo_anterior', 1,
        'ciclo_actual', 1,
        'cofre_final_reclamado', true,
        'gemas', v_gemas_ganadas
      );

      if v_nivel_actual = 2 then
        select referido_por, recompensa_referido_otorgada_en into v_referido_por, v_recompensa_referido_otorgada_en
        from public.perfiles_usuario where id = auth.uid();

        if v_referido_por is not null and v_recompensa_referido_otorgada_en is null then
          perform comercio.acreditar_gemas(auth.uid(), 100, 'referido_nivel2', auth.uid()::text);
          perform comercio.acreditar_gemas(v_referido_por, 100, 'referido_nivel2', auth.uid()::text);
          update public.perfiles_usuario set recompensa_referido_otorgada_en = now() where id = auth.uid();
        end if;
      end if;
    end if;
  elsif v_plan_vigente.id is not null and v_nivel_actual = 7 then
    -- Maestría infinita: cada múltiplo nuevo de 42 días paga un cofre final
    -- de ciclo y el recorrido se reinicia solo (no hay nivel 8).
    v_dias_requeridos := v_dias_requeridos_por_nivel[7];
    v_dias_completados := privacidad.contar_dias_completados_nivel(p_habito_id, v_tipo_meta, 7);

    if v_dias_completados > 0 and v_dias_completados % v_dias_requeridos = 0 then
      v_ciclo_completado := v_dias_completados / v_dias_requeridos;
      v_referencia_cofre := 'cofre:' || p_habito_id::text || ':nivel:7:ciclo:' || v_ciclo_completado || ':final';

      insert into public.habitos_cofres_reclamados (usuario_id, habito_id, nivel, ciclo, tipo, nodo_dia, gemas)
      values (auth.uid(), p_habito_id, 7, v_ciclo_completado, 'final', v_dias_requeridos, 35)
      on conflict on constraint habitos_cofres_unicidad do nothing;

      perform comercio.acreditar_gemas(auth.uid(), 35, 'cofre_final', v_referencia_cofre);

      v_gemas_ganadas := 35;
      v_transicion := jsonb_build_object(
        'tipo', 'ciclo_maestria',
        'nivel_anterior', 7,
        'nivel_actual', 7,
        'ciclo_anterior', v_ciclo_completado,
        'ciclo_actual', v_ciclo_completado + 1,
        'cofre_final_reclamado', true,
        'gemas', 35
      );
    end if;
  end if;

  return jsonb_build_object(
    'id', v_registro.id, 'habito_id', v_registro.habito_id, 'fecha_local', v_registro.fecha_local,
    'valor', v_registro.valor, 'nota', v_registro.nota,
    'subio_nivel', v_subio_nivel, 'nivel', v_nivel_actual, 'gemas_ganadas', v_gemas_ganadas,
    'transicion_sendero', v_transicion, 'mandala_pendiente', v_mandala
  );
end;
$$;

-- ─── 3. guardar_mandala_registro: única vía para cerrar una mandala
--        pendiente. No acepta color/paquete/nivel/ciclo/nodo/gemas del
--        cliente — todo eso ya quedó fijado por registrar_progreso_habito.
create or replace function privacidad.guardar_mandala_registro(p_registro_id uuid, p_trazos jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_registro public.habitos_registros;
begin
  if auth.uid() is null then
    raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege';
  end if;

  select * into v_registro
  from public.habitos_registros
  where id = p_registro_id and usuario_id = auth.uid()
  for update;

  if v_registro.id is null then
    raise exception 'Registro no encontrado.' using errcode = 'no_data_found';
  end if;
  if v_registro.mandala_estado is distinct from 'pendiente' then
    raise exception 'Este registro no tiene una mandala pendiente.' using errcode = 'check_violation';
  end if;

  update public.habitos_registros
  set mandala_trazos = p_trazos, mandala_estado = 'creada', mandala_creada_en = now()
  where id = p_registro_id;

  return jsonb_build_object(
    'registro_id', p_registro_id, 'estado', 'creada',
    'paquete_id', v_registro.mandala_paquete_id, 'color', v_registro.mandala_color,
    'nivel', v_registro.mandala_nivel, 'ciclo', v_registro.mandala_ciclo, 'nodo_dia', v_registro.mandala_nodo_dia
  );
end;
$$;

create or replace function public.guardar_mandala_registro(p_registro_id uuid, p_trazos jsonb)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select privacidad.guardar_mandala_registro(p_registro_id, p_trazos);
$$;

revoke all on function privacidad.guardar_mandala_registro(uuid, jsonb) from public, anon;
grant execute on function privacidad.guardar_mandala_registro(uuid, jsonb) to authenticated, service_role;
revoke all on function public.guardar_mandala_registro(uuid, jsonb) from public, anon;
grant execute on function public.guardar_mandala_registro(uuid, jsonb) to authenticated, service_role;

-- ─── 4. obtener_mandalas_habito: lo que el mapa necesita para saber qué
--        nodos son orbe-mandala.
create or replace function privacidad.obtener_mandalas_habito(p_habito_id uuid)
returns table (
  registro_id uuid,
  nivel smallint,
  ciclo integer,
  nodo_dia smallint,
  estado text,
  semilla text,
  trazos jsonb,
  paquete_id text,
  color text
)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id, r.mandala_nivel, coalesce(r.mandala_ciclo, 1), r.mandala_nodo_dia, r.mandala_estado,
         r.mandala_semilla, r.mandala_trazos, r.mandala_paquete_id, r.mandala_color
  from public.habitos_registros r
  where r.habito_id = p_habito_id and r.usuario_id = auth.uid() and r.mandala_estado is not null;
$$;

create or replace function public.obtener_mandalas_habito(p_habito_id uuid)
returns table (
  registro_id uuid, nivel smallint, ciclo integer, nodo_dia smallint, estado text,
  semilla text, trazos jsonb, paquete_id text, color text
)
language sql
security invoker
set search_path = ''
as $$
  select * from privacidad.obtener_mandalas_habito(p_habito_id);
$$;

revoke all on function privacidad.obtener_mandalas_habito(uuid) from public, anon;
grant execute on function privacidad.obtener_mandalas_habito(uuid) to authenticated, service_role;
revoke all on function public.obtener_mandalas_habito(uuid) from public, anon;
grant execute on function public.obtener_mandalas_habito(uuid) to authenticated, service_role;

notify pgrst, 'reload schema';

commit;
