-- Migración 74: "Ramas" — dividir un plan en partes paralelas (ej. para un
-- plan de marketing: "Distribución" / "Creación"), una por persona, cada una
-- con su propio arco de 4 fases completo. La idea clave: el detalle de una
-- rama (días/bloques/ítems, con SU disponibilidad real) se genera recién
-- cuando alguien la reclama — nunca antes, porque hasta ese momento no se
-- sabe ni quién es esa persona ni cuánto tiempo tiene. Esto reusa casi todo
-- lo que ya existe (generación progresiva, propuesta→aceptar) en vez de
-- inventar un mecanismo nuevo.
--
-- Un plan SIN ramas sigue funcionando exactamente igual que hoy — rama_id
-- nullable en todos lados, cero impacto en planes existentes.
begin;

create table public.planes_ramas (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.planes_items(id) on delete cascade,
  nombre text not null check (char_length(trim(nombre)) between 1 and 120),
  resumen text,
  orden integer not null default 0,
  -- null = todavía sin reclamar. Quien la reclama fija esto Y su propia
  -- disponibilidad — recién ahí se genera el detalle real de esta rama.
  instancia_id uuid references public.planes_instancias(id) on delete set null,
  disponibilidad jsonb check (disponibilidad is null or jsonb_typeof(disponibilidad) = 'object'),
  created_at timestamptz not null default now()
);

-- Una persona reclama como máximo UNA rama (por plan — una instancia ya
-- pertenece a un solo plan de por sí).
create unique index planes_ramas_instancia_unica on public.planes_ramas (instancia_id) where instancia_id is not null;
create index planes_ramas_plan_id_idx on public.planes_ramas (plan_id, orden);

alter table public.planes_ramas enable row level security;

-- Solo lectura desde el cliente — toda escritura (crear ramas, reclamar una)
-- pasa por las Edge Functions (service_role), nunca un insert/update directo,
-- porque reclamar necesita validar atómicamente "¿sigue libre?" antes de
-- gastar una generación de Gemini.
create policy planes_ramas_select on public.planes_ramas
  for select using (
    exists (
      select 1 from public.planes_items p
      where p.id = plan_id and (
        p.usuario_id = auth.uid()
        or exists (select 1 from public.planes_instancias i where i.plan_id = p.id and i.usuario_id = auth.uid())
      )
    )
  );

grant select on public.planes_ramas to authenticated;
grant all on public.planes_ramas to service_role;

-- ─── planes_secciones ahora puede pertenecer a una rama ───────────────────
alter table public.planes_secciones add column rama_id uuid references public.planes_ramas(id) on delete cascade;
create index planes_secciones_rama_id_idx on public.planes_secciones (rama_id);

-- ─── planes_propuestas: nuevo tipo 'rama' ──────────────────────────────────
alter table public.planes_propuestas drop constraint planes_propuestas_check;
alter table public.planes_propuestas drop constraint planes_propuestas_tipo_check;
alter table public.planes_propuestas add column rama_id uuid references public.planes_ramas(id) on delete cascade;
alter table public.planes_propuestas add constraint planes_propuestas_tipo_check
  check (tipo in ('plan_inicial', 'seccion', 'rama'));
alter table public.planes_propuestas add constraint planes_propuestas_check
  check (
    (tipo = 'seccion' and seccion_id is not null and rama_id is null)
    or (tipo = 'rama' and rama_id is not null and seccion_id is null)
    or (tipo = 'plan_inicial' and seccion_id is null and rama_id is null)
  );

-- ─── obtener_participantes_plan: "total" tiene que ser el de SU rama, no
-- el de todo el plan, cuando el plan está dividido en ramas (si no, alguien
-- con una rama de 12 ítems se vería como "3 de 80"). Sin ramas, se comporta
-- exactamente igual que antes. ──────────────────────────────────────────────
create or replace function privacidad.obtener_participantes_plan(p_plan_id uuid)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare v_autorizado boolean;
begin
  if auth.uid() is null then raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege'; end if;

  select exists(select 1 from public.planes_instancias where plan_id = p_plan_id and usuario_id = auth.uid()) into v_autorizado;
  if not v_autorizado then raise exception 'No tenés acceso a este plan.' using errcode = 'insufficient_privilege'; end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'instanciaId', i.id,
      'usuarioId', i.usuario_id,
      'nombre', coalesce(pu.nombre_visible, 'Usuario'),
      'esCreador', i.es_creador,
      'ramaNombre', r.nombre,
      'completadas', (
        select count(*) from public.planes_instancia_progreso ip
        join public.planes_bloque_items bi on bi.id = ip.bloque_item_id
        join public.planes_bloques b on b.id = bi.bloque_id
        join public.planes_dias d on d.id = b.dia_id
        join public.planes_secciones s on s.id = d.seccion_id
        where s.plan_id = p_plan_id and ip.instancia_id = i.id and ip.hecho = true
          and (r.id is null or s.rama_id = r.id)
      ),
      'total', (
        select count(*) from public.planes_bloque_items bi2
        join public.planes_bloques b2 on b2.id = bi2.bloque_id
        join public.planes_dias d2 on d2.id = b2.dia_id
        join public.planes_secciones s2 on s2.id = d2.seccion_id
        where s2.plan_id = p_plan_id
          and (r.id is null or s2.rama_id = r.id)
      )
    ) order by i.es_creador desc, i.created_at)
    from public.planes_instancias i
    left join public.perfiles_usuario pu on pu.id = i.usuario_id
    left join public.planes_ramas r on r.instancia_id = i.id
    where i.plan_id = p_plan_id
  ), '[]'::jsonb);
end;
$function$;

commit;

notify pgrst, 'reload schema';
