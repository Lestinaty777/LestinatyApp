# Progresion de Aprendizaje en Lestinaty

> **Estado:** borrador v2. Sustituye el modelo de siete categorias activas y Direcciones con hitos compuestos. Conserva sus garantias de seguridad, agenda, notificaciones, auditoria y economia.

## Objetivo

Lestinaty crea caminos guiados para dominar un tema. El primer producto activo es **Estudio**: una persona indica un tema o aporta una fuente y Aby propone un camino revisable de lecciones, practicas, repasos y evaluaciones. Salud, Finanzas y las demas categorias se mantienen como catalogo futuro, sin contenido ni automatizacion activos en el MVP.

## Jerarquia y lenguaje de UI

`Vision opcional` -> `Meta de aprendizaje` -> `Camino` -> `Seccion` -> `Nodo` -> `Leccion o evaluacion`.

- Una `vision` es un horizonte grande y opcional, por ejemplo "Aprobar Medicina en 2027". Agrupa metas; nunca obliga a completar un formulario largo.
- Una `meta` es un resultado de aprendizaje, por ejemplo "Dominar Anatomia basica". Si la persona crea un solo camino, el servidor crea una meta semilla y la UI puede ocultarla.
- Un `sendero` conserva el nombre tecnico y visual de camino. Pertenece a una meta y tiene una unica categoria activa: `estudio`.
- Un `sendero_nivel` se presenta como **seccion**, no como nivel competitivo. En el MVP una seccion tiene exactamente siete nodos de aprendizaje y un nodo final de evaluacion.
- Un `sendero_nodo` representa una leccion, practica, repaso o evaluacion. No es una tarea generica ni puede marcarse completado sin el resultado validado de su leccion.

La categoria se conserva en `senderos` y los recursos de diseno la heredan desde alli. `categorias_producto` contiene `estudio` activa y las futuras categorias con `estado = proximamente`; ningun cliente puede crear un sendero fuera de una categoria activa.

## Fuentes y contenido confiable

Una persona puede iniciar un camino con un tema libre, texto propio, apuntes o PDF. Las URL y la investigacion web quedan fuera de la primera entrega, pero el modelo admite esas clases de fuente sin migracion posterior.

- `fuentes_aprendizaje` registra propietario, clase (`tema`, `texto`, `archivo`, `url`), titulo, estado de procesamiento, hash, idioma y declaracion de derecho de uso.
- Los archivos y el texto original son privados. Solo Edge Functions con autorizacion pueden leerlos; nunca se publican, se usan para entrenar modelos ni aparecen en plantillas comunitarias.
- `fragmentos_fuente` contiene extractos privados, posicion y referencia de procedencia para fundamentar una leccion. No guarda el documento completo duplicado.
- Cada bloque que use una fuente incluye referencias a `fragmentos_fuente` o se declara como conocimiento general. Aby no debe presentar una afirmacion como procedente de una fuente si no puede enlazarla.

Antes de procesar un archivo, la UI pide confirmar que la persona tiene derecho a usarlo para su aprendizaje privado. La app no permite publicar ni revender caminos basados en fuentes privadas.

## Lecciones, dominio y evaluacion

`lesson_pack` sustituye al anterior `action_pack`. Es un JSONB versionado y validado en servidor y TypeScript; Expo solo renderiza bloques aprobados.

Bloques permitidos de MVP: `explicacion`, `ejemplo_resuelto`, `eleccion_multiple`, `completar`, `emparejar`, `ordenar`, `respuesta_corta` y `repaso`.

Un nodo usa de tres a seis bloques y declara concepto, objetivo, dificultad, fuentes, criterio de aprobado y tiempo estimado. `intentos_leccion` y `respuestas_leccion` son append-only; una RPC verifica las respuestas objetivas, calcula el resultado y registra el evento. La IA no acredita nodos desde el cliente.

