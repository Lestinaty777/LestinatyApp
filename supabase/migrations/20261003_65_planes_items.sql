-- Migración 65: Fase 11.1 — esquema de "Planes", módulo nuevo y propio
-- (fuera de Tareas/Hábitos): Plan → Secciones → Días → Bloques (mañana/
-- tarde/noche) → Ítems. A diferencia de tareas_items, un ítem de plan NO es
-- una tarea real con tipo/frecuencia/recordatorio — es contenido simple
-- (texto + progreso), mismo espíritu que tareas_subitems.
--
-- Decisión de producto clave: el progreso vive siempre del lado de una
-- "instancia" (planes_instancias/planes_instancia_progreso), nunca en
-- planes_bloque_items directo — incluso en modo solo (Fase 11, un plan tiene
-- exactamente una instancia, la del creador). Esto evita reescribir el
-- esquema cuando se construya compartir (Fase 12, múltiples instancias por
-- plan): marcar_item_plan ya generaliza correctamente a N instancias desde
-- el día 1, así que esa función no se vuelve a tocar en la Fase 12.
--
-- Todas las tablas llevan el prefijo planes_ (incluida la raíz, planes_items
-- — mismo criterio que tareas_items/habitos_items: el prefijo identifica el
-- módulo completo, no solo las tablas "hijas").
begin;

create table public.planes_items (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  titulo text not null check (char_length(trim(titulo)) between 1 and 120),
  descripcion text,
  -- El pedido en lenguaje natural que se le dio a Aby, null si el plan es
  -- manual — se reusa como contexto para pedirle detalle a secciones futuras.
  objetivo_original text,
  modo text not null check (modo in ('manual', 'ia')),
  paquete_id text references public.arboles_paquetes(id),
  bloques_por_dia smallint not null default 3 check (bloques_por_dia between 1 and 3),
  -- Opcional — habilita calcularRitmoPlan() (¿vas a tiempo?) en el cliente;
  -- sin fecha, el plan avanza a ritmo propio sin ninguna lectura de "atraso".
  fecha_objetivo date,
  estado text not null default 'activo' check (estado in ('activo', 'completado', 'archivado')),
  orden integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completado_en timestamptz
);

create index planes_items_usuario_id_idx on public.planes_items (usuario_id, estado);

alter table public.planes_items enable row level security;

create policy planes_items_propios on public.planes_items
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

grant select, insert, update, delete on public.planes_items to authenticated;
grant all on public.planes_items to service_role;

create trigger planes_items_updated_at before update on public.planes_items
  for each row execute function public.set_updated_at();

-- ─── Secciones ──────────────────────────────────────────────────────────
-- Generación progresiva (Fase 11): al crear un plan con IA, la primera
-- llamada deja la sección 1 en 'detallada' (con sus días/bloques/ítems ya
-- armados) y el resto en 'solo_titulo' (solo titulo+resumen, sin contenido
-- todavía) — se detallan una por una a medida que se llega a ellas.
create table public.planes_secciones (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.planes_items(id) on delete cascade,
  orden integer not null default 0,
  titulo text not null check (char_length(trim(titulo)) between 1 and 120),
  resumen text,
  estado text not null default 'solo_titulo' check (estado in ('solo_titulo', 'detallada', 'completada')),
  -- Lo que el usuario le contó a Aby antes de detallar esta sección (cómo le
  -- fue en la anterior, qué quiere ajustar) — null si todavía no se detalló
  -- o si el plan es manual.
  contexto_usuario text,
  detallada_en timestamptz,
  created_at timestamptz not null default now()
);

create index planes_secciones_plan_id_idx on public.planes_secciones (plan_id, orden);

alter table public.planes_secciones enable row level security;

create policy planes_secciones_de_planes_propios on public.planes_secciones
  for all using (
    exists (select 1 from public.planes_items p where p.id = plan_id and p.usuario_id = auth.uid())
  ) with check (
    exists (select 1 from public.planes_items p where p.id = plan_id and p.usuario_id = auth.uid())
  );

grant select, insert, update, delete on public.planes_secciones to authenticated;
grant all on public.planes_secciones to service_role;

-- ─── Días ───────────────────────────────────────────────────────────────
-- Orden relativo dentro de su sección, no fecha de calendario — los planes
-- avanzan por progreso (ritmo propio), no por cronograma fijo (ver Fase 11
-- del plan: esto es lo que hace posible el desbloqueo mutuo de la Fase 12).
create table public.planes_dias (
  id uuid primary key default gen_random_uuid(),
  seccion_id uuid not null references public.planes_secciones(id) on delete cascade,
  orden integer not null default 0,
  titulo text,
  created_at timestamptz not null default now()
);

create index planes_dias_seccion_id_idx on public.planes_dias (seccion_id, orden);

alter table public.planes_dias enable row level security;

create policy planes_dias_de_planes_propios on public.planes_dias
  for all using (
    exists (
      select 1 from public.planes_secciones s
      join public.planes_items p on p.id = s.plan_id
      where s.id = seccion_id and p.usuario_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.planes_secciones s
      join public.planes_items p on p.id = s.plan_id
      where s.id = seccion_id and p.usuario_id = auth.uid()
    )
  );

grant select, insert, update, delete on public.planes_dias to authenticated;
grant all on public.planes_dias to service_role;

