-- Bug crítico encontrado auditando la Tienda: comercio.comprar_semillas_arbol
-- (20260916_26_semillas_arbol.sql) inserta movimientos con motivo
-- 'gasto_semillas', pero el check constraint de comercio.movimientos_gemas
-- nunca se amplió para permitir ese valor (se quedó en compra_iap /
-- gasto_tienda / ajuste_soporte / recompensa_nivel, de la migración
-- 20260912_14). Resultado: TODA compra de semillas de árbol falla con una
-- violación de check constraint — la tienda de árboles, la de gemas por
-- semillas y el vivero de Senderos nunca pudieron completar una compra real.

begin;

alter table comercio.movimientos_gemas drop constraint movimientos_gemas_motivo_check;
alter table comercio.movimientos_gemas add constraint movimientos_gemas_motivo_check
  check (motivo in ('compra_iap', 'gasto_tienda', 'ajuste_soporte', 'recompensa_nivel', 'gasto_semillas'));

commit;
