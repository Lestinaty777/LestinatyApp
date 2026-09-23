-- Migración 47: Tareas diarias y cofres temáticos.
--
-- Misiones simples ligadas al progreso real de Senderos (no a hábitos
-- nuevos, no premian abrir la app). Se completan solas; las gemas sólo se
-- acreditan cuando la persona toca y abre el cofre. Referidos sigue siendo
-- una misión especial permanente manejada por el sistema existente — esta
-- migración no la toca.
--
-- Verificado en vivo antes de escribirla (proyecto nzwkiffbircixvznnjek):
-- 36/45/46 ya están aplicadas, comercio.acreditar_gemas ya acepta
-- p_referencia con idempotencia por (persona_id, motivo, referencia), y
-- habitos_es_dia_programado(plan habitos_planes, fecha date) es la firma
-- vigente.

begin;

-- ─── 1. Tabla de reclamos de tareas diarias.
create table public.tareas_diarias_reclamadas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  fecha_local date not null,
  tarea_codigo text not null check (tarea_codigo in (
    'sendero_1_nodo', 'sendero_2_nodos', 'sendero_dia_completo'
  )),
  gemas integer not null check (gemas > 0),
  reclamado_en timestamptz not null default now(),
  unique (usuario_id, fecha_local, tarea_codigo)
);

alter table public.tareas_diarias_reclamadas enable row level security;

create policy tareas_diarias_usuario_propio on public.tareas_diarias_reclamadas
  for select using (usuario_id = auth.uid());

revoke insert, update, delete on public.tareas_diarias_reclamadas from anon, authenticated;
grant select on public.tareas_diarias_reclamadas to authenticated;
grant all on public.tareas_diarias_reclamadas to service_role;

-- ─── 2. Motivos de crédito: sumar 'tarea_diaria' sin retirar ninguno existente.
alter table comercio.movimientos_gemas drop constraint if exists movimientos_gemas_motivo_check;
alter table comercio.movimientos_gemas add constraint movimientos_gemas_motivo_check
  check (motivo = any (array[
    'compra_iap', 'gasto_tienda', 'ajuste_soporte', 'recompensa_nivel',
    'gasto_semillas', 'referido_nivel2', 'trial_horizon_bono',
    'cofre_intermedio', 'cofre_final', 'tarea_diaria'
  ]));

-- ─── 3. acreditar_gemas: mismo cuerpo vigente en remoto, + 'tarea_diaria'
--        en la lista blanca de motivos aceptados.
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
  if p_motivo not in ('compra_iap', 'ajuste_soporte', 'referido_nivel2', 'trial_horizon_bono', 'cofre_intermedio', 'cofre_final', 'tarea_diaria') then
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

-- ─── 4. Resumen de tareas diarias: cuenta nodos avanzados hoy con la misma
--        regla que estaMetaCompleta() en src/modulos/habitos/semanaProgramada.ts
--        (check -> valor > 0, resto -> valor >= objetivo_valor).
create or replace function privacidad.obtener_tareas_diarias()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid := auth.uid();
  v_fecha_actual date;
  v_nodos_programados integer := 0;
  v_nodos_completados integer := 0;
  v_tareas jsonb := '[]'::jsonb;
  v_gemas_por_codigo jsonb := '{"sendero_1_nodo": 4, "sendero_2_nodos": 7, "sendero_dia_completo": 10}'::jsonb;
  v_codigo text;
  v_meta integer;
  v_estado text;
begin
  if v_usuario_id is null then
    raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege';
  end if;

  select (now() at time zone perfil.zona_horaria)::date into v_fecha_actual
  from public.perfiles_usuario perfil where perfil.id = v_usuario_id;
  v_fecha_actual := coalesce(v_fecha_actual, current_date);

  select
    count(*) filter (where public.habitos_es_dia_programado(plan, v_fecha_actual)),
    count(*) filter (where public.habitos_es_dia_programado(plan, v_fecha_actual)
      and (case when item.tipo_meta = 'check' then coalesce(reg.valor, 0) > 0 else coalesce(reg.valor, 0) >= plan.objetivo_valor end))
  into v_nodos_programados, v_nodos_completados
  from public.habitos_items item
  join lateral (
    select p.* from public.habitos_planes p
    where p.habito_id = item.id
      and p.desde_fecha <= v_fecha_actual
      and (p.hasta_fecha is null or p.hasta_fecha > v_fecha_actual)
    order by p.desde_fecha desc
    limit 1
  ) plan on true
  left join public.habitos_registros reg on reg.habito_id = item.id and reg.fecha_local = v_fecha_actual
  where item.usuario_id = v_usuario_id and item.estado = 'activo';

  for v_codigo, v_meta in
    select * from (values ('sendero_1_nodo', 1), ('sendero_2_nodos', 2)) as t(codigo, meta)
  loop
    v_estado := case
      when exists (
        select 1 from public.tareas_diarias_reclamadas
        where usuario_id = v_usuario_id and fecha_local = v_fecha_actual and tarea_codigo = v_codigo
      ) then 'reclamada'
      when v_nodos_completados >= v_meta then 'disponible'
      else 'bloqueada'
    end;
    v_tareas := v_tareas || jsonb_build_object(
      'codigo', v_codigo,
      'gemas', (v_gemas_por_codigo ->> v_codigo)::integer,
      'progreso', v_nodos_completados,
      'meta', v_meta,
      'estado', v_estado
    );
  end loop;

  -- sendero_dia_completo sólo existe si hay uno o más nodos programados hoy.
  if v_nodos_programados > 0 then
    v_estado := case
      when exists (
        select 1 from public.tareas_diarias_reclamadas
        where usuario_id = v_usuario_id and fecha_local = v_fecha_actual and tarea_codigo = 'sendero_dia_completo'
      ) then 'reclamada'
      when v_nodos_completados >= v_nodos_programados then 'disponible'
      else 'bloqueada'
    end;
    v_tareas := v_tareas || jsonb_build_object(
      'codigo', 'sendero_dia_completo',
      'gemas', 10,
      'progreso', v_nodos_completados,
      'meta', v_nodos_programados,
      'estado', v_estado
    );
  end if;

  return jsonb_build_object(
    'fecha_local', v_fecha_actual,
    'nodos_programados', v_nodos_programados,
    'tareas', v_tareas
  );
