-- Migración 72: catálogo de plantillas de rutinas, gratis y de pago con gemas.
-- El contenido vive en el servidor (no en el bundle de la app): las plantillas
-- de pago solo se entregan a quien las compró, y se pueden añadir, cambiar de
-- precio o apagar sin publicar una versión nueva.
--
-- Cómo agregar una plantilla premium (como service_role/postgres):
--
--   insert into public.plantillas_rutinas (id, titulo, descripcion, franja, icono_id, precio_gemas, orden)
--   values ('estudio-examen-30d', 'Examen en 30 días', 'Plan diario de repaso con descansos', 'tarde', 'estudiar', 100, 20);
--   insert into public.plantillas_rutinas_contenido (plantilla_id, pasos) values ('estudio-examen-30d', '[
--     {"titulo": "Repasar apuntes", "modo": "cronometro", "objetivo_valor": 25, "unidad": "min"},
--     {"titulo": "Ejercicios del tema", "modo": "contador", "objetivo_valor": 15, "unidad": "ejercicios"},
--     {"titulo": "Resumen en una hoja", "modo": "simple"}
--   ]'::jsonb);
--
-- num_pasos y duracion_min se calculan solos desde el contenido.
-- precio_gemas = 0 significa gratis. Para retirar una plantilla, activa = false
-- (quien ya la compró la sigue viendo); no se borra, el historial de compras
-- lo impide a propósito.
begin;

