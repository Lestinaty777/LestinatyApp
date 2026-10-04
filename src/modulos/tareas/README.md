# Tareas

Módulo de tareas: 4 tipos, 2 frecuencias, y una regla de ruteo por cada combinación que decide qué RPC se llama al completar. Este documento es la referencia de "cómo funciona de verdad" — se escribió después de encontrar y corregir una inconsistencia real entre frecuencias, así que vale la pena leerlo antes de tocar la lógica de completar/progreso.

## Los 4 tipos

| Tipo | Qué es | Tiene meta numérica (`objetivo_valor`) |
|---|---|---|
| `simple` | Un toque y listo | No (siempre 1) |
| `checklist` | Varios pasos chicos (subitems) | No a nivel tarea — cada subitem es binario |
| `contador` | Meta numérica (ej. "8 vasos de agua") | Sí |
| `cronometro` | Meta por tiempo en minutos | Sí |

El wizard (`componentes/CrearTareaWizard.tsx`) deja asignar `objetivo_valor`/`unidad` a contador y cronómetro **sin importar la frecuencia** — una tarea "una vez" puede perfectamente ser "Tomar 8 vasos de agua" o "Revisar mis gastos (10 min)". El detalle adicional es que qué tan en serio se trackea ese número depende de la frecuencia (ver tabla de ruteo abajo).

## Alta rápida ("quick add")

Además del wizard completo, `pantallas/TareasPantalla.tsx` tiene una tarjeta compacta arriba de todo (en el lugar donde antes vivía la tarjeta de "mejor racha" — se quitó de ahí porque racha casi no aporta en Tareas: muchas tareas "una vez" nunca la tienen) con dos botones, cada uno con su ícono de `assets/icons/ui/` (`rayo` para tarea rápida, `hoy/lista` para checklist). Tocar cualquiera abre un modal centrado (`MasterGlass`, mismo lenguaje visual del resto de la app) con el campo de texto — ahí sí hay espacio horizontal cómodo para escribir, a diferencia de la tarjeta chica de origen. Escribes el título, confirmas (Enter o el botón), y aparece de inmediato en "Hoy". Siempre "una vez" con vencimiento hoy, sin color/recordatorio — todo lo demás en su default:

- **Tarea rápida** (`simple`): `crearTarea({ titulo, fechaVencimiento: hoy })` directo, sin pasar por `crearTareaPremium` ni por ningún paso del wizard.
- **Checklist**: el modal pide el título del checklist y, debajo, una lista de pasos (arranca con 2 campos vacíos, botón "+ Agregar paso"/quitar por fila — mismo patrón que el paso "Meta" de `CrearTareaWizard.tsx`). Al confirmar: `crearTarea({ titulo, tipo: 'checklist', fechaVencimiento: hoy })` y luego `crearSubitemsTarea(tarea.id, pasos)` con todos los pasos no vacíos — un checklist real desde el alta rápida, no un único subitem igual al título.

Contador y cronómetro no tienen opción rápida — necesitan una meta numérica real, eso sí pasa por el wizard completo. Pensado para "se me ocurrió algo a la mitad de otra cosa, anótalo ya"; si después quieres más detalle (frecuencia, recordatorio, más pasos del checklist), se edita desde la tarea ya creada.

## Las 2 frecuencias

- **`una_vez`**: pasa una sola vez, en una fecha específica (`fecha_vencimiento`) o sin fecha. No tiene "racha", no tiene sendero.
- **`dias_semana`**: se repite en días específicos de la semana (`dias_semana: number[]`, 1=lunes..7=domingo). Tiene racha y, para simple/contador/cronómetro, un sendero de días con figura geométrica (ver más abajo).

## La tabla de ruteo — qué RPC se llama al completar

Esta es la parte que generó más confusión durante el desarrollo, documentada explícitamente para que no se repita:

| Tipo | Frecuencia | RPC | Qué guarda | Niveles/figuras/gemas |
|---|---|---|---|---|
| `checklist` | cualquiera | `completar_tarea_dia` | toggle binario (`tareas_registros` si `dias_semana`, `tareas_items.estado` si `una_vez`) | No — el detalle vive en `tareas_subitems` (ver sendero de pasos) |
| `simple` | `una_vez` | `completar_tarea_dia` | `tareas_items.estado` | No |
| `simple` | `dias_semana` | `registrar_progreso_tarea` | `tareas_registros.valor` (0 o 1) | Sí — sendero de días |
| `contador` / `cronometro` | `una_vez` | `registrar_progreso_tarea_unica` | `tareas_items.valor_actual` | No — ver abajo por qué |
| `contador` / `cronometro` | `dias_semana` | `registrar_progreso_tarea` | `tareas_registros.valor` (por día) | Sí — sendero de días |

