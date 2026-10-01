-- Fase 8.1: sendero de días con árbol/nivel para tareas recurrentes
-- (tipo in ('simple','contador','cronometro') + frecuencia='dias_semana').
-- Espejo de la capa de gamificación de Hábitos (habitos_planes.nivel,
-- registrar_progreso_habito, mandala_* en habitos_registros), simplificado:
-- sin tabla de planes versionada (mismo criterio ya aplicado a tareas
-- check-only en 20260930_59) — nivel/objetivo_valor viven directo en
-- tareas_items, y `tareas_contar_dias_completados_nivel` evalúa
-- `tareas_es_dia_programado` con la frecuencia ACTUAL de la tarea (no la
-- histórica). Efecto aceptado: editar la frecuencia a mitad de nivel
-- reinterpreta el conteo con la regla nueva.
--
-- `checklist` sigue usando su propio sendero de pasos (Fase 7, sin tocar).
-- `completar_tarea_dia` NO se modifica en esta migración: la guarda que
-- impediría llamarla para tareas que ya usan este sendero se agrega recién
-- en la fase que cambia el cliente (Fase 8.4) — agregarla ahora rompería,
-- sin necesidad, las tareas recurrentes simples que hoy sigue completando
-- el cliente actual vía esa RPC.

-- ─── 1. Nivel/meta real en tareas_items ─────────────────────────────────
alter table public.tareas_items
  add column nivel integer not null default 1 check (nivel between 1 and 7),
  add column nivel_desde_fecha date not null default current_date,
  add column objetivo_valor numeric not null default 1 check (objetivo_valor > 0),
  add column unidad text;

-- ─── 2. Valor + snapshot de figura (mandala_* de tareas) en tareas_registros
alter table public.tareas_registros
  add column valor numeric,
  add column figura_estado text check (figura_estado is null or figura_estado = any (array['pendiente', 'creada'])),
  add column figura_semilla text,
  add column figura_trazos jsonb,
  add column figura_paquete_id text,
  add column figura_color text,
  add column figura_nivel smallint,
  add column figura_ciclo integer,
  add column figura_nodo_dia smallint,
  add column figura_creada_en timestamptz;

-- ─── 3. Cofres reclamados por tarea (espejo de habitos_cofres_reclamados)
create table public.tareas_cofres_reclamados (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  tarea_id uuid not null references public.tareas_items(id) on delete cascade,
  nivel integer not null,
  ciclo integer not null,
  tipo text not null,
  nodo_dia integer not null,
  gemas integer not null,
  reclamado_en timestamptz not null default now(),
  constraint tareas_cofres_unicidad unique (usuario_id, tarea_id, nivel, ciclo, tipo, nodo_dia)
);

alter table public.tareas_cofres_reclamados enable row level security;

create policy tareas_cofres_usuario_propio
  on public.tareas_cofres_reclamados
  for select
  using (usuario_id = auth.uid());

-- ─── 4. Conteo de días completados en el nivel actual (helper interno) ──
create or replace function privacidad.tareas_contar_dias_completados_nivel(
  p_tarea_id uuid
)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(distinct r.fecha_local)::integer
  from public.tareas_registros r
  join public.tareas_items t on t.id = r.tarea_id
  where r.tarea_id = p_tarea_id
    and r.fecha_local >= t.nivel_desde_fecha
    and public.tareas_es_dia_programado(t, r.fecha_local)
    and (case when t.tipo = 'simple' then r.valor > 0 else r.valor >= t.objetivo_valor end);
$$;

revoke all on function privacidad.tareas_contar_dias_completados_nivel(uuid) from public, anon, authenticated;
grant execute on function privacidad.tareas_contar_dias_completados_nivel(uuid) to service_role;

