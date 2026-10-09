# Rutinas

Parte de la [visión de Lestinaty](../../vision/lestinaty-vision.md), fase 4. Depende de las [franjas del día](2026-10-04-franjas-del-dia-design.md).

## Objetivo

Una **rutina** es una secuencia ordenada de pasos que se ejecuta como una sesión. Un paso puede ser un **hábito existente**, una **tarea existente** o una **acción propia de la rutina**. Las rutinas reutilizan los modos de ejecución de las tareas (simple, checklist, contador, cronómetro) y se pueden programar por días.

Ejemplo — *Rutina de estudio (45 min)*:

1. Repasar apuntes — cronómetro, 10 min (acción propia)
2. Resolver ejercicios — contador, 20 (tarea existente "Hacer ejercicios")
3. Repasar errores — cronómetro, 10 min (acción propia)
4. Beber agua — hábito existente
5. Descanso — cronómetro, 5 min (acción propia)

## Estado actual

- **Implementado (2026-10-04):** migraciones 78 y 79, módulo `src/modulos/rutinas/` y `RutinasPantalla` con datos reales (ya no es maqueta). Ver el plan `2026-10-04-franjas-y-rutinas.md` para el detalle y lo pendiente.
- `tareas_items.routine_id` (migración 59) sigue existiendo sin `references`: el cliente aún lo lee, así que **todavía no se borra**. `rutinas_pasos` es la relación autoritativa.
- Pantalla: vista **Hoy** con selector de franja y cuatro accesos (**Mis rutinas**, **Crear**, **Recordatorios**, **Plantillas**), tema Ignate.
- En esta primera entrega los pasos de hábito y tarea se muestran con su estado pero se completan desde su propia pantalla; solo los pasos propios se marcan desde la rutina. El ejecutor paso a paso es la siguiente etapa.
- El recordatorio se guarda (hora y activo) pero el envío de la notificación no está conectado todavía.
- **Sesión guiada (2026-10-05):** pasos esenciales/opcionales, "tengo X minutos", ejecución paso a paso con cronómetro y contador, `iniciar_rutina` y `cerrar_rutina_dia`. Ver `2026-10-05-sesion-guiada-rutinas-design.md`. Con esto, una rutina está completa cuando lo están sus pasos esenciales (no todos), y los pasos de hábito y tarea ya se pueden marcar desde la sesión.

## Principios

1. **Fuente de verdad única.** Completar un paso que referencia un hábito llama a `registrar_progreso_habito`; si referencia una tarea, usa `tareas_registros` (o el estado de la tarea si es `una_vez`). La rutina **no guarda un duplicado**: su avance del día se calcula.
2. **El hábito y la tarea siguen funcionando solos.** Estar en una rutina no los cambia ni los oculta de sus propias pantallas. En Hoy, un paso de rutina aparece solo dentro de la tarjeta de la rutina (ver franjas del día).
3. **Un paso propio solo existe dentro de su rutina.** Si la persona quiere reutilizarlo fuera, lo convierte en tarea.
4. **Servidor decide.** Identidad por `auth.uid()`, progreso y gemas en RPCs; el cliente no envía `usuario_id` ni cantidades de gemas.

## Modelo de datos

Migración nueva y aditiva (siguiente número libre tras la 63).

