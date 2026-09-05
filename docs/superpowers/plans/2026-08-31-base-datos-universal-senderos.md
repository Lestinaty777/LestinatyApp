# Base de Datos de Aprendizaje Lestinaty Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adaptar la arquitectura universal de Lestinaty a un MVP de caminos de aprendizaje de Estudio, conservando privacidad, agenda, notificaciones, auditoria y economia segura.

**Architecture:** Se conservan los nombres tecnicos `senderos`, `sendero_niveles` y `sendero_nodos`; la UI los presenta como camino, seccion y nodo. Una meta de aprendizaje agrupa caminos y una vision es opcional. Los resultados de lecciones, repaso, progreso, eventos y gemas son append-only o derivados desde hechos inmutables.

**Tech Stack:** Supabase Postgres, RLS, SQL migrations, Edge Functions, Expo, Zod, OneSignal.

**Spec:** `docs/superpowers/specs/2026-08-31-progresion-senderos-metas-design.md`

## Global Constraints

- `estudio` es la unica categoria activa; futuras categorias existen solo como catalogo `proximamente`.
- Cada sendero tiene una meta de aprendizaje. El servidor crea una meta semilla cuando la persona no desea configurar una vision.
- Una seccion contiene cinco nodos de aprendizaje y una evaluacion final; cada cofre de seccion paga diez gemas una sola vez tras aprobarla.
- `lesson_pack` es versionado, validado y renderizado mediante bloques permitidos; Expo nunca interpreta instrucciones libres de IA.
- Ningun resultado de leccion, dominio, cofre, gemas o programacion se modifica directamente desde Expo.
- Las fuentes son privadas, requieren declaracion de derecho de uso y no se reutilizan para plantillas ni contenido publico.
- Una plantilla publica es una definicion versionada e inmutable; instalarla crea un camino privado independiente y nunca comparte progreso, fuentes, respuestas ni gemas.
- Toda tabla personal tiene RLS antes de datos de produccion; la Edge Function vuelve a leer permisos antes de enviar informacion a Aby.
- El schema `privacidad` nunca se agrega a Supabase "Exposed schemas"; sus funciones con privilegios viven alli y `public` solo ofrece wrappers `security invoker` para el cliente autenticado.
- Supabase decide estado, agenda y cancelaciones de notificaciones; OneSignal solo entrega una cola idempotente.
- La venta futura de suscripcion, gemas o funcionalidades digitales usa StoreKit y Google Play Billing validados en servidor.
- El MVP es 13+ y no activa Salud, Finanzas, grupos, marketplace, URL procesable ni investigacion web.

---

### Task 1: Plataforma comun, privacidad y catalogo de categorias

**Files:**
- Create: `docs/base-datos/contrato-nucleo-aprendizaje.md`
- Create: `supabase/migrations/20260903_01_plataforma_privacidad_catalogo.sql`

- [ ] **Step 1: Auditar esquema remoto y decidir eliminacion heredada**

Usar MCP para listar tablas, migraciones, asesores de seguridad y conteos de `senderos`, `sendero_nodos`, `sendero_conexiones`, `usuario_nodo_progreso`, `sendero_registros` y `aby_generation_locks`. Si cualquier tabla heredada tiene filas, detener la migracion y documentar una conversion. Si todas estan vacias, eliminar en orden de dependencia solo las tablas de dominio heredadas antes de crear el nuevo contrato.

- [ ] **Step 2: Crear tablas transversales y catalogo**

Crear `perfiles_usuario`, `documentos_legales`, `responsables_privacidad`, `preferencias_notificacion_usuario` y `catalogo_notificaciones` en `public`. Crear el schema no expuesto `privacidad` para `usuario_permisos_datos`, `auditoria_permisos_datos`, `aceptaciones_documentos_legales`, `solicitudes_privacidad`, `incidentes_privacidad`, `dispositivos_notificacion` y `presupuestos_notificacion_usuario`. Crear `categorias_producto(codigo, nombre, estado, orden_visual)` y sembrar `estudio` como `activa`; sembrar Salud, Finanzas, Rutinas, Habitos, Tareas y Relaciones como `proximamente`. Crear las RPCs públicas `obtener_permisos_datos`, `actualizar_permisos_datos`, `obtener_aceptaciones_legales`, `aceptar_documento_legal`, `obtener_solicitudes_privacidad_activas`, `crear_solicitud_privacidad`, `registrar_dispositivo_notificacion` y `desvincular_dispositivo_notificacion` como wrappers `security invoker` de funciones `security definer` no expuestas. Las mutaciones escriben auditoria o son idempotentes; las lecturas devuelven solo el estado minimo de la persona autenticada.

