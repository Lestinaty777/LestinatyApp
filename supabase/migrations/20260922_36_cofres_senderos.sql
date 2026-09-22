-- Migración 36: Cofres de Senderos para Hábitos (intermedios cada 3 días y final de nivel)
-- 
-- 1. Amplía el check constraint de comercio.movimientos_gemas con los motivos 'cofre_intermedio' y 'cofre_final'.
-- 2. Crea la tabla public.habitos_cofres_reclamados con unicidad por (usuario_id, habito_id, nivel, tipo, nodo_dia)
--    para impedir matemáticamente el doble reclamo.
-- 3. Crea la función RPC comercio.reclamar_cofre_sendero() con validación transaccional de progreso real en el servidor.
-- 4. Crea la función de consulta comercio.obtener_cofres_reclamados_habito().

begin;

-- 1. Constraint de motivos en movimientos_gemas
alter table comercio.movimientos_gemas drop constraint if exists movimientos_gemas_motivo_check;
alter table comercio.movimientos_gemas add constraint movimientos_gemas_motivo_check
  check (motivo in ('compra_iap', 'gasto_tienda', 'ajuste_soporte', 'recompensa_nivel', 'gasto_semillas', 'referido_nivel2', 'cofre_intermedio', 'cofre_final'));

-- 2. Tabla persistente de cofres reclamados
create table if not exists public.habitos_cofres_reclamados (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  habito_id uuid not null references public.habitos_items(id) on delete cascade,
  nivel integer not null check (nivel between 1 and 7),
  tipo text not null check (tipo in ('intermedio', 'final')),
  nodo_dia integer not null check (nodo_dia > 0),
  gemas integer not null check (gemas > 0),
  reclamado_en timestamptz not null default now(),
  constraint habitos_cofres_unicidad unique (usuario_id, habito_id, nivel, tipo, nodo_dia)
);

alter table public.habitos_cofres_reclamados enable row level security;

drop policy if exists habitos_cofres_usuario_propio on public.habitos_cofres_reclamados;
create policy habitos_cofres_usuario_propio on public.habitos_cofres_reclamados
  for select using (usuario_id = auth.uid());

