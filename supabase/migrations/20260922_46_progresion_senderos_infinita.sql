-- Migración 46: Progresión de niveles y maestría infinita en Senderos.
--
-- Reemplaza el pago paralelo por nivel (comercio.acreditar_recompensa_nivel_habito)
-- por cofres idempotentes de senderos, hace transaccionales y a prueba de
-- doble-tap todos los créditos con referencia, corrige el conteo de días
-- para que sume TODOS los segmentos históricos de un mismo nivel (un cambio
-- de frecuencia/meta ya no reinicia el progreso), y convierte el nivel 7 en
-- ciclos infinitos de 42 días con cofre final propio por ciclo.
--
-- Diseñada para aplicarse con o sin 20260922_36_cofres_senderos.sql
-- previamente aplicada (esa migración nunca llegó a producción; se verificó
-- en vivo antes de escribir esta).

begin;

-- ─── 1. Motivos de crédito: sumar cofre_intermedio/cofre_final sin retirar
--        ningún motivo existente (compra_iap, gasto_tienda, ajuste_soporte,
--        recompensa_nivel, gasto_semillas, referido_nivel2, trial_horizon_bono).
alter table comercio.movimientos_gemas drop constraint if exists movimientos_gemas_motivo_check;
alter table comercio.movimientos_gemas add constraint movimientos_gemas_motivo_check
  check (motivo = any (array[
    'compra_iap', 'gasto_tienda', 'ajuste_soporte', 'recompensa_nivel',
    'gasto_semillas', 'referido_nivel2', 'trial_horizon_bono',
    'cofre_intermedio', 'cofre_final'
  ]));

-- ─── 2. Tabla de cofres reclamados, con ciclo, compatible con 36 aplicada o no.
create table if not exists public.habitos_cofres_reclamados (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  habito_id uuid not null references public.habitos_items(id) on delete cascade,
  nivel integer not null check (nivel between 1 and 7),
  ciclo integer not null default 1,
  tipo text not null check (tipo in ('intermedio', 'final')),
  nodo_dia integer not null check (nodo_dia > 0),
  gemas integer not null check (gemas > 0),
  reclamado_en timestamptz not null default now()
);

-- Si la tabla ya existía (migración 36 aplicada) puede faltarle `ciclo`.
alter table public.habitos_cofres_reclamados add column if not exists ciclo integer not null default 1;

alter table public.habitos_cofres_reclamados drop constraint if exists habitos_cofres_unicidad;
alter table public.habitos_cofres_reclamados add constraint habitos_cofres_unicidad
  unique (usuario_id, habito_id, nivel, ciclo, tipo, nodo_dia);

alter table public.habitos_cofres_reclamados enable row level security;

drop policy if exists habitos_cofres_usuario_propio on public.habitos_cofres_reclamados;
create policy habitos_cofres_usuario_propio on public.habitos_cofres_reclamados
  for select using (usuario_id = auth.uid());

revoke insert, update, delete on public.habitos_cofres_reclamados from anon, authenticated;
grant select on public.habitos_cofres_reclamados to authenticated;
grant all on public.habitos_cofres_reclamados to service_role;

-- ─── 3. Idempotencia genérica de créditos con referencia (además del índice
--        histórico solo-IAP, que se deja intacto).
create unique index if not exists movimientos_gemas_credito_referencia_uniq
on comercio.movimientos_gemas (persona_id, motivo, referencia)
where cantidad > 0 and referencia is not null;