- [ ] **Step 3: Aplicar RLS y pruebas de aislamiento**

Aplicar RLS a toda tabla personal y no agregar `privacidad` a schemas expuestos. La migracion debe fallar si el propietario de una funcion `security definer` privada no tiene `BYPASSRLS`. Exponer el catalogo de categorias solo en lectura. Probar con dos usuarios autenticados reales, no desde SQL Editor o service role, que los wrappers públicos no devuelven permisos, aceptaciones, solicitudes ni dispositivos ajenos; que revocar los tres permisos conserva la auditoria y actualiza `revocado_at`; que reenviar el mismo consentimiento no reescribe `otorgado_at`; que la aceptacion legal y una solicitud duplicada son idempotentes; que transferir un dispositivo no hereda preferencias del usuario anterior; y que un logout antiguo no desactiva un dispositivo ya transferido. Confirmar con asesores de Supabase que RLS esta habilitado.

### Task 2: Vision, metas, caminos, secciones y fuentes privadas

**Files:**
- Create: `supabase/migrations/20260902_02_camino_aprendizaje_fuentes.sql`
- Modify: `src/modulos/senderos/tipos.ts`
- Create: `src/modulos/senderos/dominio/caminoAprendizaje.schema.test.ts`

- [ ] **Step 1: Escribir prueba de jerarquia y categoria activa**

Crear una prueba Zod que rechace un camino sin `metaId`, una seccion sin cinco nodos de aprendizaje mas evaluacion y un camino creado con categoria `proximamente`.

- [ ] **Step 2: Crear el nucleo de aprendizaje**

Crear `visiones`, `metas`, `senderos`, `sendero_niveles`, `sendero_nodos`, `sendero_conexiones`, `usuario_nodo_progreso` y `sendero_eventos`. `metas.vision_id` es nullable; `senderos.meta_id` no lo es. `senderos.categoria_codigo` referencia `categorias_producto` y un trigger exige `estado = activa`. `sendero_niveles` usa `tipo = seccion` y numero unico por sendero. Un trigger exige cinco nodos de tipo aprendizaje y uno de tipo evaluacion antes de activar una seccion; activar contenido lo vuelve inmutable.

- [ ] **Step 3: Crear fuentes y conceptos**

Crear `fuentes_aprendizaje`, `fragmentos_fuente`, `conceptos_aprendizaje` y `nodo_conceptos`. Una fuente registra tipo, hash, metadatos, estado, declaracion de derecho y propietario. Los fragmentos y relaciones de conceptos conservan RLS por la cadena fuente -> sendero -> meta. El almacenamiento de PDF usa ruta privada; la tabla no guarda binarios.

- [ ] **Step 4: Verificar contratos de dominio**

Ejecutar la prueba focalizada y `npm run typecheck`. Con MCP confirmar las FKs, indices de orden, unicidad de numero por sendero y que una fuente no puede ser leida por otra cuenta.

### Task 3: Lecciones, intentos, dominio, repaso y evaluacion de seccion

**Files:**
- Create: `supabase/migrations/20260902_03_lecciones_dominio_evaluaciones.sql`
- Create: `src/modulos/senderos/dominio/lessonPack.schema.ts`
- Create: `src/modulos/senderos/dominio/lessonPack.schema.test.ts`
- Create: `src/modulos/senderos/servicios/completarLeccion.servicio.ts`

- [ ] **Step 1: Escribir pruebas de `lesson_pack`**

Validar que un pack sin `version`, con un bloque no permitido, sin concepto, sin criterio de aprobado o sin referencia de fuente valida sea rechazado. Incluir un pack valido con explicacion, ejemplo, eleccion multiple y repaso.

- [ ] **Step 2: Persistir intentos y dominio**

