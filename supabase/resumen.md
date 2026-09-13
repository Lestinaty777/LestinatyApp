# Base de Datos Lestinaty

## Estado

Las migraciones `01` a `21` están aplicadas en el proyecto remoto. La migración `06` crea el núcleo de Senderos de Estudio; `07` y `08` incorporan Hábitos, `09` añade su cola privada de recordatorios, `10` y `11` la creación premium y los niveles progresivos, `12` el plan de niveles por IA (sin generador aún), `13`-`15` la tienda de gemas y su endurecimiento, y `16` corrige un bug real de doble subida de nivel encontrado al escribir `supabase/tests/05_comercio_gemas_nivel_habito.sql`. Este documento no sustituye una inspección real de Supabase ni el Security Advisor.

## Separacion de Schemas

```text
auth        -> usuarios y sesiones gestionados por Supabase
public      -> superficie minima de la app y wrappers RPC expuestos
privacidad  -> datos sensibles, auditoria y funciones privilegiadas
comercio    -> billetera de gemas, ledger de movimientos y compras
```

`privacidad` y `comercio` nunca se agregan en **API Settings -> Exposed schemas**. Expo solo consulta tablas o RPCs en `public`. Las funciones privilegiadas viven en `privacidad`/`comercio`; sus wrappers en `public` son `security invoker` y conservan el JWT de la persona autenticada. Ver `supabase/comercio-schema.md` para el detalle de la tienda.

## Principios

- Toda tabla personal tiene RLS habilitado.
- Las tablas de `privacidad` no ofrecen acceso directo a cliente, incluso con RLS.
- Las funciones `security definer` usan `search_path = ''`, referencias calificadas y deben pertenecer a un rol con `BYPASSRLS`.
- Las mutaciones sensibles son transaccionales e idempotentes.
- OneSignal solo entrega avisos: el estado y propiedad del dispositivo viven en Supabase.
- Las funciones de la app nunca aceptan un `usuario_id` desde Expo; derivan identidad de `auth.uid()`.

## Flujo de Usuario Nuevo

1. Supabase Auth crea `auth.users`.
2. El trigger `privacidad.crear_datos_usuario_nuevo` crea `public.perfiles_usuario`.
3. Crea la fila revocada de `privacidad.usuario_permisos_datos`.
4. Crea preferencias de notificaciones desactivadas para cada aviso activo.
5. La persona acepta documentos y configura permisos mediante RPCs públicas.

## Migraciones Planeadas

| Orden | Archivo | Alcance |
| --- | --- | --- |
| 01 | `20260903_01_plataforma_privacidad_catalogo.sql` | Plataforma, privacidad, catálogo y notificaciones base. |
| 02 | `20260903_02_reparar_inicializacion_usuarios.sql` | Backfill idempotente para cuentas de Auth creadas antes de la inicialización automática. |
| 03 | `20260903_03_conceder_acceso_tablas_publicas.sql` | Privilegios SQL mínimos de la Data API; RLS conserva el control por fila. |
| 04 | `20260903_04_conceder_operacion_service_role.sql` | Privilegios SQL de servidor para Edge Functions y procesos internos. |
| 05 | `20260903_05_enriquecer_aceptaciones_legales.sql` | Metadatos del documento en aceptaciones legales para la UI autenticada. |
| 06 | `20260905_06_senderos_nucleo_estudio.sql` | Metas, senderos, secciones, nodos, conexiones, cofres y propuestas privadas de Aby. Fuentes y conceptos siguen pendientes. |
| 07 | `20260909_07_habitos_nucleo.sql` | Hábitos, planes versionados, registros, contextos, conexiones y RPC analítica. |
| 08 | `20260909_08_habitos_insights_progresivos.sql` | Campos avanzados de hábito, recordatorio configurable y señales diarias. |
| 09 | `20260909_09_cola_recordatorios_habitos.sql` | Cola privada, entregas, interacciones y RPCs solo de servidor para recordatorios. |
| 10 | `20260910_10_habitos_creacion_premium.sql` | Creación de hábitos con RPC premium (icono, color, categoría, dificultad). |
| 11 | `20260910_11_habitos_niveles_progresivos.sql` | Nivel, origen y mensaje en `habitos_planes`; `registrar_progreso_habito` sube de nivel según racha real. |
| 12 | `20260911_12_habitos_niveles_plan.sql` | `habitos_niveles_plan` para metas de nivel generadas por IA (fallback: fórmula +15%). |
| 13 | `20260912_13_comercio_tienda_gemas.sql` | Schema `comercio` (billetera de gemas, ledger) y tienda pública (`articulos_tienda`, `compras_tienda`). `acreditar_gemas` queda reservada a `service_role` hasta que exista la Edge Function de validación de compra real. |
| 14 | `20260912_14_recompensa_gemas_nivel_habito.sql` | `registrar_progreso_habito()` acredita gemas (5 × nivel nuevo) al confirmar una subida de nivel real, vía `comercio.acreditar_recompensa_nivel_habito` (idempotente por hábito+nivel). |
| 15 | `20260912_15_endurecer_escrituras_habitos_planes.sql` | Mueve `crear_habito`, `crear_habito_premium`, `actualizar_plan_habito` y `registrar_progreso_habito` a `privacidad` (security definer); revoca INSERT/UPDATE/DELETE de `authenticated` sobre `habitos_planes`/`habitos_registros`. Cierra el hueco que dejaba la migración 14 explotable vía REST directo. |
| 16 | `20260912_16_fix_doble_subida_nivel.sql` | Corrige un bug de la migración 11: si el umbral de 80%/80% se cumple antes del día 14 (el 80% permite huecos), una segunda llamada el mismo día real reintentaba la subida de nivel y violaba el exclusion constraint de `habitos_planes`, revirtiendo también el registro de progreso de ese día. Encontrado con el smoke test `05`. |
| 17 | `20260912_17_paquetes_gemas_iap.sql` | Catálogo `public.paquetes_gemas_iap` (product_id de RevenueCat -> cantidad de gemas, placeholders) e idempotencia por `(persona, motivo, referencia)` en `comercio.acreditar_gemas` — necesaria porque los webhooks de RevenueCat se reintentan. |
| 18 | `20260912_18_wrapper_acreditar_gemas_service.sql` | Wrapper `public.acreditar_gemas` (EXECUTE exclusivo `service_role`) para que la Edge Function pueda llamarlo vía `supabase-js`, ya que `comercio` nunca está en los schemas expuestos de PostgREST. |
| 19 | `20260913_19_nivel_inicial_habito.sql` | `crear_habito_premium` acepta `p_nivel_inicial` (acotado 1-7) y lo guarda en `habitos_planes.nivel` — el tono elegido en el wizard ya no se pierde, antes todo hábito nuevo arrancaba en nivel 1 sin importar el tono elegido. |
| 20 | `20260913_20_fix_duplicado_crear_habito_premium.sql` | Borra el overload viejo de `crear_habito_premium` (18 params) que dejó la migración 19 y fuerza recarga del caché de PostgREST — sin esto, crear un hábito fallaba en silencio. |
| 21 | `20260913_21_regla_nivel_por_dias_acumulados.sql` | Reemplaza la regla de subida de nivel: en vez de 14 días fijos con dos ventanas al 80%, cada nivel pide una cantidad de días cumplidos ACUMULADOS (no se resetea si hay un día perdido) — 3/7/14/30/60/90 para niveles 2-7, los mismos números que ya mostraba el paso 6 del wizard como texto decorativo, ahora conectados a la regla real. |