-- 3. Función RPC transaccional para reclamar cofre
create or replace function comercio.reclamar_cofre_sendero(
  p_habito_id uuid,
  p_nivel integer,
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
  v_plan public.habitos_planes;
  v_dias_completados integer := 0;
  v_dias_requeridos integer;
  v_dias_requeridos_por_nivel integer[] := array[3, 7, 12, 18, 25, 33];
  v_gemas integer;
  v_referencia text;
  v_tipo_meta text;
begin
  if v_usuario_id is null then
    raise exception 'Autenticación requerida.' using errcode = '28000';
  end if;

  if p_nivel < 1 or p_nivel > 7 then
    raise exception 'Nivel no válido.' using errcode = 'check_violation';
  end if;

  -- Validar pertenencia del hábito
  select item.tipo_meta into v_tipo_meta
  from public.habitos_items item
  where item.id = p_habito_id and item.usuario_id = v_usuario_id;

  if v_tipo_meta is null then
    raise exception 'Hábito no encontrado.' using errcode = 'no_data_found';
  end if;

  -- Obtener plan vigente o más reciente para ese nivel
  select * into v_plan
  from public.habitos_planes
  where habito_id = p_habito_id and nivel = p_nivel
  order by desde_fecha desc
  limit 1;

  if v_plan.id is null then
    raise exception 'Plan de hábito no encontrado para el nivel indicado.' using errcode = 'no_data_found';
  end if;

  -- Contar días completados reales en este nivel
  select count(*) into v_dias_completados
  from generate_series(v_plan.desde_fecha, coalesce(v_plan.hasta_fecha, current_date), interval '1 day') as dia(fecha)
  join public.habitos_registros r
    on r.habito_id = p_habito_id and r.fecha_local = dia.fecha::date
  where public.habitos_es_dia_programado(v_plan, dia.fecha::date)
    and (case when v_tipo_meta = 'check' then r.valor > 0 else r.valor >= v_plan.objetivo_valor end);

  -- Validar cumplimiento según tipo de cofre
  if p_tipo = 'intermedio' then
    if p_nodo_dia % 3 <> 0 then
      raise exception 'El nodo indicado no corresponde a un cofre intermedio.' using errcode = 'check_violation';
    end if;

    if v_dias_completados < p_nodo_dia then
      raise exception 'Días insuficientes para desbloquear este cofre.' using errcode = 'check_violation';
    end if;

    -- 8 a 15 gemas aleatorias generadas en el servidor
    v_gemas := 8 + floor(random() * 8)::integer;
    v_referencia := 'cofre:' || p_habito_id::text || ':n:' || p_nivel || ':i:' || p_nodo_dia;
  elsif p_tipo = 'final' then
    v_dias_requeridos := v_dias_requeridos_por_nivel[p_nivel];
    if v_dias_completados < v_dias_requeridos then
      raise exception 'Aún no has completado todos los días del nivel.' using errcode = 'check_violation';
    end if;

    -- Recompensa declarada en wizard: (nivel + 1) * 5
    v_gemas := 5 * (p_nivel + 1);
    v_referencia := 'cofre:' || p_habito_id::text || ':n:' || p_nivel || ':final';
  else
    raise exception 'Tipo de cofre no válido.' using errcode = 'invalid_parameter_value';
  end if;

  -- Comprobar si ya fue reclamado (antifraude / doble reclamo)
  if exists (
    select 1 from public.habitos_cofres_reclamados
    where usuario_id = v_usuario_id
      and habito_id = p_habito_id
      and nivel = p_nivel
      and tipo = p_tipo
      and nodo_dia = p_nodo_dia
  ) then
    raise exception 'Este cofre ya ha sido reclamado.' using errcode = 'unique_violation';
  end if;

  -- Registrar cofre reclamado
  insert into public.habitos_cofres_reclamados (usuario_id, habito_id, nivel, tipo, nodo_dia, gemas)
  values (v_usuario_id, p_habito_id, p_nivel, p_tipo, p_nodo_dia, v_gemas);

  -- Acreditar gemas en billetera
  insert into comercio.billeteras_gemas (persona_id, saldo)
  values (v_usuario_id, v_gemas)
  on conflict (persona_id) do update
    set saldo = comercio.billeteras_gemas.saldo + excluded.saldo, actualizado_en = now();

  -- Registrar movimiento en el ledger
  insert into comercio.movimientos_gemas (persona_id, cantidad, motivo, referencia)
  values (v_usuario_id, v_gemas, case when p_tipo = 'intermedio' then 'cofre_intermedio' else 'cofre_final' end, v_referencia);

  return jsonb_build_object(
    'exito', true,
    'gemas', v_gemas,
    'tipo', p_tipo,
    'nodo_dia', p_nodo_dia,
    'nivel', p_nivel
  );
end;
$$;

revoke all on function comercio.reclamar_cofre_sendero(uuid, integer, text, integer) from public, anon;
grant execute on function comercio.reclamar_cofre_sendero(uuid, integer, text, integer) to authenticated, service_role;

-- 4. Consulta de cofres reclamados de un hábito y nivel
create or replace function comercio.obtener_cofres_reclamados_habito(
  p_habito_id uuid,
  p_nivel integer
)
returns table (
  nodo_dia integer,
  tipo text,
  gemas integer,
  reclamado_en timestamptz
)
language sql
security definer
set search_path = ''
as $$
  select c.nodo_dia, c.tipo, c.gemas, c.reclamado_en
  from public.habitos_cofres_reclamados c
  where c.usuario_id = auth.uid()
    and c.habito_id = p_habito_id
    and c.nivel = p_nivel;
$$;

revoke all on function comercio.obtener_cofres_reclamados_habito(uuid, integer) from public, anon;
grant execute on function comercio.obtener_cofres_reclamados_habito(uuid, integer) to authenticated, service_role;

commit;
