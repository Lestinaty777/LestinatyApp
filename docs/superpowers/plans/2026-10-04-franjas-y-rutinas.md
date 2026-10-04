# Plan: franjas del día y Rutinas

Specs de referencia: [visión](../../vision/lestinaty-vision.md) · [franjas del día](../specs/2026-10-04-franjas-del-dia-design.md) · [Rutinas](../specs/2026-10-04-rutinas-design.md).

Este documento tiene dos partes. **La Parte 1 es para ti** (dirección y función, sin tecnicismos). **La Parte 2 es mía** (detalle técnico de ejecución).

---

# PARTE 1 — Para ti: dirección y función

## Actualización tras tu commit `0194f44` (Planes y sendero de días en Tareas)

Tu commit cambia varias cosas del plan. Lo importante:

- **Planes ya existe.** Un plan se organiza en Secciones → Días → Bloques → Ítems, con generación por Aby y progreso por instancia (preparado para compartir). Eso adelanta la fase de Planes de la visión y parte del cooperativo.
- **Los bloques de un plan ya usan mañana / tarde / noche.** Es justo el concepto de franja que propusimos. Lo trato como confirmación de la idea, y las franjas usarán los mismos códigos, así que todo encaja.
- **Tareas ya está mucho más avanzada** (sendero de días, widgets de contador y cronómetro, alta rápida). No hay que rehacer nada de eso. Mis cambios solo añaden la franja.
- **Insights de hábitos y tareas se fusionó** en una pantalla; no me afecta.
- **Cada módulo tiene su propio tema visual** (Tareas dorado, Planes aurelia). Rutinas necesitará el suyo.
- **Hay un test que prohíbe una ruta `app/rutinas/index.tsx`.** Rutinas debe seguir viviendo como pestaña, no como pantalla independiente. Lo respeto en el plan.
- **Números de migración:** las tuyas ocuparon la 64 a la 68. Las mías pasan a ser 69, 70 y 71.

Tus cambios locales sin commitear no los puedo ver, porque solo existen en tu computadora. Lo que revisé es lo que está en GitHub. Si esos cambios tocan tareas o planes, hazme saber qué archivos o súbelos en otro commit antes de que empiece la etapa A, para no pisarlos ni dejar choques de migraciones.

## Qué vamos a construir

1. **Franjas del día.** Cada hábito, tarea y rutina puede tener una franja: mañana, tarde, noche o "sin franja". Hoy muestra primero lo que toca en este momento.
2. **Rutinas reales.** La pestaña Rutinas deja de ser una maqueta con datos falsos. Una rutina es una secuencia de pasos: hábitos tuyos, tareas tuyas o pasos propios de la rutina (con cronómetro, contador o simple).
3. **Hoy unificado.** En una misma pantalla ves hábitos, tareas y rutinas, divididos por franja, con 4 botones pequeños: `Mañana`, `Tarde`, `Noche`, `Todo`.

## Cómo se verá y funcionará

- **Botones de franja.** Al abrir Hoy queda seleccionada la franja actual. El número en cada botón es lo que te falta por hacer en esa franja.
- **Lo que no tiene franja** solo aparece en `Todo`.
- **Una rutina cuenta como un solo elemento** en Hoy: una tarjeta con sus pasos dentro. Sus hábitos y tareas no se repiten aparte en Hoy. En las pantallas de Hábitos y Tareas sí aparecen, con la etiqueta "en Rutina X".
- **No se muestran más de 5 pendientes por franja**, con "Ver n más". Lo completado se pliega en una línea.
- **Una franja que pasó no te castiga.** Si no hiciste algo de la mañana, sigue visible hasta el final del día y no cuenta como fallo. Rachas y niveles funcionan exactamente igual que hoy.
- **Completar un hábito dentro de una rutina** hace crecer su árbol y da sus gemas, como si lo hubieras hecho solo. La rutina no duplica nada.
- **La rutina no da gemas por sí misma** en esta versión, para evitar premios dobles.
- **Tus hábitos y tareas actuales no cambian.** Todo lo existente queda en "sin franja" hasta que tú lo configures.

