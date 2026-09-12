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
| `metas` | Resultado de aprendizaje privado que agrupa uno o más senderos. | La persona administra solo sus propias metas. |
| `senderos` | Camino de estudio persistente, creado desde una propuesta confirmada. | Lectura solo si pertenece a una meta propia. |
| `sendero_niveles` | Secciones ordenadas de un sendero. | Lectura por la cadena sendero -> meta propia. |
| `sendero_nodos` | Cinco lecciones y una evaluación por sección activa. | Lectura por la cadena sección -> sendero -> meta propia. |
| `sendero_conexiones` | Relaciones dirigidas entre nodos del mismo sendero. | Lectura solo dentro de senderos propios. |
| `sendero_cofres` | Cofre de recompensa asociado a la evaluación de cada sección. | Lectura solo dentro de senderos propios. |
| `aby_propuestas` | Propuestas privadas y confirmables generadas por Aby. | Lectura solo de propuestas propias. |
| `habitos_items` | Hábito configurable de una persona. | Administración únicamente de la propia fila. |
| `habitos_planes` | Meta y frecuencia versionadas de un hábito. | Administración por la cadena hábito propio. |
| `habitos_registros` | Acumulado diario de progreso. | Administración únicamente de la propia fila. |
| `habitos_contextos` | Contextos personales opcionales para detectar patrones. | Administración únicamente de la propia fila. |
| `habitos_registro_contextos` | Contextos asociados a un registro. | Administración por la cadena registro propio. |
| `habitos_conexiones` | Relación dirigida entre hábitos propios. | Administración únicamente de la propia fila. |
| `articulos_tienda` | Catálogo de artículos comprables por gemas (ej. paquete Arcoíris). | Lectura de filas activas. |
| `compras_tienda` | Artículos que ya desbloqueó la persona. | Lectura solo de las propias filas; nunca se inserta directo, solo vía `comprar_articulo_tienda(...)`. |

La estructura, invariantes y flujo de creación de estas tablas se documentan en `supabase/senderos.md`.

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
| `crear_habito(...)` | Hábito y primer plan creados atómicamente. | Deriva la persona desde `auth.uid()`. |
| `registrar_progreso_habito(...)` | Registro diario creado o actualizado. | Idempotente por hábito y fecha local. |
| `actualizar_plan_habito(...)` | Cierra el plan vigente y crea la nueva versión. | Conserva las métricas históricas. |
| `obtener_panel_habitos(...)` | Panel de Hoy, Patrones, Conexiones, Riesgo e Impacto. | Devuelve estados reales o de observación. |
| `obtener_saldo_gemas()` | Saldo actual de gemas de la persona. | Deriva la identidad desde `auth.uid()`, nunca acepta un id de otra persona. |
| `comprar_articulo_tienda(...)` | Compra idempotente: cobra gemas y desbloquea el artículo. | Falla si no hay saldo suficiente; repetir la compra de algo ya poseído no cobra de nuevo. |

`reclamar_recordatorios_habitos(...)` y `finalizar_recordatorio_habito(...)` también viven en `public` como puentes técnicos hacia `privacidad`, pero tienen `EXECUTE` exclusivamente para `service_role`. No aparecen como capacidad de Expo ni de una sesión autenticada normal.

## Reglas

- Las RPCs públicas usan `security invoker`; no poseen privilegios elevados.
- No crear funciones `security definer` nuevas en `public`.
- Las nuevas tablas de camino, lección y progreso solo se exponen en `public` si la UI necesita consultarlas directamente y tienen RLS revisado.
- El cliente no inserta ni activa senderos, secciones, nodos, conexiones, cofres ni propuestas. Esas mutaciones se harán desde una Edge Function o RPC transaccional de servidor.
- La app nunca usa `service_role`.
