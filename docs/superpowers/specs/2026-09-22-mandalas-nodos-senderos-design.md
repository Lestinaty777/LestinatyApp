# Mandalas persistentes para nodos de Senderos

## Estado y objetivo

Esta propuesta transforma cada día completado de un hábito en una huella visual permanente del usuario.

- Cada nodo de día concluido puede convertirse en una mandala única.
- La mandala reemplaza al nodo terminado en la misma posición del mapa como un orbe pastel animado.
- La apariencia toma el color del **paquete asociado al hábito**, no el tema global seleccionado por la persona.
- Los tres tipos de hábito tienen una interacción de completado específica, pero convergen en la misma creación de mandala y finalización.

No son tareas diarias, no son cofres nuevos y no cambian las reglas de gemas existentes.

**Verificado contra el código real**: la lógica de "día completado" ya es sólida y no se toca — `privacidad.registrar_progreso_habito` (transaccional, idempotente por `habito_id+fecha_local`) es la única autoridad servidor, y `construirNodosDias.ts` deriva el estado visual de cada nodo de forma posicional/agregada (`diaEnNivel <= diasCompletados`) a partir de `obtener_resumen_sendero_habito`. Lo que falta es exclusivamente el dato *por-registro* de mandala, que hoy no existe en ninguna forma.

El único punto de entrada al flujo de completar un nodo es `MapaSenderosPantalla.tsx` (`onCompletarNodo` de `ContenedorMapaSenderos`, ~línea 553): navega con `router.push('/senderos/mision', { habitoId, diaGlobal, nivel, color })` a la ruta `app/senderos/mision.tsx` → `SesionMisionPantalla.tsx`, que hoy decide la experiencia con un `if (tipoMeta === ...)` dentro del mismo archivo de 1429 líneas (con errores preexistentes de TS que el proyecto ya prohíbe tocar). Ese `tipoMeta` ya está disponible en el propio call site (`sendero.consulta.data.habito.tipoMeta`).

## Restricción obligatoria de datos

**No crear tablas nuevas.**

La fuente de verdad ya existe: `public.habitos_registros`. Un registro representa el avance de un hábito en una fecha local y ya tiene la identidad necesaria para una mandala:

```text
usuario_id + habito_id + fecha_local
```

El plan sólo agrega columnas a `public.habitos_registros` mediante una migración. No crear `habitos_mandalas`, `mandalas_nodos`, una tabla de eventos ni otra tabla paralela.

## Datos actuales que se reutilizan

| Entidad actual | Uso en esta funcionalidad |
| --- | --- |
| `public.habitos_items` | Dueño, `tipo_meta`, paquete actual, color e identidad del hábito. |
| `public.habitos_planes` | Nivel, frecuencia, meta y vigencia para calcular el nodo real. |
| `public.habitos_registros` | Registro diario que se convierte en la persistencia de la mandala. |
| `privacidad.registrar_progreso_habito` | Único punto servidor que confirma el avance real y crea la mandala pendiente. |
| `privacidad.obtener_resumen_sendero_habito` | Fuente de nivel/ciclo/secciones que consume el mapa. |
| `construirNodosDias.ts` | Construye los nodos visuales de cada nivel/ciclo; debe sustituir un nodo terminado por orbe si su registro tiene mandala. |
| `habitos_cofres_reclamados` | Sólo conserva los cofres actuales; no se reutiliza ni modifica para guardar mandalas. |

La progresión actual ya usa `nivel`, `ciclo` y `nodo_dia` para cofres. En nivel 7, `ciclo` evita colisiones entre vueltas de maestría de 42 días.

## Columnas a agregar a `habitos_registros`

Una migración debe agregar únicamente estos datos; los nombres pueden ajustarse, pero la semántica no:

```sql
alter table public.habitos_registros
  add column if not exists mandala_estado text,
  add column if not exists mandala_semilla text,
  add column if not exists mandala_trazos jsonb,
  add column if not exists mandala_paquete_id text,
  add column if not exists mandala_color text,
  add column if not exists mandala_nivel smallint,
  add column if not exists mandala_ciclo integer,
  add column if not exists mandala_nodo_dia smallint,
  add column if not exists mandala_creada_en timestamptz;
```

Reglas:

