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
| `notificaciones_programadas` | Cola privada e idempotente de recordatorios de hábitos, tareas y rutinas. | Exactamente un origen por fila (`plan_habito_id`, `tarea_id` o `rutina_id`) y una fila por origen y fecha local; Expo no puede leerla. |
| `notificaciones_entregas` | Auditoría de resultados por dispositivo. | Solo la Edge Function escribe envíos o fallos. |
| `notificacion_interacciones` | Aperturas o descartes recibidos desde proveedor. | Nunca se inserta desde la app. |

## Funciones Privadas

Las funciones de este schema son `security definer`, usan `search_path = ''` y verifican `auth.uid()` antes de actuar. La migración falla si su propietario no tiene `BYPASSRLS`.

- Lectura: permisos, aceptaciones legales y solicitudes activas propias.
- Consentimiento: actualización completa de toggles y auditoría transaccional.
- Legal: aceptación idempotente de documento activo.
- Privacidad: creación idempotente de solicitud activa.
- Notificaciones: registro o transferencia atómica de dispositivo, reclamación de recordatorios y cierre auditado de entregas.
- Recordatorios (migraciones 84 y 86): `reclamar_recordatorios_habitos`, `reclamar_recordatorios_tareas`, `reclamar_recordatorios_rutinas` y `finalizar_recordatorio_habito` solo son ejecutables por `service_role` (las usa la Edge Function `despachar-recordatorios-habitos`). `reprogramar_recordatorio_tarea` y `reprogramar_recordatorio_rutina` sí las llama la app: comprueban sesión y propiedad.
- Franja de hábito (migración 82): `establecer_franja_habito` cambia la franja del plan más reciente de un hábito propio.
- Metas (migración 87): `asignar_meta` enlaza un hábito, tarea, rutina o plan propios con una meta propia.
- Hábitos: `crear_habito`, `crear_habito_premium`, `actualizar_plan_habito` y `registrar_progreso_habito` escriben `public.habitos_items`/`habitos_planes`/`habitos_registros` — movidas aquí para que `authenticated` no pueda insertar directo una fila de plan con un `nivel` falso (ver migración 15, motivada por la recompensa en gemas de subir de nivel). Los wrappers en `public` son invoker, como el resto.

## Restricciones Operativas

- No agregar `privacidad` a schemas expuestos de Supabase.
- No devolver identificadores de dispositivo a la UI si no son necesarios.
- No insertar ni actualizar estas tablas desde Expo.
- Las Edge Functions que envíen recordatorios deben volver a leer planes, preferencias y dispositivos vigentes desde este schema o sus RPCs de servidor.
- Al completar una eliminación de cuenta, el proceso de servidor debe desactivar dispositivos, revocar sesiones y conservar únicamente los registros legalmente necesarios.

## Datos personales fuera de este schema (rutinas, metas y áreas)

Viven en `public` con RLS por propietaria y se borran en cascada al eliminar la cuenta (`on delete cascade` desde `auth.users` o `perfiles_usuario`).

| Tabla | Contenido | Acceso |
| --- | --- | --- |
| `rutinas_items`, `rutinas_pasos` | Rutinas y sus pasos (título, franja, horario, pasos propios). | Solo la persona dueña. |
| `rutinas_pasos_registros`, `rutinas_registros` | Avance de pasos propios y sesiones de cada día. | Solo la persona dueña. |
| `rutinas_plantillas`, `rutinas_plantillas_contenido` | Catálogo de plantillas de Lestinaty (no es dato personal). | Lectura con sesión; el contenido de pago solo si se compró. |
| `rutinas_plantillas_compradas` | Qué plantillas compró cada persona y a qué precio en gemas. | Solo la persona dueña; escribe únicamente el RPC de compra. |
| `areas_vida` | Áreas del sistema (sin dueño) y áreas propias (nombre, color, ícono). | Las del sistema, cualquiera con sesión; las propias, solo su dueña. |
| `metas` | Metas (título, descripción, área, plazo opcional, estado). | Solo la persona dueña. |
| `habitos_planes.franja`, `tareas_items.franja`, `perfiles_usuario.franja_*_desde` | Franja del día de cada elemento y horas de inicio de cada franja. | Heredan la RLS de su tabla. |
| `meta_id` en `habitos_items`, `tareas_items`, `rutinas_items`, `planes_items` | Enlace con una meta propia. | Un trigger impide enlazar la meta de otra persona. |

El XP y la racha global que muestra Hoy **no se guardan**: `obtener_resumen_hoy` los calcula desde los registros anteriores.
