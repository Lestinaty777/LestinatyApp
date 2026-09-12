-- Smoke test manual for 20260909_07_habitos_nucleo.sql.
-- Prerequisites:
--   1. Apply the migration.
--   2. Replace USER_A_UUID and USER_B_UUID with two Auth users.
-- This script rolls back all fixture writes at the end.

begin;

set local role authenticated;
set local request.jwt.claims = '{"role":"authenticated","sub":"USER_A_UUID"}';

select set_config(
  'app.smoke_habito_a',
  (public.crear_habito(
    'Beber agua', null, 'Droplets', '#2196F3', 'cantidad', 'vasos', 'diaria', null, null, 8, current_date
  )->>'id'),
  true
);

select public.registrar_progreso_habito(
  current_setting('app.smoke_habito_a')::uuid, current_date, 4, null
);
select public.registrar_progreso_habito(
  current_setting('app.smoke_habito_a')::uuid, current_date, 6, 'Segundo registro idempotente'
);

do $$
declare total_registros integer;
begin
  select count(*) into total_registros
  from public.habitos_registros
  where habito_id = current_setting('app.smoke_habito_a')::uuid;

  if total_registros <> 1 then
    raise exception 'Expected one daily record after an upsert, got %', total_registros
      using errcode = 'assert_failure';
  end if;
end;
$$;

-- Migration 15 revoked direct INSERT on habitos_planes for `authenticated` —
-- all plan writes now go through security definer functions in `privacidad`,
-- so a raw insert (overlapping or not) is rejected before it ever reaches the
-- exclusion constraint.
do $$
begin
  begin
    insert into public.habitos_planes (
      habito_id, frecuencia, objetivo_valor, desde_fecha
    ) values (
      current_setting('app.smoke_habito_a')::uuid, 'diaria', 8, current_date
    );
    raise exception 'A direct plan insert was accepted' using errcode = 'assert_failure';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

set local request.jwt.claims = '{"role":"authenticated","sub":"USER_B_UUID"}';

do $$
declare filas_visibles integer;
begin
  select count(*) into filas_visibles
  from public.habitos_items
  where id = current_setting('app.smoke_habito_a')::uuid;

  if filas_visibles <> 0 then
    raise exception 'A second user can read another user''s habit' using errcode = 'assert_failure';
  end if;
end;
$$;

rollback;
