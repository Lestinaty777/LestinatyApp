# Senderos progresivos: Hábitos, Rutinas y Tareas

## Objetivo

Reemplazar la idea original de "sendero = curso con lecciones" (solo `estudio`) por dos mecánicas de sendero más simples, más baratas y más honestas con lo que cada categoría realmente es. Estudio y Metas quedan congelados como capa premium futura, no como parte de este MVP.

## Las dos mecánicas de sendero

**Sendero de niveles** (Hábitos, Rutinas): infinito, cada nodo es un nivel de dificultad. Avanza solo con desempeño sostenido, nunca por contenido generado. Ya construido para Hábitos (ver abajo); Rutinas lo reusa generalizando el mismo core en vez de duplicarlo.

**Sendero de pasos** (Tareas grandes): finito y lineal, cada nodo es un paso concreto hacia completar la tarea (ej. "Preparar examen de matemáticas" → Definir temario → Reunir apuntes → Resolver ejercicios → Repasar errores → Simulacro final). Reusa las tablas ya existentes de `senderos`/`sendero_niveles`/`sendero_nodos` (las mismas que servían a `estudio`), cambiando `categoria_codigo` y el vocabulario de `tipo` de nodo. Solo aplica a tareas con varios pasos; una tarea simple no lleva sendero, solo checklist + fecha. Para el MVP los pasos los escribe la persona a mano; el desglose asistido por IA es una mejora posterior, no una dependencia.

Tareas de una vez que son simples (sin pasos) quedan fuera de ambas mecánicas: checklist plano.

## Sendero de niveles — ya construido (Hábitos)

Migración `20260910_11_habitos_niveles_progresivos.sql` (aplicada en producción, tablas en 0 filas al momento de aplicarla):

- `habitos_planes` gana `nivel` (hereda del plan anterior salvo subida), `origen` (`usuario` | `subida_nivel`), `mensaje_nivel` (texto de celebración, empieza genérico, redactable por IA después sin bloquear nada).
- `registrar_progreso_habito` evalúa, tras guardar el registro del día, si el plan vigente lleva ≥14 días activo y sostuvo ≥80% de cumplimiento en las dos ventanas de 7 días más recientes (mínimo 3 días programados por ventana). Si se cumple: cierra el plan vigente e inserta uno nuevo con `nivel + 1` y el objetivo +15% redondeado (los hábitos tipo `check` no escalan el número, solo el nivel). La regla es 100% determinista; nunca depende de una llamada a IA para progresar. Regla: **solo avanza, nunca degrada** — un mal período detiene la subida, no hace retroceder.
- El RPC devuelve `subio_nivel` y `nivel` para que el cliente celebre en el momento.

UI (`DetalleHabitoPantalla.tsx`): ya no es una pantalla nueva — es `HojaDeslizante` (nuevo primitivo en `src/diseno/componentes/`, gesto de arrastre para cerrar) presentada como `transparentModal` sobre `HabitosPantalla`, para no perder la sensación de "seguir en la misma pantalla". Dentro: ícono real del hábito (`buscarIconoHabito`, ya existía pero no se usaba aquí), diorama del bioma elegido al crear el hábito (`coloresHabitos`, assets ya existentes), `AnilloProgreso` (nuevo primitivo, SVG + reanimated) en vez del círculo estático, pill de nivel, celebración con haptic al `subio_nivel`.

`ContenedorMapaSenderos`/`NodoSendero` (el mapa voxel visual) no necesitaron ningún cambio — ya eran agnósticos de "estudio"; el único punto atado era un stub de navegación a `/senderos/leccion` que hay que desconectar cuando se construya la fuente de nodos real (niveles → `NodoMapaSendero`, ventana deslizante de los últimos ~3 niveles superados + el activo + 2-3 placeholders bloqueados, no todo el historial).

## Pendiente: Rutinas

Hoy no existe backend (0 tablas, 0 RPCs; el catálogo marca `rutinas` como `proximamente`). En vez de construir un sistema paralelo, generalizar el core de hábitos: una rutina es un hábito compuesto — su `configuracion` describe bloques/pasos en vez de una cantidad numérica simple. Reusa `registrar_progreso_habito`/la regla de nivel/`AnilloProgreso`/`HojaDeslizante`; solo cambia qué significa "completar hoy" (marcar bloques vs. una cantidad).