## Qué verás al terminar cada etapa

| Etapa | Qué ves tú | Riesgo para lo existente |
| --- | --- | --- |
| A. Base de franjas | Nada visible todavía | Ninguno |
| B. Backend de Rutinas | Nada visible todavía | Ninguno (se eliminan campos sin uso) |
| C. Pantalla de Rutinas | La pestaña Rutinas con datos reales, con el mismo estilo que Hábitos y Tareas | Bajo |
| D. Crear rutinas y ejecutarlas | Wizard para crear una rutina y pantalla para hacerla paso a paso | Bajo |
| E. Franjas en wizards y en Hoy | Selector de franja al crear hábito o tarea, y Hoy con los 4 botones | Medio: toca pantallas que ya usas |
| F. Ajustes de franjas e insights | Cambiar las horas de mañana/tarde/noche y ver en qué franja cumples más | Bajo |

Las etapas A y B no muestran nada porque son la base. La primera vez que verás algo nuevo es la etapa C.

## Lo que tienes que hacer tú

1. **Aplicar las migraciones nuevas** en tu proyecto de Supabase cuando yo las deje escritas (etapas A y B). Yo no puedo probar el SQL contra tu base real desde esta sesión.
2. **Probar en un dispositivo o simulador** al terminar cada etapa visible (C, D, E). Yo puedo verificar tipos y pruebas automáticas, pero no puedo abrir la app nativa.
3. **Confirmar las decisiones pendientes** de abajo.

## Decisiones ya tomadas

- Rutinas se construye sobre datos reales desde el inicio, no sobre maqueta.
- Lo sin franja aparece solo en `Todo`.
- La franja es una sola por elemento.
- Una rutina completa no da gemas por ahora.
- El campo `routine_id` de las tareas se elimina; los pasos de rutina son la única relación.
- Hoy se unifica y deja de tener el toggle Hábitos/Tareas.
- **Los planes quedan fuera de Hoy por ahora** (se siguen viendo en su pastilla de Tareas). Se retomarán cuando el resto funcione.
- **Tema visual de Rutinas: Ignate** (paquete rojo carmesí `#90010D`, ya existe con sus ilustraciones). Tareas usa Golden y Planes Aurelia.

## Decisiones pendientes (puedo avanzar sin ellas, pero conviene que las pienses)

1. **Tope de 5 pendientes por franja.** ¿Te sirve esa cifra o prefieres otra?
2. **Horas por defecto de las franjas.** Propongo mañana 5–12, tarde 12–19, noche 19–5, editables.
3. **Rutinas como destino visual.** En la primera versión la rutina se muestra como lista de pasos con progreso. El camino con nodos y mundo propio (la idea de que cada rutina evolucione visualmente) queda para después. ¿De acuerdo?
4. **Prioridad esencial/opcional de un paso** y versión corta de la rutina: son ideas que comentamos y no están en el spec. ¿Las quieres incluidas en la primera versión o más adelante?
5. **Licencia.** `main` es BUSL-1.1 y `mejoras` es propietaria. Hay que decidir cuál queda antes de fusionar ramas.

## Lo que queda fuera

Gemas por rutina, rutinas compartidas o cooperativas, planes dentro de Hoy, rutinas dentro de planes y cursos, que Aby cree rutinas, adaptación responsive para iPad y web (solo dejo la base preparada), y cualquier cambio de marketplace o cursos.

---

# PARTE 2 — Técnico (para mí)

Rama de trabajo: `mejoras`. Un commit por paso, push al terminar cada etapa. No abrir PR salvo que se pida. Mensajes de commit con las líneas de atribución indicadas en la sesión.

## Estado verificado del repo