-- ─── 4. acreditar_gemas: el movimiento manda. Si ya existe uno con la misma
--        (persona, motivo, referencia) no se vuelve a acreditar la billetera
--        — reemplaza el patrón anterior de "insertar billetera y atrapar la
--        excepción unique_violation", que dependía del índice IAP-only.
create or replace function comercio.acreditar_gemas(
  p_persona_id uuid,
  p_cantidad integer,
  p_motivo text,
  p_referencia text default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_movimiento_id uuid;
  v_saldo integer;
begin
  if p_cantidad <= 0 then
    raise exception 'invalid credit amount' using errcode = '22023';
  end if;
  if p_motivo not in ('compra_iap', 'ajuste_soporte', 'referido_nivel2', 'trial_horizon_bono', 'cofre_intermedio', 'cofre_final') then
    raise exception 'invalid credit reason' using errcode = '22023';
  end if;

  insert into comercio.movimientos_gemas (persona_id, cantidad, motivo, referencia)
  values (p_persona_id, p_cantidad, p_motivo, p_referencia)
  on conflict (persona_id, motivo, referencia) where cantidad > 0 and referencia is not null do nothing
  returning id into v_movimiento_id;

  if v_movimiento_id is null and p_referencia is not null then
    select saldo into v_saldo from comercio.billeteras_gemas where persona_id = p_persona_id;
    return coalesce(v_saldo, 0);
  end if;

  insert into comercio.billeteras_gemas (persona_id, saldo)
  values (p_persona_id, p_cantidad)
  on conflict (persona_id) do update
    set saldo = comercio.billeteras_gemas.saldo + excluded.saldo, actualizado_en = now()
  returning saldo into v_saldo;

  return v_saldo;
end;
$$;

revoke all on function comercio.acreditar_gemas(uuid, integer, text, text) from public, anon, authenticated;
grant execute on function comercio.acreditar_gemas(uuid, integer, text, text) to service_role;

-- ─── 5. Conteo histórico: suma TODOS los segmentos de plan de un mismo nivel
--        (un cambio de frecuencia/meta dentro del nivel crea un segmento
--        nuevo pero no debe reiniciar el conteo de días).
create or replace function privacidad.contar_dias_completados_nivel(
  p_habito_id uuid,
  p_tipo_meta text,
  p_nivel integer
)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(distinct r.fecha_local)::integer
  from public.habitos_registros r
  join public.habitos_planes p
    on p.habito_id = r.habito_id
   and r.fecha_local >= p.desde_fecha
   and (p.hasta_fecha is null or r.fecha_local < p.hasta_fecha)
  where r.habito_id = p_habito_id
    and p.nivel = p_nivel
    and public.habitos_es_dia_programado(p, r.fecha_local)
    and (case when p_tipo_meta = 'check' then r.valor > 0 else r.valor >= p.objetivo_valor end);
$$;

revoke all on function privacidad.contar_dias_completados_nivel(uuid, text, integer) from public, anon, authenticated;
grant execute on function privacidad.contar_dias_completados_nivel(uuid, text, integer) to service_role;

-- ─── 6. Resumen de las siete secciones del sendero.
create or replace function privacidad.obtener_resumen_sendero_habito(p_habito_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid := auth.uid();
  v_tipo_meta text;
  v_fecha_actual date;
  v_plan_maximo public.habitos_planes;
  v_nivel_maximo integer;
  v_dias_requeridos_por_nivel integer[] := array[3, 7, 12, 18, 25, 33, 42];
  v_secciones jsonb := '[]'::jsonb;
  v_nivel integer;
  v_dias_completados integer;
  v_dias_requeridos integer;
  v_ciclo integer;
  v_ciclo_dias_completados integer;
  v_ciclo_dias_requeridos integer;
  v_estado text;
  v_puede_avanzar_hoy boolean;
  v_hoy_completo boolean;
  v_total_dias_nivel7 integer;
  v_disponible_desde date;
begin
  if v_usuario_id is null then
    raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege';
  end if;

  select item.tipo_meta into v_tipo_meta
  from public.habitos_items item
  where item.id = p_habito_id and item.usuario_id = v_usuario_id;

  if v_tipo_meta is null then
    raise exception 'Hábito no encontrado.' using errcode = 'no_data_found';
  end if;

  select (now() at time zone perfil.zona_horaria)::date into v_fecha_actual
  from public.perfiles_usuario perfil where perfil.id = v_usuario_id;
  v_fecha_actual := coalesce(v_fecha_actual, current_date);

  select p.* into v_plan_maximo
  from public.habitos_planes p
  where p.habito_id = p_habito_id
  order by p.nivel desc, p.desde_fecha desc
  limit 1;

  v_nivel_maximo := coalesce(v_plan_maximo.nivel, 0);

  for v_nivel in 1..7 loop
    select min(p.desde_fecha) into v_disponible_desde
    from public.habitos_planes p where p.habito_id = p_habito_id and p.nivel = v_nivel;

    if v_nivel > v_nivel_maximo then
      v_estado := 'bloqueado';
      v_dias_completados := 0;
      v_dias_requeridos := v_dias_requeridos_por_nivel[v_nivel];
      v_ciclo := 1;
      v_puede_avanzar_hoy := false;
      v_total_dias_nivel7 := 0;
    elsif v_nivel < v_nivel_maximo then
      v_estado := 'completado';
      v_dias_requeridos := v_dias_requeridos_por_nivel[v_nivel];
      v_dias_completados := v_dias_requeridos;
      v_ciclo := 1;
      v_puede_avanzar_hoy := false;
      v_total_dias_nivel7 := v_dias_completados;
    else
      -- v_nivel = v_nivel_maximo: el nivel vigente (o nivel 7 en ciclos).
      v_dias_completados := privacidad.contar_dias_completados_nivel(p_habito_id, v_tipo_meta, v_nivel);
      v_total_dias_nivel7 := v_dias_completados;

      if v_nivel = 7 then
        v_ciclo_dias_requeridos := v_dias_requeridos_por_nivel[7];
        v_ciclo := (v_dias_completados / v_ciclo_dias_requeridos) + 1;
        v_ciclo_dias_completados := v_dias_completados % v_ciclo_dias_requeridos;
        v_dias_requeridos := v_ciclo_dias_requeridos;
        v_dias_completados := v_ciclo_dias_completados;
      else
        v_dias_requeridos := v_dias_requeridos_por_nivel[v_nivel];
        v_ciclo := 1;
      end if;

      v_estado := 'actual';

      select exists (
        select 1 from public.habitos_registros r
        where r.habito_id = p_habito_id
          and r.fecha_local = v_fecha_actual
          and (case when v_tipo_meta = 'check' then r.valor > 0 else r.valor >= v_plan_maximo.objetivo_valor end)
      ) into v_hoy_completo;

      v_puede_avanzar_hoy := v_plan_maximo.desde_fecha <= v_fecha_actual
        and public.habitos_es_dia_programado(v_plan_maximo, v_fecha_actual)
        and not v_hoy_completo;
    end if;

    v_secciones := v_secciones || jsonb_build_object(
      'nivel', v_nivel,
      'estado', v_estado,
      'ciclo', v_ciclo,
      'dias_completados', v_dias_completados,
      'dias_requeridos', v_dias_requeridos,
      'puede_avanzar_hoy', v_puede_avanzar_hoy,
      'disponible_desde', v_disponible_desde,
      'total_dias_nivel7', v_total_dias_nivel7
    );
  end loop;

  return jsonb_build_object('habito_id', p_habito_id, 'secciones', v_secciones);
end;
$$;

create or replace function public.obtener_resumen_sendero_habito(p_habito_id uuid)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select privacidad.obtener_resumen_sendero_habito(p_habito_id);
$$;

-- public.obtener_resumen_sendero_habito es security invoker: la llamada
-- interna a privacidad.obtener_resumen_sendero_habito corre con los
-- privilegios de quien invoca, así que authenticated necesita EXECUTE acá
-- también (mismo patrón ya vigente en privacidad.registrar_progreso_habito).
revoke all on function privacidad.obtener_resumen_sendero_habito(uuid) from public, anon;
grant execute on function privacidad.obtener_resumen_sendero_habito(uuid) to authenticated, service_role;
revoke all on function public.obtener_resumen_sendero_habito(uuid) from public, anon;
grant execute on function public.obtener_resumen_sendero_habito(uuid) to authenticated, service_role;

-- ─── 7. Reclamo de cofre intermedio por nivel/ciclo. El cofre final es
--        exclusivo de registrar_progreso_habito (paga en la misma
--        transacción que cierra el día, nunca por esta vía).
--
-- Elimina primero los overloads heredados de la migración 36 (que puede o no
-- haberse aplicado) para que PostgREST nunca vea dos firmas ambiguas.
drop function if exists public.reclamar_cofre_sendero(uuid, integer, text, integer);
drop function if exists comercio.reclamar_cofre_sendero(uuid, integer, text, integer);
drop function if exists public.obtener_cofres_reclamados_habito(uuid, integer);
drop function if exists comercio.obtener_cofres_reclamados_habito(uuid, integer);

create or replace function privacidad.reclamar_cofre_sendero(
  p_habito_id uuid,
  p_nivel integer,
  p_ciclo integer,
  p_tipo text,
  p_nodo_dia integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid := auth.uid();
  v_tipo_meta text;
  v_dias_requeridos_por_nivel integer[] := array[3, 7, 12, 18, 25, 33, 42];
  v_dias_requeridos integer;
  v_dias_completados integer;
  v_gemas integer;
  v_referencia text;
  v_cofre_existente public.habitos_cofres_reclamados;
begin
  if v_usuario_id is null then
    raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege';
  end if;

  if p_tipo <> 'intermedio' then
    raise exception 'Este RPC solo reclama cofres intermedios; el cofre final lo paga registrar_progreso_habito.' using errcode = 'invalid_parameter_value';
  end if;

  if p_nivel < 1 or p_nivel > 7 then
    raise exception 'Nivel no válido.' using errcode = 'check_violation';
  end if;

  if p_nodo_dia % 3 <> 0 then
    raise exception 'El nodo indicado no corresponde a un cofre intermedio.' using errcode = 'check_violation';
  end if;

  v_dias_requeridos := v_dias_requeridos_por_nivel[p_nivel];
  if p_nodo_dia >= v_dias_requeridos then
    raise exception 'El nodo indicado pertenece al cofre final, no a uno intermedio.' using errcode = 'check_violation';
  end if;

  select item.tipo_meta into v_tipo_meta
  from public.habitos_items item
  where item.id = p_habito_id and item.usuario_id = v_usuario_id
  for update;

  if v_tipo_meta is null then
    raise exception 'Hábito no encontrado.' using errcode = 'no_data_found';
  end if;

  -- Reintento: si ya está reclamado, devolver las mismas gemas guardadas
  -- (idempotente, ninguna acreditación nueva).
  select * into v_cofre_existente
  from public.habitos_cofres_reclamados
  where usuario_id = v_usuario_id
    and habito_id = p_habito_id
    and nivel = p_nivel
    and ciclo = p_ciclo
    and tipo = 'intermedio'
    and nodo_dia = p_nodo_dia;

  if v_cofre_existente.id is not null then
    return jsonb_build_object(
      'exito', true, 'gemas', v_cofre_existente.gemas, 'tipo', 'intermedio',
      'nodo_dia', p_nodo_dia, 'nivel', p_nivel, 'ciclo', p_ciclo, 'ya_reclamado', true
    );
  end if;

  v_dias_completados := privacidad.contar_dias_completados_nivel(p_habito_id, v_tipo_meta, p_nivel);
  if p_nivel = 7 then
    -- Dentro del ciclo pedido: los días ya "gastados" por ciclos anteriores
    -- completos no cuentan para el umbral de este ciclo.
    v_dias_completados := v_dias_completados - ((p_ciclo - 1) * v_dias_requeridos);
  end if;

  if v_dias_completados < p_nodo_dia then
    raise exception 'Días insuficientes para desbloquear este cofre.' using errcode = 'check_violation';
  end if;

  v_gemas := 8 + floor(random() * 8)::integer;
  v_referencia := 'cofre:' || p_habito_id::text || ':nivel:' || p_nivel || ':ciclo:' || p_ciclo || ':intermedio:' || p_nodo_dia;

  insert into public.habitos_cofres_reclamados (usuario_id, habito_id, nivel, ciclo, tipo, nodo_dia, gemas)
  values (v_usuario_id, p_habito_id, p_nivel, p_ciclo, 'intermedio', p_nodo_dia, v_gemas)
  on conflict on constraint habitos_cofres_unicidad do nothing;

  perform comercio.acreditar_gemas(v_usuario_id, v_gemas, 'cofre_intermedio', v_referencia);

  return jsonb_build_object(
    'exito', true, 'gemas', v_gemas, 'tipo', 'intermedio',
    'nodo_dia', p_nodo_dia, 'nivel', p_nivel, 'ciclo', p_ciclo, 'ya_reclamado', false
  );
end;
$$;

create or replace function public.reclamar_cofre_sendero(
  p_habito_id uuid,
  p_nivel integer,
  p_ciclo integer,
  p_tipo text,
  p_nodo_dia integer
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select privacidad.reclamar_cofre_sendero(p_habito_id, p_nivel, p_ciclo, p_tipo, p_nodo_dia);
$$;

revoke all on function privacidad.reclamar_cofre_sendero(uuid, integer, integer, text, integer) from public, anon;
grant execute on function privacidad.reclamar_cofre_sendero(uuid, integer, integer, text, integer) to authenticated, service_role;
revoke all on function public.reclamar_cofre_sendero(uuid, integer, integer, text, integer) from public, anon;
grant execute on function public.reclamar_cofre_sendero(uuid, integer, integer, text, integer) to authenticated, service_role;

create or replace function public.obtener_cofres_reclamados_habito(
  p_habito_id uuid,
  p_nivel integer,
  p_ciclo integer
)
returns table (
  nodo_dia integer,
  ciclo integer,
  tipo text,
  gemas integer,
  reclamado_en timestamptz
)
language sql
security invoker
set search_path = ''
as $$
  select c.nodo_dia, c.ciclo, c.tipo, c.gemas, c.reclamado_en
  from public.habitos_cofres_reclamados c
  where c.usuario_id = auth.uid()
    and c.habito_id = p_habito_id
    and c.nivel = p_nivel
    and c.ciclo = p_ciclo;
$$;

revoke all on function public.obtener_cofres_reclamados_habito(uuid, integer, integer) from public, anon;
grant execute on function public.obtener_cofres_reclamados_habito(uuid, integer, integer) to authenticated, service_role;

-- ─── 8. registrar_progreso_habito: transición atómica de día + cofre final.
--        Preserva la firma pública (public.registrar_progreso_habito ya
--        delega a esta función y no cambia).
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
    'transicion_sendero', v_transicion
  );
end;
$$;

-- ─── 9. Backfill: los pagos históricos de recompensa_nivel se anotan como
--        cofre final ya reclamado, sin volver a acreditar ni tocar el ledger.
insert into public.habitos_cofres_reclamados (usuario_id, habito_id, nivel, ciclo, tipo, nodo_dia, gemas, reclamado_en)
select
  m.persona_id,
  split_part(m.referencia, ':', 1)::uuid,
  split_part(m.referencia, ':', 3)::integer - 1,
  1,
  'final',
  (array[3, 7, 12, 18, 25, 33])[split_part(m.referencia, ':', 3)::integer - 1],
  m.cantidad,
  m.creado_en
from comercio.movimientos_gemas m
where m.motivo = 'recompensa_nivel'
  and m.referencia ~ '^[0-9a-f-]{36}:nivel:[1-7]$'
  and split_part(m.referencia, ':', 3)::integer - 1 between 1 and 6
on conflict on constraint habitos_cofres_unicidad do nothing;

notify pgrst, 'reload schema';

commit;
