-- Cierra el hueco que hacía explotable la recompensa de gemas por nivel
-- (migración 14): hasta ahora `authenticated` tenía INSERT/UPDATE/DELETE de
-- tabla completa sobre `habitos_planes` y `habitos_registros`, así que
-- cualquiera con acceso REST crudo podía insertar una fila de plan con
-- `nivel = 7` (o registros históricos falsos que disparen el cálculo de
-- racha) y reclamar la recompensa sin haber subido de nivel de verdad —
-- repetible sin límite creando hábitos nuevos.
--
-- `public` no debe tener funciones security definer nuevas (ver
-- supabase/public-schema.md), así que la lógica real de las cuatro funciones
-- que escriben en esas tablas se muda a `privacidad` (que ya aloja lógica de
-- privilegio elevado sobre estas mismas tablas: `reclamar_recordatorios_habitos`
-- lee/escribe habitos_planes/habitos_items desde ahí). Los wrappers en
-- `public` quedan como `security invoker`, igual que el resto de la app.
--
-- Las cuatro funciones ya filtraban todo por `auth.uid()` internamente — no
-- dependían de RLS para acotar el alcance — así que moverlas y pasarlas a
-- `security definer` no cambia su comportamiento en nada. El cliente nunca
-- escribía estas tablas por fuera de RPCs (verificado: solo hace
-- `.select(...)` en habitos.servicio.ts), así que esto no rompe la app actual.

begin;