- `mandala_estado` sólo admite `pendiente` o `creada` cuando no es nulo.
- Una mandala existe únicamente si ese registro ya cumple la meta real del hábito.
- **Guarda de idempotencia obligatoria**: el `UPDATE` que fija `mandala_estado = 'pendiente'` dentro de `registrar_progreso_habito` debe llevar `where mandala_estado is null` (no sólo "meta cumplida"). `registrar_progreso_habito` es un upsert idempotente — un reintento, un doble-tap o una edición posterior del mismo día vuelven a pasar por el mismo camino, y sin esta guarda resetearían a `pendiente` una mandala que ya estaba `creada`, perdiendo los trazos guardados del usuario. Con la guarda, el campo se toca una única vez en la vida del registro sin importar cuántas veces se reintente.
- `mandala_semilla` se genera en servidor para un fallback reproducible.
- `mandala_trazos` almacena siete trazos compactos, no una imagen ni un SVG completo.
- `mandala_paquete_id` y `mandala_color` son snapshots. Un cambio futuro de semilla/paquete no puede alterar la mandala histórica.
- `mandala_nivel`, `mandala_ciclo` y `mandala_nodo_dia` son snapshots calculados al completar el registro; no se recalculan cuando cambie un plan o una frecuencia.
- El índice existente por hábito/fecha continúa evitando dos registros para el mismo día. No se necesita una tabla ni una unicidad adicional.

Para registros históricos sin mandala no hay backfill obligatorio: siguen mostrándose como nodos completados normales. Sólo los completados después de la migración crean mandala.

## Identidad de un nodo

Para renderizar el mapa, la identidad visual de un nodo es:

```text
habito_id + nivel + ciclo + nodo_dia
```

La fila propietaria continúa siendo el registro diario real. El mapa obtiene la mandala filtrando los registros que tengan `mandala_estado is not null` y haciendo coincidir los tres snapshots de nodo.

No asumir que el día 3 siempre corresponde a la tercera fecha del calendario: `habitos_planes.frecuencia`, `dias_semana` y `veces_por_semana` ya determinan cuándo un día cuenta. El servidor debe usar las mismas funciones actuales de Senderos para resolverlo.

## Flujo de producto: cuatro pantallas

```text
Mapa de Senderos
  → 1. Interacción por tipo de hábito
  → 2. Registro confirmado en servidor
  → 3. Creación guiada de mandala
  → 4. MasterNodeFinalization
  → Mapa con orbe-mandala en la posición del nodo
```

Cada tipo de hábito es una **pantalla-ruta dedicada** (`app/senderos/mision-check.tsx`, `app/senderos/mision-cantidad.tsx`, `app/senderos/mision-duracion.tsx`), no un overlay condicional dentro de `SesionMisionPantalla.tsx`. `SesionMisionPantalla.tsx` y su ruta actual (`app/senderos/mision.tsx`) **no se tocan** — siguen existiendo tal cual, sin aumentar sus errores preexistentes. `MapaSenderosPantalla.tsx` ya tiene `tipoMeta` disponible en el único call site de `onCompletarNodo` (`sendero.consulta.data.habito.tipoMeta`); sólo cambia el `pathname` del `router.push` existente según ese valor. Las tres pantallas nuevas convergen al compositor/finalización común (sección 3-4).

### 1A. Hábito `check`

Overlay minimalista de pantalla completa:

- La persona mantiene el dedo en el punto central durante 7 segundos.
- El punto de contacto permanece blanco brillante.
- Una mandala SVG de siete pétalos se dibuja alrededor del toque.
- El fondo se llena progresivamente con un degradado tenue del paquete asociado al hábito.
- Soltar antes del final retrae la animación y no registra progreso.
- Debe existir alternativa accesible de botón para completar sin mantener pulsado.

### 1B. Hábito `cantidad`

Overlay minimalista:

- Valor grande y meta/unidad visibles.
- Controles `−` y `+` claros; no sliders imprecisos.
- Progreso radial o lineal discreto.
- Al alcanzar la meta, se habilita la confirmación y se llama al RPC existente.

### 1C. Hábito `duracion`

Overlay minimalista:

- Reloj de foco grande con iniciar, pausar y finalizar.
- Integrar el cronómetro nativo actual; no crear otro origen de tiempo.
- Sólo registrar cuando el tiempo acumulado alcanza la meta.

### 2 y 3. Registro y creación

Los tres caminos llaman al mismo `registrar_progreso_habito` actual. La actualización de progreso permanece exclusivamente en servidor.