- Última migración tras `0194f44`: `20261003_68_obtener_resumen_planes.sql`. Las nuevas son `20261004_69_*`, `20261004_70_*`, `20261004_71_*` (sustituir los números 64/65/66 que aparecen más abajo por 69/70/71). Antes de escribir cada una, hacer `git fetch` y `ls supabase/migrations | tail` por si hay más.
- Tras `0194f44`: existe `src/modulos/planes/` (tipos, servicio, wizard, detalle, timeline), `planes_items → planes_secciones → planes_dias → planes_bloques(momento manana|tarde|noche) → planes_bloque_items`, progreso en `planes_instancias` + `planes_instancia_progreso`. `planes_bloques.momento` es `text check (manana, tarde, noche)`; **no tocarlo**, solo mantener códigos idénticos a `franja_dia` por compatibilidad futura.
- `TareasPantalla.tsx` ahora tiene 634 líneas, es una ruta (`app/(principal)/tareas.tsx`) y aloja un selector de pastillas Planes|Tareas con tema ambiente por módulo (`PAQUETE_TAREAS='golden'`, `PAQUETE_PLANES='aurelia'`). Se resolvió la duda de dónde se monta. `src/modulos/tareas/README.md` documenta el ruteo de RPCs al completar; leerlo antes de tocar Tareas.
- `tareas.servicio.ts` usa la constante `COLUMNAS` (string con todas las columnas, incluye `routine_id`). Añadir `franja` ahí y quitar `routine_id` al borrarlo; `CrearTareaInput.routineId` y `EditarTareaInput.routineId` también.
- `routine_id` sigue en uso en `tareas.tipos.ts` (líneas 35 y 68) y `tareas.servicio.ts` (38, 66, 80, 135, 159). El borrado en B1 requiere limpiar todo eso.
- `src/nucleo/navegacion/superficieRelease.test.ts` lista `app/rutinas/index.tsx` como ruta **retirada**: no crear esa ruta. El ejecutor puede ser `app/rutinas/[id].tsx` (no está prohibido); la lista de rutinas sigue como pestaña dentro de `SenderosPantalla`. Si se añade ruta, revisar que el test siga en verde.
- Los cambios de `0194f44` también tocaron `CrearHabitoWizard.tsx`, `CrearTareaWizard.tsx`, `HabitosPantalla`/`TimelineTareasHoy` y añadieron `SelectorHora12` y `SelectorFechaCalendario` (`src/diseno/ui`). Reutilizar `SelectorHora12` para la hora de la rutina. Releer los wizards completos antes de editarlos en la etapa E.
- Hay cambios locales del usuario sin subir sobre tareas y planes. Antes de la etapa A, preguntar si ya los subió; si toca `tareas.servicio.ts`, `tareas.tipos.ts` o migraciones, esperar para evitar conflictos.
- `RutinasPantalla.tsx` (237 líneas) es maqueta con `RUTINAS_INICIALES` fijos. Se monta en `SenderosPantalla.tsx` como pestaña `rutinas`.
- En `SenderosPantalla.tsx` la pestaña `tareas` aún muestra `ProximamentePane`, aunque la pantalla real vive en la ruta `tareas`. Es un residuo; no tocarlo salvo que moleste.
- Patrón de servicios de tareas: `tareas.servicio.ts` usa `obtenerClienteSupabase()`; CRUD directo con RLS sobre `tareas_items`, RPC para lo que acredita gemas o calcula en servidor. `FilaTarea` → `normalizar` → `Tarea`. Hábitos pasa todo por RPC y mappers con validación defensiva (`senderoHabito.mapper.ts`).
- `habitos_es_dia_programado(plan, fecha)` (migración 07) y `tareas_es_dia_programado(tarea, fecha)` (migración 59) son la base de "aplica hoy". `estaProgramadaEnFecha` en `tareaProgramada.ts` es el espejo de cliente.
- Tests: `vitest run`, 82 archivos, nombres `*.test.ts` junto al código. Los smoke SQL remotos viven en `supabase/tests/*.mjs` ejecutados con `ejecutar_sql_management.mjs`.
- Restricciones de entorno: no hay `node_modules` (hacer `npm ci`); el MCP de Supabase no conecta (`ERR_PROXY_TUNNEL`), así que el SQL **no se prueba**; la app es nativa (Skia, widgets), no corre en Expo Go ni en esta sesión, así que no hay capturas.

