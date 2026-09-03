-- Completa privilegios SQL para las tablas publicas expuestas mediante Data API.
-- Las politicas RLS de la migracion 01 siguen limitando las filas disponibles.

grant select, update on public.perfiles_usuario to authenticated;
grant select on public.categorias_producto to anon, authenticated;
grant select on public.documentos_legales to anon, authenticated;
grant select on public.responsables_privacidad to anon, authenticated;
grant select on public.catalogo_notificaciones to anon, authenticated;
grant select, update on public.preferencias_notificacion_usuario to authenticated;
