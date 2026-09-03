# Schema `privacidad`

## Proposito

`privacidad` contiene datos sensibles, auditoría y lógica de privilegio elevado. No se expone mediante PostgREST ni se consulta con `supabase.from(...)` desde Expo.

## Tablas

| Tabla | Proposito | Regla principal |
| --- | --- | --- |
| `usuario_permisos_datos` | Consentimientos de contexto Aby, procesamiento de fuentes y analítica. | Una fila por usuario; todos apagados implica `revocado_at`. |
| `auditoria_permisos_datos` | Historial inmutable antes/después de consentimiento. | Solo lo escribe la función de permisos. |
| `aceptaciones_documentos_legales` | Evidencia de aceptación por versión de documento. | Única por usuario y documento; la RPC pública devuelve código, versión, idioma, URL, fecha y origen. |
| `solicitudes_privacidad` | Exportación, eliminación o corrección. | Solo una solicitud activa por usuario y tipo. |
| `incidentes_privacidad` | Registro interno de incidentes. | Nunca se expone a la app. |
| `dispositivos_notificacion` | Relación actual persona-dispositivo OneSignal. | `onesignal_subscription_id` es único global. |
| `presupuestos_notificacion_usuario` | Límite atómico de avisos proactivos por fecha local. | Máximo dos proactivas por día. |

## Funciones Privadas

Las funciones de este schema son `security definer`, usan `search_path = ''` y verifican `auth.uid()` antes de actuar. La migración falla si su propietario no tiene `BYPASSRLS`.

- Lectura: permisos, aceptaciones legales y solicitudes activas propias.
- Consentimiento: actualización completa de toggles y auditoría transaccional.
- Legal: aceptación idempotente de documento activo.
- Privacidad: creación idempotente de solicitud activa.
- Notificaciones: registro o transferencia atómica de dispositivo y desvinculación condicional.

## Restricciones Operativas

- No agregar `privacidad` a schemas expuestos de Supabase.
- No devolver identificadores de dispositivo a la UI si no son necesarios.
- No insertar ni actualizar estas tablas desde Expo.
- Las Edge Functions que envíen contenido a Aby deben volver a leer los permisos vigentes desde este schema.
- Al completar una eliminación de cuenta, el proceso de servidor debe desactivar dispositivos, revocar sesiones y conservar únicamente los registros legalmente necesarios.