## Etapa A — Base de franjas (sin UI)

**A1. Migración `20261004_69_franjas_del_dia.sql`**
- `create domain public.franja_dia as text check (...)`.
- `habitos_planes.franja`, `tareas_items.franja` con `not null default 'cualquier_momento'`.
- `perfiles_usuario.franja_manana_desde / tarde_desde / noche_desde` con defaults 5/12/19 y check de orden.
- `public.franja_de_hora(...)` inmutable.
- Revisar si `perfiles_usuario` tiene grants por columna o policies de update restrictivas antes de exponer los límites; si las hay, extenderlas.
- Revisar qué RPCs crean o reemplazan planes de hábito (`crear_habito_premium` y siguientes, migraciones 10, 20, 42) para saber qué parámetro `p_franja` habrá que añadir en la etapa E. **No tocarlas en A**; las columnas con default no las rompen.
- Todo en `begin; … commit;`.

**A2. Lógica pura en TS** — `src/compartido/utilidades/franjas.ts`
- Tipo `FranjaDia`, constante `FRANJAS_ORDEN`, `LimitesFranja`, `LIMITES_FRANJA_DEFECTO`.
- `franjaDeHora(hora, limites)` con noche que cruza medianoche.
- `sugerirFranjaPorHora(horaHHmm, limites)` para los wizards.
- `franjaActual(ahora, limites)`.
- Tests primero: 4:59, 5:00, 11:59, 12:00, 18:59, 19:00, 23:59, 0:00, límites personalizados, hora inválida.

**A3. Tipos y mappers**
- `Tarea.franja`, `FilaTarea.franja`, `normalizar`; actualizar `tareas.mapper` y tests existentes que construyen `Tarea`.
- Tipo del plan de hábito: añadir `franja`. Localizar el mapper de plan en `src/modulos/habitos` (grep `dias_semana` en mappers).
- `npm run typecheck` y `npm test` en verde antes de commit.

## Etapa B — Backend de Rutinas (sin UI)

**B1. Migración `20261004_70_rutinas_nucleo.sql`**
- Tablas `rutinas_items` (con `franja public.franja_dia`), `rutinas_pasos`, `rutinas_pasos_registros`, `rutinas_registros` exactamente como el spec.
- RLS y grants espejo de `tareas_items`; para `rutinas_pasos` y `rutinas_pasos_registros`, policy vía `exists` sobre la rutina propietaria.
- Trigger `rutinas_pasos_mismo_propietario`: el hábito o tarea referenciados deben ser del `usuario_id` de la rutina; `security definer` con `search_path` fijo.
- `unique (rutina_id, orden) deferrable initially deferred`.
- `alter table tareas_items drop column routine_id` (columna solo en `mejoras`, sin referencias en UI; confirmar con grep de `routine_id` y `routineId` antes de borrar y limpiar `Tarea`, `FilaTarea`, mappers, plantillas y tests).
- Triggers `updated_at` con `set_updated_at()`.

**B2. Migración `20261004_71_rutinas_rpcs.sql`**
- `crear_rutina`, `actualizar_rutina`, `obtener_rutinas_hoy`, `iniciar_rutina`, `completar_paso_propio_rutina`.
- Seguir el patrón existente de wrappers `public` sobre funciones en `privacidad`/`comercio`: leer una migración reciente (59/60/63) y copiar convención de `security definer`, `set search_path`, `auth.uid()`, grants a `authenticated` y revocar de `anon`.
- `obtener_rutinas_hoy`: zona horaria desde `perfiles_usuario`, aplica `habitos_es_dia_programado` / `tareas_es_dia_programado`, estado de pasos calculado desde `habitos_registros`, `tareas_registros`/`tareas_items.estado` y `rutinas_pasos_registros`. Incluir `franja` de la rutina.
- Máximo 20 pasos por rutina, orden contiguo, validación de `modo`/`objetivo_valor`.
- Cierre de rutina dentro de `completar_paso_propio_rutina` y también al leer: la lectura puede fijar `completada_en` solo vía RPC explícito, no en una lectura. Decidir: cierre calculado en lectura (sin escribir) y `completada_en` solo cuando el cliente llama a `iniciar`/`cerrar`. Dejar escrito en el SQL la elección tomada.

