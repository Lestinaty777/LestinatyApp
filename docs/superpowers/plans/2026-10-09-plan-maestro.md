# Plan maestro — Franjas, Rutinas, Hoy unificado y estrategia

Fecha: 2026-10-09. Rama: `mejoras`. Este documento es **la única fuente de órdenes** para el agente que ejecuta (Gemini u otro). Está escrito para seguirse literalmente, tarea por tarea, en orden.

Documentos de origen (leerlos solo cuando una tarea lo pida; este plan ya los resume):

| Documento | Ruta |
| --- | --- |
| Visión | `docs/vision/lestinaty-vision.md` |
| Estrategia y monetización | `docs/vision/estrategia-y-monetizacion.md` |
| Plan anterior (franjas y rutinas) | `docs/superpowers/plans/2026-10-04-franjas-y-rutinas.md` |
| Spec franjas | `docs/superpowers/specs/2026-10-04-franjas-del-dia-design.md` |
| Spec rutinas | `docs/superpowers/specs/2026-10-04-rutinas-design.md` |
| Spec plantillas con gemas | `docs/superpowers/specs/2026-10-04-plantillas-rutinas-design.md` |
| Spec sesión guiada | `docs/superpowers/specs/2026-10-05-sesion-guiada-rutinas-design.md` |

> Esos documentos llaman 69–73 a las migraciones de franjas y rutinas; hoy son la 77–81 (ver sección 1.1). Donde un documento antiguo contradiga a este plan, **manda este plan**.

---

## 0. Reglas para el agente (obligatorias)

1. **Ejecuta las tareas en orden.** No empieces una tarea si la anterior no pasó su verificación.
2. **No inventes.** Si un archivo, función o columna que este plan nombra no existe o es distinto, **detente y pregunta**. No lo sustituyas por otra cosa.
3. **Antes de editar un archivo, léelo completo.** Copia el estilo que ya tiene (nombres en español, comentarios, formato).
4. **Verificación antes de cada commit:** `npm run typecheck && npm test`. Ambos deben terminar sin errores. Si fallan, arregla antes de seguir; nunca borres ni desactives un test para que pase.
5. **Un commit por tarea**, con el mensaje exacto que indica la tarea. No hagas `git push` salvo que la tarea lo diga.
6. **PARADA** significa: detente, muestra al usuario lo que se indica y espera su respuesta. No continúes por tu cuenta.
7. **Base de datos real:** tiene datos de usuarios reales (9 perfiles, 35 hábitos, 322 registros). Solo se aplica SQL en una tarea marcada **PARADA-BD**, con confirmación del usuario. Las consultas de solo lectura (`select`) sí se pueden correr libremente.
8. **Nunca** uses `supabase db push` ni `supabase migration list` (el historial de migraciones de este proyecto no está sincronizado; no sirven). Se usa siempre:
   ```bash
   export SUPABASE_ACCESS_TOKEN=$(grep "^SUPABASE_ACESSS_TOKEN=" .env | cut -d= -f2-)   # el typo ACESSS es real
   npx supabase db query --linked "select 1"                 # consulta suelta
   npx supabase db query --linked --file ruta/al/archivo.sql # archivo
   ```
9. **Nombres de tablas:** toda tabla lleva el prefijo de su familia: `habitos_`, `tareas_`, `rutinas_`, `planes_`, `metas`/`metas_`, `areas_`. Una tabla nueva de Rutinas se llama `rutinas_algo`, nunca `algo_rutinas`. Los RPC siguen empezando por verbo (`obtener_…`, `crear_…`). Si dudas de a qué familia pertenece una tabla, **PARADA**.
9b. **Migraciones:** siempre aditivas, envueltas en `begin; … commit;`, nombre `AAAAMMDD_NN_descripcion.sql` con `NN` = siguiente número libre (`ls supabase/migrations | tail -3`). Nunca edites una migración ya aplicada: crea una nueva.
10. **Checks SQL con columnas anulables:** `check (char_length(x) between 1 and 80)` deja pasar `null`. Añade siempre `x is not null and …`.
11. **Seguridad:** identidad siempre por `auth.uid()`; ningún RPC recibe `usuario_id` del cliente; toda tabla nueva con RLS; funciones con `set search_path = ''`; `revoke all … from public, anon` y `grant execute … to authenticated`.
12. **Textos de interfaz:** todo texto visible va en `src/servicios/i18n/recursos.ts`, en **las dos** secciones (`en.translation`, línea ~2, y `es.translation`, línea ~1081), con las mismas claves. Añade al final del bloque del módulo; no reordenes el archivo.
13. **Rutas:** no crees `app/rutinas/index.tsx` (lo prohíbe `src/nucleo/navegacion/superficieRelease.test.ts`). La lista de Rutinas vive como pestaña de `SenderosPantalla`.
14. **La app no se puede abrir desde la terminal** (es nativa: Skia, widgets). Nada visual se da por verificado: al terminar cada fase con interfaz, escribe en tu resumen "pendiente de prueba en dispositivo" y qué probar.
15. **Fuera de alcance, no lo construyas aunque los documentos lo mencionen:** gemas por completar rutina, rutinas compartidas, rutinas dentro de planes, Aby generando rutinas, bloques de plan dentro de Hoy, marketplace, cursos, pagos a creadores, modelo unificado de Sendero, cambios a `planes_bloques.momento`.

---

## 1. Estado real y referencia de la base de datos (verificado 2026-10-09)

Todo lo de esta sección está comprobado contra la base real y el repositorio. **Es tu referencia: si necesitas una tabla, columna o RPC, búscala aquí antes de suponer nada.**

### 1.1 Dónde estamos

- Rama `mejoras`. **Hechas las fases 0 a 6B, la 8 y la 9** (pantalla de Metas).
- **Migraciones 01 a 88 aplicadas en la base real.** La **89** (`20261009_89_tareas_quitar_routine_id.sql`) está escrita y ensayada, **pendiente de aplicar** por el usuario.
- 111 archivos de test y 700 tests en verde; `npm run typecheck` limpio.
- Nada de lo construido en las fases 2 a 8 se ha visto correr en un dispositivo: **todo está pendiente de prueba visual** (ver sección 1.5).

Numeración de migraciones (para no confundirse: los documentos antiguos usan otros números):

| Números | Contenido |
| --- | --- |
| 69–76 | Planes: disponibilidad, nota de sección, ítems tipados, compartidos, ramas |
| 77 | Franjas del día (antes llamada 69) |
| 78, 79 | Rutinas: tablas y RPCs (antes 70 y 71) |
| 80 | Plantillas de rutinas con gemas (antes 72) |
| 81 | Sesión guiada: pasos esenciales, iniciar y cerrar (antes 73) |
| 82 | Franja de hábitos |
| 83 | Resumen de Hoy: racha global y XP |
| 84 | Recordatorios de rutina |
| 85 | Editar rutina |
| 86 | Permisos de las funciones de reclamo de recordatorios |
| 87 | Áreas de vida y metas |
| 88 | Prefijo de familia en los nombres de tabla |
| 89 | Borra `tareas_items.routine_id` — **sin aplicar** |

### 1.2 Qué está hecho y qué falta en el código

| Pieza | Estado |
| --- | --- |
| Franja en hábitos y tareas (datos, asistentes, edición de hábito) | Hecho (fases 1 y 2) |
| Hoy unificado por franja, con tope de 5, rutinas como un solo elemento y sin duplicados | Hecho (Fase 3) |
| Cabecera de Hoy: nombre, saludo por franja, racha global, nivel y XP | Hecho (Fase 3) |
| Etiqueta "En Rutina X" y filtro de franja en Hábitos y Tareas | Hecho (Fase 3). El filtro solo aparece si algún elemento tiene franja |
| Completar con un toque desde Hoy | **No hecho** (tarea 3.5, decisión del usuario) |
| Editar una rutina | Hecho (Fase 4) |
| Recordatorios de rutina | Hecho en el código; **falta desplegar la Edge Function** (lo hace el usuario) |
| Racha de sesiones y rutina como camino de nodos en la sesión | Hecho (Fase 4). El camino es una versión ligera, no el mapa isométrico |
| `routineId` fuera del cliente | Hecho; falta aplicar la migración 89 |
| Ajustes de horas de franja e insight "tu mejor franja" | Hecho (Fase 5) |
| Analítica del embudo | Hecho (Fase 6). No envía nada hasta que exista `EXPO_PUBLIC_POSTHOG_KEY`; además exige el permiso de analítica de cada persona |
| Invitación en Hoy vacío y primera victoria | Hecho (Fase 6B) |
| Áreas y metas: dominio, `SelectorMeta` al crear, filtro por área en Hoy | Hecho (tareas 8.2 a 8.5). `SelectorMeta` no se muestra mientras la persona no tenga metas |
| Pantalla de Metas | Hecho (Fase 9). Ruta `app/(principal)/metas.tsx`, se entra desde la tarjeta "Metas" de Hoy. Tema Celesthia (azul). Arriba las áreas como filtro; cuatro pestañas: Mis metas, Crear, Logradas, Áreas |
| Cambiar la meta de algo ya creado | Hecho: al abrir una meta, "Añadir o quitar contenido" |
| Pantallas de maqueta de Metas (`PanelMetasPantalla`, `MetasListaPantalla`, `DetalleMetaPantalla`, `tipos.ts`, `metas.estado.ts`) | Sin uso desde la Fase 9. No se borraron: decide el usuario |
| Edición de tarea con franja | **Falta**: no existe formulario de edición de tareas |
| Plantillas premium reales | **Falta** (Fase 7): necesita contenido aprobado por el usuario |
| Packs, límites y trial en servidor, Live Activities | **Falta y sin spec** (Fases 10 a 13) |

Desviaciones respecto a lo que este plan pedía, y por qué:

- **Camino de la rutina (4.6):** el componente que dibuja el sendero de Tareas es un mapa isométrico de pantalla completa con su propio motor; no cabe dentro de la sesión. Se hizo `CaminoRutina`, una versión ligera con las mismas reglas.
- **Ajustes de franja (5.1):** en vez de una hoja con validación, botones − y + que nunca permiten un orden inválido.
- **Analítica (6):** `habito_completado` se dispara dentro de `registrarProgresoHabito`, porque completar un hábito ocurre en cinco pantallas distintas y ese servicio es su único punto común.
- **Primera victoria (6B):** el botón "Crear mi primer hábito" navega con el parámetro de ruta `abrirCreacion` que `HabitosPantalla` ya entendía, no con la señal del onboarding (esa solo se lee al montar).
- **Áreas propias:** la paleta no incluye verdes, por la regla del proyecto de que todo verde pertenece al tema (`verdesEsmeralda.test.ts`).

### 1.3 Referencia de la base de datos

Convención: toda tabla lleva el prefijo de su familia (`habitos_`, `tareas_`, `rutinas_`, `planes_`, `metas`, `areas_`). `!` = no admite nulo. "Directo" = el cliente puede leer y escribir con `from('tabla')` y RLS limita a lo propio. "Solo lectura" = el cliente solo hace `select`; se escribe por RPC.

#### Franjas del día

- Dominio `public.franja_dia`: `'manana' | 'tarde' | 'noche' | 'cualquier_momento'` (valor por defecto en todas partes).
- `habitos_planes.franja!`, `tareas_items.franja!`, `rutinas_items.franja!`.
- `perfiles_usuario.franja_manana_desde!` (5), `franja_tarde_desde!` (12), `franja_noche_desde!` (19): horas 0–23, con `mañana < tarde < noche`. La noche cruza medianoche.
- `planes_bloques.momento` usa los mismos tres códigos como texto. **No se toca.**

#### Hábitos