**Por qué `una_vez` contador/cronómetro no usa el mismo RPC que `dias_semana`:** `registrar_progreso_tarea` calcula racha, nivel y figura pendiente iterando sobre varios días (`tareas_contar_dias_completados_nivel`, etc.) — ese cálculo no tiene sentido para algo que pasa una sola vez. El RPC lo rechaza explícitamente (`raise exception` si `frecuencia <> 'dias_semana'`). Por eso existe `registrar_progreso_tarea_unica` (migración `20261003_64`): mismo concepto de "guardar un valor real", pero sin niveles/figuras/gemas — solo `valor_actual` + marcar `estado='hecha'` cuando `valor_actual >= objetivo_valor`.

**Función helper correspondiente en cada capa:**
- `tareas.servicio.ts`: `usaSenderoDeDias()` / las llamadas directas a `completarTareaDia` / `registrarProgresoTareaUnica`.
- `pantallas/TareasPantalla.tsx`: `usaSenderoDeDias()` y `usaProgresoUnaVez()` (copias locales con el mismo criterio — ver nota de duplicación abajo).

> Nota: `usaSenderoDeDias` está duplicado (con tipados ligeramente distintos) en `tareas.servicio.ts` y en `pantallas/TareasPantalla.tsx`. Es deliberado — mismo criterio que otros helpers de 2 líneas en este módulo (ver `CrearTareaWizard.tsx` con su propia copia de `TIPOS_CON_SENDERO_DIAS`). Si alguna vez cambia la regla, hay que tocar los tres lugares.

## "Hoy" (`componentes/TimelineTareasHoy.tsx`)

Cada fila tiene dos formas de completar:

1. **El círculo de estado** (izquierda, siempre tocable) — acceso rápido: llama a `onCompletar` directo, sin importar el tipo. Para contador/cronómetro, esto manda `valor: objetivoValor` (salta directo a la meta) — **no suma 1**, porque ambos RPC de progreso *reemplazan* el valor, no lo acumulan.
2. **Tocar la fila completa** — para `simple`/`checklist`, alterna completado/pendiente directo (mismo efecto que el círculo). Para `contador`/`cronometro` (`esExpandible`), expande la fila y muestra `WidgetProgresoTarea` en vez de completar de un toque — ahí sí puedes ir sumando con +/- o corriendo el cronómetro, con guardado real en cada toque (vía la ruta que corresponda según frecuencia, tabla de arriba).

`WidgetProgresoTarea.tsx` no sabe ni le importa la frecuencia — solo llama a `onGuardar(valor)` en cada cambio; la decisión de a qué RPC apunta esa llamada vive en `TareasPantalla.tsx`.

### El anillo del contador: `MasterRingBar`

El lado izquierdo del widget de contador es `src/diseno/ui/MasterRingBar.tsx` — el mismo anillo de la pantalla de espera del wizard de Hábitos (`PreparandoHabito`), formalizado como componente reusable. Reusa el motor de extrusión/sombras tal cual (surco suave del color + relleno saturado conforme avanza porcentaje), con sombras proporcionales a `tamano` para que se vea bien tanto a 300px (su uso original) como a 60px (este widget).

El cronómetro usa el dibujo clásico del widget de cronómetro del SDUI (`senderos/motor/sdui/widgets/WidgetCronometro.tsx`) — corona, botón lateral, aguja, anillo de progreso — pero con el progreso creciendo HACIA la meta en vez de contar hacia atrás desde una duración fija.

## Dos senderos distintos — no confundir

Tareas tiene **dos** sistemas de "camino de nodos" completamente separados, para cosas distintas:

### Sendero de pasos (Fase 7) — solo `checklist`

- Un nodo por subitem (`tareas_subitems`), sin importar la frecuencia de la tarea.
- `construirNodosPasos.ts` arma los nodos a partir de `SubitemTarea[]`.
- `completarSubitemTarea()` marca cada paso.
- Sin figura geométrica — son nodos simples en un camino, igual estilo que el resto de los senderos de la app.

### Sendero de días (Fase 8) — `simple`/`contador`/`cronometro` **recurrentes** (`dias_semana`)