create or replace function privacidad.crear_habito(
  p_titulo text, p_descripcion text, p_icono_lucide text, p_color text, p_tipo_meta text, p_unidad text,
  p_frecuencia text, p_dias_semana smallint[] default null, p_veces_por_semana smallint default null,
  p_objetivo_valor numeric default 1, p_desde_fecha date default current_date
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_item public.habitos_items;
declare v_plan public.habitos_planes;
begin
  if auth.uid() is null then raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege'; end if;
  insert into public.habitos_items (usuario_id, titulo, descripcion, icono_lucide, color, tipo_meta, unidad)
  values (auth.uid(), p_titulo, p_descripcion, p_icono_lucide, p_color, p_tipo_meta, nullif(trim(p_unidad), ''))
  returning * into v_item;
  insert into public.habitos_planes (habito_id, frecuencia, dias_semana, veces_por_semana, objetivo_valor, desde_fecha)
  values (v_item.id, p_frecuencia, p_dias_semana, p_veces_por_semana, p_objetivo_valor, p_desde_fecha)
  returning * into v_plan;
  return jsonb_build_object('id', v_item.id, 'plan_id', v_plan.id);
end;
$$;

create or replace function privacidad.crear_habito_premium(
  p_titulo text, p_descripcion text, p_icono_lucide text, p_color text, p_tipo_meta text, p_unidad text,
  p_categoria text, p_dificultad text, p_disparador text, p_recompensa text,
  p_frecuencia text, p_dias_semana smallint[] default null, p_veces_por_semana smallint default null,
  p_objetivo_valor numeric default 1, p_recordatorio_activo boolean default false,
  p_hora_recordatorio time without time zone default null, p_mostrar_nombre_notificacion boolean default false,
  p_desde_fecha date default current_date
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_item public.habitos_items; declare v_plan public.habitos_planes;
begin
  if auth.uid() is null then raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege'; end if;
  if p_recordatorio_activo and p_hora_recordatorio is null then raise exception 'El recordatorio necesita una hora.' using errcode = 'check_violation'; end if;
  insert into public.habitos_items (usuario_id,titulo,descripcion,icono_lucide,color,tipo_meta,unidad,categoria,dificultad,disparador,recompensa)
  values (auth.uid(),p_titulo,nullif(trim(p_descripcion),''),p_icono_lucide,p_color,p_tipo_meta,nullif(trim(p_unidad),''),nullif(trim(p_categoria),''),coalesce(p_dificultad,'estandar'),nullif(trim(p_disparador),''),nullif(trim(p_recompensa),''))
  returning * into v_item;
  insert into public.habitos_planes (habito_id,frecuencia,dias_semana,veces_por_semana,objetivo_valor,desde_fecha,recordatorio_activo,hora_recordatorio,mostrar_nombre_notificacion)
  values (v_item.id,p_frecuencia,p_dias_semana,p_veces_por_semana,p_objetivo_valor,p_desde_fecha,p_recordatorio_activo,p_hora_recordatorio,p_mostrar_nombre_notificacion)
  returning * into v_plan;
  return jsonb_build_object('id',v_item.id,'plan_id',v_plan.id);
end;
$$;

create or replace function privacidad.actualizar_plan_habito(
  p_habito_id uuid, p_frecuencia text, p_dias_semana smallint[], p_veces_por_semana smallint,
  p_objetivo_valor numeric, p_desde_fecha date
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_plan public.habitos_planes;
begin
  if not exists (select 1 from public.habitos_items where id = p_habito_id and usuario_id = auth.uid()) then
    raise exception 'Hábito no encontrado.' using errcode = 'no_data_found';
  end if;
  update public.habitos_planes set hasta_fecha = p_desde_fecha
  where habito_id = p_habito_id and hasta_fecha is null;
  insert into public.habitos_planes (habito_id, frecuencia, dias_semana, veces_por_semana, objetivo_valor, desde_fecha)
  values (p_habito_id, p_frecuencia, p_dias_semana, p_veces_por_semana, p_objetivo_valor, p_desde_fecha)
  returning * into v_plan;
  return jsonb_build_object('id', v_plan.id, 'habito_id', v_plan.habito_id);
end;
$$;

-- Mismo cuerpo que public.registrar_progreso_habito (migración 14), movido
-- aquí como security definer.
create or replace function privacidad.registrar_progreso_habito(p_habito_id uuid, p_fecha_local date, p_valor numeric, p_nota text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_fecha_actual date;
declare v_registro public.habitos_registros;
declare v_tipo_meta text;
declare v_plan_vigente public.habitos_planes;
declare v_prog_1 integer;
declare v_comp_1 integer;
declare v_prog_2 integer;
declare v_comp_2 integer;
declare v_nuevo_objetivo numeric;
declare v_mensaje_nivel text;
declare v_siguiente_generado public.habitos_niveles_plan;
declare v_subio_nivel boolean := false;
declare v_nivel_actual integer;
declare v_gemas_ganadas integer := 0;
begin
  if auth.uid() is null then raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege'; end if;
  select (now() at time zone perfil.zona_horaria)::date into v_fecha_actual
  from public.perfiles_usuario perfil where perfil.id = auth.uid();
  if p_fecha_local > coalesce(v_fecha_actual, current_date) then
    raise exception 'No puedes registrar progreso en una fecha futura.' using errcode = 'check_violation';
  end if;

  select item.tipo_meta into v_tipo_meta
  from public.habitos_items item where item.id = p_habito_id and item.usuario_id = auth.uid();
  if v_tipo_meta is null then
    raise exception 'Hábito no encontrado.' using errcode = 'no_data_found';
  end if;

  insert into public.habitos_registros (habito_id, usuario_id, fecha_local, valor, nota)
  values (p_habito_id, auth.uid(), p_fecha_local, p_valor, p_nota)
  on conflict (habito_id, fecha_local) do update
  set valor = excluded.valor, nota = excluded.nota, registrado_at = now(), updated_at = now()
  returning * into v_registro;

  select plan.* into v_plan_vigente
  from public.habitos_planes plan
  where plan.habito_id = p_habito_id
    and plan.desde_fecha <= v_fecha_actual
    and (plan.hasta_fecha is null or plan.hasta_fecha > v_fecha_actual)
  order by plan.desde_fecha desc
  limit 1;

  v_nivel_actual := coalesce(v_plan_vigente.nivel, 1);

  if v_plan_vigente.id is not null and v_plan_vigente.desde_fecha <= v_fecha_actual - 13 then
    with dias as (
      select gs::date as fecha
      from generate_series(v_fecha_actual - 13, v_fecha_actual, interval '1 day') gs
    ),
    evaluado as (
      select
        dias.fecha,
        case when dias.fecha <= v_fecha_actual - 7 then 1 else 2 end as ventana,
        public.habitos_es_dia_programado(v_plan_vigente, dias.fecha) as programado,
        coalesce(registro.valor, 0) >= v_plan_vigente.objetivo_valor as completado
      from dias
      left join public.habitos_registros registro
        on registro.habito_id = p_habito_id and registro.fecha_local = dias.fecha
    )
    select
      count(*) filter (where ventana = 1 and programado),
      count(*) filter (where ventana = 1 and programado and completado),
      count(*) filter (where ventana = 2 and programado),
      count(*) filter (where ventana = 2 and programado and completado)
    into v_prog_1, v_comp_1, v_prog_2, v_comp_2
    from evaluado;

    if v_prog_1 >= 3 and v_prog_2 >= 3
       and v_comp_1::numeric / v_prog_1 >= 0.8
       and v_comp_2::numeric / v_prog_2 >= 0.8
    then
      select * into v_siguiente_generado
      from public.habitos_niveles_plan
      where habito_id = p_habito_id and nivel = v_plan_vigente.nivel + 1;

      if v_siguiente_generado.id is not null then
        v_nuevo_objetivo := v_siguiente_generado.objetivo_valor;
        v_mensaje_nivel := coalesce(v_siguiente_generado.mensaje, '¡Subiste al nivel ' || (v_plan_vigente.nivel + 1) || '!');
      else
        v_nuevo_objetivo := case
          when v_tipo_meta = 'check' then v_plan_vigente.objetivo_valor
          else round(v_plan_vigente.objetivo_valor * 1.15, 2)
        end;
        v_mensaje_nivel := '¡Subiste al nivel ' || (v_plan_vigente.nivel + 1) || '!';
      end if;

      update public.habitos_planes set hasta_fecha = v_fecha_actual + 1 where id = v_plan_vigente.id;

      insert into public.habitos_planes (
        habito_id, frecuencia, dias_semana, veces_por_semana, objetivo_valor, desde_fecha, nivel, origen, mensaje_nivel
      ) values (
        p_habito_id, v_plan_vigente.frecuencia, v_plan_vigente.dias_semana, v_plan_vigente.veces_por_semana,
        v_nuevo_objetivo, v_fecha_actual + 1, v_plan_vigente.nivel + 1, 'subida_nivel', v_mensaje_nivel
      );

      v_subio_nivel := true;
      v_nivel_actual := v_plan_vigente.nivel + 1;
      v_gemas_ganadas := comercio.acreditar_recompensa_nivel_habito(p_habito_id, v_nivel_actual);
    end if;
  end if;

  return jsonb_build_object(
    'id', v_registro.id, 'habito_id', v_registro.habito_id, 'fecha_local', v_registro.fecha_local,
    'valor', v_registro.valor, 'nota', v_registro.nota,
    'subio_nivel', v_subio_nivel, 'nivel', v_nivel_actual, 'gemas_ganadas', v_gemas_ganadas
  );
end;
$$;

revoke all on function privacidad.crear_habito(text,text,text,text,text,text,text,smallint[],smallint,numeric,date) from public, anon;
revoke all on function privacidad.crear_habito_premium(text,text,text,text,text,text,text,text,text,text,text,smallint[],smallint,numeric,boolean,time,boolean,date) from public, anon;
revoke all on function privacidad.actualizar_plan_habito(uuid,text,smallint[],smallint,numeric,date) from public, anon;
revoke all on function privacidad.registrar_progreso_habito(uuid,date,numeric,text) from public, anon;
grant execute on function privacidad.crear_habito(text,text,text,text,text,text,text,smallint[],smallint,numeric,date) to authenticated, service_role;
grant execute on function privacidad.crear_habito_premium(text,text,text,text,text,text,text,text,text,text,text,smallint[],smallint,numeric,boolean,time,boolean,date) to authenticated, service_role;
grant execute on function privacidad.actualizar_plan_habito(uuid,text,smallint[],smallint,numeric,date) to authenticated, service_role;
grant execute on function privacidad.registrar_progreso_habito(uuid,date,numeric,text) to authenticated, service_role;

do $$
begin
  if exists (
    select 1
    from pg_catalog.pg_proc as routine
    join pg_catalog.pg_roles as owner on owner.oid = routine.proowner
    where routine.oid in (
      'privacidad.crear_habito(text,text,text,text,text,text,text,smallint[],smallint,numeric,date)'::regprocedure,
      'privacidad.crear_habito_premium(text,text,text,text,text,text,text,text,text,text,text,smallint[],smallint,numeric,boolean,time,boolean,date)'::regprocedure,
      'privacidad.actualizar_plan_habito(uuid,text,smallint[],smallint,numeric,date)'::regprocedure,
      'privacidad.registrar_progreso_habito(uuid,date,numeric,text)'::regprocedure
    )
      and not owner.rolbypassrls
  ) then
    raise exception
      'habitos security definer functions require an owner with BYPASSRLS';
  end if;
end;
$$;

-- Los wrappers en public quedan invoker, como el resto de la Data API.
create or replace function public.crear_habito(
  p_titulo text, p_descripcion text, p_icono_lucide text, p_color text, p_tipo_meta text, p_unidad text,
  p_frecuencia text, p_dias_semana smallint[] default null, p_veces_por_semana smallint default null,
  p_objetivo_valor numeric default 1, p_desde_fecha date default current_date
)
returns jsonb language sql security invoker set search_path = ''
as $$
  select privacidad.crear_habito(p_titulo, p_descripcion, p_icono_lucide, p_color, p_tipo_meta, p_unidad, p_frecuencia, p_dias_semana, p_veces_por_semana, p_objetivo_valor, p_desde_fecha);
$$;

create or replace function public.crear_habito_premium(
  p_titulo text, p_descripcion text, p_icono_lucide text, p_color text, p_tipo_meta text, p_unidad text,
  p_categoria text, p_dificultad text, p_disparador text, p_recompensa text,
  p_frecuencia text, p_dias_semana smallint[] default null, p_veces_por_semana smallint default null,
  p_objetivo_valor numeric default 1, p_recordatorio_activo boolean default false,
  p_hora_recordatorio time without time zone default null, p_mostrar_nombre_notificacion boolean default false,
  p_desde_fecha date default current_date
)
returns jsonb language sql security invoker set search_path = ''
as $$
  select privacidad.crear_habito_premium(p_titulo, p_descripcion, p_icono_lucide, p_color, p_tipo_meta, p_unidad, p_categoria, p_dificultad, p_disparador, p_recompensa, p_frecuencia, p_dias_semana, p_veces_por_semana, p_objetivo_valor, p_recordatorio_activo, p_hora_recordatorio, p_mostrar_nombre_notificacion, p_desde_fecha);
$$;

create or replace function public.actualizar_plan_habito(
  p_habito_id uuid, p_frecuencia text, p_dias_semana smallint[], p_veces_por_semana smallint,
  p_objetivo_valor numeric, p_desde_fecha date
)
returns jsonb language sql security invoker set search_path = ''
as $$
  select privacidad.actualizar_plan_habito(p_habito_id, p_frecuencia, p_dias_semana, p_veces_por_semana, p_objetivo_valor, p_desde_fecha);
$$;

create or replace function public.registrar_progreso_habito(p_habito_id uuid, p_fecha_local date, p_valor numeric, p_nota text default null)
returns jsonb language sql security invoker set search_path = ''
as $$
  select privacidad.registrar_progreso_habito(p_habito_id, p_fecha_local, p_valor, p_nota);
$$;

revoke all on function public.crear_habito(text,text,text,text,text,text,text,smallint[],smallint,numeric,date) from public, anon;
revoke all on function public.crear_habito_premium(text,text,text,text,text,text,text,text,text,text,text,smallint[],smallint,numeric,boolean,time,boolean,date) from public, anon;
revoke all on function public.actualizar_plan_habito(uuid,text,smallint[],smallint,numeric,date) from public, anon;
revoke all on function public.registrar_progreso_habito(uuid,date,numeric,text) from public, anon;
grant execute on function public.crear_habito(text,text,text,text,text,text,text,smallint[],smallint,numeric,date) to authenticated, service_role;
grant execute on function public.crear_habito_premium(text,text,text,text,text,text,text,text,text,text,text,smallint[],smallint,numeric,boolean,time,boolean,date) to authenticated, service_role;
grant execute on function public.actualizar_plan_habito(uuid,text,smallint[],smallint,numeric,date) to authenticated, service_role;
grant execute on function public.registrar_progreso_habito(uuid,date,numeric,text) to authenticated, service_role;

revoke insert, update, delete on public.habitos_planes from authenticated;
revoke insert, update, delete on public.habitos_registros from authenticated;

-- Con registrar_progreso_habito ahora en privacidad (security definer), la
-- única llamadora de esta función es esa, desde dentro (postgres bypassa el
-- grant al ejecutar como dueño). Ya no hace falta que authenticated pueda
-- invocarla directo — cerrar esa vía también.
revoke execute on function comercio.acreditar_recompensa_nivel_habito(uuid, integer) from authenticated;

commit;
