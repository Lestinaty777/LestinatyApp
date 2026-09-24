-- Smoke test para la migración 20260924_51_productos_iap_plataforma.sql.
-- Autocontenido, revierte todo al final.

begin;

do $$
begin
  if to_regclass('public.paquetes_gemas_iap_productos') is null then
    raise exception 'falta la tabla paquetes_gemas_iap_productos' using errcode = 'assert_failure';
  end if;
end;
$$;

-- La plataforma solo acepta ios|android.
do $$
begin
  begin
    insert into public.paquetes_gemas_iap_productos (paquete_id, plataforma, product_id_revenuecat)
    values ('gemas_100', 'web', 'com.lestinaty.app.gemas.100.web');
    raise exception 'se permitió una plataforma inválida' using errcode = 'assert_failure';
  exception
    when check_violation then null;
  end;
end;
$$;

-- Todos los productos heredados existen como Android.
do $$
declare v_faltantes integer;
begin
  select count(*) into v_faltantes
  from public.paquetes_gemas_iap padre
  where not exists (
    select 1 from public.paquetes_gemas_iap_productos hijo
    where hijo.paquete_id = padre.id and hijo.plataforma = 'android' and hijo.product_id_revenuecat = padre.product_id_revenuecat
  );
  if v_faltantes > 0 then
    raise exception 'faltan % paquetes heredados como fila android', v_faltantes using errcode = 'assert_failure';
  end if;
end;
$$;

-- El mismo product ID no puede duplicarse en la misma plataforma.
do $$
begin
  begin
    insert into public.paquetes_gemas_iap_productos (paquete_id, plataforma, product_id_revenuecat)
    values ('gemas_550', 'android', (select product_id_revenuecat from public.paquetes_gemas_iap_productos where paquete_id = 'gemas_100' and plataforma = 'android'));
    raise exception 'se permitió duplicar un product_id en la misma plataforma' using errcode = 'assert_failure';
  exception
    when unique_violation then null;
  end;
end;
$$;

-- Un producto iOS activo resuelve la cantidad del paquete lógico.
insert into public.paquetes_gemas_iap_productos (paquete_id, plataforma, product_id_revenuecat, activo)
values ('gemas_100', 'ios', 'com.lestinaty.app.gemas.100', true);

do $$
declare v_cantidad integer;
begin
  select padre.cantidad_gemas into v_cantidad
  from public.paquetes_gemas_iap_productos hijo
  join public.paquetes_gemas_iap padre on padre.id = hijo.paquete_id
  where hijo.plataforma = 'ios' and hijo.product_id_revenuecat = 'com.lestinaty.app.gemas.100' and hijo.activo;

  if v_cantidad is distinct from 100 then
    raise exception 'el producto iOS no resolvió la cantidad correcta del paquete lógico (obtuvo %)', v_cantidad using errcode = 'assert_failure';
  end if;
end;
$$;

-- Dos créditos con el mismo event.id no duplican saldo (idempotencia ya
-- garantizada por comercio.acreditar_gemas — se reverifica acá porque es la
-- ruta que ahora consulta la tabla hija).
do $$
declare
  v_usuario_id uuid := gen_random_uuid();
  v_saldo_1 integer;
  v_saldo_2 integer;
begin
  insert into auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  values (v_usuario_id, 'smoke-iap-plataforma-' || v_usuario_id || '@lestinaty.invalid', crypt('smoke-password', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb);

  v_saldo_1 := comercio.acreditar_gemas(v_usuario_id, 100, 'compra_iap', 'smoke-evento-iap-plataforma');
  v_saldo_2 := comercio.acreditar_gemas(v_usuario_id, 100, 'compra_iap', 'smoke-evento-iap-plataforma');

  if v_saldo_1 is distinct from v_saldo_2 then
    raise exception 'el mismo event.id acreditó dos veces (saldo % luego %)', v_saldo_1, v_saldo_2 using errcode = 'assert_failure';
  end if;
end;
$$;

do $$
begin
  raise notice 'OK: catálogo de productos IAP por plataforma y créditos idempotentes.';
end;
$$;

rollback;
