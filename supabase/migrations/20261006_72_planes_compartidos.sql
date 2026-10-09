-- Migración 72: Fase 12 — Planes compartidos. El terreno ya estaba
-- preparado desde la Fase 11 (planes_instancias ya soporta N filas por plan,
-- y marcar_item_plan ya evalúa "sección completa" sobre TODAS las instancias
-- del plan, no una sola) — lo que falta es: código de invitación, la forma
-- de unirse, y abrir la lectura del contenido del plan a cualquier
-- participante (hoy solo el dueño puede leerlo).
--
-- Hallazgo de seguridad al revisar esto: la policy de planes_instancias
-- (`for all using/with check (usuario_id = auth.uid())`) deja insertar una
-- fila con CUALQUIER plan_id, no solo el propio. Hoy es inofensivo porque
-- planes_items/secciones/etc. solo se leen por dueño — pero en cuanto esta
-- migración abre esa lectura a "cualquiera con una instancia", esa policy
-- vieja se vuelve una forma de leer CUALQUIER plan sin invitación real. Se
-- cierra reemplazándola: el alta de la instancia propia (creador) sigue
-- permitida directo desde el cliente, pero unirse como participante nuevo
-- pasa SIEMPRE por unirse_a_plan() (valida el código ahí adentro).
begin;

alter table public.planes_items add column codigo_invitacion text unique;

-- ─── Lectura abierta a cualquier participante, escritura solo del dueño ───
drop policy planes_items_propios on public.planes_items;
create policy planes_items_select on public.planes_items
  for select using (
    usuario_id = auth.uid()
    or exists (select 1 from public.planes_instancias i where i.plan_id = planes_items.id and i.usuario_id = auth.uid())
  );
create policy planes_items_insert on public.planes_items
  for insert with check (usuario_id = auth.uid());
create policy planes_items_update on public.planes_items
  for update using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
create policy planes_items_delete on public.planes_items
  for delete using (usuario_id = auth.uid());

drop policy planes_secciones_de_planes_propios on public.planes_secciones;
create policy planes_secciones_select on public.planes_secciones
  for select using (
    exists (
      select 1 from public.planes_items p
      where p.id = plan_id and (
        p.usuario_id = auth.uid()
        or exists (select 1 from public.planes_instancias i where i.plan_id = p.id and i.usuario_id = auth.uid())
      )
    )
  );
create policy planes_secciones_write on public.planes_secciones
  for insert with check (exists (select 1 from public.planes_items p where p.id = plan_id and p.usuario_id = auth.uid()));
create policy planes_secciones_update on public.planes_secciones
  for update using (exists (select 1 from public.planes_items p where p.id = plan_id and p.usuario_id = auth.uid()))
  with check (exists (select 1 from public.planes_items p where p.id = plan_id and p.usuario_id = auth.uid()));
create policy planes_secciones_delete on public.planes_secciones
  for delete using (exists (select 1 from public.planes_items p where p.id = plan_id and p.usuario_id = auth.uid()));

drop policy planes_dias_de_planes_propios on public.planes_dias;
create policy planes_dias_select on public.planes_dias
  for select using (
    exists (
      select 1 from public.planes_secciones s join public.planes_items p on p.id = s.plan_id
      where s.id = seccion_id and (
        p.usuario_id = auth.uid()
        or exists (select 1 from public.planes_instancias i where i.plan_id = p.id and i.usuario_id = auth.uid())
      )
    )
  );
create policy planes_dias_write on public.planes_dias
  for insert with check (
    exists (select 1 from public.planes_secciones s join public.planes_items p on p.id = s.plan_id where s.id = seccion_id and p.usuario_id = auth.uid())
  );
create policy planes_dias_update on public.planes_dias
  for update using (
    exists (select 1 from public.planes_secciones s join public.planes_items p on p.id = s.plan_id where s.id = seccion_id and p.usuario_id = auth.uid())
  ) with check (
    exists (select 1 from public.planes_secciones s join public.planes_items p on p.id = s.plan_id where s.id = seccion_id and p.usuario_id = auth.uid())
  );
create policy planes_dias_delete on public.planes_dias
  for delete using (
    exists (select 1 from public.planes_secciones s join public.planes_items p on p.id = s.plan_id where s.id = seccion_id and p.usuario_id = auth.uid())
  );

drop policy planes_bloques_de_planes_propios on public.planes_bloques;
create policy planes_bloques_select on public.planes_bloques
  for select using (
    exists (
      select 1 from public.planes_dias d join public.planes_secciones s on s.id = d.seccion_id join public.planes_items p on p.id = s.plan_id
      where d.id = dia_id and (
        p.usuario_id = auth.uid()
        or exists (select 1 from public.planes_instancias i where i.plan_id = p.id and i.usuario_id = auth.uid())
      )
    )
  );