**B3. TS de dominio** — `src/modulos/rutinas/`
- `rutinas.tipos.ts`, `rutinas.mapper.ts` (validación defensiva estilo `senderoHabito.mapper.ts`), `rutinas.servicio.ts` (solo `rpc()`), `estadoRutina.ts` (función pura que calcula completitud, progreso y "no aplica hoy" a partir de pasos).
- Tests: `estadoRutina.test.ts` (4 orígenes, sin pasos aplicables, orden), `rutinas.mapper.test.ts` (payload válido y roto).

**B4. Smoke SQL** — `supabase/tests/09_rutinas_nucleo_remoto.mjs`
- RLS entre dos cuentas, rechazo de referencia a hábito ajeno, paso propio idempotente, límite de pasos. Escrito pero **no ejecutable aquí**; documentar en el commit que queda pendiente de correr.

**B5. Docs** — actualizar `supabase/resumen.md`, `supabase/privacidad-schema.md` y `docs/app-store/privacy-inventory.md` con las tablas nuevas.

## Etapa C — `RutinasPantalla` real

- Tomar el esqueleto de `HabitosPantalla` (666 líneas) y `TareasPantalla` (342 líneas): `AuroraBoreal`, encabezado con volver y gemas (`useSaldoGemas`), hero con progreso del día, lista. No copiar bloques enteros: extraer lo repetido a componentes si ya hay duplicación evidente, sin refactorizar Hábitos ni Tareas en esta etapa.
- Datos con `useQuery` sobre `obtener_rutinas_hoy`; claves de caché en el mismo estilo que tareas; invalidar al mutar.
- Agrupación por franja con los 4 botones: crear `SelectorFranja` como componente compartido (candidato: `src/diseno/componentes/SelectorFranja.tsx`) con función pura de conteo y filtro (`agruparPorFranja`) en `src/compartido/utilidades/franjas.ts`, con tests (franja vacía, sin franja solo en Todo, pendientes por franja).
- Estados: cargando (skeleton existente), vacío (invita a crear), error.
- Responsive: usar `maxWidth` y flex, sin anchos fijos; hook de breakpoints si ya existe uno, y si no, crear `useDispositivo` mínimo sin aplicar layouts de tablet todavía.
- i18n: añadir claves ES/EN en `src/servicios/i18n/recursos.ts` (archivo único de 1.806 líneas; añadir sin reorganizar).
- Mantener el montaje como pestaña `rutinas` de `SenderosPantalla` (no crear `app/rutinas/index.tsx`, lo prohíbe `superficieRelease.test.ts`).
- Tema ambiente propio de Rutinas: paquete `ignate`, color `#90010D` (existe en `arboles_paquetes`, migración 28, y en `registroPaquetesArbol.ts` con sus ilustraciones). Definir `PAQUETE_RUTINAS = 'ignate'` y `COLOR_PAQUETE_RUTINAS = '#90010D'` y reutilizar el mecanismo de `TareasPantalla` (`paqueteId`/`colorPaquete`, `obtenerAssetsPaquete`, `crearTonoMaster`). Verificar que `TareasPantalla` usa su paquete fijo sin exigir que la persona lo tenga comprado (parece así: `PAQUETE_TAREAS='golden'` es de pago); si exige propiedad, usar el mismo criterio para Rutinas. Comprobar contraste del texto sobre `#90010D` (es oscuro) con `colorSeguroUi`.
- Los planes no entran en `construirPlanDelDia` en esta fase: solo hábitos, tareas y rutinas.
- Quitar `RUTINAS_INICIALES` y los tipos mock.

## Etapa D — Crear y ejecutar rutinas

