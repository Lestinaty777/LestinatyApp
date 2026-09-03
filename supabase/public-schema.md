# Schema `public`

## Proposito

`public` es la unica superficie expuesta a la Data API de Expo. Solo contiene datos que la app puede leer directamente con RLS y wrappers RPC que delegan mutaciones sensibles a `privacidad`.

## Tablas

| Tabla | Proposito | Acceso desde Expo |
| --- | --- | --- |
| `categorias_producto` | Catálogo de categorías. Solo `estudio` está activa durante el MVP. | Lectura pública. |
| `perfiles_usuario` | Nombre visible, idioma y zona horaria de la persona. | Leer y actualizar solo la propia fila. |
| `documentos_legales` | Versiones públicas de privacidad, términos, IA y comunidad. | Lectura de documentos no retirados. |
| `responsables_privacidad` | Contacto público de privacidad. | Lectura de filas activas. |
| `catalogo_notificaciones` | Tipos seguros de avisos permitidos. | Lectura de filas activas. |
| `preferencias_notificacion_usuario` | Preferencias por aviso, anticipación y ventana silenciosa. | Leer y actualizar solo las propias filas. |

## RPCs Públicas

| RPC | Resultado | Garantía |
| --- | --- | --- |
| `obtener_permisos_datos()` | Estado actual de consentimiento. | Solo devuelve la fila de `auth.uid()`. |
| `actualizar_permisos_datos(...)` | Estado actualizado de consentimiento. | Audita antes/después; no reescribe consentimientos idénticos. |
| `obtener_aceptaciones_legales()` | Aceptaciones propias. | Devuelve datos mínimos, sin documentos ajenos. |
| `aceptar_documento_legal(...)` | Aceptación creada o existente. | Idempotente por usuario y documento. |
| `obtener_solicitudes_privacidad_activas()` | Solicitudes propias pendientes o en proceso. | No expone evidencia interna. |
| `crear_solicitud_privacidad(...)` | Solicitud creada o activa existente. | Idempotente por usuario y tipo activo. |
| `registrar_dispositivo_notificacion(...)` | Dispositivo registrado o transferido. | Transferencia atómica por suscripción OneSignal. |
| `desvincular_dispositivo_notificacion(...)` | `true` solo si el dispositivo aún era propio. | Un logout tardío no afecta al nuevo usuario. |

## Reglas

- Las RPCs públicas usan `security invoker`; no poseen privilegios elevados.
- No crear funciones `security definer` nuevas en `public`.
- Las nuevas tablas de camino, lección y progreso solo se exponen en `public` si la UI necesita consultarlas directamente y tienen RLS revisado.
- La app nunca usa `service_role`.