create policy planes_bloques_write on public.planes_bloques
  for insert with check (
    exists (select 1 from public.planes_dias d join public.planes_secciones s on s.id = d.seccion_id join public.planes_items p on p.id = s.plan_id where d.id = dia_id and p.usuario_id = auth.uid())
  );
create policy planes_bloques_update on public.planes_bloques
  for update using (
    exists (select 1 from public.planes_dias d join public.planes_secciones s on s.id = d.seccion_id join public.planes_items p on p.id = s.plan_id where d.id = dia_id and p.usuario_id = auth.uid())
  ) with check (
    exists (select 1 from public.planes_dias d join public.planes_secciones s on s.id = d.seccion_id join public.planes_items p on p.id = s.plan_id where d.id = dia_id and p.usuario_id = auth.uid())
  );
create policy planes_bloques_delete on public.planes_bloques
  for delete using (
    exists (select 1 from public.planes_dias d join public.planes_secciones s on s.id = d.seccion_id join public.planes_items p on p.id = s.plan_id where d.id = dia_id and p.usuario_id = auth.uid())
  );

drop policy planes_bloque_items_de_planes_propios on public.planes_bloque_items;
create policy planes_bloque_items_select on public.planes_bloque_items
  for select using (
    exists (
      select 1 from public.planes_bloques b join public.planes_dias d on d.id = b.dia_id join public.planes_secciones s on s.id = d.seccion_id join public.planes_items p on p.id = s.plan_id
      where b.id = bloque_id and (
        p.usuario_id = auth.uid()
        or exists (select 1 from public.planes_instancias i where i.plan_id = p.id and i.usuario_id = auth.uid())
      )
    )
  );
create policy planes_bloque_items_write on public.planes_bloque_items
  for insert with check (
    exists (select 1 from public.planes_bloques b join public.planes_dias d on d.id = b.dia_id join public.planes_secciones s on s.id = d.seccion_id join public.planes_items p on p.id = s.plan_id where b.id = bloque_id and p.usuario_id = auth.uid())
  );
create policy planes_bloque_items_update on public.planes_bloque_items
  for update using (
    exists (select 1 from public.planes_bloques b join public.planes_dias d on d.id = b.dia_id join public.planes_secciones s on s.id = d.seccion_id join public.planes_items p on p.id = s.plan_id where b.id = bloque_id and p.usuario_id = auth.uid())
  ) with check (
    exists (select 1 from public.planes_bloques b join public.planes_dias d on d.id = b.dia_id join public.planes_secciones s on s.id = d.seccion_id join public.planes_items p on p.id = s.plan_id where b.id = bloque_id and p.usuario_id = auth.uid())
  );
create policy planes_bloque_items_delete on public.planes_bloque_items
  for delete using (
    exists (select 1 from public.planes_bloques b join public.planes_dias d on d.id = b.dia_id join public.planes_secciones s on s.id = d.seccion_id join public.planes_items p on p.id = s.plan_id where b.id = bloque_id and p.usuario_id = auth.uid())
  );

-- ─── planes_instancias: cierra el hueco de seguridad descrito arriba ──────
drop policy planes_instancias_propias on public.planes_instancias;
create policy planes_instancias_select on public.planes_instancias
  for select using (usuario_id = auth.uid());
create policy planes_instancias_insert_propia on public.planes_instancias
  for insert with check (
    usuario_id = auth.uid()
    and es_creador = true
    and exists (select 1 from public.planes_items p where p.id = plan_id and p.usuario_id = auth.uid())
  );

-- ─── Progreso: cada participante ve el de TODOS los de su mismo plan,
-- pero solo escribe el suyo (ya lo hacía) ──────────────────────────────────
-- Una policy no puede simplemente "join" planes_instancias para mirar la
-- fila de OTRO participante — esa tabla tiene su propia RLS (a propósito,
-- ver nota de arriba) que bloquea ver filas ajenas, incluso desde DENTRO de
-- la subquery de otra policy. Se necesita una función security definer
-- (bypasea esa RLS igual que ya hace marcar_item_plan) para resolver "¿esta
-- instancia es del mismo plan que alguna de las mías?".
create or replace function privacidad.es_instancia_de_mi_plan(p_instancia_id uuid)
 returns boolean
 language sql
 stable
 security definer
 set search_path to ''
as $function$
  select exists (
    select 1 from public.planes_instancias mia
    join public.planes_instancias otra on otra.plan_id = mia.plan_id
    where mia.usuario_id = auth.uid() and otra.id = p_instancia_id
  );
$function$;

grant execute on function privacidad.es_instancia_de_mi_plan(uuid) to authenticated;