| Tabla | Acceso | Notas |
| --- | --- | --- |
| `habitos_items` (`id, usuario_id, titulo, descripcion, icono_lucide, color, tipo_meta, unidad, estado, categoria, dificultad, disparador, recompensa, paquete_id, meta_id, …`) | Directo, pero **se escribe por RPC** | `tipo_meta`: `check / cantidad / duracion`. `estado = 'activo'` para los vigentes |
| `habitos_planes` (`id, habito_id, frecuencia, dias_semana, veces_por_semana, objetivo_valor, desde_fecha, hasta_fecha, recordatorio_activo, hora_recordatorio, mostrar_nombre_notificacion, nivel, origen, mensaje_nivel, franja`) | **Solo lectura** | Versionado por rango de fechas: editar un hábito o subir de nivel puede crear un plan nuevo. Un plan nuevo **hereda la franja** del anterior (trigger) |
| `habitos_registros` (`id, habito_id, usuario_id, fecha_local, valor, registrado_at, nota, …`) | Directo (lectura) | Un registro por hábito y día |
| `habitos_tareas_diarias_reclamadas` | Solo lectura | Misiones diarias de hábitos (antes `tareas_diarias_reclamadas`). No es del módulo Tareas |

RPC: `crear_habito_premium(…)`, `actualizar_habito_desde_detalle(…)`, `archivar_habito`, `registrar_progreso_habito(p_habito_id, p_fecha_local, p_valor, p_nota)`, `obtener_panel_habitos(p_fecha_referencia)`, `obtener_tareas_diarias()`, `reclamar_tarea_diaria(p_tarea_codigo)`, y el nuevo:

- `establecer_franja_habito(p_habito_id uuid, p_franja text) → void`. Cambia la franja del plan más reciente de un hábito propio. Errores: `P0002` hábito ajeno o inexistente, `23514` franja inválida.

#### Tareas

| Tabla | Acceso | Notas |
| --- | --- | --- |
| `tareas_items` (`id, usuario_id, titulo, descripcion, estado, tipo, prioridad, columna_kanban, fecha_vencimiento, frecuencia, dias_semana, recordatorio_activo, hora_recordatorio, mostrar_nombre_notificacion, routine_id, paquete_id, color, icono_lucide, orden, completada_en, nivel, nivel_desde_fecha, objetivo_valor, unidad, valor_actual, franja, meta_id`) | Directo | `tipo`: `simple / checklist / contador / cronometro`. `frecuencia`: `una_vez / dias_semana`. `routine_id` está **pendiente de borrar** (tarea 4.4): no lo uses |
| `tareas_registros` (`id, tarea_id, usuario_id, fecha_local, completada_en, valor, nota, …`) | Directo (lectura) | Solo para tareas `dias_semana` |
| `tareas_subitems` (`id, tarea_id, titulo, hecho, orden`) | Directo | Pasos de una tarea `checklist` |

RPC: `crear_tarea_premium(…)`, `completar_tarea_dia`, `registrar_progreso_tarea`, `registrar_progreso_tarea_unica`, `reprogramar_recordatorio_tarea(p_tarea_id, p_fecha_local)`, `obtener_panel_tareas`. La franja y la meta de una tarea se escriben con `update` directo (`franja`) o con `asignar_meta`.

#### Rutinas

| Tabla | Acceso | Notas |
| --- | --- | --- |
| `rutinas_items` (`id, usuario_id, titulo, descripcion, franja, icono_lucide, color, estado, frecuencia, dias_semana, hora_inicio, recordatorio_activo, mostrar_nombre_notificacion, archivada_en, meta_id`) | Directo | `estado`: `activa / pausada / archivada`. `frecuencia`: `diaria / dias_semana` |
| `rutinas_pasos` (`id, rutina_id, orden, tipo_origen, habito_id, tarea_id, titulo, modo, objetivo_valor, unidad, esencial`) | Directo | `tipo_origen`: `habito / tarea / propio`. `titulo/modo/objetivo_valor/unidad` solo en pasos `propio`. Máximo 20 por rutina; un mismo hábito o tarea no se repite en una rutina |
| `rutinas_pasos_registros` (`id, paso_id, usuario_id, fecha_local, valor, completado_en`) | Directo | Solo pasos `propio`. Los de hábito y tarea se registran en sus propias tablas |
| `rutinas_registros` (`id, rutina_id, usuario_id, fecha_local, iniciada_en, completada_en`) | Directo | La sesión de cada día. `completada_en` no nulo = sesión completa |
| `rutinas_plantillas` (`id text, titulo, descripcion, franja, icono_id, autor, precio_gemas, num_pasos, duracion_min, activa, orden`) | Solo lectura | `precio_gemas = 0` = gratis. Hay 4, todas gratuitas |
| `rutinas_plantillas_contenido` (`plantilla_id, pasos jsonb`) | Solo lectura | RLS: solo si es gratis o la compraste |
| `rutinas_plantillas_compradas` (`usuario_id, plantilla_id, precio_pagado, comprada_en`) | Solo lectura | Se escribe solo por el RPC de compra |

RPC:

| RPC | Devuelve | Notas |
| --- | --- | --- |
| `obtener_rutinas_hoy(p_fecha_referencia date)` | Arreglo de rutinas no archivadas | Cada una con `toca_hoy`, `sesion_iniciada_en`, `sesion_completada_en` y `pasos` (cada paso con `id, orden, origen, habito_id, tarea_id, esencial, tarea_tipo, tarea_frecuencia, titulo, icono_lucide, color, modo, objetivo_valor, unidad, aplica, completo, valor`). **No incluye `meta_id`** |
| `crear_rutina(p_datos jsonb)` | `{ "id" }` | Exige 1–20 pasos y al menos uno esencial |
| `actualizar_rutina(p_rutina_id uuid, p_datos jsonb)` | `{ "id" }` | Misma forma que `crear_rutina`; cada paso puede llevar su `id` para conservarse con sus registros. Errores: `P0002`, `23514` |
| `completar_paso_propio_rutina(p_paso_id, p_valor, p_fecha_local)` | `{ paso_id, valor, completo }` | Solo pasos `propio` |
| `iniciar_rutina(p_rutina_id, p_fecha_local)` | registro de la sesión | Idempotente |
| `cerrar_rutina_dia(p_rutina_id, p_fecha_local)` | `{ completa, requeridos, requeridos_completos, completada_en }` | Completa = todos los esenciales que aplican hoy |
| `obtener_plantillas_rutinas()` | Catálogo con `desbloqueada` y, si lo está, `pasos` | |
| `comprar_plantilla_rutina(p_plantilla_id text)` | `{ plantilla_id, ya_desbloqueada, saldo_restante }` | Sin gemas: `23514` |
| `reprogramar_recordatorio_rutina(p_rutina_id uuid)` | `void` | Llamar tras cambiar hora o apagar el recordatorio |
| `reclamar_recordatorios_rutinas(p_limite integer)` | Arreglo para enviar | **Solo servidor** (`service_role`) |

#### Hoy

- `obtener_resumen_hoy(p_fecha_referencia date) → { "fecha", "racha", "dias_activos_semana": [1..7], "xp_total" }`. Calculado, no guardado. XP: 10 por registro de hábito con avance, 10 por registro de tarea, 10 por tarea `una_vez` hecha, 15 por sesión de rutina completa. Racha: días con alguna acción, consecutivos hasta hoy (o hasta ayer si hoy aún no hay acción).

#### Áreas y metas

| Tabla | Acceso | Notas |
| --- | --- | --- |
| `areas_vida` (`id, usuario_id, codigo, nombre, color, icono_lucide, orden, archivada_en`) | Directo | Del sistema: `usuario_id` nulo y `codigo` (`cuerpo, mente, espiritual, estudios, trabajo, negocios_proyectos, finanzas`); no editables. Propias: `usuario_id` de la sesión, `codigo` nulo, `color` `#RRGGBB`, máximo 20, nombre único por persona |
| `metas` (`id, usuario_id, titulo, descripcion, estado, area_id, icono_lucide, color, fecha_inicio, duracion_dias, lograda_en, orden`) | Directo | `estado`: `activa / pausada / lograda / archivada`. `lograda` exige `lograda_en`, y al revés. `area_id` anulable en la base (lo usa un flujo antiguo de Aby); la interfaz lo exige. `senderos.meta_id` también apunta aquí |
| `meta_id` en `habitos_items`, `tareas_items`, `rutinas_items`, `planes_items` | — | Una sola meta por elemento. El área de un elemento es la de su meta. Borrar una meta deja el elemento sin meta |

RPC: `asignar_meta(p_tipo text, p_elemento_id uuid, p_meta_id uuid) → void` (`p_tipo`: `habito / tarea / rutina / plan`; `p_meta_id` nulo quita la meta) y `obtener_metas(p_fecha_referencia date)` (forma exacta en la Fase 8).

#### Recordatorios

- Cola `privacidad.notificaciones_programadas` (no accesible desde la app): exactamente uno de `plan_habito_id`, `tarea_id`, `rutina_id`.
- `catalogo_notificaciones` activos: `habito_recordatorio`, `tarea_recordatorio`, `rutina_recordatorio`. La preferencia de cada persona nace **apagada**: al activar un recordatorio hay que llamar `actualizarPreferenciaNotificacion(codigo, true)`.
- `reclamar_recordatorios_habitos / _tareas / _rutinas` y `finalizar_recordatorio_habito`: **solo servidor**. Las usa la Edge Function `despachar-recordatorios-habitos`, que corre cada minuto.

#### Planes (no se modifican en este plan)

`planes_items → planes_secciones → planes_dias → planes_bloques (momento) → planes_bloque_items`, con progreso en `planes_instancias` y `planes_instancia_progreso`, más `planes_propuestas`, `planes_ramas`, `planes_generaciones_uso`. `planes_items.meta_id` es lo único nuevo.

#### Gemas

- `comercio.movimientos_gemas` y `comercio.billeteras_gemas` (no accesibles desde la app; solo por RPC). Motivos válidos: `compra_iap, gasto_tienda, ajuste_soporte, recompensa_nivel, gasto_semillas, referido_nivel2, trial_horizon_bono, cofre_intermedio, cofre_final, tarea_diaria, racha_tarea, cofre_final_tarea, gasto_plantilla_rutina`. Añadir un motivo exige una migración que **conserve los 13**.

#### Claves de caché que ya existen (úsalas tal cual)

`['rutinas','lista']` (`CLAVE_RUTINAS`), `['habitos','panel']`, `['habitos','detalles-hoy']`, `['habitos','activos']`, `['habitos','mejor-racha']`, `CLAVE_TAREAS_HOY`, `CLAVE_TAREAS_LISTA`, `CLAVE_TAREAS_RECORDATORIOS`, `CLAVE_SALDO_GEMAS`, `['configuracion','usuario']`.

### 1.4 Qué SQL queda

Ninguno por escribir para las fases 1 a 9. Queda **aplicar** la migración 89 (borra `tareas_items.routine_id`), y solo cuando la app instalada sea posterior al commit `refactor(tareas): quitar routineId del cliente`; una app más vieja falla al cargar Tareas si la columna ya no existe:

```bash
export SUPABASE_ACCESS_TOKEN=$(grep "^SUPABASE_ACESSS_TOKEN=" .env | cut -d= -f2-)
npx supabase db query --linked --file supabase/migrations/20261009_89_tareas_quitar_routine_id.sql
```

Si crees que necesitas otra tabla, columna o RPC, **PARADA** y explícalo: lo más probable es que ya esté en la sección 1.3.

### 1.5 Pendientes del usuario

| # | Qué | Para qué |
| --- | --- | --- |
| 1 | Reconstruir la app y probar en dispositivo lo de las fases 2 a 8 | Nada de la interfaz nueva se ha visto correr |
| 2 | `npx supabase functions deploy despachar-recordatorios-habitos` | Sin esto no salen los recordatorios de rutina (los de hábitos y tareas siguen funcionando) |
| 3 | Aplicar la migración 89, después de instalar la app nueva | Limpieza; no bloquea nada |
| 4 | Crear un proyecto en PostHog y poner `EXPO_PUBLIC_POSTHOG_KEY` en `.env`; añadir PostHog al inventario de privacidad antes de publicar | Sin clave la analítica no envía nada |
| 6 | Aprobar contenido y precio de las plantillas premium (decisión 6) | Desbloquea la Fase 7 |
| 7 | Usar la app dos semanas y llenar `docs/fricciones.md` | Fase 5B: esa lista ordena lo que sigue |

Qué probar en dispositivo, en orden:

1. **Hoy:** saludo con tu nombre; racha y nivel reales (cuenta nueva: racha 0, Nivel 1 · 0/60 XP); botones de franja con la actual seleccionada; lo sin franja solo en "Todo"; un hábito que está en una rutina de hoy no sale suelto.
2. **Crear hábito y tarea:** el selector de franja; con recordatorio a las 7:00 sugiere Mañana; si eliges otra a mano, cambiar la hora no la mueve.
3. **Rutinas:** crear, editar (lápiz en Mis rutinas), sesión guiada con el camino de nodos al preparar y al terminar, racha a partir de 2 días.
4. **Recordatorio de rutina:** activarlo pide permiso de notificaciones; tras desplegar la función, llega a la hora y al tocarlo abre la sesión.
5. **Ajustes → Franjas del día:** mover las horas y ver que Hoy abre en la franja correcta.
6. **Insights → Tu mejor franja:** con menos de 7 registros muestra la barra de "faltan datos".
7. **Cuenta nueva:** Hoy muestra "Tu primer paso"; al completar el primer hábito aparece el aviso una vez.
8. **Metas:** entrar desde la tarjeta de Hoy; crear una meta en Cuerpo con plazo de 30 días; abrirla y añadirle un hábito; filtrar por área arriba; marcarla lograda y verla en Logradas; crear un área propia en la pestaña Áreas. Después, en Hoy debe aparecer el chip rojo "Cuerpo" y, al crear un hábito, la pregunta "¿Para qué meta es?".

---

## 2. Mapa de fases

| Fase | Resultado | Depende de | ¿Toca la base real? |
| --- | --- | --- | --- |
| 0 | Una sola rama con todo, migraciones renumeradas y aplicadas | — | **Hecha** |
| 1 | Hábitos y tareas guardan y leen su franja | 0 | **Hecha** |
| 2 | Selector de franja al crear y editar | 1 | **Hecha** |
| 3 | Hoy unificado con datos reales y cabecera funcional (racha, nivel, XP) | 1 | **Hecha** (salvo 3.5, opcional) |
| 4 | Rutinas: editar, recordatorios reales, racha, camino visual, limpieza | 0 | **Hecha**; falta aplicar la 89 y desplegar la función |
| 5 | Ajustes de horas de franja e insights por franja | 1 | **Hecha** |
| 5B | **Pausa de uso real (2 semanas)** y lista de fricciones | 5 | No |
| 6 | Analítica del embudo | 0 | **Hecha** (falta la clave de PostHog) |
| 6B | Primera victoria de un usuario nuevo | 3, 6 | **Hecha** |
| 7 | Plantillas premium reales | 0, 6 | Sí (solo datos) |
| 8 | Áreas de vida y metas: dominio, selector de meta y filtro por área en Hoy | 3 | **Hecha** (el cambio de meta al editar pasa a la Fase 9) |
| 9 | Pantalla de Metas real | 8 | **Hecha** |
| 10 | Packs por área | 7, 8, 9 | Sí (solo datos) |
| 11 | Límites gratis/Horizon en servidor y trial | 6 | Sí |
| 12 | Live Activities (iOS) | 4 | No |
| 13 | Finanzas sencillas | 8, 9 | Por decidir |

Las fases 0 a 6B, la 8 y la 9 están hechas. **Lo siguiente es la Fase 7, que espera la decisión 6 (contenido de las plantillas premium), y la pausa de uso real (5B).** Las fases 1–9 (incluidas 5B y 6B) están detalladas. Las fases 10–13 **no tienen spec**: su primera tarea es escribirlo y hacer PARADA. La sección 3 dice cuándo se retoman las fases 6–10 de la visión (modelo unificado, Aby, cooperativo, cursos, marketplace).

---

## FASE 0 — Unir el trabajo y poner la base al día — **HECHA (2026-10-09)**

No repitas nada de esta fase. Lo que se hizo:

1. Trabajo local de Planes commiteado (`49f6b96`).
2. Merge con `origin/mejoras` sin conflictos y migraciones de Franjas/Rutinas renumeradas de 69–73 a 77–81 (`e571ee3`).
3. Migraciones 77–88 aplicadas a la base real y verificadas con consultas de solo lectura.
4. Todo subido a `origin/mejoras`.

Quedan tres pendientes **del usuario** (no bloquean la Fase 1; recuérdaselos en tu primer resumen):

- **Prueba en dispositivo de Rutinas:** en Senderos → Rutinas, crear una rutina, usar una plantilla y hacer una sesión completa con cronómetro.
- **Pruebas SQL de humo:** `supabase/tests/09_franjas_rutinas.sql`, `10_plantillas_rutinas.sql` y `11_sesion_rutinas.sql` necesitan `psql` (`sudo pacman -S postgresql`) y la cadena de conexión del panel de Supabase en `DATABASE_URL`. Hacen `rollback`.
- **Base de pruebas (staging):** decidir si se crea un segundo proyecto de Supabase. Sin él, cualquier SQL nuevo se ensaya contra la base real dentro de `begin; … rollback;`.

---

## FASE 1 — Franja en los datos de hábitos y tareas — **HECHA y revisada (2026-10-09)**

Commits `53b1fde` y `6415b5d`. Revisada contra este plan: cumple las tareas 1.3 y 1.4. No la repitas. Queda un ajuste, que es la tarea 2.0.

Objetivo: que cada hábito y cada tarea pueda guardar y devolver su franja. Sin interfaz todavía.

Decisión de diseño (no la cambies): **no se reescriben** `crear_habito_premium` (20 parámetros) ni `actualizar_habito_desde_detalle`. Hay un RPC pequeño que cambia la franja del plan vigente y un trigger que hace que un plan nuevo herede la franja del anterior.

### Tarea 1.1 — Migración 82 (ya escrita y ensayada: no la modifiques)

Archivo: `supabase/migrations/20261009_82_franja_habitos.sql`. Contiene:

- Trigger `habitos_planes_heredar_franja`: un plan nuevo de un hábito hereda la franja del plan anterior.
- RPC `public.establecer_franja_habito(p_habito_id uuid, p_franja text) returns void`: cambia la franja del plan más reciente de un hábito propio. Errores: `P0002` si el hábito no es tuyo, `23514` si la franja no es válida.

Tu trabajo es solo llamarla desde el cliente (tarea 1.4).

### Tarea 1.2 — Comprobar que está aplicada (solo lectura)

`select count(*) from pg_trigger where tgname = 'habitos_planes_heredar_franja';` debe dar 1. Si da 0, **PARADA** y avisa al usuario (sección 1.4).

### Tarea 1.3 — Tareas: tipo, servicio y lectura

Archivos: `src/modulos/tareas/tareas.tipos.ts`, `src/modulos/tareas/tareas.servicio.ts`.

1. En `tareas.tipos.ts`: importa `FranjaDia` de `../../compartido/utilidades/franjas`. Añade `franja: FranjaDia;` a `Tarea` y a `TareaHoyDetalle`. Añade `franja?: FranjaDia;` a `CrearTareaInput`.
2. En `tareas.servicio.ts`:
   - `FilaTarea`: añade `franja: FranjaDia;`.
   - `normalizar`: añade `franja: fila.franja,`.
   - Constante `COLUMNAS` (línea ~80): añade `, franja` al final del string.
   - `crearTarea`: en el objeto del `insert`, añade `franja: input.franja ?? 'cualquier_momento',`.
   - `editarTarea`: añade `if (input.franja !== undefined) cambios.franja = input.franja;`.
   - `CrearTareaPremiumInput`: añade `franja?: FranjaDia;`. En `crearTareaPremium`, **después** de obtener el `id` del RPC y solo si `input.franja` existe y no es `'cualquier_momento'`, ejecuta `await obtenerClienteSupabase().from('tareas_items').update({ franja: input.franja }).eq('id', id)` y lanza el error si lo hay. No cambies los parámetros del RPC `crear_tarea_premium`.
   - `obtenerTareasHoy`: añade `franja` al `select` de `tareas_items`, al tipo `FilaItemHoy` y al objeto devuelto.
3. Arregla todos los errores de `npm run typecheck` (tests y objetos que construyen `Tarea` o `TareaHoyDetalle`: añade `franja: 'cualquier_momento'`).

Commit: `feat(franjas): franja en tipos y servicio de tareas`

### Tarea 1.4 — Hábitos: tipo, servicio y lectura

Archivos: `src/modulos/habitos/semanaProgramada.ts`, `habitos.servicio.ts`, `tipos.ts`, `gestionDetalleHabito.ts`.

1. `semanaProgramada.ts`: en `FilaPlanSemana` añade `franja?: FranjaDia;`. En `HabitoHoyDetalle` añade `franja: FranjaDia;`. En `calcularDetalleHabitoHoy`, toma la franja del plan vigente hoy (el mismo plan que la función ya usa para decidir si está programado); si no hay plan, `'cualquier_momento'`. Añade un test en `semanaProgramada.test.ts`: plan con `franja: 'tarde'` → detalle con `franja: 'tarde'`; sin plan → `'cualquier_momento'`.
2. `habitos.servicio.ts`:
   - `obtenerDetallesHabitosHoy`: añade `franja` al `select` de `habitos_planes`.
   - `obtenerDetalleHabito`: lee cómo arma `programacion`; añade `franja` al select del plan y devuélvela en `programacion.franja`.
   - Nueva función:
     ```ts
     export async function establecerFranjaHabito(habitoId: string, franja: FranjaDia): Promise<void> {
       const { error } = await obtenerClienteSupabase().rpc('establecer_franja_habito', { p_habito_id: habitoId, p_franja: franja });
       if (error) throw error;
     }
     ```
   - `CrearHabitoInput`: añade `franja?: FranjaDia`. En `crearHabito`, tras recibir `{ id, plan_id }`, si `input.franja` existe y no es `'cualquier_momento'`, llama `await establecerFranjaHabito(id, input.franja)`.
   - `actualizarHabitoDesdeDetalle`: tras el RPC existente, llama `await establecerFranjaHabito(habitoId, edicion.franja)`.
3. `tipos.ts`: en `DetalleHabito.programacion` añade `franja: FranjaDia`.
4. `gestionDetalleHabito.ts`: añade `franja: FranjaDia` a `EdicionHabito` y en `normalizarEdicionHabito` copia `programacion.franja`. Actualiza `gestionDetalleHabito.test.ts`.

Commit: `feat(franjas): franja en tipos y servicio de hábitos`

---

## FASE 2 — Selector de franja al crear y editar

### Tarea 2.0 — Que un fallo al guardar la franja no parezca un fallo al crear

Hoy, en `crearHabito` (`habitos.servicio.ts`) y `crearTareaPremium` (`tareas.servicio.ts`), si el hábito o la tarea **ya se creó** y falla el segundo paso (guardar la franja), la función lanza el error. El asistente mostraría "no se pudo crear" aunque sí se creó, y la persona podría crearlo dos veces.

1. En `crearHabito`: envuelve `await establecerFranjaHabito(res.id, input.franja)` en `try { … } catch { /* la franja es solo presentación: el hábito ya existe */ }`.
2. En `crearTareaPremium`: no lances `errorFranja`; ignóralo con el mismo comentario.
3. **No** cambies `actualizarHabitoDesdeDetalle` ni `editarTarea`: al editar, un fallo sí debe verse (la persona está cambiando justo eso).
4. `npm run typecheck && npm test`.

Commit: `fix(franjas): un fallo al guardar la franja no interrumpe la creación`

### Tarea 2.1 — Componente `SelectorFranjaElemento`

Crea `src/diseno/componentes/SelectorFranjaElemento.tsx` y expórtalo en `src/diseno/componentes/index.ts`. Es distinto de `SelectorFranja` (ese **filtra** con Mañana/Tarde/Noche/Todo; este **elige** la franja de un elemento).

- Props: `{ color: string; etiquetas: Record<FranjaDia, string>; onCambiar: (franja: FranjaDia) => void; valor: FranjaDia }`.
- Cuatro botones en el orden de `FRANJAS_ORDEN`. Copia la estructura y estilos de `SelectorFranja.tsx` (sin el contador). `accessibilityRole="radio"` y `accessibilityState={{ selected }}`.
- Sin textos propios: las etiquetas llegan por props.

Claves i18n nuevas (en `en` y `es`), bajo un bloque `franjas`:

