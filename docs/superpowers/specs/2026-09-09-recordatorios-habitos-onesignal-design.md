# Recordatorios de Hábitos con OneSignal

## Objetivo

Enviar recordatorios de hábitos programados a dispositivos Android asociados por OneSignal, sin exponer identificadores de suscripción, colas ni credenciales a Expo.

## Decisión de arquitectura

Se conservan las cuatro tablas de notificaciones existentes: `public.catalogo_notificaciones`, `public.preferencias_notificacion_usuario`, `privacidad.dispositivos_notificacion` y `privacidad.presupuestos_notificacion_usuario`. La migración 09 completa únicamente la cola privada y su auditoría: `privacidad.notificaciones_programadas`, `privacidad.notificaciones_entregas` y `privacidad.notificacion_interacciones`.

Un proceso de servidor crea una fila por plan de hábito y fecha local; `unique(plan_habito_id, fecha_local)` hace la operación idempotente. La Edge Function reclama filas vencidas, vuelve a consultar plan, preferencia, dispositivo activo y permiso nativo, y solo entonces llama a OneSignal. Registra un resultado por dispositivo sin guardar contenido adicional en OneSignal ni revelar datos privados al cliente.

## Flujo

1. Un hábito con `recordatorio_activo`, `hora_recordatorio` y un plan vigente genera una notificación privada pendiente.
2. La función `despachar-recordatorios-habitos` reclama atómicamente solo las filas pendientes cuya hora ya llegó.
3. Si el plan dejó de estar vigente, la preferencia `habito_recordatorio` no está activa o no hay dispositivo Android concedido, la fila se cancela y no se envía.
4. Por cada dispositivo válido se llama a OneSignal, dirigido mediante `include_subscription_ids`, con el icono normal de la aplicación, una ruta `/habitos/<id>` y sin exponer el nombre salvo que el plan tenga `mostrar_nombre_notificacion`.
5. La respuesta se persiste en `notificaciones_entregas`; los eventos de apertura futuros se guardarán en `notificacion_interacciones` mediante un webhook autenticado, nunca desde Expo.

## Contratos y seguridad

- Expo solo registra/desvincula su dispositivo con las RPC públicas existentes; no inserta colas privadas.
- La Edge Function exige `SUPABASE_SERVICE_ROLE_KEY`, `ONESIGNAL_REST_API_KEY` y `ONESIGNAL_APP_ID` como secretos de Supabase.
- Las tres nuevas tablas tienen RLS activa y privilegios solo para `service_role`.
- La Edge Function no acepta un usuario ni un destinatario en el request: procesa exclusivamente la cola privada.
- El nombre del hábito se envía solo cuando la persona activó `mostrar_nombre_notificacion`; de otro modo el texto es genérico.

## Programación

La función estará preparada para invocación programada (cada cinco minutos) y para una invocación autenticada manual durante pruebas. El despliegue/configuración del cron se documenta, porque requiere una configuración externa al código y no debe hacerse sin autorización explícita.