Si la llamada hace que el registro pase de incompleto a completo:

1. `privacidad.registrar_progreso_habito` calcula nivel, ciclo y nodo del día con las reglas actuales.
2. En la misma transacción completa los campos `mandala_*` del registro con estado `pendiente`, semilla y snapshot de paquete.
3. La respuesta incluye `mandala_pendiente` y su identidad de nodo.
4. La UI abre el compositor de mandala: siete swipes alrededor de un centro, uno por pétalo.
5. Cada gesto se simplifica antes de guardarse: ángulo, longitud, curvatura, duración y orden. Nunca se almacena un bitmap.
6. `guardar_mandala_registro(p_registro_id, p_trazos jsonb)` valida que el registro pertenece a la persona, está completado y está `pendiente`; después guarda los trazos y cambia estado a `creada`.

Si la app se cierra antes de terminar, el mapa muestra una mandala generada con `mandala_semilla`; al tocar el orbe pendiente se reabre el compositor. No existe un nodo vacío ni se vuelve a registrar el día.

### 4. `MasterNodeFinalization`

Pantalla común a los tres tipos:

1. Fondo oscuro/translúcido con aurora muy suave del paquete del hábito.
2. Zoom ligero hacia el nodo terminado.
3. La mandala se termina de dibujar usando los trazos del usuario.
4. Mandala y halo se contraen en un orbe pastel.
5. Haptic de confirmación y texto breve, por ejemplo `Nodo cultivado`.
6. Al volver al mapa, el nodo se reemplaza por el orbe-mandala animado lentamente.

No hay ilustraciones de semilla, árbol ni vegetación dentro de este ritual: sólo SVG, tipografía, luz, color y movimiento.

## Mandala y rendimiento

Existe una base parcialmente reutilizable en `src/modulos/aby/componentes/` (`MandalaAby.tsx`, `mandalaAby.config.ts`, `animacionMandalaAby.config.ts` — los tres viven bajo `componentes/`, no directo en `aby/`).

**Verificado**: lo reutilizable ahí es más limitado de lo que parece a primera vista. `mandalaAby.config.ts` genera **un solo path** de pétalo y lo rota 7 veces (`<G rotation={angulo} origin="80,80">`) — no son 7 trazos independientes. Para "siete swipes, uno por pétalo" hace falta un mecanismo nuevo que convierta cada gesto (ángulo/longitud/curvatura) en su propio `path d=...`, potencialmente distinto entre sí — eso es diseño nuevo, no extracción. Lo único que vale la pena portar tal cual es la función de semilla pseudoaleatoria determinista (`variacion()`, basada en `Math.sin`), útil para el fallback reproducible de `mandala_semilla`.

Además, `MandalaAby.tsx` anima con `Animated` nativo de React Native (`useNativeDriver: false` para `strokeDashoffset`) en un `useEffect` con loop autoperpetuo — no usa Reanimated. **No usar ese código como base de animación.** El patrón correcto ya existe en el proyecto: `src/diseno/componentes/AnilloProgreso.tsx` (SVG + `useAnimatedProps` + `strokeDashoffset` vía Reanimated) es el ejemplo a seguir para `MandalaNodo.tsx`, consistente con "usar valores nativos/Reanimated donde sea posible" más abajo.

No montar `MandalaAby` sin cambios en ningún caso: hoy ejecuta un ciclo infinito autónomo sin props de progreso ni trazos.

Para evitar congelamientos:

- animación limitada a la pantalla activa y al orbe visible;
- no ejecutar animaciones infinitas para orbes fuera de viewport;
- usar valores nativos/Reanimated donde sea posible;
- las mandalas históricas fuera del viewport se renderizan estáticas;
- no serializar trayectorias de alta frecuencia: guardar siete parámetros simplificados.

**Infraestructura nueva requerida**: hoy `ContenedorMapaSenderos.tsx` no tiene ningún tracking de viewport — es un `ScrollView` con nodos posicionados absolutos, no una lista virtualizada. "No animar orbes fuera de viewport" no es gratis: hace falta agregar `onScroll` (o `onLayout` + medición) al contenedor y comparar la posición de cada orbe contra el área visible antes de decidir si su `MandalaNodo` anima o se renderiza estático. Esto debe listarse como tarea explícita, no asumirse como detalle de implementación de `OrbeMandalaNodo`.

## Orbes en el mapa

Actualizar la construcción/render de nodos, no crear una capa flotante adicional:

```text
nodo bloqueado → nodo activo → nodo completado → orbe-mandala
```

El orbe reemplaza el nodo en su misma posición. El color viene de `mandala_color` / `mandala_paquete_id` guardados, no del tema global. Tiene:

- halo pastel;
- mandala vectorial en blanco y color del paquete;
- pulso lento sólo cuando es visible;
- accesibilidad: `Mandala creada para Día X` y acción para terminarla si sigue pendiente.

### Cofres

Los cofres no se deben perder:

- Día normal: se convierte en orbe al guardar/usar su mandala.
- Cofre intermedio: permanece cofre hasta que se reclama; después se convierte en orbe.
- Cofre final: la progresión actual lo acredita dentro de `registrar_progreso_habito`; tras esa respuesta puede transicionar a orbe.

### Un solo nodo completable por día

**Ya está garantizado funcionalmente, no hay bug de datos**: el servidor sólo puede completar la fecha local real de hoy (`registrar_progreso_habito` calcula `v_fecha_actual` server-side, nunca confía en el nodo que el cliente cree estar tocando), y `MapaSenderosPantalla.tsx` corta en el cliente si `sendero.seccionVisible?.puedeAvanzarHoy` es falso antes de siquiera navegar. Un usuario no puede completar dos nodos el mismo día real sin importar qué toque.

**El gap real es puramente visual**: `estadoVisual` en `ContenedorMapaSenderos.tsx` (`indice <= ultimoCompletado ? 'completado' : esNodoActual ? 'activo' : 'bloqueado'`) es posicional — no considera `puedeAvanzarHoy`. Apenas se completa el nodo de hoy, el siguiente nodo del array pasa a mostrarse `'activo'` (con su brillo/badge de disponible) aunque tocarlo no haga nada, porque `puedeAvanzarHoy` ya es falso hasta el día siguiente. El mismo cálculo se repite, con el mismo hueco, en el estado del tooltip (`estadoNodoSeleccionado`).

Corrección a incluir en esta entrega:

- Pasar `puedeAvanzarHoy` como prop nueva a `ContenedorMapaSenderos`.
- Agregar un estado visual distinto para "es el siguiente nodo, pero no se puede avanzar hoy" (ej. `'esperando'`), separado de `'bloqueado'` (nodos futuros reales) y de `'activo'` (sí se puede tocar ahora). Aplicarlo tanto en el `.map` de nodos como en el cálculo del tooltip.
- Copy del tooltip para ese estado, tipo "Vuelve mañana" — nuevas claves ES/EN.

## Ambientación de lluvia al volver al mapa

Se activa al volver al mapa justo después de `MasterNodeFinalization` (no dentro del ritual, que se mantiene abstracto y sin vegetación, tal como ya establece la sección anterior), y **continúa en loop mientras la condición siga siendo cierta**, no por una duración fija ni por "un día":

```text
condición = !seccionVisible?.puedeAvanzarHoy && (seccionVisible?.diasCompletados ?? 0) > 0
```

- Se monta (`AmbienteLluviaMapa`, visual + audio) mientras el mapa de Senderos de ese `habitoId` está en pantalla y la condición es cierta — **sin importar qué nivel/nodos se estén viendo**, el criterio depende del hábito, no del nivel visible.
- `puedeAvanzarHoy` ya considera `habitos_es_dia_programado`, así que la lluvia dura exactamente hasta el próximo día en que el hábito está configurado para hacerse — no "hasta mañana". Ejemplo real: hábito programado lunes y jueves; se completa el lunes → llueve lunes, martes y miércoles (no son días programados, `puedeAvanzarHoy` sigue en falso) → se corta exactamente el jueves, en cuanto `habitos_es_dia_programado` vuelve a dar verdadero para ese día y aún no se ha completado.
- `diasCompletados > 0` evita que llueva en un hábito que nunca se ha completado ni una vez (hoy no programado + cero historial no es "esperando", es simplemente "nada que celebrar todavía").
- Se desmonta de inmediato al navegar a otro hábito o salir de Senderos — no sigue sonando/animando en segundo plano.
- Si el usuario vuelve dentro de la misma ventana de espera (cualquier día antes del próximo programado) al mismo hábito, la lluvia reaparece; al llegar el próximo día programado, deja de llover incluso si el usuario sigue en esa pantalla (debe recalcularse al refrescar/revisitar, no sólo al montar).
- Reusa exactamente la misma señal (`puedeAvanzarHoy`) que ya se agrega para el estado visual `'esperando'` de "Un solo nodo completable por día" — un solo dato, dos usos.
- Límite conocido, no resuelto en esta entrega: si el usuario **no** completó el último día programado (lo dejó pasar) y hay historial previo (`diasCompletados > 0` de semanas/ciclos anteriores), la condición igual puede dar "lloviendo" en días no programados intermedios sin que haya habido una celebración reciente. Es un caso borde de "día perdido" que la app hoy tampoco resuelve en otros lugares (la UI sólo permite registrar la fecha de hoy, no retroactivo) — no se agrega complejidad nueva para distinguirlo en esta entrega.