`conceptos_aprendizaje` y `dominio_concepto_usuario` separan el contenido del dominio de cada usuario. Un resultado aprobado aumenta el dominio; un resultado insuficiente crea de uno a tres nodos de recuperacion o una entrada en `cola_repaso`, nunca castiga con vidas. La cola usa repeticion espaciada y se alimenta desde intentos, no desde una mutacion de UI.

Cada seccion tiene siete nodos de aprendizaje y una evaluacion de seccion. La primera evaluacion cubre su propia seccion. Las posteriores se componen principalmente de la seccion actual y agregan preguntas de conceptos previos con dominio bajo. Un examen fallido abre recuperacion y genera variantes equivalentes, no la misma bateria de preguntas.

## Hoy, sesiones y notificaciones

`Hoy` responde "que conviene hacer ahora" y no duplica el mapa. Proyecta lecciones programadas, rutinas de estudio, habitos de estudio, tareas de estudio y repasos generados por `cola_repaso`.

`sendero_programaciones`, `ejecuciones_nodo`, `eventos_hoy` y la cola de OneSignal conservan el contrato existente: fecha local, zona horaria, idempotencia, revalidacion de estado, ventana silenciosa y payload opaco. La base rechaza solapamientos que no hayan sido confirmados como permitidos.

Los avisos del MVP son `hoy_sesion_proxima`, `hoy_sesion_inicio`, `hoy_repaso_pendiente`, `hoy_evaluacion_disponible`, `hoy_cofre_disponible`, `hoy_resumen_diario` y `hoy_racha_recuperable`. Las proactivas siguen limitadas a dos por dia local y separadas al menos cuatro horas; los recordatorios explicitamente solicitados no consumen ese presupuesto.

## Aby, gemas y suscripcion

Aby genera una propuesta temporal y confirmable de meta, camino, secciones, nodos y `lesson_pack`. Una aceptacion transaccional crea el contenido inmutable activo. Aby puede proponer recuperacion o replanificacion, pero no completar nodos, programar sesiones ni modificar progreso sin confirmacion humana.

Las gemas se obtienen al aprobar una seccion por primera vez: un cofre de diez gemas se vincula a su evaluacion y puede reclamarse una sola vez por usuario. `movimientos_gemas` continua siendo un ledger append-only; ningun cliente modifica saldo. Las gemas no desbloquean lecciones, respuestas correctas ni aprobados.

El producto gratuito permite crear y completar el primer camino activo. Una futura suscripcion Pro concede multiples caminos activos, generacion o adaptacion adicional, simulacros, mas contexto para Aby y capacidad de fuentes ampliada. Los creditos de gemas solo cubren acciones opcionales como regenerar una seccion o un simulacro adicional. Cualquier venta digital en iOS o Android se valida exclusivamente con StoreKit o Google Play Billing desde servidor.

## Plataforma, privacidad y futuro

Se conservan perfiles, RLS, permisos de datos, auditoria, solicitudes de exportacion y eliminacion, documentos legales, dispositivos OneSignal y registros de incidentes. El piloto es para personas de 13 anos o mas. La privacidad de las fuentes se trata como dato sensible de producto: no se mezcla con datos de otros usuarios ni se envia a Aby sin el permiso vigente leido en servidor.

Las futuras categorias reutilizaran `vision -> meta -> sendero -> seccion -> nodo`, pero introduciran sus propios tipos de nodo y de actividad. Salud y Finanzas no se implementan ni se exponen como funcionales en este MVP. Grupos de estudio, profesores, plantillas publicas, torneos y marketplace se mantienen fuera de la primera entrega; sus tablas futuras no podran leer intentos, respuestas, fuentes ni sesiones privadas de una persona.

## Fuera de alcance inicial

- Investigacion web automatica y URL como fuente procesable.
- Subidas publicas de libros, apuntes o caminos derivados de material privado.
- Compras reales, validacion de recibos y suscripcion Pro activa.
- Grupos, profesores, invitaciones, chat, torneos y marketplace.
- Salud, Finanzas y cualquier categoria distinta de Estudio.
- Vidas, castigos por fallar, respuestas generadas sin revisar o desbloqueo pagado de progreso.