| Clave | es | en |
| --- | --- | --- |
| `franjas.manana` | Mañana | Morning |
| `franjas.tarde` | Tarde | Afternoon |
| `franjas.noche` | Noche | Night |
| `franjas.cualquier_momento` | Sin franja | Any time |
| `franjas.todo` | Todo | All |
| `franjas.titulo` | ¿En qué momento del día? | What time of day? |
| `franjas.sugerida` | Sugerida por la hora del recordatorio | Suggested from the reminder time |
| `franjas.pendientes` | {{franja}}, {{n}} pendientes | {{franja}}, {{n}} pending |
| `franjas.vacia` | Nada pendiente en esta franja | Nothing pending in this slot |
| `franjas.verTodo` | Ver todo | See all |
| `franjas.verMas` | Ver {{n}} más | See {{n}} more |
| `franjas.completados` | {{n}} completados | {{n}} completed |

Si el módulo de Rutinas ya definió claves equivalentes, **reutilízalas** en vez de duplicar (busca `Mañana` en `recursos.ts`).

Commit: `feat(franjas): SelectorFranjaElemento y textos`

### Tarea 2.2 — `CrearHabitoWizard`

Archivo: `src/modulos/habitos/componentes/CrearHabitoWizard.tsx` (586 líneas; léelo entero primero).

1. Estado nuevo: `const [franja, setFranja] = useState<FranjaDia>('cualquier_momento'); const [franjaManual, setFranjaManual] = useState(false);`
2. En el paso de recordatorio (`paso === 4`), debajo del selector de hora, pinta el título `t('franjas.titulo')` y `<SelectorFranjaElemento … onCambiar={(f) => { setFranja(f); setFranjaManual(true); }} />`.
3. Sugerencia: un `useEffect` que, cuando `recordatorio` es `true`, cambia `hora` y `franjaManual` es `false`, hace `const s = sugerirFranjaPorHora(hora); if (s) setFranja(s);`. Si `franjaManual` es `true`, nunca se pisa.
4. Donde se arma el objeto para `onCrear` (línea ~418), añade `franja`.
5. Si existe una función que reinicia el estado al cerrar, reinicia también `franja` y `franjaManual`.

### Tarea 2.3 — `CrearTareaWizard`

Archivo: `src/modulos/tareas/componentes/CrearTareaWizard.tsx` (662 líneas). Mismos 5 pasos que 2.2, en el paso donde está `SelectorHora12` (línea ~599), y añadiendo `franja` al objeto de creación (línea ~320).

### Tarea 2.4 — Edición

1. `src/modulos/habitos/componentes/EditarHabitoFormulario.tsx`: añade `SelectorFranjaElemento` ligado a `edicion.franja`, junto a los campos de recordatorio.
2. Edición de tarea: busca dónde se llama `editarTarea(` en `src/modulos/tareas` (`grep -rn "editarTarea(" src`). Si hay formulario de edición, añade ahí el selector. Si no existe formulario de edición de tarea, **no lo crees**: anótalo como pendiente en tu resumen.

Verificación de la fase: `npm run typecheck && npm test`. Commit: `feat(franjas): selector de franja en asistentes y edición de hábitos y tareas`

Pendiente de dispositivo: crear un hábito con recordatorio a las 7:00 (debe sugerir Mañana), cambiar a Noche a mano, mover la hora (no debe cambiar), guardar, editar y ver Noche.

---

## FASE 3 — Hoy unificado

Objetivo: `HoyPantalla` deja de mostrar la lista falsa `TAREAS_HOY` y muestra hábitos, tareas y rutinas reales por franja. Se conservan el encabezado, el hero, la cuadrícula y **todos los estilos y colores** actuales de la pantalla.

### Tarea 3.1 — Función pura `construirPlanDelDia`

Crea `src/modulos/hoy/planDelDia.ts` y `src/modulos/hoy/planDelDia.test.ts`. **Escribe primero los tests.**

```ts
import type { FiltroFranja, FranjaDia } from '../../compartido/utilidades/franjas';

export const TOPE_PENDIENTES_POR_FRANJA = 5;

export type ElementoHoy = {
  tipo: 'habito' | 'tarea' | 'rutina';
  id: string;
  titulo: string;
  iconoLucide: string | null;
  color: string | null;
  franja: FranjaDia;
  completado: boolean;
  /** Texto corto de avance ya calculado, p. ej. "2 de 5 pasos" o "3/8 vasos"; null si no aplica. */
  detalle: string | null;
};

export type SeccionHoy = {
  franja: FranjaDia;
  pendientes: ElementoHoy[];      // como máximo `tope`, salvo que la franja esté expandida
  pendientesOcultos: number;      // cuántos pendientes quedaron fuera por el tope
  completados: ElementoHoy[];
};

export type PlanDelDia = {
  secciones: SeccionHoy[];                       // solo las franjas visibles para el filtro, sin secciones vacías
  conteos: Record<FiltroFranja, number>;         // pendientes por botón (siempre de todo el día)
  total: number;
  completados: number;
};

export function construirPlanDelDia(entrada: {
  habitos: ElementoHoy[];
  tareas: ElementoHoy[];
  rutinas: ElementoHoy[];
  /** Ids de hábitos y tareas que son paso de una rutina que toca hoy: no se muestran sueltos. */
  idsEnRutinas: { habitos: ReadonlySet<string>; tareas: ReadonlySet<string> };
  filtro: FiltroFranja;
  expandidas: ReadonlySet<FranjaDia>;
  tope?: number;
}): PlanDelDia
```

Reglas (cada una con su test):

1. Un hábito o tarea cuyo id está en `idsEnRutinas` **no aparece** (ni cuenta).
2. Orden de secciones: `manana`, `tarde`, `noche`, `cualquier_momento`.
3. Filtro `manana`/`tarde`/`noche`: una sola sección, la de esa franja. Filtro `todo`: las cuatro.
4. Los elementos `cualquier_momento` solo aparecen con filtro `todo`.
5. `conteos`: pendientes de cada franja; `conteos.todo` = todos los pendientes, incluidos los sin franja. No dependen del filtro activo.
6. Dentro de una sección, los pendientes mantienen el orden de entrada: rutinas, luego hábitos, luego tareas.
7. Si hay más de `tope` pendientes y la franja no está en `expandidas`: se devuelven `tope` y `pendientesOcultos` = el resto. Si está expandida: todos y `pendientesOcultos = 0`.
8. Una sección sin pendientes ni completados no se devuelve.
9. `total` y `completados` cuentan todo el día tras quitar los duplicados de la regla 1.

Añade en el mismo archivo `idsDeRutinasDeHoy(rutinas: Rutina[])`: devuelve `{ habitos, tareas }` con los `habitoId`/`tareaId` de los pasos de las rutinas con `tocaHoy === true` y `estado === 'activa'`. Con test.

Commit: `feat(hoy): construirPlanDelDia con tests`

### Tarea 3.2 — Adaptadores

En `src/modulos/hoy/adaptadoresHoy.ts` (+ test), tres funciones puras que convierten a `ElementoHoy`:

- `habitoAElemento(habito: HabitoResumen, detalle: HabitoHoyDetalle | undefined)`: `franja = detalle?.franja ?? 'cualquier_momento'`; `completado = habito.completado`; `detalle` = `null` si `tipoMeta === 'check'`, si no `` `${valorHoy}/${meta} ${unidad ?? ''}`.trim() ``.
- `tareaAElemento(tarea: TareaHoyDetalle)`: `completado = tarea.completada`; `detalle` = `null` si `tipo` es `simple` o `checklist`, si no `` `${valorHoy}/${objetivoValor} ${unidad ?? ''}`.trim() ``.
- `rutinaAElemento(rutina: Rutina)`: usa `resumirRutina` de `src/modulos/rutinas/estadoRutina.ts` (lee su tipo `ResumenRutina` y usa sus campos reales) para `completado` y para `detalle` = "n de m pasos". El texto "de … pasos" entra como parámetro ya traducido; no pongas texto fijo en la función.

Para saber **qué hábitos tocan hoy**, haz exactamente lo que hace `HabitosPantalla.tsx` para alimentar `TimelineHabitosHoy` (línea ~245): la misma fuente (`consulta.data.hoy.datos`) y el mismo filtro. No inventes otro criterio.

Commit: `feat(hoy): adaptadores de hábito, tarea y rutina`

### Tarea 3.3 — Conectar `HoyPantalla`

Archivo: `src/modulos/hoy/pantallas/HoyPantalla.tsx` (897 líneas; léelo entero).

1. En `TimelineHoy`, añade cuatro consultas con las **mismas claves** que usan sus pantallas (para compartir caché):
   - `useQuery({ queryKey: ['habitos', 'panel'], queryFn: () => obtenerPanelHabitos() })`
   - `useQuery({ queryKey: ['habitos', 'detalles-hoy'], queryFn: () => obtenerDetallesHabitosHoy() })`
   - `useQuery({ queryKey: CLAVE_TAREAS_HOY, queryFn: () => obtenerTareasHoy() })` (importa la clave de donde la importa `TareasPantalla.tsx`)
   - `useQuery({ queryKey: CLAVE_RUTINAS, queryFn: obtenerRutinasHoy })`
2. Estado: `filtro` (inicial `franjaActual()`; no se guarda entre aperturas) y `expandidas` (`Set<FranjaDia>` vacío).
3. Con `useMemo`, arma los `ElementoHoy` con los adaptadores (rutinas: solo `tocaHoy && estado === 'activa'`) y llama `construirPlanDelDia`.
4. Encima de la lista, `<SelectorFranja color={C.morado} conteos={plan.conteos} … />` con las etiquetas `franjas.*` y `etiquetaAccesible` usando `franjas.pendientes`.
5. Sustituye `TAREAS_HOY.map(...)` por el recorrido de `plan.secciones`. Con filtro `todo`, cada sección lleva un encabezado con el nombre de la franja. **Reutiliza los mismos estilos de fila** (`s.timelineItem`, `s.timelineNodoCol`, `s.timelineNodo`, `s.timelineTareaContenido`, etc.). El ícono de cada fila: usa el mismo componente que usa `HabitosPantalla` (`IconoHabitoVisual` / `buscarIconoHabito`) con `iconoLucide`; añade junto al título un indicador pequeño del tipo (hábito, tarea o rutina) que no dependa solo del color.
6. Tras los pendientes de cada sección: si `pendientesOcultos > 0`, un botón `t('franjas.verMas', { n })` que añade la franja a `expandidas`. Si hay completados, una sola línea `t('franjas.completados', { n })`.
7. Sección vacía por filtro: texto `t('franjas.vacia')` y botón `t('franjas.verTodo')` que pone `filtro = 'todo'`.
8. `s.timelineContador`: `` `${plan.completados}/${plan.total}` `` con el texto existente traducido.
9. Al tocar una fila: hábito → `router.push('/habitos/' + id)`; tarea → `router.navigate('/tareas')`; rutina → `router.push('/rutinas/' + id)`. **No** completes nada desde Hoy en esta tarea.
10. Estados: cargando (usa `Skeleton` de `src/diseno/componentes`), error (texto + reintentar con `refetch`), y sin nada para hoy.
11. Borra la constante `TAREAS_HOY`, el tipo local `Tarea`/`EstadoTarea` y los imports de íconos que queden sin uso.
12. `GridCategorias`: sustituye los progresos fijos de `tareas`, `habitos` y `rutinas` por `completados/total` reales de cada tipo. Deja `estudio` sin progreso (`''`). No cambies `CATEGORIAS_CON_PANTALLA`.

No toques `HeaderHoy` ni `HeroSection` en esta tarea: se hacen funcionales en las tareas 3.6 a 3.8.

Commit: `feat(hoy): plan del día unificado con hábitos, tareas y rutinas por franja`

### Tarea 3.4 — "En Rutina X" y filtro en Hábitos y Tareas

1. En `src/modulos/rutinas/estadoRutina.ts` añade (con test) `rutinasPorOrigen(rutinas: Rutina[]): { habitos: Map<string, string[]>; tareas: Map<string, string[]> }` (id → títulos de las rutinas activas que lo contienen).
2. `HabitosPantalla.tsx` (`FilaHabitoHoy`, `TarjetaHabito`) y `TimelineTareasHoy.tsx`: si el elemento está en alguna rutina, muestra bajo el título `t('rutinas.enRutina', { nombre })` (es: `En {{nombre}}`, en: `In {{nombre}}`; con varias, la primera y `+n`).
3. En la vista "hoy" de ambas pantallas, añade `SelectorFranja` con `contarPendientesPorFiltro` y `filtrarPorFranja`. Filtro inicial: `'todo'` (aquí no se abre en la franja actual, para no esconder nada en la pantalla de gestión).