Metáfora: mientras llueve sobre el mapa, los árboles decorativos que **ya existen** de fondo (`CapaDecoracionMapa`, alimentados por `assets.etapas` vía `registroBiomas.ts`, ligados al nivel global del sendero) se leen como si estuvieran creciendo con la lluvia — no se crea un árbol nuevo por nodo; no hay precedente de eso en el código y sería una pieza mucho más grande de lo necesario. Se reutiliza la decoración existente, la lluvia sólo se pone encima.

**Verificado**: no existe ningún sistema de lluvia/partículas en el proyecto (grep de "lluvia"/"clima"/"weather": cero resultados). Hay tres patrones de ambientación maduros para construirla, ninguno directamente listo:

- `src/diseno/componentes/NieblaUi.tsx`: niebla Skia con shader procedural (fbm), color hoy fijo en blanco (`sky = half3(1,1,1)`) — parametrizar a gris es trivial. Tiene fallback ya resuelto para web/Expo Go (`BlurView` + masas semitransparentes).
- `src/modulos/hoy/componentes/AuroraBoreal.tsx`: Skia `Canvas` + `Group` + `Path` + `BlurMask`, animado con Reanimated (`useDerivedValue`, shared values). Es el molde más directo para "muchos trazos" — para lluvia, sustituir las curvas por rayas verticales cortas repetidas, gris translúcido.
- `src/diseno/componentes/NieblaAnimada.tsx`: niebla sin Skia (`Animated` + `BlurView`), ya usada en `BibliotecaSenderosPantalla.tsx` y `SesionMisionPantalla.tsx`.

Ninguno es un sistema de gotas discretas — hay que construirlo, usando el patrón de `AuroraBoreal.tsx` como base técnica (Skia + Reanimated, no `Animated` nativo, consistente con el resto de este spec).

Reglas:

- Loop mientras la condición (`!puedeAvanzarHoy` para ese hábito) y el montaje de esa pantalla sigan vigentes; nunca corre si ninguna de las dos se cumple — mismo criterio de rendimiento que el resto de este spec (nada de animaciones/audio sin control cuando la pantalla no está activa).
- El `useEffect` que la controla debe limpiar (detener audio + parar animación) en su cleanup, y reaccionar a cambios de `habitoId` (no asumir que sólo se desmonta al salir de Senderos; cambiar de hábito dentro del mismo flujo también debe cortarla).
- 100% cliente en su disparo/corte: la condición se lee de un dato que ya viene del servidor (`puedeAvanzarHoy`), pero no depende de ningún dato nuevo persistido ni de una migración adicional.
- Componente nuevo aislado, ej. `AmbienteLluviaMapa.tsx`, montado condicionalmente sobre `ContenedorMapaSenderos.tsx` sin alterar su lógica de nodos.

## Sonido

**No existe infraestructura de audio en el proyecto** — verificado: ni `expo-av` ni `expo-audio` están instalados, ningún código reproduce sonido hoy. Sólo hay un asset huérfano (`assets/sonido_exito.wav`, generado con `generate_sound.py`, nunca conectado a la app). Esto es infraestructura nueva, no un detalle menor.

- Paquete: `expo-audio` (no `expo-av`, deprecado; el proyecto ya usa Expo SDK 57).
- Wrapper nuevo `src/nucleo/dispositivo/sonido.ts`, mismo criterio que `haptics.ts` (`hapticSeguro`): nunca debe romper la UI si falla, no bloqueante, no hace falta `await` en el caller.
- **Sin toggle de mute en esta entrega** (decisión explícita del usuario; ni siquiera hápticos lo tienen hoy). Como única forma de apagarlo, la reproducción debe **respetar el switch de silencio físico de iOS** (no forzar audio en modo silencioso) — configuración de sesión de audio de `expo-audio`, no algo que se pueda dejar por default sin revisar.
- Asset ya descargado: `assets/sonido/lluvia-loop.mp3`, ~1 minuto de duración — deliberadamente largo (no un clip corto) para que el loop no se note al repetirse; un clip de pocos segundos en loop apretado es más propenso a chasquidos/costuras audibles.