-- ─── Catálogo (metadatos públicos para quien tiene sesión) ──────────────
create table public.plantillas_rutinas (
  id text primary key check (id ~ '^[a-z0-9][a-z0-9-]{1,59}$'),
  titulo text not null check (char_length(trim(titulo)) between 1 and 80),
  descripcion text not null check (char_length(trim(descripcion)) between 1 and 280),
  franja public.franja_dia not null default 'cualquier_momento',
  icono_id text not null check (char_length(trim(icono_id)) between 1 and 80),
  autor text not null default 'Lestinaty' check (char_length(trim(autor)) between 1 and 80),
  precio_gemas integer not null default 0 check (precio_gemas between 0 and 100000),
  -- Calculados desde el contenido por el trigger de abajo.
  num_pasos smallint not null default 0,
  duracion_min integer not null default 0,
  activa boolean not null default true,
  orden integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger plantillas_rutinas_updated_at before update on public.plantillas_rutinas
  for each row execute function public.set_updated_at();

-- ─── Contenido (los pasos): solo lo ve quien la compró o si es gratis ───
create table public.plantillas_rutinas_contenido (
  plantilla_id text primary key references public.plantillas_rutinas(id) on delete cascade,
  pasos jsonb not null check (jsonb_typeof(pasos) = 'array' and jsonb_array_length(pasos) between 1 and 20)
);

-- Valida la forma de cada paso (misma regla que rutinas_pasos 'propio') y
-- recalcula num_pasos y duracion_min (minutos de los pasos con cronómetro).
create or replace function public.plantillas_rutinas_validar_contenido()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_paso jsonb;
  v_modo text;
  v_objetivo numeric;
  v_minutos numeric := 0;
begin
  for v_paso in select * from jsonb_array_elements(new.pasos) loop
    if jsonb_typeof(v_paso) <> 'object'
      or jsonb_typeof(v_paso -> 'titulo') is distinct from 'string'
      or char_length(trim(v_paso ->> 'titulo')) not between 1 and 80 then
      raise exception 'Cada paso necesita un título de 1 a 80 caracteres.' using errcode = 'check_violation';
    end if;
    v_modo := v_paso ->> 'modo';
    if v_modo is null or v_modo not in ('simple', 'cronometro', 'contador') then
      raise exception 'Modo de paso inválido: %.', coalesce(v_modo, 'null') using errcode = 'check_violation';
    end if;
    if v_modo = 'simple' then
      if v_paso ? 'objetivo_valor' and jsonb_typeof(v_paso -> 'objetivo_valor') <> 'null' then
        raise exception 'Un paso simple no lleva objetivo.' using errcode = 'check_violation';
      end if;
    else
      if jsonb_typeof(v_paso -> 'objetivo_valor') is distinct from 'number' then
        raise exception 'Un paso con cronómetro o contador necesita un objetivo numérico.' using errcode = 'check_violation';
      end if;
      v_objetivo := (v_paso ->> 'objetivo_valor')::numeric;
      if v_objetivo <= 0 or v_objetivo > 9999 then
        raise exception 'El objetivo debe estar entre 0 y 9999.' using errcode = 'check_violation';
      end if;
      if v_modo = 'cronometro' then v_minutos := v_minutos + v_objetivo; end if;
    end if;
    if v_paso ? 'unidad' and jsonb_typeof(v_paso -> 'unidad') not in ('null', 'string') then
      raise exception 'La unidad debe ser texto.' using errcode = 'check_violation';
    end if;
  end loop;

  update public.plantillas_rutinas
  set num_pasos = jsonb_array_length(new.pasos), duracion_min = round(v_minutos)::integer
  where id = new.plantilla_id;
  return new;
end;
$$;

create trigger plantillas_rutinas_contenido_validar before insert or update on public.plantillas_rutinas_contenido
  for each row execute function public.plantillas_rutinas_validar_contenido();

-- ─── Compras ────────────────────────────────────────────────────────────
create table public.plantillas_rutinas_compradas (
  usuario_id uuid not null references auth.users(id) on delete cascade,
  plantilla_id text not null references public.plantillas_rutinas(id) on delete restrict,
  precio_pagado integer not null check (precio_pagado > 0),
  comprada_en timestamptz not null default now(),
  primary key (usuario_id, plantilla_id)
);

-- ─── Seguridad ──────────────────────────────────────────────────────────
-- Supabase concede por defecto todo a anon/authenticated sobre tablas nuevas
-- de public: se revoca y se concede solo lectura. Escribir catálogo y
-- contenido es cosa de service_role; escribir compras, solo del RPC.
alter table public.plantillas_rutinas enable row level security;
alter table public.plantillas_rutinas_contenido enable row level security;
alter table public.plantillas_rutinas_compradas enable row level security;

revoke all on public.plantillas_rutinas, public.plantillas_rutinas_contenido, public.plantillas_rutinas_compradas from anon, authenticated;
grant select on public.plantillas_rutinas, public.plantillas_rutinas_contenido, public.plantillas_rutinas_compradas to authenticated;
grant all on public.plantillas_rutinas, public.plantillas_rutinas_contenido, public.plantillas_rutinas_compradas to service_role;

create policy plantillas_rutinas_ver on public.plantillas_rutinas
  for select to authenticated
  using (
    activa
    or exists (select 1 from public.plantillas_rutinas_compradas c where c.plantilla_id = plantillas_rutinas.id and c.usuario_id = auth.uid())
  );

create policy plantillas_rutinas_contenido_ver on public.plantillas_rutinas_contenido
  for select to authenticated
  using (
    exists (
      select 1 from public.plantillas_rutinas p
      where p.id = plantilla_id
        and (
          (p.activa and p.precio_gemas = 0)
          or exists (select 1 from public.plantillas_rutinas_compradas c where c.plantilla_id = p.id and c.usuario_id = auth.uid())
        )
    )
  );

create policy plantillas_rutinas_compradas_propias on public.plantillas_rutinas_compradas
  for select to authenticated using (usuario_id = auth.uid());

-- ─── Ledger: motivo nuevo ───────────────────────────────────────────────
alter table comercio.movimientos_gemas drop constraint movimientos_gemas_motivo_check;
alter table comercio.movimientos_gemas add constraint movimientos_gemas_motivo_check
  check (motivo = any (array[
    'compra_iap', 'gasto_tienda', 'ajuste_soporte', 'recompensa_nivel', 'gasto_semillas',
    'referido_nivel2', 'trial_horizon_bono', 'cofre_intermedio', 'cofre_final',
    'tarea_diaria', 'racha_tarea', 'cofre_final_tarea', 'gasto_plantilla_rutina'
  ]));

-- ─── Comprar ────────────────────────────────────────────────────────────
-- Misma mecánica que comercio.comprar_semillas_arbol: la lógica privilegiada
-- vive en comercio (no expuesto) y public tiene un wrapper invoker. Se bloquea
-- primero la billetera: dos llamadas simultáneas se serializan y la segunda ve
-- la compra de la primera, así nunca se cobra dos veces.
create or replace function comercio.comprar_plantilla_rutina(p_plantilla_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_persona_id uuid := auth.uid();
  v_precio integer;
  v_saldo integer;
begin
  if v_persona_id is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  select precio_gemas into v_precio from public.plantillas_rutinas where id = p_plantilla_id and activa;
  if not found then
    raise exception 'Plantilla no disponible.' using errcode = '22023';
  end if;

  insert into comercio.billeteras_gemas (persona_id, saldo) values (v_persona_id, 0)
  on conflict (persona_id) do nothing;
  select saldo into v_saldo from comercio.billeteras_gemas where persona_id = v_persona_id for update;

  if v_precio = 0 or exists (
    select 1 from public.plantillas_rutinas_compradas where usuario_id = v_persona_id and plantilla_id = p_plantilla_id
  ) then
    return jsonb_build_object('plantilla_id', p_plantilla_id, 'ya_desbloqueada', true, 'saldo_restante', v_saldo);
  end if;

  if v_saldo < v_precio then
    raise exception 'No tienes gemas suficientes.' using errcode = 'check_violation';
  end if;

  update comercio.billeteras_gemas set saldo = saldo - v_precio, actualizado_en = now() where persona_id = v_persona_id;
  insert into comercio.movimientos_gemas (persona_id, cantidad, motivo, referencia)
  values (v_persona_id, -v_precio, 'gasto_plantilla_rutina', 'plantilla-rutina:' || p_plantilla_id);
  insert into public.plantillas_rutinas_compradas (usuario_id, plantilla_id, precio_pagado)
  values (v_persona_id, p_plantilla_id, v_precio);

  return jsonb_build_object('plantilla_id', p_plantilla_id, 'ya_desbloqueada', false, 'saldo_restante', v_saldo - v_precio);
end;
$$;

create or replace function public.comprar_plantilla_rutina(p_plantilla_id text)
returns jsonb language sql security invoker set search_path = ''
as $$ select comercio.comprar_plantilla_rutina(p_plantilla_id); $$;

-- ─── Listar ─────────────────────────────────────────────────────────────
-- Una sola llamada: catálogo con estado de desbloqueo. Los pasos solo viajan
-- si la plantilla es gratis o ya es de la persona (RLS ya lo garantiza; el
-- case lo repite a propósito para que nunca dependa de una sola capa).
create or replace function public.obtener_plantillas_rutinas()
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_resultado jsonb;
begin
  if auth.uid() is null then raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege'; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', p.id,
    'titulo', p.titulo,
    'descripcion', p.descripcion,
    'franja', p.franja,
    'icono_id', p.icono_id,
    'autor', p.autor,
    'precio_gemas', p.precio_gemas,
    'num_pasos', p.num_pasos,
    'duracion_min', p.duracion_min,
    'desbloqueada', (p.precio_gemas = 0 or c.plantilla_id is not null),
    'pasos', case when p.precio_gemas = 0 or c.plantilla_id is not null then ct.pasos end
  ) order by p.orden, p.created_at), '[]'::jsonb)
  into v_resultado
  from public.plantillas_rutinas p
  left join public.plantillas_rutinas_compradas c on c.plantilla_id = p.id and c.usuario_id = auth.uid()
  left join public.plantillas_rutinas_contenido ct on ct.plantilla_id = p.id;

  return v_resultado;