```sql
create table public.rutinas_items (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  titulo text not null check (char_length(trim(titulo)) between 1 and 80),
  descripcion text check (descripcion is null or char_length(trim(descripcion)) <= 280),
  franja public.franja_dia not null default 'cualquier_momento', -- ver 2026-10-04-franjas-del-dia-design.md
  icono_lucide text not null,
  color text not null,
  estado text not null default 'activa' check (estado in ('activa', 'pausada', 'archivada')),
  frecuencia text not null default 'dias_semana' check (frecuencia in ('diaria', 'dias_semana')),
  dias_semana smallint[],
  hora_inicio time,
  recordatorio_activo boolean not null default false,
  mostrar_nombre_notificacion boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archivada_en timestamptz,
  check ((frecuencia = 'diaria' and dias_semana is null)
      or (frecuencia = 'dias_semana' and cardinality(dias_semana) between 1 and 7)),
  check (dias_semana is null or dias_semana <@ array[1,2,3,4,5,6,7]::smallint[]),
  check (not recordatorio_activo or hora_inicio is not null),
  check ((estado = 'archivada') = (archivada_en is not null))
);

create table public.rutinas_pasos (
  id uuid primary key default gen_random_uuid(),
  rutina_id uuid not null references public.rutinas_items(id) on delete cascade,
  orden smallint not null check (orden >= 1),
  tipo_origen text not null check (tipo_origen in ('habito', 'tarea', 'propio')),
  habito_id uuid references public.habitos_items(id) on delete cascade,
  tarea_id uuid references public.tareas_items(id) on delete cascade,
  -- Solo para tipo_origen = 'propio':
  titulo text,
  modo text check (modo in ('simple', 'cronometro', 'contador')),
  objetivo_valor numeric(10,2) check (objetivo_valor > 0), -- minutos o cantidad
  unidad text,
  unique (rutina_id, orden) deferrable initially deferred,
  check (
    (tipo_origen = 'habito' and habito_id is not null and tarea_id is null and titulo is null and modo is null)
    or (tipo_origen = 'tarea' and tarea_id is not null and habito_id is null and titulo is null and modo is null)
    or (tipo_origen = 'propio' and habito_id is null and tarea_id is null
        and char_length(trim(titulo)) between 1 and 80 and modo is not null
        and ((modo = 'simple' and objetivo_valor is null) or (modo <> 'simple' and objetivo_valor is not null)))
  )
);

-- Solo para pasos 'propio'; hábitos y tareas ya tienen sus propios registros.
create table public.rutinas_pasos_registros (
  id uuid primary key default gen_random_uuid(),
  paso_id uuid not null references public.rutinas_pasos(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  fecha_local date not null,
  valor numeric(10,2) not null default 1 check (valor >= 0),
  completado_en timestamptz not null default now(),
  unique (paso_id, fecha_local)
);

-- Registro de la sesión: cuándo se inició y se cerró la rutina ese día.
create table public.rutinas_registros (
  id uuid primary key default gen_random_uuid(),
  rutina_id uuid not null references public.rutinas_items(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  fecha_local date not null,
  iniciada_en timestamptz not null default now(),
  completada_en timestamptz,
  unique (rutina_id, fecha_local)
);
```

Tanto `rutinas_items` como las demás tablas llevan RLS con `usuario_id = auth.uid()` (para `rutinas_pasos`, mediante la rutina propietaria) y los mismos grants que `tareas_items`.

### Integridad entre propietarios

Un trigger en `rutinas_pasos` verifica que el hábito o la tarea referenciados pertenezcan al mismo `usuario_id` que la rutina. Sin esto, RLS por sí sola no impide referenciar el hábito de otra persona.

### `tareas_items.routine_id`

`rutinas_pasos` es la única relación autoritativa. Como `routine_id` solo existe en `mejoras` y aún no lo usa ninguna pantalla, la migración lo **elimina** (y se quita de `Tarea`/`mapper`). Así una tarea puede aparecer en varias rutinas y no hay dos fuentes de verdad.

## Semántica del día

Para una fecha local, una rutina "toca" según su `frecuencia`/`dias_semana`. Cada paso se evalúa así:

| Origen | Aplica hoy | Completo si |
| --- | --- | --- |
| hábito | si el hábito está programado ese día (`habitos_es_dia_programado`) | existe registro que cumple su meta (`habitos_registros`) |
| tarea `dias_semana` | si `tareas_es_dia_programado` | existe `tareas_registros` de ese día |
| tarea `una_vez` | si no está archivada | `estado = 'hecha'` |
| propio | siempre | existe `rutinas_pasos_registros` con `valor >= objetivo_valor` |

- Un paso que **no aplica hoy** no cuenta (ni a favor ni en contra) y se muestra atenuado como "no programado hoy".
- La rutina está **completa** cuando todos los pasos que aplican están completos. Si ningún paso aplica, la rutina no se puede completar ese día.
- `rutinas_registros.completada_en` se fija al cumplirse esa condición dentro del RPC; **no es** fuente de verdad del avance de pasos, solo del cierre de la sesión (para racha e insights).

## RPCs

Todos exigen sesión y derivan identidad de `auth.uid()`. Implementados en la migración 79: `obtener_rutinas_hoy`, `crear_rutina`, `completar_paso_propio_rutina`. Pendientes: `actualizar_rutina` e `iniciar_rutina`. Recordatorio y archivado son `update` directo sobre `rutinas_items` (RLS).