Crear `intentos_leccion`, `respuestas_leccion`, `dominio_concepto_usuario`, `cola_repaso` y `evaluaciones_seccion`. Los intentos y respuestas son append-only. `evaluaciones_seccion` vincula exactamente un nodo de evaluacion por seccion; su blueprint declara proporcion de conceptos actuales y previos. La cola tiene clave unica por usuario y concepto para no programar el mismo repaso dos veces.

- [ ] **Step 3: Crear RPC de resultado idempotente**

Implementar `registrar_resultado_leccion(intento_id, respuestas, idempotency_key)`. Revalida propiedad, bloque, respuestas y estado; registra una sola vez el resultado, actualiza dominio, marca nodo aprobado cuando corresponde, inserta `sendero_eventos` y crea repaso o recuperacion cuando el dominio no alcanza el umbral. Ningun resultado se acepta desde un booleano de Expo.

- [ ] **Step 4: Verificar recuperacion y mezcla de examen**

Probar una seccion inicial que evalua solo conceptos propios y una segunda que incorpora conceptos previos de dominio bajo. Probar doble envio de un intento y confirmar un solo evento, un solo ajuste de dominio y una sola entrada de repaso.

### Task 4: Hoy, sesiones programadas y notificaciones de estudio

**Files:**
- Create: `supabase/migrations/20260902_04_hoy_notificaciones_estudio.sql`
- Create: `src/modulos/senderos/dominio/ejecucionNodo.test.ts`
- Create: `src/modulos/senderos/servicios/ejecucionesHoy.servicio.ts`
- Create: `supabase/functions/despachar-notificaciones/index.ts`

- [ ] **Step 1: Modelar actividades de estudio y ejecuciones**

Crear `sendero_programaciones`, `ejecuciones_nodo`, `eventos_hoy` y `resoluciones_nodo`. Los tipos de actividad permitidos son `leccion`, `rutina_estudio`, `habito_estudio`, `tarea_estudio` y `repaso`. `ejecuciones_nodo` tiene unicidad por usuario, nodo y fecha local; conserva hora ancla, flexibilidad, zona horaria e intervalo UTC. Usar exclusion constraint para impedir solapamientos salvo confirmacion explicita.

- [ ] **Step 2: Crear cola de notificaciones**

Crear `notificaciones_programadas`, `notificaciones_entregas` y `notificacion_interacciones`. Sembrar los codigos de Estudio definidos en la especificacion. Exigir una sola fuente por aviso: ejecucion o evento de Hoy. El payload contiene solo `notification_id`, ruta y referencias opacas.

- [ ] **Step 3: Despachar desde servidor con limites**

La Edge Function toma avisos pendientes con bloqueo transaccional, vuelve a leer ejecucion, preferencias, permiso nativo, ventana silenciosa y presupuesto antes de enviar con OneSignal. Reserva maximo dos proactivas por fecha local con cuatro horas de separacion, no cuenta recordatorios de horario activados explicitamente y registra cada entrega o cancelacion.

- [ ] **Step 4: Verificar agenda y privacidad**

Probar que dos intentos de crear la misma ejecucion generan una fila, que editar o completar una ejecucion cancela sus avisos, que una tercera proactiva es denegada y que el texto de bloqueo de pantalla no incluye titulo, fuente, respuesta ni resultado de examen.

### Task 5: Aby, plantillas compartibles, cofres, entitlements futuros y rollout seguro

**Files:**
- Create: `supabase/migrations/20260902_05_aby_plantillas_recompensas_entitlements.sql`
- Modify: `supabase/functions/generar-sendero-aby/index.ts`
- Create: `supabase/functions/aceptar-propuesta-aby/index.ts`
- Create: `supabase/functions/instalar-plantilla-sendero/index.ts`
- Create: `src/modulos/aby/dominio/propuestaAprendizaje.schema.ts`
- Create: `src/modulos/senderos/dominio/plantillaSendero.schema.ts`
- Modify: `docs/base-datos/contrato-nucleo-aprendizaje.md`

- [ ] **Step 1: Crear propuestas y protecciones de Aby**

Crear `aby_conversaciones`, `aby_turnos`, `aby_propuestas`, `aby_generation_locks`, `aby_sesiones` y `decisiones_contexto`. Una propuesta contiene fuentes autorizadas, meta, camino, secciones, conceptos y `lesson_pack` validados. La Edge Function lee permisos actuales, aplica lock por usuario y fuente, y nunca activa contenido directamente.