### Lluvia ambiental (`AmbienteLluviaMapa`)

Arranca junto con la animación visual y sigue el mismo ciclo de vida y condición (ver "Ambientación de lluvia al volver al mapa": `!puedeAvanzarHoy && diasCompletados > 0`) — puede durar varios días de calendario si el hábito no es diario (ej. lunes-jueves), mientras el usuario esté viendo el mapa de ese hábito. Se detiene de inmediato al navegar a otro hábito o salir de Senderos. No es un disparo de duración fija — el archivo de 1 minuto ya provee margen de sobra para loopear sin costuras mientras dure la visita.

### Sonidos de interacción por tipo de hábito

- `ExperienciaNodoCantidad`: click corto y sutil en cada toque de `+`/`−`. Debe soportar toques rápidos sucesivos sin cortarse ni acumular retraso (reiniciar el player en cada toque, o un pool pequeño de instancias).
- `ExperienciaNodoDuracion`: sonido distinto para iniciar, pausar y finalizar el cronómetro — sutil, no una alarma. No inventar un origen de sonido nuevo si el módulo nativo del cronómetro (Android) ya dispara algo a nivel de notificación; verificar antes de duplicar.
- Los tres tipos (check/cantidad/duración) pueden compartir el mismo sonido de "meta cumplida" si conviene, reusando `sonido_exito.wav` como primer candidato en vez de generar uno nuevo.

## Cambios concretos esperados

### Backend y migración

- Nueva migración que sólo altera `public.habitos_registros`, funciones y RLS/validaciones necesarias; no crear tablas.
- Extender `privacidad.registrar_progreso_habito` y su wrapper público para retornar datos de la mandala pendiente cuando aplique.
- Añadir RPC `guardar_mandala_registro(uuid, jsonb)`; no recibe ni acepta color, paquete, nivel, ciclo, nodo ni gemas desde cliente.
- Extender la consulta/resumen de Senderos o crear una consulta que lea los campos `mandala_*` de registros existentes para que el mapa pueda renderizarlos.

### App React Native

- **No tocar** `SesionMisionPantalla.tsx` ni `app/senderos/mision.tsx` — quedan intactos, sin uso nuevo.
- Rutas nuevas `app/senderos/mision-check.tsx`, `app/senderos/mision-cantidad.tsx`, `app/senderos/mision-duracion.tsx`, cada una renderizando su componente dedicado (`ExperienciaNodoCheck`, `ExperienciaNodoCantidad`, `ExperienciaNodoDuracion`); mismas reglas de registro que hoy, mismo RPC.
- `MapaSenderosPantalla.tsx`: en el único call site de `onCompletarNodo` (~línea 553), elegir el `pathname` según `tipoMeta` en vez de siempre `/senderos/mision`; recibir/encadenar la transición pendiente y abrir el compositor/finalización después de respuesta exitosa.
- `ContenedorMapaSenderos.tsx` y sus nodos: agregar viewport tracking (ver "Mandala y rendimiento") y reemplazar visualmente cada nodo con mandala por el nuevo orbe, siguiendo el mismo patrón `if` que ya distingue cofres. Recibir `puedeAvanzarHoy` como prop nueva y agregar el estado visual `'esperando'` (ver "Un solo nodo completable por día") en el cálculo de nodos y en el tooltip (`estadoNodoSeleccionado`).
- `construirNodosDias.ts`: nuevo parámetro con la información de mandalas existentes (indexado por día-en-nivel), nuevo `TipoNodoMapa` (`orbe_mandala`); el caller resuelve primero qué registros de ese hábito tienen mandala.
- Componentes nuevos aislados: `ExperienciaNodoCheck`, `ExperienciaNodoCantidad`, `ExperienciaNodoDuracion`, `CompositorMandalaNodo`, `MasterNodeFinalization`, `OrbeMandalaNodo`, `MandalaNodo`, `AmbienteLluviaMapa`.
- `expo-audio` como dependencia nueva; `src/nucleo/dispositivo/sonido.ts` (wrapper, ver "Sonido"); asset `assets/sonido/lluvia-loop.mp3` (fuente externa royalty-free, ver "Sonido").
- Todos los textos visibles se agregan en ES/EN a `src/servicios/i18n/recursos.ts`.