UI de referencia para el hub (lista de rutinas, análogo a `HabitosPantalla`): mockup compartido 2026-09-11, con chips de subcategoría que ya coinciden con `subcategoriasPorCategoria.rutinas` existente (mañana/tarde/noche/entrenamiento/reinicio). Para el MVP, recortar la fila de accesos "Programación/Progreso/Rachas/Logros" del mockup a solo lo esencial (misma disciplina que aplicamos a Hábitos al ocultar analíticas). Tocar una rutina abre su propia hoja de sendero de niveles, igual que un hábito.

## Pendiente: Tareas grandes

Reusar `senderos`/`sendero_niveles`/`sendero_nodos` (las tablas de "estudio", con esquema flexible/jsonb) con `categoria_codigo = 'tarea'` y nodos tipados como paso simple, mini-lista, acción breve tipo rutina, o hábito asociado — no lección/evaluación. Creación manual para el MVP (la persona escribe sus pasos); desglose asistido por IA es fase 2 y, cuando llegue, es candidato natural a función de pago (ver Monetización).

## Alcance recortado del MVP

- Estadísticas de Hábitos (patrones/conexiones/riesgo/impacto): el backend (`obtener_panel_habitos`) se queda tal cual, con tests — se oculta la UI, no se borra. Candidato a resucitar como feature Pro.
- Estudio y Metas: congelados por completo, no se tocan. Candidatos a ser la capa premium cuando el MVP gratuito ya funcione y tenga tracción.

## Monetización (decisiones de dirección, no implementación aún)

Secuencia acordada: núcleo gratuito primero (Hábitos + Rutinas + Tareas con sendero), monetizar después sobre una base que ya funciona — no al revés.

- **Capa premium futura**: Estudio y Metas (ya construidos, solo congelados), analíticas de Hábitos resucitadas, desglose de tareas asistido por IA, ajuste de dificultad de hábitos con contexto real vía IA en vez de la fórmula fija. El criterio: si la llamada a Gemini cuesta dinero variable real, es candidata a gate de pago.
- **Tienda cosmética**: skins de bioma para el sendero (ya hay 7 biomas completos en `coloresHabitos` con assets; el MVP los da todos gratis — monetizar es simplemente bloquear algunos detrás de gemas/compra en el mismo selector de `CrearHabitoWizard`) e ilustraciones alternas para el home. Cosmético puro, nunca ventaja de progreso — mantiene el sendero de niveles justo y gratis para todos.
- **Hueco técnico pendiente, no bloqueante hoy**: las gemas mostradas en la UI (`235`, `1,250`) son texto fijo, no hay balance real ni inventario de desbloqueados. Se necesita esa base antes de vender nada.

## Hallazgo clave: el motor de widgets de acción ya existe

`src/modulos/senderos/motor/sdui/` ya tiene un motor genérico de "cómo se completa un nodo", separado del motor de lecciones (`motor/sdui/lecciones/`, ese sí específico de estudio). Contrato: un nodo tiene un `ActionPack` con un widget **principal** y hasta dos de **apoyo** (`WidgetAccionPack`); cada widget recibe `color/config/estado/onEvento` y emite `onEvento({tipo:'completado',...})` sin tocar navegación ni progreso global. Ya construidos y funcionando (no placeholders): `contador`, `cronometro` (con anillo SVG, play/pause, haptics, sonido), `registro`, `checklist-asistida`, `escala`, `decision`, `kanban`, `foco`. Faltan componentes para `eisenhower` y `planificador-semanal` (están en `IDS_WIDGET_ACCION` pero sin `Componente` en el registro).

Esto resuelve directamente el "cómo se completa un nodo" tanto del sendero de pasos (tareas: `checklist-asistida` o `kanban` por paso) como de bloques dentro de una rutina (`cronometro`/`foco` por bloque). `aby.contrato.ts` ya tiene el esquema para que la IA asigne el widget a un nodo — infraestructura lista para la fase 2 de IA, sin que se haya pedido en esta ronda.

Hoy solo es alcanzable como demostrador en `/senderos/analisis` (`RutinasAnalisis.tsx`, con datos mock y `onEvento` que solo hace `console.log`). Pendiente real: (1) persistir el evento de completado contra el nodo/registro correspondiente en vez de estado local, (2) para el MVP, asignar el widget de cada nodo a mano al crearlo (la asignación por IA es fase 2, ya con contrato listo).

## Fila de accesos compartida (Hábitos, Rutinas, Tareas)

Cada pantalla de categoría tiene siempre 4 tarjetas: tres compartidas + una que varía. Construidas en Rutinas (`RutinasPantalla.tsx`, componente `ACCESOS`); Hábitos y Tareas repiten el mismo molde cuando se construyan.

