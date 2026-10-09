-- Migración 86: cierra un hueco de permisos de la migración 60.
--
-- public.reclamar_recordatorios_tareas quedó con los permisos por defecto de
-- Postgres (ejecutable por cualquiera, incluido anon), y llama a una función
-- security definer. Cualquier sesión podía invocarla por la API y: (a) recibir
-- títulos de tareas e identificadores de dispositivo de OTRAS personas, y
-- (b) dejar sus recordatorios pendientes como "reclamados", de modo que nunca
-- se envían. Solo debe llamarla la Edge Function despachar-recordatorios-habitos,
-- que usa service_role. Las de hábitos (reclamar/finalizar en public) ya
-- estaban cerradas; aquí se cierran también sus gemelas del esquema privacidad.
--
-- reprogramar_recordatorio_tarea SÍ la llama el cliente (comprueba auth.uid()
-- y propiedad): se le quita solo el acceso anónimo.
begin;

revoke all on function public.reclamar_recordatorios_tareas(integer) from public, anon, authenticated;
revoke all on function privacidad.reclamar_recordatorios_tareas(integer) from public, anon, authenticated;
grant execute on function public.reclamar_recordatorios_tareas(integer) to service_role;
grant execute on function privacidad.reclamar_recordatorios_tareas(integer) to service_role;

revoke all on function privacidad.reclamar_recordatorios_habitos(integer) from public, anon, authenticated;
grant execute on function privacidad.reclamar_recordatorios_habitos(integer) to service_role;

revoke all on function privacidad.finalizar_recordatorio_habito(uuid, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function privacidad.finalizar_recordatorio_habito(uuid, text, text, text, jsonb) to service_role;

revoke all on function public.reprogramar_recordatorio_tarea(uuid, date) from public, anon;
revoke all on function privacidad.reprogramar_recordatorio_tarea(uuid, date) from public, anon;
grant execute on function public.reprogramar_recordatorio_tarea(uuid, date) to authenticated;
grant execute on function privacidad.reprogramar_recordatorio_tarea(uuid, date) to authenticated;

commit;