- Un nodo por día programado, con una figura geométrica que crece por nivel (igual mecánica que el mandala de Hábitos, pero geometría distinta).
- `construirNodosDiasTarea.ts` arma los nodos.
- `registrar_progreso_tarea` es quien decide si un día "cumple la meta" (`valor >= objetivo_valor`, o `valor > 0` para `simple`) y dispara nivel/figura pendiente/gemas.
- La figura (`figuraSello.ts` + `componentes/SelloExtruido.tsx`) es **espejo horizontal de aristas rectas**, no una mandala radial: el usuario traza solo la mitad de abajo entre dos anclas fijas, la mitad de arriba es el espejo exacto — ver comentarios en `figuraSello.ts` para el porqué (evitar que Tareas se sienta como "mandalas de otro color").
- El ritual de trazo vive en `senderos/componentes/mapa/CompositorOverlaySello.tsx` (fork de `CompositorOverlay.tsx`, el de Hábitos) — mismo mecanismo de levitación/descenso/fusión, geometría distinta. No tiene "mano fantasma" (tutorial animado) todavía, a propósito.

`simple` con `dias_semana` también pasa por el sendero de días (con `objetivo_valor` fijo en 1), pero no se le construyó UI de "detalle expandible" — se completa igual que siempre con un toque, el sendero de días corre atrás sin que el usuario necesite ver un número.

## Archivos clave

```
tareas.tipos.ts              Todos los tipos — empezar acá para entender las formas de datos
tareas.servicio.ts            CRUD + las 3 funciones de completar/progreso + obtenerTareasHoy
tareas.mapper.ts              Mapeo de filas de panel/insights
tareaProgramada.ts            estaProgramadaEnFecha, calcularRachaTarea (puro, testeado)
figuraSello.ts                Geometría del sendero de días — espejo, no mandala
figuraTarea.mapper.ts         Mapeo de figuras pendientes/transición de sendero
construirNodosPasos.ts        Nodos del sendero de pasos (checklist)
construirNodosDiasTarea.ts    Nodos del sendero de días (simple/contador/cronometro recurrentes)
plantillasTareas.ts           Plantillas del wizard

componentes/CrearTareaWizard.tsx       Wizard de creación — único punto que crea tareas premium
componentes/TimelineTareasHoy.tsx      "Hoy" — ver sección de arriba
componentes/WidgetProgresoTarea.tsx    Detalle expandible contador/cronómetro
componentes/ListaMisTareas.tsx         Vista "Mis tareas" (Kanban/Eisenhower son VISTAS, no tipos)
componentes/SelloExtruido.tsx          Render 3D del sendero de días

pantallas/TareasPantalla.tsx           Pantalla completa — acá vive el ruteo a los 3 RPC de completar
```

## Decisiones de producto explícitas (para no revisitarlas sin querer)

- **Kanban y Eisenhower son vistas**, no un tipo de tarea — cualquiera de los 4 tipos puede aparecer en esas vistas sobre "Mis tareas".
- **Checklist nunca usa el sendero de días** — su "camino" es el de pasos (subitems), sin importar la frecuencia.
- **`una_vez` nunca tiene racha ni nivel ni gemas** — es una acción puntual, no un hábito en miniatura. El `objetivo_valor` de contador/cronómetro en `una_vez` es solo "qué tan grande es la meta", no algo que genere recompensa por trackearlo.
- **El sendero de días de Tareas no es visualmente una mandala** — es una decisión deliberada para que Tareas se sienta distinto de Hábitos, no "lo mismo con otro ícono".

## Pendiente / ideas no implementadas

- **Widget de iOS (home screen) mostrando Hoy (hábitos + tareas juntos)**: explorado como idea, no iniciado. Requeriría una Widget Extension nativa en Swift (WidgetKit + AppIntents para botones interactivos + un App Group para compartir datos con la app) — nada de esto se puede escribir ni probar como código TypeScript/Expo normal. Si se retoma, la base de datos ya soporta lo necesario para contador/cronómetro en ambas frecuencias (este documento describe esa base); falta decidir qué datos exactos necesitaría leer/escribir el App Group y diseñar el layout de cada fila según tipo.
- **Mano fantasma (tutorial) para el sendero de días de Tareas**: el ritual de trazo (`CompositorOverlaySello.tsx`) no tiene todavía el equivalente de `ManoFantasma` que sí tiene el de Hábitos.