- **Creación** — acceso directo a crear un ítem nuevo (mismo destino que el botón principal de la pantalla).
- **Recordatorios** — hora en que se avisa cada ítem. Para Hábitos ya hay base real (`habitos_planes.recordatorio_activo`/`hora_recordatorio` + la edge function de notificaciones ya despacha avisos); para Rutinas y Tareas es "próximamente" hasta generalizar ese patrón.
- **Insights** — analítica de la categoría. Para Hábitos ya es real (envuelve `patrones/conexiones/riesgo/impacto`, hoy oculto tras pestañas); para Rutinas y Tareas es "próximamente" hasta que tengan backend.
- **Variable por categoría**: Rutinas → *Programación* (horario, ya funcional). Hábitos → *Progresión* (vista de niveles, propuesta, no construida). Tareas → *Prioridades* (matriz Eisenhower — coincide con `eisenhower`, que ya está en `IDS_WIDGET_ACCION` sin componente todavía).

Se descartó nombrar esto "Forja" (sonaba a yunque/herrería) y también "Retos" para el tercer compartido (se prefirió Recordatorios por ser más barato de construir de verdad pronto, al reusar infraestructura ya existente). No se necesitó nombre final para el concepto de "módulos" porque se resolvió como *Mi espacio* (ver abajo), no como una tarjeta de esta fila.

## Mi espacio: cuarto lente, no una tarjeta más

Idea: agrupar hábitos, rutinas y tareas por **dominio de vida** (Mente/Cuerpo/Salud/…) en vez de por mecánica — alguien piensa "cuidar mi cuerpo", no "tengo un hábito, una rutina y una tarea". Cada dominio podría ser uno de los 7 biomas ya existentes en `coloresHabitos` (Arces = Cuerpo/rojo, Selva viva = Salud/verde, Sauces antiguos = Mente/morado, etc.) — cero arte nuevo.

Se descartó meterlo como tarjeta dentro de Hábitos/Rutinas/Tareas: abrir "Hábitos" y aterrizar en algo que dice "Salud" es una navegación confusa (mezclas mecánica con dominio). Se promovió a **nivel superior**: pantalla propia (`MiEspacioPantalla`, placeholder "próximamente" por ahora), con dos puntos de entrada — una tarjeta en Hoy y una pestaña en la barra inferior. La pestaña reusa el slot de **Metas** que ya estaba oculto (`app/(principal)/_layout.tsx`), sin agregar una sexta pestaña.

Sin contenido real todavía — es una idea grande que merece su propio diseño cuando se le dé forma, no una tarjeta apurada.

## Flujo de Hábitos — completo

Primer flujo terminado de punta a punta, sirve de referencia para Rutinas y Tareas.

- **Fila de 4 accesos** en `HabitosPantalla.tsx`: Progresión, Creación, Recordatorios, Insights.
- **Insights es real** — no hubo que construir nada: `CategoriaHabitosPantalla.tsx` (ruta `/habitos/categoria/[id]`) ya existía completa, con su propio selector entre patrones/conexiones/riesgo/impacto/hoy. Solo se conectó el acceso. Se quitaron de `HabitosPantalla` las 5 pestañas de categoría y el render de analítica en línea que quedaban duplicados con esa pantalla.
- **Progresión (nueva)** — `ProgresionHabitosPantalla.tsx` (`/habitos/progresion`): lista de hábitos con su `nivel` actual.
- **Recordatorios (nueva)** — `RecordatoriosHabitosPantalla.tsx` (`/habitos/recordatorios`): a qué hora avisa cada hábito, de solo lectura (editar sigue siendo desde el wizard).
- Ambas pantallas nuevas comparten una sola función de datos: `obtenerResumenPlanesHabitos()` en `habitos.servicio.ts` (ítems activos + su plan vigente: nivel, recordatorio_activo, hora_recordatorio).
- El widget de racha (7 días de la semana) se mantuvo igual — a diferencia de Rutinas, sí encaja con la naturaleza de un hábito.

Rutinas y Tareas repiten este mismo molde de 4 tarjetas cuando se construyan, con su propia variable (Programación / Prioridades) y sus versiones de Insights/Recordatorios "próximamente" hasta tener backend.

## Niveles generados por IA (una vez, no en cada subida)

Evolución del sendero de niveles: en vez de que `registrar_progreso_habito` calcule siempre +15%, ahora primero busca en `habitos_niveles_plan` (migración `20260911_12_habitos_niveles_plan.sql`, aplicada) si ya existe una fila para `nivel + 1` — generada por IA una sola vez, al crear el hábito, no en cada subida. Si no hay fila (todavía no se generó, o ya se pasó del nivel 7), cae de vuelta a la fórmula fija de siempre. La regla de cuándo subes de nivel sigue siendo 100% determinista; solo cambia de dónde sale el número. Esto también le da progresión real a los hábitos tipo "check" (hoy no tenían nada que escalar) — la IA puede variar frecuencia o contexto en vez de solo una cantidad.