- `CrearRutinaWizard`: copiar la estructura de pasos de `CrearTareaWizard` (puntos de progreso, `layoutTecladoWizard`), pasos: identidad → programación y franja → pasos (elegir hábito, tarea o paso propio) → recordatorio → revisión. Estado de pasos con reducer, no con 15 `useState`.
- Ejecutor: pantalla/ruta `app/rutinas/[id].tsx` que reutiliza `TarjetaChecklistCompacta`, cronómetro y contador de tareas. Hábito/tarea llaman a sus RPCs existentes (`registrar_progreso_habito`, `completar_tarea_dia`/`registrar_progreso_tarea`); paso propio llama a `completar_paso_propio_rutina`. Tras cada acción, invalidar la consulta de rutinas, hábitos y tareas.
- Recordatorios: añadir código a `catalogo_notificaciones`, extender la cola y `despachar-recordatorios-habitos` o crear función hermana; revisar `reclamar_recordatorios_tareas` como modelo.

## Etapa E — Franjas en wizards y Hoy

- `CrearHabitoWizard` y `CrearTareaWizard`: selector de franja en el paso de programación; sugerencia con `sugerirFranjaPorHora` solo si la persona no eligió a mano (flag `franjaManual`). Extender los RPCs de creación/edición de hábito con `p_franja` (identificados en A1; mirar también cómo `0194f44` modificó el wizard) y la inserción de tareas.
- Edición de hábito (`DetalleHabitoPantalla`/gestión, migración 42) y de tarea.
- `HoyPantalla` (892 líneas): plan unificado con `SelectorFranja`, tope de 5 por franja, rutinas como tarjeta, deduplicación de pasos de rutina. Antes de tocarla, leerla completa y mantener su tema. Hacer el cambio detrás de una función pura `construirPlanDelDia(items, rutinas, limites, ahora)` con tests, para no meter lógica en el componente.
- Retirar el toggle Hábitos/Tareas de Hoy solo cuando el plan unificado funcione.

## Etapa F — Ajustes e insights

- Pantalla de límites de franja en `direccion`/configuración, con validación del orden y vista previa.
- Insights por franja derivados de `completada_en` y los límites del perfil, sin columna nueva.

## Verificación por etapa

1. `npm ci` una vez; después `npm run typecheck && npm test` antes de cada commit.
2. Las migraciones y RPCs se revisan leyendo el SQL contra las convenciones de migraciones 56–63; no se pueden ejecutar aquí.
3. Nada de UI se da por verificado sin que la persona lo pruebe en dispositivo; lo diré explícitamente en cada entrega.
4. Regresión en A: rachas y niveles de hábitos y tareas sin cambios (tests existentes en verde).

## Riesgos técnicos

| Riesgo | Mitigación |
| --- | --- |
| SQL sin probar contra Supabase | Revisión contra convenciones, smoke tests escritos, la persona los ejecuta al aplicar |
| Borrar `routine_id` rompe código que lo lea | grep previo y typecheck |
| `HoyPantalla` es grande y delicada | Lógica en función pura con tests; cambiar el componente al final |
| Choque de migraciones con trabajo local del usuario | Preguntar antes de A1, `git fetch` antes de cada migración |
| Dominio SQL `franja_dia` no soportado por el generador de tipos o por PostgREST como se espera | Si da problema, cambiar a `check` repetido; decisión local a la migración 69 |
| Triggers `security definer` mal acotados | `search_path` fijo y pruebas de propietario ajeno |
| `perfiles_usuario` con grants por columna | Revisar en A1 antes de añadir columnas |
| Recordatorios duplicados rutina vs hábitos | La hora de la rutina no reemplaza recordatorios de sus pasos; documentarlo en la pantalla de creación |

## Orden de commits sugerido

1. `feat(franjas): migración, dominio y lógica pura` (A1–A3)
2. `feat(rutinas): esquema y RPCs` (B1–B2)
3. `feat(rutinas): tipos, mapper, servicio y estado` (B3–B5)
4. `feat(rutinas): pantalla con datos reales` (C)
5. `feat(rutinas): wizard y ejecutor` (D)
6. `feat(franjas): wizards, Hoy unificado` (E)
7. `feat(franjas): ajustes e insights` (F)