- [ ] **Step 2: Aceptar propuestas de forma atomica**

Implementar la aceptacion transaccional que revalida propiedad, version de contexto y derecho de uso de fuentes. Inserta meta semilla si hace falta, camino, secciones, nodos, conceptos y conexiones como borrador; solo entonces activa el primer contenido valido. Probar que una propuesta vencida, ajena o duplicada no escribe contenido.

- [ ] **Step 3: Modelar recompensa y monetizacion sin cobrar**

Crear `reglas_recompensa`, `sendero_cofres`, `recompensas_usuario`, `movimientos_gemas`, `productos_tienda`, `entitlements_usuario` y `transacciones_compra`. Asociar un cofre a la evaluacion de cada seccion, con recompensa fija de diez gemas y unicidad por usuario y cofre. `entitlements_usuario` soporta `gratis` y futuro `pro`, pero el MVP no muestra compra ni valida recibos.

- [ ] **Step 4: Crear plantillas, versiones, enlaces e instalaciones privadas**

Crear `plantillas_sendero`, `plantilla_versiones`, `enlaces_plantilla` e `instalaciones_plantilla`. Una plantilla contiene autor, titulo, resumen, portada, categoria activa, estado de publicacion y slug unico. Cada version guarda un snapshot validado de secciones, nodos, conceptos, conexiones, decoracion y `lesson_pack`; no puede referenciar `fuentes_aprendizaje`, fragmentos, intentos, respuestas, progresos, ejecuciones, cofres reclamados ni movimientos de gemas. `enlaces_plantilla` referencia una version publicada, tiene codigo unico revocable y campo opcional `origen_campana`. `instalaciones_plantilla` vincula usuario, version, enlace opcional y el nuevo sendero privado; impone unicidad por usuario y plantilla para evitar instalar la misma plantilla repetidamente como forma de farmear recompensas.

El MVP permite publicar solo plantillas oficiales de Lestinaty. El esquema conserva `autor_usuario_id`, `tipo_autor` y estados `borrador`, `revision`, `publicada`, `suspendida`, `retirada` para habilitar creadores de comunidad despues, con moderacion antes de cualquier publicacion ajena.

- [ ] **Step 5: Instalar una plantilla mediante RPC atomica**

Implementar `instalar_plantilla(plantilla_version_id, enlace_codigo nullable, idempotency_key)`. La funcion valida que la version esta publicada, que el enlace es vigente cuando existe y que el usuario no tiene una instalacion previa. En una transaccion crea una meta semilla privada, duplica el snapshot como sendero, secciones, nodos, conceptos y conexiones propios, inserta la instalacion y un evento de sendero. No copia fuentes privadas ni crea progreso, intentos, ejecuciones, recompensas o gemas del autor. Una actualizacion de plantilla crea una version nueva y nunca altera caminos ya instalados.

- [ ] **Step 6: Crear RPC antigranja y pruebas finales**

Implementar `reclamar_cofre(cofre_id)` para validar evaluacion aprobada, bloquear fila, crear una recompensa y un movimiento idempotente. Probar doble toque, dos dispositivos y repeticion de examen: solo el primer aprobado puede acreditar diez gemas. Probar que instalar una plantilla dos veces crea un solo sendero, que un enlace revocado no instala, que un usuario no puede leer instalaciones o caminos derivados de otro y que una version nueva no modifica instalaciones anteriores. Ejecutar `npm test -- --run`, `npm run typecheck`, `git diff --check`, asesores de seguridad y pruebas manuales con dos cuentas.

## Decisiones que este plan deja visibles para revision de producto

1. Si el camino gratuito es uno activo por usuario o un limite distinto.
2. El umbral exacto de aprobado por nodo y por evaluacion de seccion.
3. La formula de repeticion espaciada y limite diario de repasos.
4. Que tipos de archivo acepta el primer lanzamiento y su limite de tamano.
5. Que beneficios concretos recibe Pro antes de habilitar compras.
6. Cuando habilitar URL, investigacion web, grupos de estudio, profesores y contenido publico.
7. Que plantillas oficiales se lanzan primero y que metrica de atribucion se muestra para cada enlace de campana.
