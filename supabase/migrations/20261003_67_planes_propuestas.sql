-- Migración 67: Fase 11.2 — soporte de esquema para las Edge Functions de
-- Aby aplicadas a Planes (generar-plan-inicial, detallar-seccion-plan,
-- aceptar-propuesta-plan). Mismo patrón que aby_propuestas/aby_generation_locks
-- (migración 20260905_06): el cliente nunca escribe estas tablas directo,
-- solo las Edge Functions (service_role) — 'authenticated' solo puede LEER
-- planes_propuestas (para ver su propia propuesta mientras la revisa).
--
-- planes_generaciones_uso es nueva (no tiene equivalente en el flujo de
-- estudio, que no tenía tope mensual) — acá sí hace falta: cada llamada real
-- a Gemini tiene costo, y a diferencia del sendero de estudio (uso ocasional
-- esperado) Planes se pensó desde el pedido del usuario para sostener un
-- cargo de suscripción, así que necesita un tope para no exponer el costo
-- de la API a abuso.
begin;

create table public.planes_propuestas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('plan_inicial', 'seccion')),
  -- Solo en 'seccion': qué sección (ya existente, en estado 'solo_titulo')
  -- se está pidiendo detallar. 'plan_inicial' no tiene plan_id propio porque
  -- el plan todavía no existe hasta aceptar la propuesta — no hace falta una
  -- columna aparte para ese caso, nada la usaría.
  seccion_id uuid references public.planes_secciones(id) on delete cascade,
  -- El pedido en lenguaje natural (plan_inicial) o el contexto que el
  -- usuario dio antes de detallar (seccion) — se guarda acá para que
  -- aceptar-propuesta-plan no dependa de que el cliente lo reenvíe.
  objetivo text not null check (char_length(trim(objetivo)) between 1 and 1000),
  bloques_por_dia smallint check (bloques_por_dia between 1 and 3),
  estado text not null default 'generando' check (estado in ('generando', 'lista', 'aceptada', 'rechazada', 'fallida', 'expirada')),
  propuesta jsonb,
  modelo text,
  error_codigo text,
  expira_at timestamptz not null default (now() + interval '24 hours'),
  aceptada_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((tipo = 'seccion') = (seccion_id is not null)),
  check ((estado = 'aceptada') = (aceptada_at is not null)),
  check (propuesta is null or jsonb_typeof(propuesta) = 'object')
);

create index planes_propuestas_usuario_estado_idx on public.planes_propuestas (usuario_id, estado, created_at desc);

alter table public.planes_propuestas enable row level security;

create policy planes_propuestas_usuario_propio on public.planes_propuestas
  for select using (usuario_id = auth.uid());

grant select on public.planes_propuestas to authenticated;
grant all on public.planes_propuestas to service_role;

create trigger planes_propuestas_updated_at before update on public.planes_propuestas
  for each row execute function public.set_updated_at();

-- ─── Tope mensual de generaciones (protege el costo real de Gemini) ──────
create table public.planes_generaciones_uso (
  usuario_id uuid not null references auth.users(id) on delete cascade,
  mes date not null,
  cantidad integer not null default 0 check (cantidad >= 0),
  actualizado_en timestamptz not null default now(),
  primary key (usuario_id, mes)
);

alter table public.planes_generaciones_uso enable row level security;
-- Sin policy para 'authenticated' (ni siquiera lectura) — es contador
-- interno de las Edge Functions, no algo que el cliente necesite leer en
-- esta fase (si más adelante se quiere mostrar "N de 20 este mes" en la UI,
-- se agrega una policy de solo lectura entonces).
grant all on public.planes_generaciones_uso to service_role;

commit;

notify pgrst, 'reload schema';