drop policy planes_instancia_progreso_de_instancias_propias on public.planes_instancia_progreso;
create policy planes_instancia_progreso_select on public.planes_instancia_progreso
  for select using (privacidad.es_instancia_de_mi_plan(instancia_id));
create policy planes_instancia_progreso_write on public.planes_instancia_progreso
  for insert with check (exists (select 1 from public.planes_instancias i where i.id = instancia_id and i.usuario_id = auth.uid()));
create policy planes_instancia_progreso_update on public.planes_instancia_progreso
  for update using (exists (select 1 from public.planes_instancias i where i.id = instancia_id and i.usuario_id = auth.uid()))
  with check (exists (select 1 from public.planes_instancias i where i.id = instancia_id and i.usuario_id = auth.uid()));
create policy planes_instancia_progreso_delete on public.planes_instancia_progreso
  for delete using (exists (select 1 from public.planes_instancias i where i.id = instancia_id and i.usuario_id = auth.uid()));

-- ─── RPCs ──────────────────────────────────────────────────────────────────
create or replace function privacidad.generar_codigo_invitacion_plan(p_plan_id uuid)
 returns text
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare v_plan_id uuid; declare v_codigo text;
begin
  if auth.uid() is null then raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege'; end if;

  select id, codigo_invitacion into v_plan_id, v_codigo from public.planes_items where id = p_plan_id and usuario_id = auth.uid();
  if v_plan_id is null then raise exception 'Plan no encontrado.' using errcode = 'no_data_found'; end if;

  if v_codigo is null then
    v_codigo := substr(md5(random()::text || clock_timestamp()::text), 1, 8);
    update public.planes_items set codigo_invitacion = v_codigo where id = p_plan_id;
  end if;

  return v_codigo;
end;
$function$;

create or replace function public.generar_codigo_invitacion_plan(p_plan_id uuid)
 returns text
 language sql
 set search_path to ''
as $function$ select privacidad.generar_codigo_invitacion_plan(p_plan_id); $function$;

grant execute on function public.generar_codigo_invitacion_plan(uuid) to authenticated;

create or replace function privacidad.unirse_a_plan(p_codigo text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare v_plan_id uuid; declare v_titulo text; declare v_dueno uuid;
begin
  if auth.uid() is null then raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege'; end if;

  select id, titulo, usuario_id into v_plan_id, v_titulo, v_dueno
  from public.planes_items
  where lower(codigo_invitacion) = lower(nullif(trim(p_codigo), ''));

  if v_plan_id is null then raise exception 'Código no válido.' using errcode = 'no_data_found'; end if;
  if v_dueno = auth.uid() then raise exception 'Ya eres parte de este plan.' using errcode = 'unique_violation'; end if;
  if exists (select 1 from public.planes_instancias where plan_id = v_plan_id and usuario_id = auth.uid()) then
    raise exception 'Ya eres parte de este plan.' using errcode = 'unique_violation';
  end if;

  insert into public.planes_instancias (plan_id, usuario_id, es_creador) values (v_plan_id, auth.uid(), false);

  return jsonb_build_object('planId', v_plan_id, 'titulo', v_titulo);
end;
$function$;

create or replace function public.unirse_a_plan(p_codigo text)
 returns jsonb
 language sql
 set search_path to ''
as $function$ select privacidad.unirse_a_plan(p_codigo); $function$;

grant execute on function public.unirse_a_plan(text) to authenticated;

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
      'completadas', (
        select count(*) from public.planes_instancia_progreso ip
        join public.planes_bloque_items bi on bi.id = ip.bloque_item_id
        join public.planes_bloques b on b.id = bi.bloque_id
        join public.planes_dias d on d.id = b.dia_id
        join public.planes_secciones s on s.id = d.seccion_id
        where s.plan_id = p_plan_id and ip.instancia_id = i.id and ip.hecho = true
      ),
      'total', (
        select count(*) from public.planes_bloque_items bi2
        join public.planes_bloques b2 on b2.id = bi2.bloque_id
        join public.planes_dias d2 on d2.id = b2.dia_id
        join public.planes_secciones s2 on s2.id = d2.seccion_id
        where s2.plan_id = p_plan_id
      )
    ) order by i.es_creador desc, i.created_at)
    from public.planes_instancias i
    left join public.perfiles_usuario pu on pu.id = i.usuario_id
    where i.plan_id = p_plan_id
  ), '[]'::jsonb);
end;
$function$;

create or replace function public.obtener_participantes_plan(p_plan_id uuid)
 returns jsonb
 language sql
 set search_path to ''
as $function$ select privacidad.obtener_participantes_plan(p_plan_id); $function$;

grant execute on function public.obtener_participantes_plan(uuid) to authenticated;

commit;

notify pgrst, 'reload schema';