Commit: `feat(franjas): etiqueta de rutina y filtro de franja en Hábitos y Tareas`

### Tarea 3.5 — Completar desde Hoy (opcional; solo si el usuario lo pide) — **PARADA**

Pregunta al usuario si quiere marcar como hecho desde Hoy con un toque. Si sí, usa **solo** servicios que ya existen: para hábito `registrarProgresoHabito({ habitoId, fechaLocal: fechaLocalHoy(), valor: meta })`; para tarea, la misma decisión que toma `resolverCompletadoExterno` en `src/modulos/rutinas/sesionRutina.ts`. Tras completar, invalida las claves de `CLAVES_TRAS_PASO` (`sesionRutina.servicio.ts`). No escribas lógica de gemas ni niveles en el cliente.

### Tarea 3.6 — Migración 83 (ya escrita y ensayada: no la modifiques)

Archivo: `supabase/migrations/20261009_83_resumen_hoy.sql`. RPC `public.obtener_resumen_hoy(p_fecha_referencia date default null) returns jsonb` con esta forma exacta:

```json
{ "fecha": "2026-10-09", "racha": 3, "dias_activos_semana": [3, 4, 5], "xp_total": 15 }
```

`dias_activos_semana` usa isodow (1 = lunes … 7 = domingo) y solo incluye días de la semana actual hasta hoy.

Definiciones que implementa (decisiones 10, 11 y 12 de la sección 4):

- **Día activo:** fecha local con al menos una acción: registro de hábito con `valor > 0`, registro de tarea, tarea `una_vez` hecha, paso propio de rutina registrado o sesión de rutina completa.
- **Racha global:** días activos consecutivos terminando hoy; si hoy aún no hay acción, terminando ayer.
- **XP** (calculado, no guardado; no da gemas): 10 por registro de hábito con avance, 10 por registro de tarea, 10 por tarea `una_vez` hecha, 15 por sesión de rutina completa.

Comprobación: `select count(*) from pg_proc where proname = 'obtener_resumen_hoy';` debe dar 1. Si da 0, **PARADA** y avisa al usuario (sección 1.4).

### Tarea 3.7 — Nivel a partir del XP (función pura)

Crea `src/modulos/hoy/nivelUsuario.ts` y su test. **Tests primero.**

```ts
/** XP necesario para pasar del nivel n al n+1: 60, 80, 100, 120… */
export function xpParaSubir(nivel: number): number { return 40 + 20 * nivel; }

export type NivelUsuario = { nivel: number; xpEnNivel: number; xpRequerido: number; porcentaje: number };

export function nivelDesdeXp(xpTotal: number): NivelUsuario
```

`nivelDesdeXp` empieza en nivel 1 y va restando `xpParaSubir(nivel)` mientras alcance. `porcentaje` = `Math.round(xpEnNivel / xpRequerido * 100)`. XP negativo, `NaN` o no finito se trata como 0.

Casos obligatorios del test: `0 → nivel 1, 0/60`; `59 → nivel 1, 59/60`; `60 → nivel 2, 0/80`; `240 → nivel 4, 0/120`; `335 → nivel 4, 95/120, 79 %`; `-5 → nivel 1, 0/60`.

En el mismo módulo, `src/modulos/hoy/resumenHoy.servicio.ts`:

```ts
export const CLAVE_RESUMEN_HOY = ['hoy', 'resumen'] as const;
export type ResumenHoy = { racha: number; diasActivosSemana: number[]; xpTotal: number };
export async function obtenerResumenHoy(): Promise<ResumenHoy>   // rpc('obtener_resumen_hoy', { p_fecha_referencia: fechaLocalHoy() })
```

con un mapper defensivo (`mapearResumenHoy(crudo: unknown)`, con test de respuesta válida y respuesta rota) en el estilo de `src/modulos/rutinas/rutinas.mapper.ts`.

Commit: `feat(hoy): nivel de usuario desde XP y servicio de resumen`

### Tarea 3.8 — Cabecera y hero de Hoy con datos reales

Archivo: `src/modulos/hoy/pantallas/HoyPantalla.tsx`. No cambies estilos, tamaños ni imágenes; solo los datos.

1. **Nombre.** En `HeaderHoy`, `useQuery({ queryKey: ['configuracion', 'usuario'], queryFn: () => cargarConfiguracion() })` (misma clave que `PerfilPantalla`). Sustituye `Alejandro` por `configuracion.perfil.nombreVisible` (comprueba la forma real del tipo en `configuracion.tipos.ts`). Si está vacío o cargando, no muestres nombre ni la coma.
2. **Saludo.** Sustituye el texto fijo `Hola,` por la franja actual: claves `hoy.saludo.manana` (es: `Buenos días,` / en: `Good morning,`), `hoy.saludo.tarde` (`Buenas tardes,` / `Good afternoon,`), `hoy.saludo.noche` (`Buenas noches,` / `Good evening,`), usando `franjaActual()` con los límites del perfil cuando exista la tarea 5.1 (hasta entonces, los de por defecto). Borra la función local `obtenerSaludo`. La frase "Disciplina hoy, libertad mañana." pasa a la clave `hoy.frase`.
3. **Racha.** En `HeroSection`, `useQuery({ queryKey: CLAVE_RESUMEN_HOY, queryFn: obtenerResumenHoy })`. `3 Días` → `t('hoy.racha.dias', { count: resumen.racha })` (es: `{{count}} día` / `{{count}} días`; en: `{{count}} day` / `{{count}} days`; usa el plural de i18next como ya lo haga el archivo). Los checks de la semana: sustituye `RACHA_CHECKS[i]` por `resumen.diasActivosSemana.includes(i + 1)`. El día resaltado deja de ser el fijo `i === 3`: es el de hoy (`(new Date().getDay() + 6) % 7`). Borra `RACHA_CHECKS`.
4. **Nivel y XP.** `const n = nivelDesdeXp(resumen.xpTotal)`. `Nivel 4` → `t('hoy.nivel', { nivel: n.nivel })` (es: `Nivel {{nivel}}` / en: `Level {{nivel}}`); `95/120 XP` → `` `${n.xpEnNivel}/${n.xpRequerido} XP` ``; ancho de la barra → `` `${n.porcentaje}%` ``.
5. **Cargando o error:** racha `0`, todos los días vacíos, nivel 1 con `0/60`. Nunca muestres los números de la maqueta.
6. **Refresco.** La racha y el XP deben moverse al completar algo. Añade `CLAVE_RESUMEN_HOY` a `CLAVES_TRAS_PASO` (`src/modulos/rutinas/sesionRutina.servicio.ts`) y a las invalidaciones que ya hacen `HabitosPantalla.tsx` (líneas ~302–306) y `TareasPantalla.tsx` (líneas ~146–148 y ~238–243) tras completar. No añadas invalidaciones en otros sitios.
7. Accesibilidad: la tarjeta de racha con `accessibilityLabel` = `t('hoy.racha.accesible', { count })` (es: `Racha actual: {{count}} días`).

Commit: `feat(hoy): cabecera funcional con nombre, racha global, nivel y XP`

Pendiente de dispositivo (fase 3): con una cuenta nueva, Hoy muestra racha 0 y Nivel 1 · 0/60 XP; completar un hábito sube 10 XP y marca el día de hoy en la semana; el nombre es el del perfil. Además: abrir Hoy por la tarde y ver seleccionada "Tarde"; un hábito que está dentro de una rutina de hoy no sale suelto; con 7 pendientes en una franja salen 5 y "Ver 2 más"; lo sin franja solo en "Todo".

---

## FASE 4 — Rutinas: lo que quedó pendiente

### Tarea 4.1 — Editar una rutina (migración 85 ya escrita y ensayada)

Archivo: `supabase/migrations/20261009_85_rutinas_actualizar.sql`. RPC `public.actualizar_rutina(p_rutina_id uuid, p_datos jsonb) returns jsonb` (`{ "id": … }`). `p_datos` tiene **la misma forma que en `crear_rutina`**, con una diferencia: cada paso puede llevar su `id`.

- Un paso que llega con el `id` de un paso existente de esa rutina y el mismo origen **se conserva** (mantiene sus registros de avance).
- Un paso existente que no llega se borra. Un paso sin `id` se crea.
- Errores: `P0002` rutina ajena o archivada; `23514` sin pasos, más de 20 o ningún esencial.

Trabajo en el cliente:

1. `rutinas.tipos.ts`: añade `id?: string` a las tres variantes de `PasoNuevoRutina`.
2. `rutinas.servicio.ts`: extrae de `crearRutina` una función `datosARemoto(input: CrearRutinaInput)` que devuelve el objeto `p_datos`; en `pasoARemoto` añade `id: paso.id` cuando exista. Nueva función `actualizarRutina(rutinaId: string, input: CrearRutinaInput): Promise<void>` que llama `rpc('actualizar_rutina', { p_rutina_id: rutinaId, p_datos: datosARemoto(input) })`.
3. `CrearRutinaWizard.tsx`: prop opcional `rutinaInicial?: Rutina`. Si llega, precarga todos los campos; cada paso precargado **conserva su `id`** en el estado del asistente y se envía al guardar. Al guardar llama `actualizarRutina`. Título: `rutinas.editar.titulo` (es: `Editar rutina`, en: `Edit routine`).
4. `ListaMisRutinas.tsx`: acción "Editar" en cada rutina que abre el asistente con `rutinaInicial`.
5. Test en `rutinas.servicio` o en una función pura: `datosARemoto` incluye `id` solo en los pasos que lo traen.

Commit: `feat(rutinas): editar una rutina desde Mis rutinas`

### Tarea 4.2 — Recordatorios reales de rutina (migración 84 ya escrita y ensayada)

Archivo: `supabase/migrations/20261009_84_rutinas_recordatorios.sql`. Ya existen en la base:

- `public.reclamar_recordatorios_rutinas(p_limite integer)`: **solo `service_role`**. Devuelve un arreglo con la misma forma que el de tareas, cambiando `tarea_id`/`titulo_tarea` por `rutina_id`/`titulo_rutina`. Avisa a la `hora_inicio` los días que toca, si la sesión de hoy no está completa.
- `public.reprogramar_recordatorio_rutina(p_rutina_id uuid) returns void`: la llama el cliente tras cambiar la hora o apagar el recordatorio.
- Código de catálogo `rutina_recordatorio`, con la preferencia de cada persona **apagada por defecto** (igual que tareas).

Trabajo:

1. `supabase/functions/despachar-recordatorios-habitos/index.ts`: añade el tercer `cliente.rpc('reclamar_recordatorios_rutinas', { p_limite: 100 })` al `Promise.all`; el tipo con `rutina_id`/`titulo_rutina`; los textos (es: `Es momento de tu rutina` / `Tu rutina {titulo} te espera.`; en: `It's time for your routine` / `Your routine {titulo} is waiting.`); y la ruta `/rutinas/${rutina_id}`. Respeta `mostrar_nombre` igual que tareas. El cierre sigue siendo `finalizar_recordatorio_habito` (sirve para cualquier origen).
2. **PARADA:** el despliegue lo hace el usuario: `npx supabase functions deploy despachar-recordatorios-habitos`.
3. `rutinas.servicio.ts`, en `actualizarRecordatorioRutina`: tras el `update`, llama `rpc('reprogramar_recordatorio_rutina', { p_rutina_id: rutinaId })`.
4. Al **activar** un recordatorio de rutina (en `CrearRutinaWizard.tsx` y `ListaRecordatoriosRutinas.tsx`), enciende la preferencia global igual que lo hace `CrearTareaWizard.tsx` en su línea ~182: `void actualizarPreferenciaNotificacion('rutina_recordatorio', true).catch(() => undefined);`. Sin esto el aviso se cancela.
5. `PerfilPantalla.tsx`: añade `rutina_recordatorio` a los dos mapas de etiquetas donde está `habito_recordatorio` (líneas ~81 y ~92), con la clave `perfil.settings.notifications.rutina_recordatorio` (es: `Recordatorios de rutinas`, en: `Routine reminders`).
6. `ListaRecordatoriosRutinas.tsx`: quita la línea que avisa de que el envío no está conectado (y su clave i18n en `en` y `es`).