Pendiente (siguiente paso, no construido todavía): la función que genera esas 7 filas llamando a Gemini al crear el hábito, con la fórmula como respaldo si falla. Mismo patrón que `generar-sendero-aby`.

Con una hoja de ruta finita y conocida de 7 niveles, conectar el mapa visual (`ContenedorMapaSenderos`) deja de necesitar nodos-placeholder especulativos — ya se sabe de antemano cuántos nodos hay.

## Hábitos: verde único, tono por nivel

Se retiró la elección libre de color/bioma al crear un hábito (`coloresHabitos`, 7 combinaciones). Ahora todo hábito es verde; el tono se oscurece con el nivel (`tonoVerdeNivel()` en `iconosHabitos.ts`, 7 factores de oscurecimiento sobre `#22C55E`) — el color visualiza el progreso, no es una decisión del usuario. Aplicado ya en `ProgresionHabitosPantalla` (ícono, pill de nivel, fila de 7 puntos de progreso). Pendiente: aplicarlo también en `DetalleHabitoPantalla` y la lista de `HabitosPantalla`, y quitar el selector de color/bioma de `CrearHabitoWizard` (no se tocó todavía — es un flujo que ya funciona bien).

Los 6 biomas no verdes (Pinos nevados, Bosque dorado, Bosque cálido, Arces, Cerezos, Sauces antiguos) no se borran — quedan como candidatos a skins desbloqueables cuando se construya la tienda de gemas.

## Tarjeta destacada y cuadrícula de hábitos

`HabitosPantalla` reemplazó el `TabChanger` (Categorías/Hábitos) por una sola vista: una cuadrícula de tarjetas cuadradas (3 por fila), cada una con `AnilloProgreso` mostrando el avance de hoy. El toggle no aportaba nada real — ambas pestañas renderizaban la misma lista.

Debajo de los 4 accesos, una tarjeta condicional **"A punto de subir de nivel"** destaca el hábito con mejor cumplimiento en sus dos ventanas de 14 días (`obtenerHabitoMasCercaDeNivel()` en `habitos.servicio.ts`, replica en JS el mismo cálculo que la regla de subida en SQL, de solo lectura). Usa el mínimo de las dos ventanas como "qué tan cerca estás", porque esa es la que frena la subida. No aparece si ningún hábito lleva 14 días en su nivel actual todavía.

## Progresión incrustada, no navegada

Tocar la tarjeta "Progresión" ya no navega a `/habitos/progresion` — actualiza el panel inferior de `HabitosPantalla` en la misma pantalla (título y contenido cambian, la tarjeta se resalta, tocarla de nuevo vuelve a "Hoy"). La lista se extrajo a `ListaProgresionHabitos` (componente puro, sin header) para que la use tanto la vista incrustada como la ruta standalone `/habitos/progresion`, que se deja viva para deep-links (ej. desde una notificación) aunque no sea el camino principal.

Regla para decidir cuándo algo se incrusta vs. navega: si el destino es **sobre la misma categoría** (Progresión e Insights son sobre hábitos), inclusiones en el mismo panel. Si es un **dominio distinto** (Mi Espacio agrupando por Mente/Cuerpo/Salud), navega a su propia pantalla — mezclar dominios en el mismo panel confunde (ver sección "Mi espacio" arriba).

Recordatorios recibió el mismo tratamiento (`ListaRecordatoriosHabitos`, componente puro reusado por la ruta standalone y la vista incrustada). Como Progresión y Recordatorios comparten los mismos datos (`obtenerResumenPlanesHabitos`), `HabitosPantalla` los sirve con una sola consulta (`consultaPlanes`) — cambiar entre ambas vistas no refetch, es instantáneo.

## Archivos relacionados

- Migración: `supabase/migrations/20260910_11_habitos_niveles_progresivos.sql`.
- `src/diseno/componentes/AnilloProgreso.tsx`, `src/diseno/componentes/HojaDeslizante.tsx`.
- `src/modulos/habitos/pantallas/DetalleHabitoPantalla.tsx`, `app/_layout.tsx` (ruta `habitos/[id]` como `transparentModal`).
- Esquema original a reusar para tareas: `supabase/senderos.md`, `supabase/migrations/20260905_06_senderos_nucleo_estudio.sql`.
