-- Permite a Edge Functions y procesos internos operar tablas de servidor.
-- No se otorgan estos privilegios a anon ni authenticated; RLS no es una
-- sustitucion de privilegios SQL para service_role.

grant all privileges on public.categorias_producto to service_role;
grant all privileges on public.perfiles_usuario to service_role;
grant all privileges on public.documentos_legales to service_role;
grant all privileges on public.responsables_privacidad to service_role;
grant all privileges on public.catalogo_notificaciones to service_role;
grant all privileges on public.preferencias_notificacion_usuario to service_role;
grant all privileges on privacidad.usuario_permisos_datos to service_role;
grant all privileges on privacidad.auditoria_permisos_datos to service_role;
grant all privileges on privacidad.aceptaciones_documentos_legales to service_role;
grant all privileges on privacidad.solicitudes_privacidad to service_role;
grant all privileges on privacidad.incidentes_privacidad to service_role;
grant all privileges on privacidad.dispositivos_notificacion to service_role;
grant all privileges on privacidad.presupuestos_notificacion_usuario to service_role;