- `public.crear_rutina(p_datos jsonb)` — crea rutina y pasos en una transacción; valida propietarios, límites (máx. 20 pasos por rutina) y orden contiguo. Idempotente por `p_idempotency_key` opcional.
- `public.actualizar_rutina(p_rutina_id uuid, p_datos jsonb)` — reemplaza el conjunto de pasos de forma atómica (deferrable `unique(rutina_id, orden)`).
- `public.obtener_rutinas_hoy()` — devuelve las rutinas que tocan hoy (zona horaria de `perfiles_usuario`), cada paso con su estado calculado (`aplica`, `completo`, `valor`, `objetivo`).
- `public.completar_paso_propio_rutina(p_paso_id uuid, p_valor numeric)` — registra un paso propio (upsert por `paso_id, fecha_local`) y cierra la rutina si corresponde. Los pasos de hábito/tarea **no** pasan por este RPC: usan los RPCs existentes (`registrar_progreso_habito`, completar tarea) y la rutina se recalcula en la lectura.
- `public.iniciar_rutina(p_rutina_id uuid)` — crea `rutinas_registros` del día (idempotente).

## Recompensas

Regla base: **los pasos no pagan nada por estar en una rutina**. Un hábito dentro de una rutina sigue dando sus gemas de nivel; una tarea sigue dando lo suyo.

Para evitar doble pago, una rutina completa **no** acredita gemas en esta fase. Si más adelante se quiere un cofre de rutina, debe definirse en un spec propio con ledger determinista (`rutina:<fecha>:<rutina_id>`) y tope diario, igual que `tareas_diarias_reclamadas`.

## Interfaz

1. **Lista** (`RutinasPantalla`): reemplaza los datos mock por `obtener_rutinas_hoy`. Se conserva la estructura visual existente (racha, progreso del día) y se agrupa por franjas del día igual que Hoy; "Estudio" pasa a ser una plantilla de creación, no una franja.
2. **Ejecutor**: pantalla de sesión paso a paso. Hábito/tarea muestran su control nativo (check, contador, cronómetro) y al completar llaman a su RPC; pasos propios usan `completar_paso_propio_rutina`. Se puede salir y reanudar: el estado sale siempre del servidor. Reutiliza los componentes de ejecución de tareas (`TarjetaChecklistCompacta`, cronómetro, contador) en lugar de crear nuevos.
3. **Creación**: wizard similar a `CrearTareaWizard`: datos → programación → pasos (elegir hábito, elegir tarea, o crear paso propio) → recordatorio. Aby podrá ofrecer una rutina propuesta en una fase posterior (misma estructura que `crear_rutina`).
4. **Sendero visual**: los pasos se dibujan como nodos en un camino (reutilizando `construirNodosPasos`), con el cierre de la rutina como destino. Es la forma de mostrar la rutina dentro del lenguaje de Senderos.
5. **Hoy**: cada rutina que toca es una sola tarjeta dentro de su franja, con sus pasos dentro; sus hábitos y tareas no se repiten como elementos aparte en Hoy, y sí en las pantallas de Hábitos y Tareas con la etiqueta "en Rutina X".

## Recordatorios

Se reutiliza la cola de recordatorios existente (`privacidad.notificaciones_programadas` y la Edge Function `despachar-recordatorios-habitos`). El recordatorio de rutina usa `hora_inicio` y respeta `mostrar_nombre_notificacion`, igual que tareas. Requiere ampliar el catálogo de notificaciones (`catalogo_notificaciones`) con un código de rutina.

## Privacidad

- Rutinas y pasos propios son datos personales: RLS por propietario y cobertura en la eliminación de cuenta (`on delete cascade` desde `auth.users`).
- Actualizar `docs/app-store/privacy-inventory.md` y `supabase/privacidad-schema.md` con las tablas nuevas.
- Ningún paso se envía a Aby salvo que la persona lo pida explícitamente.

## Pruebas

- Unitarias (vitest): resumen de avance de una rutina (`estadoRutina.ts`), mapper de RPC → tipos, plantillas, i18n. El estado de cada paso por origen lo calcula SQL, así que se prueba en el smoke SQL.
- Smoke SQL (`supabase/tests/09_franjas_rutinas.sql`, con `psql`): RLS (otra cuenta no lee ni referencia), trigger de propietario, completar paso propio idempotente, cierre de rutina, paso de hábito no programado no bloquea.

## Fases de implementación

1. Migración + tipos + servicio + mapper + tests unitarios.
2. Lista con datos reales (`obtener_rutinas_hoy`) reemplazando el mock.
3. Wizard de creación y edición.
4. Ejecutor de sesión.
5. Recordatorios e insights (racha de rutina = días consecutivos con `completada_en`).
6. Presentación como Sendero de pasos.

## Fuera de alcance

- Gemas o cofres por completar rutinas.
- Rutinas compartidas o cooperativas.
- Rutinas dentro de planes y cursos (llegan con el modelo unificado de Sendero).
- Generación de rutinas con Aby.