## Seguridad

- La app nunca decide que un nodo se completó.
- `guardar_mandala_registro` no puede convertir un registro incompleto en mandala.
- Los snapshots de paquete/color se asignan servidor-side desde el hábito y su paquete asociado.
- No hay gemas nuevas ni cambios de recompensa por crear una mandala.
- Reintentos de `registrar_progreso_habito` sobre un día ya completo no crean una segunda mandala, porque actualizan la misma fila de `habitos_registros`.

## Orden de entrega

1. **Spike aislado del compositor**: `CompositorMandalaNodo` + `MandalaNodo`, sin tocar DB ni rutas — una pantalla de desarrollo que reciba 7 swipes simulados/reales y renderice el resultado con Reanimated (patrón `AnilloProgreso.tsx`). Es la única pieza del spec sin precedente en el código; valida barato si el resultado visual convence antes de comprometer el resto.
2. Migración (`habitos_registros` + guarda de idempotencia), `registrar_progreso_habito`/wrapper, `guardar_mandala_registro`, consulta de mandalas por hábito.
3. Rutas nuevas por tipo (`mision-check`/`mision-cantidad`/`mision-duracion`) y cambio del `pathname` en `MapaSenderosPantalla.tsx`; `SesionMisionPantalla.tsx` sin tocar.
4. `construirNodosDias.ts` + `ContenedorMapaSenderos.tsx`: nuevo tipo de nodo, `OrbeMandalaNodo` en su posición, con el `MandalaNodo` del paso 1 ya validado.
5. Viewport tracking (animación sólo en orbes visibles) y `MasterNodeFinalization`.
6. Transición de cofres (intermedio permanece cofre hasta reclamarse; final ya se acredita en `registrar_progreso_habito`).
7. Estado visual `'esperando'` (`puedeAvanzarHoy` en `ContenedorMapaSenderos.tsx` y su tooltip) y `AmbienteLluviaMapa` al volver al mapa.
8. Infraestructura de sonido (`expo-audio`, `sonido.ts`) y los efectos por tipo de hábito, una vez que el asset de lluvia esté descargado.
9. Pruebas end-to-end y regresión de `tsc`/`vitest`.

## Pruebas requeridas

- `check`, `cantidad` y `duracion` crean una mandala pendiente sólo tras cumplir su meta.
- Registro incompleto no genera campos `mandala_*`.
- Reintento/doble toque conserva una única mandala en el registro existente.
- Los campos nivel/ciclo/nodo son correctos en niveles 1–6 y ciclos de nivel 7.
- Paquete cambiado posteriormente no recolorea una mandala histórica.
- Cierre de app con estado pendiente muestra fallback reproducible y permite completar los trazos.
- Nodo con mandala reemplaza el nodo normal; cofre intermedio no se reemplaza antes de reclamarse.
- Orbes fuera de viewport no ejecutan bucles de animación.
- Con `puedeAvanzarHoy` en falso, el siguiente nodo se ve `'esperando'`, no `'activo'`, tanto en el mapa como en el tooltip.
- Tocar un nodo distinto al actual (o el actual ya completado hoy) no dispara `registrar_progreso_habito` ni abre el compositor.
- La lluvia (visual + sonido) se detiene de inmediato al navegar a otro hábito o salir de Senderos; no sigue corriendo en segundo plano.
- Hábito no diario (ej. lunes/jueves): completado el lunes, llueve lunes/martes/miércoles y para exactamente el jueves (no "al día siguiente" del calendario) — probar explícitamente este caso, no sólo el de hábito diario.
- Hábito sin historial (`diasCompletados === 0`) en un día no programado: no llueve.
- El sonido de lluvia y de botones no reproduce con el switch de silencio de iOS activado.
- `sonido.ts` nunca lanza una excepción no capturada aunque `expo-audio` falle al cargar un asset.
- `npx tsc --noEmit` sin errores nuevos y `npx vitest run` pasa.

Los errores preexistentes de `WidgetRegistrarProgreso.tsx` y `SesionMisionPantalla.tsx` no se deben modificar ni aumentar.