-- ─── Bloques (mañana/tarde/noche) ───────────────────────────────────────
create table public.planes_bloques (
  id uuid primary key default gen_random_uuid(),
  dia_id uuid not null references public.planes_dias(id) on delete cascade,
  momento text not null check (momento in ('manana', 'tarde', 'noche')),
  -- Cómo encarar los ítems de este bloque — generado por Aby o escrito a
  -- mano en modo manual, siempre breve.
  mensaje_contexto text,
  created_at timestamptz not null default now(),
  unique (dia_id, momento)
);

alter table public.planes_bloques enable row level security;

create policy planes_bloques_de_planes_propios on public.planes_bloques
  for all using (
    exists (
      select 1 from public.planes_dias d
      join public.planes_secciones s on s.id = d.seccion_id
      join public.planes_items p on p.id = s.plan_id
      where d.id = dia_id and p.usuario_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.planes_dias d
      join public.planes_secciones s on s.id = d.seccion_id
      join public.planes_items p on p.id = s.plan_id
      where d.id = dia_id and p.usuario_id = auth.uid()
    )
  );

grant select, insert, update, delete on public.planes_bloques to authenticated;
grant all on public.planes_bloques to service_role;

-- ─── Ítems de un bloque ─────────────────────────────────────────────────
-- Sin columna "hecho" acá a propósito — el progreso vive siempre en
-- planes_instancia_progreso (ver nota de cabecera).
create table public.planes_bloque_items (
  id uuid primary key default gen_random_uuid(),
  bloque_id uuid not null references public.planes_bloques(id) on delete cascade,
  titulo text not null check (char_length(trim(titulo)) between 1 and 160),
  orden integer not null default 0,
  created_at timestamptz not null default now()
);

create index planes_bloque_items_bloque_id_idx on public.planes_bloque_items (bloque_id, orden);

alter table public.planes_bloque_items enable row level security;

create policy planes_bloque_items_de_planes_propios on public.planes_bloque_items
  for all using (
    exists (
      select 1 from public.planes_bloques b
      join public.planes_dias d on d.id = b.dia_id
      join public.planes_secciones s on s.id = d.seccion_id
      join public.planes_items p on p.id = s.plan_id
      where b.id = bloque_id and p.usuario_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.planes_bloques b
      join public.planes_dias d on d.id = b.dia_id
      join public.planes_secciones s on s.id = d.seccion_id
      join public.planes_items p on p.id = s.plan_id
      where b.id = bloque_id and p.usuario_id = auth.uid()
    )
  );

grant select, insert, update, delete on public.planes_bloque_items to authenticated;
grant all on public.planes_bloque_items to service_role;

-- ─── Instancias (preparado desde ya para compartir, Fase 12) ───────────
-- En Fase 11 cada plan tiene exactamente una instancia (la del creador),
-- creada junto con el plan. Fase 12 agrega una fila más por cada persona que
-- se suma con el código de invitación — marcar_item_plan ya generaliza a N
-- instancias desde ahora, no hace falta tocarla después.
create table public.planes_instancias (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.planes_items(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  es_creador boolean not null default false,
  created_at timestamptz not null default now(),
  unique (plan_id, usuario_id)
);

create index planes_instancias_plan_id_idx on public.planes_instancias (plan_id);
create index planes_instancias_usuario_id_idx on public.planes_instancias (usuario_id);

alter table public.planes_instancias enable row level security;

-- Alcance de la Fase 11: cada quien ve/gestiona solo SU PROPIA instancia.
-- Fase 12 va a necesitar que las instancias de un mismo plan compartido sean
-- visibles entre sí (para ver el progreso del compañero) — eso se resuelve
-- con una RPC de lectura agregada, no ensanchando esta policy a "cualquiera
-- del mismo plan", para no exponer filas crudas de otros usuarios por RLS.
create policy planes_instancias_propias on public.planes_instancias
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

grant select, insert, update, delete on public.planes_instancias to authenticated;
grant all on public.planes_instancias to service_role;

-- ─── Progreso por instancia ─────────────────────────────────────────────
create table public.planes_instancia_progreso (
  id uuid primary key default gen_random_uuid(),
  instancia_id uuid not null references public.planes_instancias(id) on delete cascade,
  bloque_item_id uuid not null references public.planes_bloque_items(id) on delete cascade,
  hecho boolean not null default false,
  hecho_en timestamptz,
  unique (instancia_id, bloque_item_id)
);

create index planes_instancia_progreso_instancia_id_idx on public.planes_instancia_progreso (instancia_id);

alter table public.planes_instancia_progreso enable row level security;

create policy planes_instancia_progreso_de_instancias_propias on public.planes_instancia_progreso
  for all using (
    exists (select 1 from public.planes_instancias i where i.id = instancia_id and i.usuario_id = auth.uid())
  ) with check (
    exists (select 1 from public.planes_instancias i where i.id = instancia_id and i.usuario_id = auth.uid())
  );

grant select, insert, update, delete on public.planes_instancia_progreso to authenticated;
grant all on public.planes_instancia_progreso to service_role;

-- ─── Semillas compartidas: un plan también puede "vestirse" con una semilla,
-- igual que un hábito o una tarea — nunca dos destinos a la vez.
alter table public.usuario_semillas add column plan_id uuid references public.planes_items(id) on delete set null;

alter table public.usuario_semillas drop constraint usuario_semillas_un_solo_destino;
alter table public.usuario_semillas add constraint usuario_semillas_un_solo_destino
  check (num_nonnulls(habito_id, tarea_id, plan_id) <= 1);

commit;

notify pgrst, 'reload schema';
