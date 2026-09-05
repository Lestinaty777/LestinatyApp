# Base de Datos Lestinaty

## Estado

Las migraciones `01` a `06` están aplicadas en el proyecto remoto. La migración `06` crea el núcleo de Senderos de Estudio; su documentación específica está en `senderos.md`. Este documento no sustituye una inspección real de Supabase ni el Security Advisor.

## Separacion de Schemas

```text
auth        -> usuarios y sesiones gestionados por Supabase
public      -> superficie minima de la app y wrappers RPC expuestos
privacidad  -> datos sensibles, auditoria y funciones privilegiadas
```

`privacidad` nunca se agrega en **API Settings -> Exposed schemas**. Expo solo consulta tablas o RPCs en `public`. Las funciones privilegiadas viven en `privacidad`; sus wrappers en `public` son `security invoker` y conservan el JWT de la persona autenticada.

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
| 07 | Pendiente | Lecciones, intentos, dominio, repaso y evaluaciones. |
| 08 | Pendiente | Hoy, agenda y cola de notificaciones. |
| 09 | Pendiente | Aby, plantillas, cofres y entitlements futuros. |

## Estado remoto verificado

- `categorias_producto` existe y `estudio` está activa.
- Existen `metas`, `senderos`, `sendero_niveles`, `sendero_nodos`, `sendero_conexiones`, `sendero_cofres`, `aby_propuestas` y `aby_generation_locks`.
- `supabase/tests/03_senderos_nucleo_remoto.mjs` confirma que esas tablas responden mediante la API.
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