Commit: `feat(rutinas): envío real de recordatorios de rutina`

### Tarea 4.3 — Racha de sesiones

1. En `src/modulos/rutinas/rachaRutina.ts` (+ test), función pura `calcularRachaRutina(fechasCompletadas: ReadonlySet<string>, rutina: Pick<Rutina, 'frecuencia' | 'diasSemana'>, hoy: string): number`: días consecutivos hacia atrás **en los que la rutina tocaba** y tiene sesión completa. Un día que no tocaba no rompe ni suma. Si hoy toca y aún no está completa, hoy no rompe la racha. Usa `src/modulos/tareas/tareaProgramada.ts` como referencia de estilo.
2. Servicio `obtenerFechasCompletadasRutinas(desde: string)`: `select rutina_id, fecha_local from rutinas_registros where completada_en is not null and fecha_local >= desde` (RLS ya limita al dueño). Ventana: 120 días.
3. Muestra la racha en `TarjetaRutinaHoy.tsx` (`rutinas.racha`, es: `{{n}} días seguidos`, en: `{{n}}-day streak`) solo si es ≥ 2.

Commit: `feat(rutinas): racha de sesiones completas`

### Tarea 4.4 — Borrar `routine_id`

1. `grep -rnE "routine_id|routineId" src app supabase/functions`. Debe salir solo en `tareas.tipos.ts` y `tareas.servicio.ts`. Si sale en otro sitio, **PARADA**.
2. Quita `routineId`/`routine_id` de `Tarea`, `CrearTareaInput`, `FilaTarea`, `normalizar`, `COLUMNAS`, `crearTarea` y `editarTarea`. `npm run typecheck && npm test`. Commit: `refactor(tareas): quitar routineId del cliente`.
3. Migración `NN_tareas_quitar_routine_id.sql`: `alter table public.tareas_items drop column routine_id;`. Antes: `select count(*) from public.tareas_items where routine_id is not null;` debe ser 0; si no, **PARADA**. **PARADA-BD**, aplica. **El paso 2 debe estar publicado en la app que usa el usuario antes de aplicar el 3**; pregunta.

Commit: `chore(tareas): migración que elimina routine_id`

### Tarea 4.5 — Documentación de datos

Añade las tablas `rutinas_items`, `rutinas_pasos`, `rutinas_pasos_registros`, `rutinas_registros`, `rutinas_plantillas`, `rutinas_plantillas_contenido`, `rutinas_plantillas_compradas` y las columnas de franja a `supabase/privacidad-schema.md` y `docs/app-store/privacy-inventory.md`, siguiendo el formato de las filas de `tareas_items`. Commit: `docs(privacidad): tablas de rutinas, plantillas y franjas`

### Tarea 4.6 — La rutina como camino de nodos

La visión pide que el progreso se vea como un camino, no como una lista. Hazla **después** de la 4.5.

1. Crea `src/modulos/rutinas/construirNodosRutina.ts` (+ test), espejo de `src/modulos/tareas/construirNodosPasos.ts`, que recibe `pasos: PasoRutina[]` y los textos ya traducidos, y devuelve `NodoMapaSendero[]`:
   - Orden por `orden`. Un paso con `aplica === false` no genera nodo.
   - `completo` → `'completado'` (ícono `Check`); el primer paso sin completar → `'activo'` (`Play`); el resto → `'bloqueado'` (`Lock`).
   - `subtitulo`: "Paso n de m", más la marca de opcional cuando `esencial === false`.
   - Un **nodo final de destino** (`id: 'destino'`): `'completado'` si todos los pasos esenciales que aplican están completos; si no, `'bloqueado'`.
   - Tests: orden, paso que no aplica, primer pendiente activo, destino con esenciales completos y opcionales pendientes, rutina sin pasos aplicables.
2. Busca qué componente dibuja hoy un `NodoMapaSendero[]` para el checklist de tareas: `grep -rn "NodoMapaSendero" src --include=*.tsx`. Reutiliza **ese mismo componente** con el paquete `PAQUETE_RUTINAS` / `COLOR_PAQUETE_RUTINAS` de `temaRutinas.ts`. Si para reutilizarlo hay que modificarlo en más de ~30 líneas o cambiar su comportamiento para Tareas: **PARADA** y explica qué haría falta.
3. En `SesionRutinaPantalla.tsx`: en la fase `'preparar'`, muestra el camino encima de la vista previa de pasos; en la fase `'fin'`, muestra el camino con su estado final (destino completado si la sesión quedó completa) y dispara `hapticSeguro` de éxito una sola vez. No crees animaciones nuevas.
4. En `TarjetaRutinaHoy.tsx` no cambies nada (la tarjeta sigue compacta).

Commit: `feat(rutinas): la sesión muestra la rutina como camino de nodos`

Pendiente de dispositivo: el camino se ve bien con 1, 5 y 20 pasos; el contraste sobre el rojo Ignate es legible.

---

## FASE 5 — Ajustes de franjas e insights

### Tarea 5.1 — Límites de franja del perfil

1. `src/modulos/configuracion/configuracion.servicio.ts`: `obtenerLimitesFranja(): Promise<LimitesFranja>` (`select franja_manana_desde, franja_tarde_desde, franja_noche_desde from perfiles_usuario` del usuario actual; mira en `cargarConfiguracion` cómo obtiene el id) y `actualizarLimitesFranja(limites)` que valida con `limitesValidos` antes del `update`.
2. Hook `src/modulos/configuracion/useLimitesFranja.ts`: `useQuery` con clave `['configuracion', 'limitesFranja']`, valor por defecto `LIMITES_FRANJA_DEFECTO`.
3. Sustituye las llamadas `franjaActual()` y `sugerirFranjaPorHora(hora)` de las fases 2 y 3 para que reciban los límites del hook.
4. En `src/modulos/direccion/pantallas/PerfilPantalla.tsx`, dentro de la sección de ajustes, una fila "Franjas del día" que abre una `HojaDeslizante` con tres selectores de hora entera (0–23) y vista previa (`Mañana 5:00–12:00`, `Tarde 12:00–19:00`, `Noche 19:00–5:00`). Guardar deshabilitado si `limitesValidos` es `false`, con el texto `franjas.ajustes.ordenInvalido` (es: `La mañana debe empezar antes que la tarde, y la tarde antes que la noche.`).

Commit: `feat(franjas): ajustes de horas de franja`

### Tarea 5.2 — Insights por franja

1. Función pura `src/modulos/insights/insightsFranjas.ts` (+ test): recibe `{ completadoEn: string }[]` (ISO), `limites` y zona horaria; devuelve el conteo por `FranjaConcreta` y la franja con más completados (o `null` si hay menos de 7 registros). Usa `franjaDeHora` con la hora local.
2. Datos: `tareas_registros` y `habitos_registros` de los últimos 30 días. Comprueba primero qué columna de fecha-hora tienen (`select column_name from information_schema.columns where table_name in ('habitos_registros','tareas_registros')`). Si alguna tabla no tiene marca de hora, usa solo la que sí y dilo en tu resumen.
3. Muestra una tarjeta en `InsightsPantalla.tsx` con el mismo componente de sección que las demás: "Cumples más por la {{franja}}", o el estado "en observación" con menos de 7 registros.

Commit: `feat(insights): en qué franja cumples más`

---

## FASE 5B — Pausa de uso real (dos semanas) — **PARADA larga**

Viene de la estrategia (sección 10): la lista de fricciones del propio fundador ordena el trabajo mejor que cualquier plan. **Al terminar la Fase 5 el agente deja de construir.**

### Tarea 5B.1 — Preparar la pausa

1. Crea `docs/fricciones.md` con esta tabla vacía y nada más:
   ```markdown
   # Fricciones de uso real

   | Fecha | Pantalla | Qué intentaba hacer | Qué estorbó o faltó | Gravedad (1 molesta · 2 frena · 3 impide) |
   | --- | --- | --- | --- | --- |
   ```
2. Escribe al usuario el resumen de todo lo pendiente de probar en dispositivo de las fases 0–5 (una lista por fase).
3. Commit: `docs: plantilla de fricciones de uso real`. `git push origin mejoras`.
4. **PARADA.** Tareas del usuario durante dos semanas: usar la app a diario (plan de marketing en Planes, tareas de escuela y trabajo, hábitos, rutinas con sesión guiada); anotar cada fricción en `docs/fricciones.md`; hablar con 5 a 10 personas del público objetivo ("¿cómo organizas esto hoy?", "¿qué te frustra?"); escribir el mensaje de la app y abrir el grupo de TestFlight.

### Tarea 5B.2 — Al volver

1. Lee `docs/fricciones.md`.
2. Agrupa las fricciones por pantalla y ordénalas por gravedad y repetición.
3. Propón al usuario: (a) qué fricciones de gravedad 2 y 3 se arreglan **antes** de la Fase 6, como tareas concretas con archivo y verificación; (b) si el orden de las fases 6 a 13 debe cambiar.
4. **PARADA.** No sigas hasta que el usuario apruebe el orden. Actualiza este documento con lo aprobado.

---

## FASE 6 — Analítica del embudo

Hoy `registrarEvento` no envía nada. Se implementa con la API HTTP de PostHog (sin dependencia nativa, sin recompilar la app).

### Tarea 6.1 — **PARADA** (usuario)

Pide al usuario la clave del proyecto de PostHog y el host (`https://us.i.posthog.com` o `https://eu.i.posthog.com`). Lee `src/nucleo/configuracion/entorno.ts` para ver cómo se cargan las demás claves y carga `posthogKey` y `posthogHost` igual. Sin clave, todo debe seguir funcionando sin enviar nada.

### Tarea 6.2 — Implementar `registrarEvento`

`src/servicios/analitica/posthog.ts` (+ test con `fetch` inyectado):

- `registrarEvento(nombre, propiedades?)`: si no hay clave, no hace nada. Si hay, `POST {host}/capture/` con JSON `{ api_key, event: nombre, distinct_id, properties, timestamp }`. `distinct_id` = id del usuario de Supabase (si no hay sesión, no envía). Nunca lanza: los errores de red se ignoran.
- Prohibido enviar títulos, descripciones, notas o cualquier texto escrito por la persona. Solo ids, tipos, números y booleanos.

### Tarea 6.3 — Eventos (lista cerrada; no añadas otros)

| Evento | Dónde se dispara | Propiedades |
| --- | --- | --- |
| `habito_creado` | éxito de `crearHabito` | `tipo_meta`, `frecuencia`, `franja`, `con_recordatorio` |
| `habito_completado` | éxito de `registrarProgresoHabito` cuando queda completo | `subio_nivel` |
| `tarea_creada` | éxito de crear tarea | `tipo`, `frecuencia`, `franja` |
| `tarea_completada` | éxito de completar tarea | `tipo` |
| `rutina_creada` | éxito de `crearRutina` | `num_pasos`, `franja`, `desde_plantilla` |
| `sesion_rutina_iniciada` | éxito de `iniciarRutina` | `minutos_disponibles` |
| `sesion_rutina_cerrada` | respuesta de `cerrarRutinaDia` | `completa`, `requeridos`, `requeridos_completos` |
| `plantilla_vista` | abrir `ModalCompraPlantilla` | `plantilla_id`, `precio_gemas` |
| `plantilla_comprada` | éxito de `comprar_plantilla_rutina` | `plantilla_id`, `precio_gemas` |
| `paywall_visto` | montar `HorizonPaywallPantalla` | `origen` |
| `hoy_filtro_franja` | cambio de filtro en Hoy | `filtro` |
| `primera_victoria` | ver tarea 6B.2 | `tipo` (`habito`, `tarea` o `rutina`) |

Dispara cada evento en el `onSuccess` de la mutación o tras el `await` correspondiente, nunca dentro de los servicios. Commit: `feat(analitica): eventos del embudo con PostHog`

---

## FASE 6B — Primera victoria

