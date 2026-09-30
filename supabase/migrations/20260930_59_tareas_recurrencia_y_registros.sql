-- Tareas — Fase 1 (núcleo): una tarea puede repetirse ("los días que quieras
-- hacerla") además de ser de una sola vez. tareas_items no gana una tabla de
-- planes versionada como habitos_planes: al ser check-only (sin objetivo
-- numérico que reinterpretar contra un plan histórico), el horario vive
-- directo en la fila de la tarea — editar la frecuencia no rompe nada de lo
-- ya registrado.
begin;

alter table public.tareas_items
  add column frecuencia text not null default 'una_vez' check (frecuencia in ('una_vez', 'dias_semana')),
  add column dias_semana smallint[],
  add column recordatorio_activo boolean not null default false,
  add column hora_recordatorio time,
  add column mostrar_nombre_notificacion boolean not null default true,
  -- Para el futuro módulo de Rutinas: aún no existe una tabla `rutinas` así
  -- que, a propósito, todavía no lleva `references` — se agrega cuando exista.
  add column routine_id uuid;

alter table public.tareas_items add constraint tareas_items_frecuencia_dias_semana_check
  check (
    (frecuencia = 'una_vez' and dias_semana is null)
    or (frecuencia = 'dias_semana' and dias_semana is not null and cardinality(dias_semana) between 1 and 7)
  );

alter table public.tareas_items add constraint tareas_items_dias_semana_check
  check (dias_semana is null or dias_semana <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[]);

alter table public.tareas_items add constraint tareas_items_recordatorio_hora_check
  check (not recordatorio_activo or hora_recordatorio is not null);

-- ─── Registro diario — solo para tareas con frecuencia = 'dias_semana'. Una
-- tarea 'una_vez' no necesita esta tabla: su estado de completada vive en
-- tareas_items.estado/completada_en (ya existentes desde la migración 56),
-- igual que hoy.
create table public.tareas_registros (
  id uuid primary key default gen_random_uuid(),
  tarea_id uuid not null references public.tareas_items(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  fecha_local date not null,
  completada_en timestamptz not null default now(),
  nota text,
  created_at timestamptz not null default now(),
  unique (tarea_id, fecha_local)
);

create index tareas_registros_usuario_fecha_idx on public.tareas_registros (usuario_id, fecha_local);

alter table public.tareas_registros enable row level security;

create policy tareas_registros_propias on public.tareas_registros
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

grant select, insert, update, delete on public.tareas_registros to authenticated;
grant all on public.tareas_registros to service_role;

-- ─── ¿Toca hoy? — espejo simplificado de habitos_es_dia_programado: 'una_vez'
-- solo "toca" el día exacto de vencimiento; 'dias_semana' según el isodow.
create or replace function public.tareas_es_dia_programado(tarea public.tareas_items, fecha date)
returns boolean
language sql
immutable
set search_path to ''
as $function$
  select case tarea.frecuencia
    when 'una_vez' then tarea.fecha_vencimiento = fecha
    when 'dias_semana' then extract(isodow from fecha)::smallint = any(tarea.dias_semana)
  end;
$function$;

-- ─── Completar/descompletar un día — RPC única para las dos acciones (toca
-- una vez para marcar, toca de nuevo para desmarcar), como un checkbox. Solo
-- aplica a tareas 'dias_semana' (llevan tareas_registros); para 'una_vez'
-- alterna directo el estado de tareas_items, sin racha ni gemas.
create or replace function privacidad.completar_tarea_dia(p_tarea_id uuid, p_fecha_local date, p_nota text default null)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_tarea public.tareas_items;
  v_completada boolean;
  v_racha integer := 0;
  v_fecha date;
  v_gemas_ganadas integer := 0;
begin
  if auth.uid() is null then raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege'; end if;
  select * into v_tarea from public.tareas_items where id = p_tarea_id and usuario_id = auth.uid() and estado <> 'archivada';
  if not found then raise exception 'Tarea no encontrada.' using errcode = 'no_data_found'; end if;

  if v_tarea.frecuencia = 'una_vez' then
    v_completada := v_tarea.estado <> 'hecha';
    update public.tareas_items
      set estado = case when v_completada then 'hecha' else 'pendiente' end,
        completada_en = case when v_completada then now() else null end
      where id = p_tarea_id;
    return jsonb_build_object('id', p_tarea_id, 'completada', v_completada, 'racha', null, 'gemas_ganadas', 0);
  end if;

  if exists (select 1 from public.tareas_registros where tarea_id = p_tarea_id and fecha_local = p_fecha_local) then
    delete from public.tareas_registros where tarea_id = p_tarea_id and fecha_local = p_fecha_local;
    v_completada := false;
  else
    insert into public.tareas_registros (tarea_id, usuario_id, fecha_local, nota)
    values (p_tarea_id, auth.uid(), p_fecha_local, nullif(trim(coalesce(p_nota, '')), ''));
    v_completada := true;
  end if;

  -- Racha: días programados consecutivos, hacia atrás desde p_fecha_local, con registro.
  v_fecha := p_fecha_local;
  while public.tareas_es_dia_programado(v_tarea, v_fecha)
    and exists (select 1 from public.tareas_registros where tarea_id = p_tarea_id and fecha_local = v_fecha) loop
    v_racha := v_racha + 1;
    v_fecha := v_fecha - 1;
  end loop;

  -- Gema de hito cada 7 días de racha (solo al completar, nunca al desmarcar).
  -- acreditar_gemas es idempotente por (persona_id, motivo, referencia): si
  -- este hito ya se pagó antes (p. ej. se desmarcó y se volvió a marcar el
  -- mismo día), no vuelve a acreditar.
  if v_completada and v_racha > 0 and v_racha % 7 = 0
    and not exists (
      select 1 from comercio.movimientos_gemas
      where persona_id = auth.uid() and motivo = 'racha_tarea'
        and referencia = 'racha_tarea:' || p_tarea_id::text || ':' || v_racha::text
    ) then
    v_gemas_ganadas := 10;
    perform comercio.acreditar_gemas(auth.uid(), v_gemas_ganadas, 'racha_tarea', 'racha_tarea:' || p_tarea_id::text || ':' || v_racha::text);
  end if;

  return jsonb_build_object('id', p_tarea_id, 'completada', v_completada, 'racha', v_racha, 'gemas_ganadas', v_gemas_ganadas);
end;
$function$;

create or replace function public.completar_tarea_dia(p_tarea_id uuid, p_fecha_local date, p_nota text default null)
returns jsonb
language sql
set search_path to ''
as $function$ select privacidad.completar_tarea_dia(p_tarea_id, p_fecha_local, p_nota); $function$;

commit;
