-- Unifica "tono" y "paquete": en vez de mantener un tono_visual (1-7, solo
-- verde) por un lado y paquetes premium por otro, TODO hábito tiene un
-- paquete_id que apunta a un catálogo único. Los 7 tonos verdes actuales se
-- modelan como 7 paquetes gratuitos ('verde-1'..'verde-7') — mismos colores
-- exactos que ya calculaba tonoVerdeNivel() en iconosHabitos.ts. Los paquetes
-- premium (Albedo, Strelizia...) se agregan después como filas nuevas, sin
-- tocar esta migración.

begin;

create table public.arboles_paquetes (
  id text primary key check (id ~ '^[a-z0-9_-]+$'),
  nombre text not null,
  master_pack_color text not null check (master_pack_color ~ '^#[0-9a-fA-F]{6}$'),
  rareza text check (rareza in ('legendario', 'unico')),
  es_gratuito boolean not null default false,
  precio_gemas integer check (precio_gemas > 0),
  cantidad_por_compra integer check (cantidad_por_compra > 0),
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  check (
    (es_gratuito and rareza is null and precio_gemas is null and cantidad_por_compra is null)
    or
    (not es_gratuito and rareza is not null and precio_gemas is not null and cantidad_por_compra is not null)
  )
);

comment on table public.arboles_paquetes is 'Catálogo de paquetes de árbol — identidad visual completa de un hábito (antes solo tono_visual, 1-7 verde). Los gratuitos (verde-1..7) siempre están disponibles; los demás se compran con gemas en la tienda.';

alter table public.arboles_paquetes enable row level security;
create policy "arboles_paquetes_lectura_activos" on public.arboles_paquetes for select to authenticated using (activo);
grant select on public.arboles_paquetes to authenticated;

insert into public.arboles_paquetes (id, nombre, master_pack_color, es_gratuito) values
  ('verde-1', 'Verde 1', '#22c55e', true),
  ('verde-2', 'Verde 2', '#20bb59', true),
  ('verde-3', 'Verde 3', '#1fb155', true),
  ('verde-4', 'Verde 4', '#1da750', true),
  ('verde-5', 'Verde 5', '#1b9e4b', true),
  ('verde-6', 'Verde 6', '#1a9447', true),
  ('verde-7', 'Verde 7', '#188a42', true);

alter table public.habitos_items add column paquete_id text references public.arboles_paquetes(id);
update public.habitos_items set paquete_id = 'verde-' || tono_visual where paquete_id is null;
alter table public.habitos_items alter column paquete_id set not null;
alter table public.habitos_items alter column paquete_id set default 'verde-1';
alter table public.habitos_items drop column tono_visual;

-- crear_habito_premium: p_tono_visual (smallint, escribía tono_visual) pasa a
-- p_paquete_id (text, escribe paquete_id). Cambia el tipo del parámetro, así
-- que hace falta drop explícito con la firma exacta anterior — mismo cuidado
-- que las migraciones 20/22 (un create or replace con parámetros distintos
-- crea un overload nuevo en vez de reemplazar).
drop function if exists privacidad.crear_habito_premium(
  text, text, text, text, text, text, text, text, text, text, text,
  smallint[], smallint, numeric, boolean, time without time zone, boolean, date, integer, smallint
);
drop function if exists public.crear_habito_premium(
  text, text, text, text, text, text, text, text, text, text, text,
  smallint[], smallint, numeric, boolean, time without time zone, boolean, date, integer, smallint
);

create function privacidad.crear_habito_premium(
  p_titulo text, p_descripcion text, p_icono_lucide text, p_color text, p_tipo_meta text, p_unidad text,
  p_categoria text, p_dificultad text, p_disparador text, p_recompensa text,
  p_frecuencia text, p_dias_semana smallint[] default null, p_veces_por_semana smallint default null,
  p_objetivo_valor numeric default 1, p_recordatorio_activo boolean default false,
  p_hora_recordatorio time without time zone default null, p_mostrar_nombre_notificacion boolean default false,
  p_desde_fecha date default current_date, p_nivel_inicial integer default 1, p_paquete_id text default 'verde-1'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_item public.habitos_items; declare v_plan public.habitos_planes; declare v_nivel_inicial integer;
begin
  if auth.uid() is null then raise exception 'Sesión requerida.' using errcode = 'insufficient_privilege'; end if;
  if p_recordatorio_activo and p_hora_recordatorio is null then raise exception 'El recordatorio necesita una hora.' using errcode = 'check_violation'; end if;
  v_nivel_inicial := greatest(1, least(7, coalesce(p_nivel_inicial, 1)));

  insert into public.habitos_items (usuario_id,titulo,descripcion,icono_lucide,color,tipo_meta,unidad,categoria,dificultad,disparador,recompensa,paquete_id)
  values (auth.uid(),p_titulo,nullif(trim(p_descripcion),''),p_icono_lucide,p_color,p_tipo_meta,nullif(trim(p_unidad),''),nullif(trim(p_categoria),''),coalesce(p_dificultad,'estandar'),nullif(trim(p_disparador),''),nullif(trim(p_recompensa),''),coalesce(p_paquete_id,'verde-1'))
  returning * into v_item;
  insert into public.habitos_planes (habito_id,frecuencia,dias_semana,veces_por_semana,objetivo_valor,desde_fecha,recordatorio_activo,hora_recordatorio,mostrar_nombre_notificacion,nivel)
  values (v_item.id,p_frecuencia,p_dias_semana,p_veces_por_semana,p_objetivo_valor,p_desde_fecha,p_recordatorio_activo,p_hora_recordatorio,p_mostrar_nombre_notificacion,v_nivel_inicial)
  returning * into v_plan;
  return jsonb_build_object('id',v_item.id,'plan_id',v_plan.id);
end;
$$;

create function public.crear_habito_premium(
  p_titulo text, p_descripcion text, p_icono_lucide text, p_color text, p_tipo_meta text, p_unidad text,
  p_categoria text, p_dificultad text, p_disparador text, p_recompensa text,
  p_frecuencia text, p_dias_semana smallint[] default null, p_veces_por_semana smallint default null,
  p_objetivo_valor numeric default 1, p_recordatorio_activo boolean default false,
  p_hora_recordatorio time without time zone default null, p_mostrar_nombre_notificacion boolean default false,
  p_desde_fecha date default current_date, p_nivel_inicial integer default 1, p_paquete_id text default 'verde-1'
)
returns jsonb language sql security invoker set search_path = ''
as $$
  select privacidad.crear_habito_premium(p_titulo, p_descripcion, p_icono_lucide, p_color, p_tipo_meta, p_unidad, p_categoria, p_dificultad, p_disparador, p_recompensa, p_frecuencia, p_dias_semana, p_veces_por_semana, p_objetivo_valor, p_recordatorio_activo, p_hora_recordatorio, p_mostrar_nombre_notificacion, p_desde_fecha, p_nivel_inicial, p_paquete_id);
$$;

commit;

notify pgrst, 'reload schema';