La estrategia dice que la primera sesión decide si alguien se queda. Objetivo: que una cuenta nueva complete su primera acción el primer día. Ya existe un punto de partida: `RegaloBienvenidaPantalla` puede encender `CLAVE_ABRIR_CREACION_HABITO` y `HabitosPantalla` abre el asistente al montarse (lee `src/modulos/onboarding/onboarding.servicio.ts`).

### Tarea 6B.1 — Hoy vacío que invita a empezar

En `HoyPantalla.tsx`, cuando el plan del día tiene `total === 0` y las consultas ya cargaron, en lugar de la lista vacía muestra una tarjeta (`RecuadroGlass`, estilos existentes) con:

- Título `hoy.vacio.titulo` (es: `Tu primer paso` / en: `Your first step`) y texto `hoy.vacio.texto` (es: `Empieza con algo pequeño que puedas hacer hoy.` / en: `Start with something small you can do today.`).
- Botón `hoy.vacio.crearHabito` (es: `Crear mi primer hábito`): enciende `CLAVE_ABRIR_CREACION_HABITO` con `queryClient.setQueryData(...)` **igual que lo hace `RegaloBienvenidaPantalla`** y navega a `/habitos`.
- Botón `hoy.vacio.rutinaLista` (es: `Usar una rutina lista`): navega a `/senderos`. `SenderosPantalla` no acepta hoy una pestaña inicial por parámetro; no se lo añadas en esta tarea.

### Tarea 6B.2 — Detectar y celebrar la primera victoria

1. La señal es el XP: una cuenta sin ninguna acción tiene `xpTotal === 0`. Crea el hook `src/modulos/hoy/usePrimeraVictoria.ts` que observa `CLAVE_RESUMEN_HOY` y, cuando `xpTotal` pasa de `0` a mayor que `0` **dentro de la misma sesión de la app**, devuelve `true` una sola vez.
2. En ese momento: `registrarEvento('primera_victoria', { tipo })` y un `Banner` (componente de `src/diseno/componentes`) en Hoy con `hoy.primeraVictoria` (es: `¡Primer paso dado! Así empieza tu racha.` / en: `First step done! Your streak starts here.`). `tipo` se deduce de qué contador del plan del día pasó a tener un completado; si no se puede deducir, envía `tipo: 'desconocido'`.
3. La lógica de "pasó de 0 a mayor que 0, solo una vez" va en una función pura con test (`detectarPrimeraVictoria(anterior: number | undefined, actual: number | undefined, yaDisparada: boolean)`); `undefined` (cargando) nunca dispara.

Commit: `feat(hoy): invitación inicial y celebración de la primera victoria`

Pendiente de dispositivo: con una cuenta nueva, Hoy muestra la invitación; tras completar el primer hábito aparece el aviso una sola vez y la racha pasa a 1.

---

## FASE 7 — Plantillas premium reales

### Tarea 7.1 — **PARADA** (decisión de producto)

Propón al usuario 4 plantillas (una por nicho: cuerpo, estudio, trabajo, finanzas), todas a **100 gemas**, cada una con 4–6 pasos propios (`simple`, `cronometro` o `contador`; sin hábitos ni tareas). Contenido general: nada de dietas, cantidades de dinero ni consejos médicos o financieros. Espera su aprobación o sus cambios.

### Tarea 7.2 — Cargar

Escribe `supabase/datos/plantillas_premium_2026_10.sql` con los `insert` en `rutinas_plantillas` y `rutinas_plantillas_contenido`, siguiendo el ejemplo comentado al inicio de `20261009_80_plantillas_rutinas.sql` **pero con los nombres nuevos de tabla** (`rutinas_plantillas` y `rutinas_plantillas_contenido`; la migración 88 las renombró). Prueba con `rollback`, **PARADA-BD**, aplica. Verifica con `select id, precio_gemas, num_pasos, duracion_min from public.rutinas_plantillas order by orden;`.

Commit: `feat(plantillas): primeras plantillas premium por nicho`

---

## FASES 8–13

Las fases 8 y 9 ya tienen la base de datos definida y sus tareas detalladas abajo. Para las fases 10 a 13: **la primera tarea es escribir el spec** en `docs/superpowers/specs/AAAA-MM-DD-<tema>-design.md`, con las mismas secciones que `2026-10-04-rutinas-design.md` (Objetivo, Decisiones, Modelo de datos, RPCs, Interfaz, Privacidad, Pruebas, Fases, Fuera de alcance), y hacer **PARADA** para aprobación. No escribas código antes.

### Fase 8 — Áreas de vida y Metas (base de datos ya definida: migración 87)

Decisiones del usuario (2026-10-09), ya implementadas en `supabase/migrations/20261009_87_areas_y_metas.sql`. **No escribas ni modifiques SQL en esta fase.**

```text
ÁREA  →  META  →  hábitos, tareas, rutinas y planes
```

- **7 áreas del sistema** y cada persona puede crear las suyas (máximo 20):

  | `codigo` | Nombre | Color | Ícono |
  | --- | --- | --- | --- |
  | `cuerpo` | Cuerpo | rojo `#EF4444` | `Dumbbell` |
  | `mente` | Mente | azul `#3B82F6` | `Brain` |
  | `espiritual` | Espiritual | verde `#22C55E` | `Leaf` |
  | `estudios` | Estudios | morado `#8B5CF6` | `BookOpen` |
  | `trabajo` | Trabajo | amarillo `#EAB308` | `Briefcase` |
  | `negocios_proyectos` | Negocios y proyectos | rosa `#EC4899` | `Rocket` |
  | `finanzas` | Finanzas | naranja `#F97316` | `PiggyBank` |

- **Un hábito, tarea, rutina o plan pertenece como mucho a una meta** (`meta_id`, anulable). **Una meta pertenece a un área.** El área de un elemento es la de su meta; no se guarda aparte. Un elemento sin meta no tiene área.
- **Una meta puede tener un plan fijo de días** (`duracion_dias`), opcional.
- El avance de una meta **no se guarda**: la persona la marca como lograda. La base solo calcula en qué día va.

Lo que existe en la base:

| Objeto | Uso |
| --- | --- |
| Tabla `areas_vida` (`id, usuario_id, codigo, nombre, color, icono_lucide, orden, archivada_en`) | Lectura y escritura directa. Las del sistema tienen `usuario_id` nulo y `codigo`; no se pueden editar ni borrar. Las propias: `usuario_id` = el de la sesión, `codigo` nulo, `color` en formato `#RRGGBB`, nombre único por persona |
| Tabla `metas` (ya existía; ampliada) con `area_id, icono_lucide, color, fecha_inicio, duracion_dias, lograda_en, orden`, `estado` en `activa / pausada / lograda / archivada` | Lectura y escritura directa (RLS por dueño). `estado = 'lograda'` exige `lograda_en` no nulo, y al revés |
| `meta_id` en `habitos_items`, `tareas_items`, `rutinas_items`, `planes_items` | Borrar una meta deja los elementos sin meta; no los borra |
| `public.asignar_meta(p_tipo text, p_elemento_id uuid, p_meta_id uuid)` | `p_tipo`: `'habito'`, `'tarea'`, `'rutina'` o `'plan'`. `p_meta_id` nulo = quitar la meta. Errores: `P0002` meta o elemento no encontrado, `23514` tipo inválido |
| `public.obtener_metas(p_fecha_referencia date default null)` | Devuelve las metas no archivadas con su área, sus días y sus conteos |

Forma exacta de cada elemento de `obtener_metas`:

```json
{
  "id": "…", "titulo": "Correr 5 km", "descripcion": null, "estado": "activa",
  "icono_lucide": null, "color": "#EF4444",
  "fecha_inicio": "2026-09-30", "duracion_dias": 30, "dia_actual": 9, "dias_restantes": 21,
  "lograda_en": null, "orden": 0,
  "area": { "id": "…", "codigo": "cuerpo", "nombre": "Cuerpo", "color": "#EF4444", "icono_lucide": "Dumbbell" },
  "conteos": { "habitos": 1, "tareas": 1, "rutinas": 0, "planes": 1 }
}
```

`color` ya viene resuelto (el de la meta o, si no tiene, el de su área; `null` si no hay ninguno). `area` es `null` en metas sin área (las que crea el flujo antiguo de Aby). Sin `duracion_dias`, `dias_restantes` es `null` y `dia_actual` son los días transcurridos.

#### Tarea 8.1 — Comprobar que la migración 87 está aplicada

`select count(*) from public.areas_vida where usuario_id is null;` debe dar 7. Si falla o da otro número, **PARADA** y avisa al usuario (sección 1.4).

#### Tarea 8.2 — Módulo de áreas

Crea `src/modulos/areas/`: `areas.tipos.ts`, `areas.mapper.ts` (+ test, defensivo, estilo `rutinas.mapper.ts`), `areas.servicio.ts`.

- `type AreaVida = { id: string; codigo: string | null; nombre: string; color: string; iconoLucide: string; orden: number; esDelSistema: boolean }`.
- `CLAVE_AREAS = ['areas', 'lista'] as const`.
- `obtenerAreas()`: `from('areas_vida').select('id, usuario_id, codigo, nombre, color, icono_lucide, orden').is('archivada_en', null).order('orden').order('created_at')`.
- `crearArea({ nombre, color, iconoLucide })`: `insert` con `usuario_id` de la sesión (mira en `crearTarea` de `tareas.servicio.ts` cómo se obtiene). Si el error es `23505`, lanza un error con la clave `areas.error.duplicada`.
- `archivarArea(id)`: `update({ archivada_en: new Date().toISOString() })`.
- Nombre visible: función pura `nombreArea(area, t)` → si `codigo` existe, `t('areas.sistema.' + codigo)`; si no, `area.nombre`. Con test.
- i18n `areas.sistema.*`: es `Cuerpo, Mente, Espiritual, Estudios, Trabajo, Negocios y proyectos, Finanzas`; en `Body, Mind, Spiritual, Studies, Work, Business & projects, Finances`. `areas.sinArea`: `Sin área` / `No area`. `areas.todas`: `Todas` / `All`. `areas.error.duplicada`: `Ya tienes un área con ese nombre.` / `You already have an area with that name.`

Commit: `feat(areas): tipos, mapper y servicio de áreas de vida`

#### Tarea 8.3 — Dominio de metas

`src/modulos/metas/tipos.ts` y `metas.estado.ts` son de la maqueta. Antes de tocarlos: `grep -rn "metas/tipos\|metas.estado" src app`. Crea archivos nuevos sin romper la maqueta: `metas.tipos.ts`, `metas.mapper.ts` (+ test con respuesta válida, respuesta rota y meta sin área), `metas.servicio.ts`.

- Tipos: `EstadoMeta = 'activa' | 'pausada' | 'lograda' | 'archivada'`; `TipoElementoMeta = 'habito' | 'tarea' | 'rutina' | 'plan'`; `MetaVida` con los mismos campos del JSON de arriba en camelCase (`area: AreaVidaResumen | null`).
- `CLAVE_METAS = ['metas', 'lista'] as const`.
- `obtenerMetas()`: `rpc('obtener_metas', { p_fecha_referencia: fechaLocalHoy() })`.
- `crearMeta({ titulo, descripcion?, areaId, iconoLucide?, color?, duracionDias? })`: `insert` en `metas` con `usuario_id` de la sesión y **`fecha_inicio: fechaLocalHoy()`** (no dejes el valor por defecto de la base: es la fecha UTC). `areaId` es obligatorio en la interfaz.
- `editarMeta(id, cambios)`.
- `marcarMetaLograda(id)`: `update({ estado: 'lograda', lograda_en: new Date().toISOString() })`. `reabrirMeta(id)`: `update({ estado: 'activa', lograda_en: null })`. Siempre los dos campos juntos.
- `archivarMeta(id)`: `update({ estado: 'archivada', lograda_en: null })`.
- `asignarMeta(tipo, elementoId, metaId: string | null)`: `rpc('asignar_meta', { p_tipo: tipo, p_elemento_id: elementoId, p_meta_id: metaId })`.
- Función pura con test `progresoPlazoMeta(meta)`: `null` si no hay `duracionDias`; si no, `{ dia, total, porcentaje }`.

Commit: `feat(metas): tipos, mapper y servicio sobre obtener_metas`

#### Tarea 8.4 — Elegir meta al crear y editar