-- ─── 5. Creación premium de tareas (espejo de crear_habito_premium) ─────
create or replace function privacidad.crear_tarea_premium(
  p_titulo text,
  p_descripcion text,
  p_icono_lucide text,
  p_color text,
  p_tipo text,
  p_objetivo_valor numeric default 1,
  p_unidad text default null,
  p_prioridad text default null,
  p_frecuencia text default 'una_vez',
  p_dias_semana smallint[] default null,
  p_fecha_vencimiento date default null,
  p_recordatorio_activo boolean default false,
  p_hora_recordatorio time default null,
  p_mostrar_nombre_notificacion boolean default true,
  p_paquete_id text default null,
  p_nivel_inicial integer default 1
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item public.tareas_items;
  v_nivel_inicial integer;
begin
  if auth.uid() is null then raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege'; end if;
  if p_recordatorio_activo and p_hora_recordatorio is null then raise exception 'El recordatorio necesita una hora.' using errcode = 'check_violation'; end if;
  if p_tipo not in ('simple', 'checklist', 'contador', 'cronometro') then raise exception 'Tipo de tarea inválido.' using errcode = 'check_violation'; end if;

  v_nivel_inicial := greatest(1, least(7, coalesce(p_nivel_inicial, 1)));

  insert into public.tareas_items (
    usuario_id, titulo, descripcion, icono_lucide, color, tipo, objetivo_valor, unidad, prioridad,
    frecuencia, dias_semana, fecha_vencimiento, recordatorio_activo, hora_recordatorio, mostrar_nombre_notificacion,
    paquete_id, nivel, nivel_desde_fecha
  ) values (
    auth.uid(), p_titulo, nullif(trim(coalesce(p_descripcion, '')), ''), p_icono_lucide, p_color, p_tipo,
    coalesce(p_objetivo_valor, 1), nullif(trim(coalesce(p_unidad, '')), ''), p_prioridad,
    p_frecuencia, p_dias_semana, p_fecha_vencimiento, p_recordatorio_activo, p_hora_recordatorio, p_mostrar_nombre_notificacion,
    p_paquete_id, v_nivel_inicial, current_date
  )
  returning * into v_item;

  return jsonb_build_object('id', v_item.id);
end;
$$;

create or replace function public.crear_tarea_premium(
  p_titulo text,
  p_descripcion text,
  p_icono_lucide text,
  p_color text,
  p_tipo text,
  p_objetivo_valor numeric default 1,
  p_unidad text default null,
  p_prioridad text default null,
  p_frecuencia text default 'una_vez',
  p_dias_semana smallint[] default null,
  p_fecha_vencimiento date default null,
  p_recordatorio_activo boolean default false,
  p_hora_recordatorio time default null,
  p_mostrar_nombre_notificacion boolean default true,
  p_paquete_id text default null,
  p_nivel_inicial integer default 1
)
returns jsonb
language sql
set search_path = ''
as $$
  select privacidad.crear_tarea_premium(
    p_titulo, p_descripcion, p_icono_lucide, p_color, p_tipo, p_objetivo_valor, p_unidad, p_prioridad,
    p_frecuencia, p_dias_semana, p_fecha_vencimiento, p_recordatorio_activo, p_hora_recordatorio,
    p_mostrar_nombre_notificacion, p_paquete_id, p_nivel_inicial
  );
$$;

-- ─── 6. Registrar progreso del sendero de días (espejo de registrar_progreso_habito)
create or replace function privacidad.registrar_progreso_tarea(
  p_tarea_id uuid,
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
  v_tarea public.tareas_items;
  v_registro public.tareas_registros;
  v_dias_requeridos_por_nivel integer[] := array[3, 7, 12, 18, 25, 33, 42];
  v_dias_requeridos integer;
  v_dias_completados integer := 0;
  v_nuevo_objetivo numeric;
  v_subio_nivel boolean := false;
  v_nivel_actual integer;
  v_gemas_ganadas integer := 0;
  v_transicion jsonb;
  v_referencia_cofre text;
  v_ciclo_completado integer;
  v_cumple_meta boolean;
  v_figura_dias_nivel integer;
  v_figura_nivel integer;
  v_figura_ciclo integer;
  v_figura_nodo_dia integer;
  v_figura jsonb;
begin
  if auth.uid() is null then raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege'; end if;

  select (now() at time zone perfil.zona_horaria)::date into v_fecha_actual
  from public.perfiles_usuario perfil where perfil.id = auth.uid();
  v_fecha_actual := coalesce(v_fecha_actual, current_date);
  if p_fecha_local > v_fecha_actual then
    raise exception 'No puedes registrar progreso en una fecha futura.' using errcode = 'check_violation';
  end if;

  -- Bloquea la tarea para serializar llamadas concurrentes del mismo día
  -- (mismo motivo que registrar_progreso_habito: evitar doble subida de
  -- nivel / doble cofre por doble-tap).
  select * into v_tarea
  from public.tareas_items
  where id = p_tarea_id and usuario_id = auth.uid() and estado <> 'archivada'
  for update;

  if not found then
    raise exception 'Tarea no encontrada.' using errcode = 'no_data_found';
  end if;
  if v_tarea.frecuencia <> 'dias_semana' or v_tarea.tipo not in ('simple', 'contador', 'cronometro') then
    raise exception 'Esta tarea no usa el sendero de días; usa completar_tarea_dia.' using errcode = 'check_violation';
  end if;

  -- Upsert monotónico: igual que en hábitos, un valor que ya cumplía la
  -- meta no puede "des-cumplirse" por una corrección menor.
  insert into public.tareas_registros (tarea_id, usuario_id, fecha_local, valor, nota)
  values (p_tarea_id, auth.uid(), p_fecha_local, p_valor, nullif(trim(coalesce(p_nota, '')), ''))
  on conflict (tarea_id, fecha_local) do update
  set
    valor = case
      when (case when v_tarea.tipo = 'simple' then public.tareas_registros.valor > 0 else public.tareas_registros.valor >= v_tarea.objetivo_valor end)
      then greatest(public.tareas_registros.valor, excluded.valor)
      else excluded.valor
    end,
    nota = excluded.nota
  returning * into v_registro;

  -- ─── Figura pendiente: solo si ESTE registro cumple la meta actual.
  --     Snapshot de nivel/ciclo/nodo_dia y paquete/color — nunca se
  --     recalcula después de creada.
  v_cumple_meta := case when v_tarea.tipo = 'simple' then v_registro.valor > 0 else v_registro.valor >= v_tarea.objetivo_valor end;

  if v_cumple_meta then
    v_figura_nivel := v_tarea.nivel;
    v_figura_dias_nivel := privacidad.tareas_contar_dias_completados_nivel(p_tarea_id);

    if v_figura_nivel = 7 then
      v_figura_ciclo := (v_figura_dias_nivel / v_dias_requeridos_por_nivel[7]) + 1;
      v_figura_nodo_dia := v_figura_dias_nivel % v_dias_requeridos_por_nivel[7];
      if v_figura_nodo_dia = 0 then
        v_figura_ciclo := v_figura_ciclo - 1;
        v_figura_nodo_dia := v_dias_requeridos_por_nivel[7];
      end if;
    else
      v_figura_ciclo := 1;
      v_figura_nodo_dia := v_figura_dias_nivel;
    end if;

    update public.tareas_registros
    set figura_estado = 'pendiente',
        figura_semilla = md5(v_registro.id::text || ':' || p_fecha_local::text),
        figura_paquete_id = v_tarea.paquete_id,
        figura_color = v_tarea.color,
        figura_nivel = v_figura_nivel,
        figura_ciclo = v_figura_ciclo,
        figura_nodo_dia = v_figura_nodo_dia
    where id = v_registro.id and figura_estado is null
    returning jsonb_build_object(
      'registro_id', id, 'estado', figura_estado, 'semilla', figura_semilla,
      'paquete_id', figura_paquete_id, 'color', figura_color,
      'nivel', figura_nivel, 'ciclo', figura_ciclo, 'nodo_dia', figura_nodo_dia
    ) into v_figura;

    -- Reintento: la guarda de arriba no actualizó nada (ya tenía
    -- figura_estado) — se reporta el estado ya guardado, sin resetear nada.
    if v_figura is null then
      select jsonb_build_object(
        'registro_id', id, 'estado', figura_estado, 'semilla', figura_semilla,
        'paquete_id', figura_paquete_id, 'color', figura_color,
        'nivel', figura_nivel, 'ciclo', figura_ciclo, 'nodo_dia', figura_nodo_dia
      ) into v_figura
      from public.tareas_registros where id = v_registro.id;
    end if;
  end if;

  v_nivel_actual := v_tarea.nivel;

  if v_nivel_actual < 7 then
    v_dias_requeridos := v_dias_requeridos_por_nivel[v_nivel_actual];
    v_dias_completados := privacidad.tareas_contar_dias_completados_nivel(p_tarea_id);

    if v_dias_completados >= v_dias_requeridos then
      v_nuevo_objetivo := case when v_tarea.tipo = 'simple' then v_tarea.objetivo_valor else round(v_tarea.objetivo_valor * 1.15, 2) end;

      update public.tareas_items
      set nivel = v_tarea.nivel + 1, nivel_desde_fecha = v_fecha_actual + 1, objetivo_valor = v_nuevo_objetivo
      where id = p_tarea_id;

      v_subio_nivel := true;
      v_nivel_actual := v_tarea.nivel + 1;

      -- Mismo esquema de gemas por nivel que el cofre final de hábitos.
      v_gemas_ganadas := case v_tarea.nivel
        when 1 then 10 when 2 then 15 when 3 then 20
        when 4 then 25 when 5 then 30 when 6 then 35
        else 5 * (v_tarea.nivel + 1)
      end;
      v_referencia_cofre := 'cofre_tarea:' || p_tarea_id::text || ':nivel:' || v_tarea.nivel || ':ciclo:1:final';

      insert into public.tareas_cofres_reclamados (usuario_id, tarea_id, nivel, ciclo, tipo, nodo_dia, gemas)
      values (auth.uid(), p_tarea_id, v_tarea.nivel, 1, 'final', v_dias_requeridos, v_gemas_ganadas)
      on conflict on constraint tareas_cofres_unicidad do nothing;

      perform comercio.acreditar_gemas(auth.uid(), v_gemas_ganadas, 'cofre_final_tarea', v_referencia_cofre);

      v_transicion := jsonb_build_object(
        'tipo', 'nivel',
        'nivel_anterior', v_tarea.nivel,
        'nivel_actual', v_nivel_actual,
        'ciclo_anterior', 1,
        'ciclo_actual', 1,
        'cofre_final_reclamado', true,
        'gemas', v_gemas_ganadas
      );
    end if;
  elsif v_nivel_actual = 7 then
    -- Maestría infinita: cada múltiplo nuevo de 42 días paga un cofre de
    -- ciclo y el recorrido se reinicia solo (no hay nivel 8), igual que
    -- en hábitos.
    v_dias_requeridos := v_dias_requeridos_por_nivel[7];
    v_dias_completados := privacidad.tareas_contar_dias_completados_nivel(p_tarea_id);

    if v_dias_completados > 0 and v_dias_completados % v_dias_requeridos = 0 then
      v_ciclo_completado := v_dias_completados / v_dias_requeridos;
      v_referencia_cofre := 'cofre_tarea:' || p_tarea_id::text || ':nivel:7:ciclo:' || v_ciclo_completado || ':final';

      insert into public.tareas_cofres_reclamados (usuario_id, tarea_id, nivel, ciclo, tipo, nodo_dia, gemas)
      values (auth.uid(), p_tarea_id, 7, v_ciclo_completado, 'final', v_dias_requeridos, 35)
      on conflict on constraint tareas_cofres_unicidad do nothing;

      perform comercio.acreditar_gemas(auth.uid(), 35, 'cofre_final_tarea', v_referencia_cofre);

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
    'id', v_registro.id, 'tarea_id', v_registro.tarea_id, 'fecha_local', v_registro.fecha_local,
    'valor', v_registro.valor, 'nota', v_registro.nota,
    'subio_nivel', v_subio_nivel, 'nivel', v_nivel_actual, 'gemas_ganadas', v_gemas_ganadas,
    'transicion_sendero', v_transicion, 'figura_pendiente', v_figura
  );
end;
$$;

create or replace function public.registrar_progreso_tarea(
  p_tarea_id uuid, p_fecha_local date, p_valor numeric, p_nota text default null
)
returns jsonb
language sql
set search_path = ''
as $$
  select privacidad.registrar_progreso_tarea(p_tarea_id, p_fecha_local, p_valor, p_nota);
$$;

-- ─── 7. Guardar/leer la figura trazada (espejo de guardar_mandala_registro
--        y obtener_mandalas_habito)
create or replace function privacidad.guardar_figura_tarea_registro(
  p_registro_id uuid, p_trazos jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_registro public.tareas_registros;
begin
  if auth.uid() is null then
    raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege';
  end if;

  select * into v_registro
  from public.tareas_registros
  where id = p_registro_id and usuario_id = auth.uid()
  for update;

  if v_registro.id is null then
    raise exception 'Registro no encontrado.' using errcode = 'no_data_found';
  end if;
  if v_registro.figura_estado is distinct from 'pendiente' then
    raise exception 'Este registro no tiene una figura pendiente.' using errcode = 'check_violation';
  end if;

  update public.tareas_registros
  set figura_trazos = p_trazos, figura_estado = 'creada', figura_creada_en = now()
  where id = p_registro_id;

  return jsonb_build_object(
    'registro_id', p_registro_id, 'estado', 'creada',
    'paquete_id', v_registro.figura_paquete_id, 'color', v_registro.figura_color,
    'nivel', v_registro.figura_nivel, 'ciclo', v_registro.figura_ciclo, 'nodo_dia', v_registro.figura_nodo_dia
  );
end;
$$;

create or replace function public.guardar_figura_tarea_registro(p_registro_id uuid, p_trazos jsonb)
returns jsonb
language sql
set search_path = ''
as $$
  select privacidad.guardar_figura_tarea_registro(p_registro_id, p_trazos);
$$;

create or replace function privacidad.obtener_figuras_tarea(p_tarea_id uuid)
returns table(registro_id uuid, nivel smallint, ciclo integer, nodo_dia smallint, estado text, semilla text, trazos jsonb, paquete_id text, color text)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id, r.figura_nivel, coalesce(r.figura_ciclo, 1), r.figura_nodo_dia, r.figura_estado,
         r.figura_semilla, r.figura_trazos, r.figura_paquete_id, r.figura_color
  from public.tareas_registros r
  where r.tarea_id = p_tarea_id and r.usuario_id = auth.uid() and r.figura_estado is not null;
$$;

create or replace function public.obtener_figuras_tarea(p_tarea_id uuid)
returns table(registro_id uuid, nivel smallint, ciclo integer, nodo_dia smallint, estado text, semilla text, trazos jsonb, paquete_id text, color text)
language sql
set search_path = ''
as $$
  select * from privacidad.obtener_figuras_tarea(p_tarea_id);
$$;

-- ─── 8. Nuevo motivo de gemas 'cofre_final_tarea' (doble lugar: whitelist
--        interno de acreditar_gemas + constraint de la tabla — ambos hacen
--        falta, ya costó un bug en la Fase 1 olvidar el segundo).
create or replace function comercio.acreditar_gemas(
  p_persona_id uuid, p_cantidad integer, p_motivo text, p_referencia text default null
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
  if p_motivo not in ('compra_iap', 'ajuste_soporte', 'referido_nivel2', 'trial_horizon_bono', 'cofre_intermedio', 'cofre_final', 'tarea_diaria', 'racha_tarea', 'cofre_final_tarea') then
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

alter table comercio.movimientos_gemas drop constraint movimientos_gemas_motivo_check;
alter table comercio.movimientos_gemas add constraint movimientos_gemas_motivo_check
  check (motivo = any (array[
    'compra_iap', 'gasto_tienda', 'ajuste_soporte', 'recompensa_nivel', 'gasto_semillas',
    'referido_nivel2', 'trial_horizon_bono', 'cofre_intermedio', 'cofre_final',
    'tarea_diaria', 'racha_tarea', 'cofre_final_tarea'
  ]));