end;
$$;

create or replace function public.obtener_tareas_diarias()
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select privacidad.obtener_tareas_diarias();
$$;

revoke all on function privacidad.obtener_tareas_diarias() from public, anon;
grant execute on function privacidad.obtener_tareas_diarias() to authenticated, service_role;
revoke all on function public.obtener_tareas_diarias() from public, anon;
grant execute on function public.obtener_tareas_diarias() to authenticated, service_role;

-- ─── 5. Reclamo de tarea diaria: recalcula todo en servidor, nunca confía
--        en lo que llegó del cliente. Reintento/doble-tap es idempotente.
create or replace function privacidad.reclamar_tarea_diaria(p_tarea_codigo text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid := auth.uid();
  v_fecha_actual date;
  v_nodos_programados integer := 0;
  v_nodos_completados integer := 0;
  v_gemas integer;
  v_meta integer;
  v_referencia text;
  v_saldo integer;
  v_existente public.tareas_diarias_reclamadas;
begin
  if v_usuario_id is null then
    raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege';
  end if;
  if p_tarea_codigo not in ('sendero_1_nodo', 'sendero_2_nodos', 'sendero_dia_completo') then
    raise exception 'Código de tarea no válido.' using errcode = 'invalid_parameter_value';
  end if;

  select (now() at time zone perfil.zona_horaria)::date into v_fecha_actual
  from public.perfiles_usuario perfil where perfil.id = v_usuario_id;
  v_fecha_actual := coalesce(v_fecha_actual, current_date);

  select * into v_existente
  from public.tareas_diarias_reclamadas
  where usuario_id = v_usuario_id and fecha_local = v_fecha_actual and tarea_codigo = p_tarea_codigo;

  if v_existente.id is not null then
    select saldo into v_saldo from comercio.billeteras_gemas where persona_id = v_usuario_id;
    return jsonb_build_object(
      'exito', true, 'tarea_codigo', p_tarea_codigo, 'gemas', v_existente.gemas,
      'saldo', coalesce(v_saldo, 0), 'ya_reclamado', true
    );
  end if;

  select
    count(*) filter (where public.habitos_es_dia_programado(plan, v_fecha_actual)),
    count(*) filter (where public.habitos_es_dia_programado(plan, v_fecha_actual)
      and (case when item.tipo_meta = 'check' then coalesce(reg.valor, 0) > 0 else coalesce(reg.valor, 0) >= plan.objetivo_valor end))
  into v_nodos_programados, v_nodos_completados
  from public.habitos_items item
  join lateral (
    select p.* from public.habitos_planes p
    where p.habito_id = item.id
      and p.desde_fecha <= v_fecha_actual
      and (p.hasta_fecha is null or p.hasta_fecha > v_fecha_actual)
    order by p.desde_fecha desc
    limit 1
  ) plan on true
  left join public.habitos_registros reg on reg.habito_id = item.id and reg.fecha_local = v_fecha_actual
  where item.usuario_id = v_usuario_id and item.estado = 'activo';

  v_meta := case p_tarea_codigo
    when 'sendero_1_nodo' then 1
    when 'sendero_2_nodos' then 2
    else v_nodos_programados
  end;
  v_gemas := case p_tarea_codigo
    when 'sendero_1_nodo' then 4
    when 'sendero_2_nodos' then 7
    else 10
  end;

  if p_tarea_codigo = 'sendero_dia_completo' and v_nodos_programados = 0 then
    raise exception 'No hay nodos programados hoy.' using errcode = 'check_violation';
  end if;
  if v_nodos_completados < v_meta then
    raise exception 'Condición insuficiente para esta tarea.' using errcode = 'check_violation';
  end if;

  v_referencia := 'tarea-diaria:' || v_fecha_actual::text || ':' || p_tarea_codigo;

  insert into public.tareas_diarias_reclamadas (usuario_id, fecha_local, tarea_codigo, gemas)
  values (v_usuario_id, v_fecha_actual, p_tarea_codigo, v_gemas)
  on conflict (usuario_id, fecha_local, tarea_codigo) do nothing;

  v_saldo := comercio.acreditar_gemas(v_usuario_id, v_gemas, 'tarea_diaria', v_referencia);

  return jsonb_build_object(
    'exito', true, 'tarea_codigo', p_tarea_codigo, 'gemas', v_gemas,
    'saldo', v_saldo, 'ya_reclamado', false
  );
end;
$$;

create or replace function public.reclamar_tarea_diaria(p_tarea_codigo text)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select privacidad.reclamar_tarea_diaria(p_tarea_codigo);
$$;

revoke all on function privacidad.reclamar_tarea_diaria(text) from public, anon;
grant execute on function privacidad.reclamar_tarea_diaria(text) to authenticated, service_role;
revoke all on function public.reclamar_tarea_diaria(text) from public, anon;
grant execute on function public.reclamar_tarea_diaria(text) to authenticated, service_role;

notify pgrst, 'reload schema';

commit;