1. Componente `src/modulos/metas/componentes/SelectorMeta.tsx`: lista las metas activas agrupadas por área (encabezado con color y nombre del área), más la opción `metas.sinMeta` (es: `Sin meta` / en: `No goal`). Props: `{ valor: string | null; onCambiar: (metaId: string | null) => void }`. Usa `useQuery` con `CLAVE_METAS`. Si no hay metas, un texto `metas.selector.vacio` (es: `Aún no tienes metas. Puedes crear una desde Metas.`). No incluyas creación de metas dentro del selector.
2. `CrearHabitoWizard.tsx`, `CrearTareaWizard.tsx` y `CrearRutinaWizard.tsx`: añade el selector en el primer paso (identidad). Es opcional. Tras crear el elemento con éxito, si se eligió meta: `await asignarMeta(tipo, idCreado, metaId)`. Si esa llamada falla, **no** deshagas la creación: muestra el aviso `metas.error.asignar` (es: `Se creó, pero no se pudo enlazar con la meta.`).
3. Edición (`EditarHabitoFormulario.tsx`, edición de rutina de la tarea 4.1): mismo selector; al guardar, `asignarMeta` solo si cambió.
4. Lectura del `meta_id`:
   - Tareas: añade `meta_id` a `COLUMNAS`, `FilaTarea`, `normalizar`, `Tarea.metaId` y `TareaHoyDetalle.metaId` (y al `select` de `obtenerTareasHoy`).
   - Hábitos: en `obtenerDetallesHabitosHoy`, el `select` de `habitos_items` pasa a `'id,tipo_meta,meta_id'` y `HabitoHoyDetalle` gana `metaId: string | null`.
   - Rutinas: nueva función en `rutinas.servicio.ts`, `obtenerMetasDeRutinas(): Promise<Map<string, string | null>>` (`from('rutinas_items').select('id, meta_id')`), con clave `['rutinas', 'metas']`. No modifiques `obtener_rutinas_hoy`.
5. Invalida `CLAVE_METAS` tras cualquier `asignarMeta`, crear, editar, lograr o archivar.

Commit: `feat(metas): selector de meta en asistentes y edición`

#### Tarea 8.5 — Filtro por área en Hoy

1. `planDelDia.ts`: `ElementoHoy` gana `areaId: string | null`. `construirPlanDelDia` recibe `areaId?: string | 'sin_area' | null` (`null` o ausente = todas). El filtro de área se aplica **antes** de contar: los conteos de los botones de franja reflejan el área elegida. Tests nuevos: filtrar por un área, por `'sin_area'`, y que `null` no filtra.
2. Los adaptadores reciben un `Map<metaId, areaId | null>` construido desde `obtenerMetas()` y resuelven `areaId` (elemento sin meta, o meta sin área → `null`).
3. En `HoyPantalla.tsx`, sobre `SelectorFranja`, una fila horizontal con desplazamiento de chips: `areas.todas`, luego **solo las áreas que tienen algún elemento hoy**, y `areas.sinArea` si hay elementos sin área. Cada chip lleva un punto con el color del área y su nombre (`nombreArea`); el color no es el único indicador. El área elegida no se guarda entre aperturas. Si solo existiría el chip "Todas", no muestres la fila.
4. Evento de analítica `hoy_filtro_area` con `{ area_codigo }` (`'propia'` para áreas creadas por la persona, `'sin_area'`, o el código del sistema). Añádelo a la tabla de la tarea 6.3.

Commit: `feat(hoy): filtro por área de vida`

Pendiente de dispositivo: crear una meta en Cuerpo, enlazarle un hábito y ver en Hoy el chip rojo "Cuerpo" que filtra; un hábito sin meta aparece bajo "Sin área".

### Fase 9 — Pantalla de Metas real

La base ya está (fase 8). `src/modulos/metas/pantallas/` (`MetasPantalla`, `MetasListaPantalla`, `PanelMetasPantalla`, `DetalleMetaPantalla`) son maqueta: `MetasListaPantalla.tsx` usa la constante `SUBTAREAS` y `PanelMetasPantalla.tsx` saluda a un "Alejandro" fijo.

#### Tarea 9.1 — **PARADA**: dónde vive la pantalla

Corre `grep -rn "MetasPantalla\|PanelMetasPantalla\|MetasListaPantalla\|DetalleMetaPantalla" app src --include=*.tsx`. Hoy no hay ninguna ruta de metas en `app/`. Muestra al usuario qué pantallas existen y pregunta: (a) si Metas será una pestaña, una ruta (`app/metas/…`) o parte de "Mi espacio"; (b) cuál de las cuatro pantallas de la maqueta conserva como diseño. No sigas sin respuesta.

#### Tarea 9.2 — Lista y detalle con datos reales

Con lo que el usuario decida, conservando los estilos de la pantalla elegida:

- **Lista:** metas activas agrupadas por área (color y nombre del área), con título, `Día {{dia}} de {{total}}` y barra si hay plazo (`progresoPlazoMeta`), y los conteos (`2 hábitos · 1 tarea`). Secciones plegadas para pausadas y logradas. Botón de crear.
- **Crear / editar:** título, área (obligatoria, con opción de crear un área propia: nombre, color de una paleta fija de 10 y un ícono), descripción opcional, y un interruptor "Tiene un plazo en días" que muestra el campo `duracionDias` (1–3650).
- **Detalle:** lo que contiene la meta, por tipo. Hábitos: `from('habitos_items').select(...).eq('meta_id', id)`; igual para `tareas_items`, `rutinas_items`, `planes_items`. Cada fila navega a su pantalla. Acciones: marcar lograda, pausar, reabrir, archivar, y "Quitar de esta meta" por elemento (`asignarMeta(tipo, id, null)`).
- Sustituye el nombre fijo por el del perfil, igual que la tarea 3.8.
- Sin gemas, XP ni recompensas por lograr una meta en esta fase.

Commit: `feat(metas): pantalla de metas con datos reales`

### Fase 10 — Packs por área

Sin código nuevo: un pack es una plantilla de rutina premium + un texto de arranque para el asistente de Planes + una meta sugerida. Requiere fases 7, 8 y 9.

### Fase 11 — Límites gratis/Horizon y trial

Decisiones abiertas que el usuario debe cerrar antes del spec: cuántas rutinas activas gratis (1 o 2), qué tipos de tarea son de Horizon, duración del trial (14 días propuestos) y generaciones de Aby en trial (3 propuestas), qué pasa con `trial_horizon_bono` de la migración 41. Reglas fijas: los límites se comprueban **en el servidor** (modelo: `supabase/functions/_shared/accesoAbyPlanes.ts`); lo creado durante el trial se pausa, nunca se borra. Nota: ese archivo tiene un bypass temporal para Android que hay que retirar cuando exista el producto en Play Store.

### Fase 12 — Live Activities (iOS)

En una rama aparte (`live-activities`). Necesita un Mac con Xcode y un iPhone real: **no la empieces sin confirmar con el usuario que los tiene**. Alcance v1: cronómetro del paso actual de la sesión guiada; sin cambio automático de paso con la app cerrada.

### Fase 13 — Finanzas sencillas

Solo si tras usar las fases anteriores sigue haciendo falta. Límite fijo: metas y hábitos de ahorro con contadores; nada de cuentas, bancos ni consejos financieros.

---

## 3. Puertas hacia el resto de la visión

Las fases 6 a 10 de la visión **no se construyen en este plan**, pero cada una tiene una condición escrita para retomarla. Cuando una condición se cumpla, el agente lo avisa y hace **PARADA**; no empieza por su cuenta.

| # | Fase de la visión | Qué existe ya | Condición para retomarla | Primer entregable |
| --- | --- | --- | --- | --- |
| 1 | Modelo unificado de Sendero y dependencias entre nodos | Cuatro familias (`habitos_*`, `tareas_*`, `rutinas_*`, `planes_*`) más `senderos`. Desde la migración 87 todas comparten un enlace común: `meta_id` hacia `metas`, y de ahí al área | Cuando haga falta algo que `meta_id` no resuelve: dependencias entre nodos de familias distintas (cooperativo o cursos) | Spec que responda la pregunta abierta de la visión: ¿tabla `senderos` polimórfica o vistas sobre las familias? |
| 2 | Aby genera rutinas | `crear_rutina(p_datos jsonb)` es un esquema destino estable; Aby ya genera Planes con propuesta privada y aceptación transaccional | Fase 4 terminada y probada en dispositivo | Spec de propuesta de rutina con el mismo flujo que Planes (Edge Function, propuesta privada, aceptar) y el tope mensual de `accesoAbyPlanes.ts` |
| 3 | Cooperativo | Planes compartidos, instancias por persona y ramas (migraciones 72–76) | Que el usuario haya usado un plan compartido con otra persona durante la Fase 5B | Spec de dependencias entre personas ("este nodo se desbloquea cuando aquel se complete") y su RLS |
| 4 | Cursos propios | Plantillas con gemas: contenido en servidor entregado solo a quien compró | 30 días de datos de la Fase 7 con, como mínimo, compras de al menos 2 nichos distintos y sesiones completadas de las plantillas compradas (los umbrales exactos los fija el usuario) | Spec de curso como Sendero publicado y vendido con RevenueCat (no consumible) |
| 5 | Marketplace | Nada | Solo tras validar la puerta 4 con cursos propios y con algún creador invitado | No se planifica todavía |

## 4. Decisiones que debe tomar el usuario

Mientras no responda, usa el valor por defecto de la tabla.

| # | Decisión | Por defecto | Afecta a |
| --- | --- | --- | --- |
| 1 | Tope de pendientes por franja en Hoy | 5 | Fase 3 |
| 2 | Horas por defecto de las franjas | 5 / 12 / 19 | Fases 1, 5 |
| 3 | ¿Completar con un toque desde Hoy? | No (solo navegar) | Tarea 3.5 |
| 4 | ¿Filtro inicial "Todo" en Hábitos y Tareas? | Sí | Tarea 3.4 |
| 5 | Proveedor de analítica | PostHog por HTTP | Fase 6 |
| 6 | Contenido y precio de plantillas premium | 4 plantillas a 100 gemas | Fase 7 |
| 7 | Rutinas activas gratis | Sin decidir (bloquea fase 11) | Fase 11 |
| 8 | Duración del trial y generaciones de Aby | Sin decidir (bloquea fase 11) | Fase 11 |
| 9 | Licencia (`main` BUSL-1.1 vs `mejoras` propietaria) | Sin decidir (bloquea fusionar a `main`) | Fusión |
| 10 | Qué cuenta como día activo y cómo se calcula la racha global | Cualquier acción cuenta; hoy sin acción no rompe la racha hasta que acabe el día | Tarea 3.6 |
| 11 | Tabla de XP y curva de niveles | 10 / 10 / 10 / 15 XP; subir cuesta 60, 80, 100, 120… | Tareas 3.6 y 3.7 |
| 12 | ¿El hábito da XP con cualquier avance o solo al cumplir la meta? | Con cualquier avance (`valor > 0`) | Tarea 3.6 |
| 13 | ¿Crear un proyecto Supabase de staging? | Recomendado; sin él se sigue probando con `rollback` | Fase 0 (pendientes del usuario) |
| 14 | Nombre del área espiritual | "Espiritual" (código `espiritual`) | Fase 8 |
| 15 | ¿Un elemento sin meta puede tener área? | No: el área siempre viene de la meta | Fase 8 |
| 16 | ¿Cómo avanza una meta? | La persona la marca como lograda; la base solo cuenta los días | Fases 8 y 9 |
| 17 | Dónde vive la pantalla de Metas | **Decidido (2026-10-10):** pantalla propia como Hábitos y Tareas, con las áreas arriba como filtro y cuatro pestañas; tema Celesthia | Fase 9 |

## 5. Qué reportar al terminar cada fase

1. Lista de commits (hash y mensaje).
2. Resultado de `npm run typecheck` y `npm test` (número de archivos y tests).
3. Migraciones aplicadas a la base real, con la salida de su consulta de verificación.
4. Qué no se pudo verificar (interfaz, cronómetro, notificaciones) y los pasos exactos para probarlo en dispositivo.
5. Cualquier punto donde el plan no coincidió con el código y qué se hizo.