## Estado remoto verificado

- `categorias_producto` existe y `estudio` está activa.
- Existen `metas`, `senderos`, `sendero_niveles`, `sendero_nodos`, `sendero_conexiones`, `sendero_cofres`, `aby_propuestas` y `aby_generation_locks`.
- `supabase/tests/03_senderos_nucleo_remoto.mjs` confirma que esas tablas responden mediante la API.
- `privacidad.notificaciones_programadas`, `privacidad.notificaciones_entregas` y `privacidad.notificacion_interacciones` existen con RLS; su acceso queda restringido a `service_role`.
- La Edge Function `despachar-recordatorios-habitos` está desplegada y `pg_cron` la invoca cada cinco minutos mediante secretos en Supabase Vault.
- El historial interno `supabase_migrations.schema_migrations` no refleja las migraciones locales `01` a `06`, porque fueron aplicadas fuera de Supabase CLI. Debe repararse antes de usar `supabase db push`.

## Ejecucion Manual

1. Confirmar que las tablas heredadas de senderos estan eliminadas y no hay datos que convertir.
2. Ejecutar el archivo `01` completo en SQL Editor.
3. Si ya habías ejecutado una versión anterior de `01` o ya existían cuentas en Auth, ejecutar también `02`.
4. Si `01` se ejecutó antes de los privilegios explícitos, ejecutar también `03`.
5. Ejecutar `04` para que Edge Functions y procesos con `service_role` puedan operar datos internos.
6. Ejecutar `05` antes de publicar la pantalla de configuración; agrega metadatos legales a la RPC existente.
7. No agregar `privacidad` a los schemas expuestos de la API.
8. Ejecutar Security Advisor y resolver advertencias reales antes de cargar datos de produccion.
9. Hacer smoke tests con un JWT real de usuario autenticado, nunca con SQL Editor o `service_role`.
10. Ejecutar `tests/01_plataforma_privacidad_smoke.sql` con dos UUID reales de Auth; el script revierte todos sus cambios.
11. Para recordatorios de hábitos, desplegar `despachar-recordatorios-habitos`, guardar `ONESIGNAL_APP_ID`, `ONESIGNAL_REST_API_KEY` y `SCHEDULER_SECRET` como secretos de Supabase, y programar la función con `pg_cron`/`pg_net` y Vault.

## Smoke Tests Iniciales

- Crear una cuenta y confirmar perfil, permisos revocados y preferencias iniciales.
- Ejecutar `obtener_permisos_datos` desde Expo y recibir la fila propia.
- Ejecutar `actualizar_permisos_datos`; confirmar auditoria antes/despues y que repetir el mismo estado no cambia fechas.
- Ejecutar `aceptar_documento_legal` dos veces y obtener una sola aceptación.
- Ejecutar `crear_solicitud_privacidad` dos veces y obtener una sola solicitud activa por tipo.
- Registrar el mismo `onesignal_subscription_id` en dos cuentas y confirmar que se transfiere sin filtrar preferencias.
- Simular logout tardío de la primera cuenta y confirmar que no desactiva el dispositivo transferido.

## Proximo Paso

Crear la aceptacion transaccional de una propuesta de Aby. Debe convertir una propuesta validada en meta semilla, sendero, una seccion de cinco lecciones, una evaluacion y su cofre; solo despues de esa transaccion la UI puede presentar el sendero como activo.