end;
$$;

revoke all on function public.comprar_plantilla_rutina(text) from public, anon;
revoke all on function public.obtener_plantillas_rutinas() from public, anon;
revoke all on function comercio.comprar_plantilla_rutina(text) from public, anon;
grant execute on function public.comprar_plantilla_rutina(text) to authenticated;
grant execute on function public.obtener_plantillas_rutinas() to authenticated;
grant execute on function comercio.comprar_plantilla_rutina(text) to authenticated;

-- ─── Plantillas gratuitas iniciales (antes vivían en el código de la app) ──
insert into public.plantillas_rutinas (id, titulo, descripcion, franja, icono_id, precio_gemas, orden) values
  ('manana-con-energia', 'Mañana con energía', 'Arrancar el día sin prisa', 'manana', 'sol', 0, 10),
  ('sesion-de-estudio', 'Sesión de estudio', '45 minutos con foco', 'tarde', 'estudiar', 0, 20),
  ('cierre-del-dia', 'Cierre del día', 'Bajar el ritmo y dejar todo listo', 'noche', 'cama', 0, 30),
  ('rutina-de-ejercicio', 'Rutina de ejercicio', 'Calentar, entrenar y estirar', 'cualquier_momento', 'hacer-ejercicio', 0, 40);

insert into public.plantillas_rutinas_contenido (plantilla_id, pasos) values
  ('manana-con-energia', '[
    {"titulo": "Tomar un vaso de agua", "modo": "simple"},
    {"titulo": "Estirar el cuerpo", "modo": "cronometro", "objetivo_valor": 5, "unidad": "min"},
    {"titulo": "Planear mi día", "modo": "cronometro", "objetivo_valor": 5, "unidad": "min"}
  ]'::jsonb),
  ('sesion-de-estudio', '[
    {"titulo": "Repasar apuntes", "modo": "cronometro", "objetivo_valor": 10, "unidad": "min"},
    {"titulo": "Resolver ejercicios", "modo": "contador", "objetivo_valor": 20, "unidad": "ejercicios"},
    {"titulo": "Repasar errores", "modo": "cronometro", "objetivo_valor": 10, "unidad": "min"},
    {"titulo": "Descanso", "modo": "cronometro", "objetivo_valor": 5, "unidad": "min"}
  ]'::jsonb),
  ('cierre-del-dia', '[
    {"titulo": "Preparar lo de mañana", "modo": "simple"},
    {"titulo": "Leer un rato", "modo": "cronometro", "objetivo_valor": 15, "unidad": "min"},
    {"titulo": "Apagar pantallas", "modo": "simple"}
  ]'::jsonb),
  ('rutina-de-ejercicio', '[
    {"titulo": "Calentar", "modo": "cronometro", "objetivo_valor": 5, "unidad": "min"},
    {"titulo": "Entrenar", "modo": "cronometro", "objetivo_valor": 25, "unidad": "min"},
    {"titulo": "Estirar", "modo": "cronometro", "objetivo_valor": 5, "unidad": "min"}
  ]'::jsonb);

commit;
