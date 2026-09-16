-- Sistema de referidos: cada persona tiene un código propio; si alguien se
-- registra con el código de otro, cuando el PRIMER hábito de la persona
-- invitada llega a nivel 2, ambas partes reciben 100 gemas — vía
-- comercio.acreditar_gemas, que ya es genérico e idempotente por
-- (persona, motivo, referencia), sin ledger nuevo que escribir a mano.

begin;

alter table public.perfiles_usuario
  add column if not exists codigo_referido text unique not null default substr(md5(random()::text || clock_timestamp()::text), 1, 8),
  add column if not exists referido_por uuid references auth.users(id),
  add column if not exists recompensa_referido_otorgada_en timestamptz;

comment on column public.perfiles_usuario.codigo_referido is 'Código propio para invitar amigos — generado solo, no lo elige la persona.';
comment on column public.perfiles_usuario.referido_por is 'Quién invitó a esta persona (si entró con un código válido al registrarse). Se fija una sola vez.';
comment on column public.perfiles_usuario.recompensa_referido_otorgada_en is 'Cuándo se acreditaron las 100 gemas a ambas partes — null hasta que el invitado llega a nivel 2. Evita pagar dos veces.';

-- El trigger ya leía raw_user_meta_data ->> 'full_name'; ahora también resuelve
-- 'codigo_referido' contra el código de otra persona. Si no existe o está
-- vacío, la subconsulta da null y referido_por queda null — nunca rompe el alta.
create or replace function privacidad.crear_datos_usuario_nuevo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles_usuario (id, nombre_visible, referido_por)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    (select id from public.perfiles_usuario where codigo_referido = nullif(trim(new.raw_user_meta_data ->> 'codigo_referido'), ''))
  )
  on conflict (id) do nothing;
  insert into privacidad.usuario_permisos_datos (usuario_id, revocado_at) values (new.id, now()) on conflict (usuario_id) do nothing;
  insert into public.preferencias_notificacion_usuario (usuario_id, catalogo_codigo)
  select new.id, codigo from public.catalogo_notificaciones where activo
  on conflict (usuario_id, catalogo_codigo) do nothing;
  return new;
end;
$$;

-- Mismo cuerpo de la migración 23 (regla de días acumulados), agregando la
-- recompensa de referidos justo cuando el nuevo nivel es 2 por primera vez.
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
declare v_dias_requeridos_por_nivel integer[] := array[3,7,12,18,25,33];
declare v_dias_requeridos integer;
declare v_dias_completados integer := 0;
declare v_nuevo_objetivo numeric;
declare v_mensaje_nivel text;
declare v_subio_nivel boolean := false;
declare v_nivel_actual integer;
declare v_gemas_ganadas integer := 0;
declare v_referido_por uuid;
declare v_recompensa_referido_otorgada_en timestamptz;
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

  if v_plan_vigente.id is not null
    and v_nivel_actual < 7
    -- Idempotencia: si el plan de mañana ya existe, esta subida ya se aplicó
    -- en una llamada anterior el mismo día (ver migración 16).
    and not exists (
      select 1 from public.habitos_planes
      where habito_id = p_habito_id and desde_fecha = v_fecha_actual + 1
    )
  then
    v_dias_requeridos := v_dias_requeridos_por_nivel[v_nivel_actual];

    select count(*) into v_dias_completados
    from generate_series(v_plan_vigente.desde_fecha, v_fecha_actual, interval '1 day') as dia(fecha)
    join public.habitos_registros registro
      on registro.habito_id = p_habito_id and registro.fecha_local = dia.fecha::date
    where public.habitos_es_dia_programado(v_plan_vigente, dia.fecha::date)
      and (case when v_tipo_meta = 'check' then registro.valor > 0 else registro.valor >= v_plan_vigente.objetivo_valor end);

    if v_dias_completados >= v_dias_requeridos then
      v_nuevo_objetivo := case
        when v_tipo_meta = 'check' then v_plan_vigente.objetivo_valor
        else round(v_plan_vigente.objetivo_valor * 1.15, 2)
      end;
      v_mensaje_nivel := '¡Subiste al nivel ' || (v_plan_vigente.nivel + 1) || '!';

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

      if v_nivel_actual = 2 then
        select referido_por, recompensa_referido_otorgada_en into v_referido_por, v_recompensa_referido_otorgada_en
        from public.perfiles_usuario where id = auth.uid();

        if v_referido_por is not null and v_recompensa_referido_otorgada_en is null then
          perform comercio.acreditar_gemas(auth.uid(), 100, 'referido_nivel2', auth.uid()::text);
          perform comercio.acreditar_gemas(v_referido_por, 100, 'referido_nivel2', auth.uid()::text);
          update public.perfiles_usuario set recompensa_referido_otorgada_en = now() where id = auth.uid();
        end if;
      end if;
    end if;
  end if;

  return jsonb_build_object(
    'id', v_registro.id, 'habito_id', v_registro.habito_id, 'fecha_local', v_registro.fecha_local,
    'valor', v_registro.valor, 'nota', v_registro.nota,
    'subio_nivel', v_subio_nivel, 'nivel', v_nivel_actual, 'gemas_ganadas', v_gemas_ganadas
  );
end;
$$;

commit;
