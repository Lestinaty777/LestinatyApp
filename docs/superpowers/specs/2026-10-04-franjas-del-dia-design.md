# Franjas del día (mañana, tarde, noche)

Parte de la [visión de Lestinaty](../../vision/lestinaty-vision.md). Es previa a Rutinas: el spec de [Rutinas](2026-10-04-rutinas-design.md) reutiliza este mismo concepto.

## Objetivo

Dividir el día en **franjas** para que Hoy muestre primero lo que corresponde al momento actual en vez de una lista plana. Con 10 hábitos programados, la persona ve por ejemplo 3 en la mañana, 4 en la tarde y 3 en la noche, y la franja actual está abierta.

Aplica a **hábitos, tareas y rutinas** con un único concepto compartido.

## Concepto

| Código | Significado |
| --- | --- |
| `manana` | Mañana |
| `tarde` | Tarde |
| `noche` | Noche |
| `cualquier_momento` | Sin franja fija (valor por defecto) |

- La franja **solo organiza la vista y alimenta insights**. No cambia reglas de constancia, niveles, gemas ni recordatorios.
- Todo lo que no tenga franja aparece en `cualquier_momento`; nada desaparece de Hoy.

## Modelo de datos

Migración aditiva (siguiente número libre tras la 63 y la de Rutinas, si ya existe).

```sql
-- Enumeración compartida como dominio, no tres checks copiados.
create domain public.franja_dia as text
  check (value in ('manana', 'tarde', 'noche', 'cualquier_momento'));

alter table public.habitos_planes
  add column franja public.franja_dia not null default 'cualquier_momento';

alter table public.tareas_items
  add column franja public.franja_dia not null default 'cualquier_momento';

-- Límites configurables por persona (hora local, 0–23).
alter table public.perfiles_usuario
  add column franja_manana_desde smallint not null default 5  check (franja_manana_desde between 0 and 23),
  add column franja_tarde_desde  smallint not null default 12 check (franja_tarde_desde  between 0 and 23),
  add column franja_noche_desde  smallint not null default 19 check (franja_noche_desde  between 0 and 23),
  add constraint perfiles_franjas_orden_check
    check (franja_manana_desde < franja_tarde_desde and franja_tarde_desde < franja_noche_desde);
```

Decisiones:

- **Hábitos:** la franja vive en `habitos_planes`, junto a días, frecuencia y `hora_recordatorio`. Los planes ya son versionados por rango de fechas, así que cambiar de franja no reescribe el historial.
- **Tareas:** columna directa en `tareas_items`, como el resto de su horario.
- **Rutinas:** `rutinas_items.momento` pasa a ser `franja public.franja_dia` (ver cambios al spec de Rutinas). La etiqueta temática "estudio" no es una franja; si se quiere conservar es un campo de presentación aparte, no parte de este concepto.
- **Hábitos y tareas existentes** quedan en `cualquier_momento`: no hay cambio de comportamiento hasta que la persona lo configure.
- Los límites de franja viven en el perfil y se interpretan con `perfiles_usuario.zona_horaria`, igual que la fecha local actual. La noche cruza medianoche: abarca de `franja_noche_desde` hasta `franja_manana_desde` del día siguiente.

### Franja del momento

Función SQL y espejo en cliente para calcular la franja de una hora local:

```sql
create function public.franja_de_hora(hora smallint, manana smallint, tarde smallint, noche smallint)
returns public.franja_dia language sql immutable as $$
  select case
    when hora >= manana and hora < tarde then 'manana'
    when hora >= tarde  and hora < noche then 'tarde'
    else 'noche'
  end
$$;
```

La versión de cliente es una función pura (`franjaDeHora`) con los mismos límites; ambas cubiertas por tests con casos de borde (5:00, 11:59, 12:00, 18:59, 19:00, 4:59).

## Reglas

1. **Franja explícita siempre guardada.** Al crear un hábito o tarea con recordatorio, se **sugiere** la franja según la hora elegida, pero lo que se guarda es la elección de la persona. Cambiar la hora después no mueve la franja sola.
2. **La franja no es un plazo.** Un elemento de la mañana sin completar a las 15:00 sigue visible, con la etiqueta de su franja, hasta fin del día. No se marca como fallido.
3. **Constancia sin cambios.** Rachas y niveles se evalúan por día, como hoy. La franja no entra en `registrar_progreso_habito`.
4. **Una franja por elemento.** Si algo ocurre en varios momentos, se crean varios hábitos o se usa una rutina; no existen franjas múltiples.
5. **Franja de un paso en rutina.** Los pasos heredan la visualización de su origen; la rutina como contenedor tiene su propia franja. Un hábito dentro de una rutina de mañana mantiene su propia franja en Hoy.

## Interfaz

- **Hoy:** secciones por franja en orden manana → tarde → noche → cualquier_momento. La franja del momento actual aparece expandida y las demás plegadas con un resumen ("Tarde: 3 · Noche: 2"). El resumen muestra pendientes y completados.
- **Franja vacía:** se oculta; no se muestra una sección sin elementos.
- **Creación de hábito, tarea y rutina:** selector de franja (cuatro opciones). Si hay hora de recordatorio, se pre-selecciona la franja correspondiente y se puede cambiar.
- **Ajustes:** pantalla para editar los límites de franja, con vista previa del día ("Mañana 5:00–12:00").
- **Diseño:** no agregar un tercer toggle a Hoy. Reusar la jerarquía visual existente (cada franja es una sección de la misma timeline) y mantener el tema actual.
- **Accesibilidad:** cada sección es un encabezado con estado expandido/plegado anunciable; el resumen es texto, no solo color.

## Insights

- Registrar la franja **en la que se completó** cada hábito o tarea, derivada de `completada_en` y de los límites del perfil (no se guarda un dato duplicado; se calcula).
- Habilita preguntas como "¿en qué franja cumples más?". Esa información es la base de las futuras adaptaciones de Aby.

## Cambios en otros specs

### Rutinas (`2026-10-04-rutinas-design.md`)

- Reemplazar `momento text … check (momento in ('manana','tarde','noche','estudio','personalizado'))` por `franja public.franja_dia not null default 'cualquier_momento'`.
- La lista de Rutinas se agrupa con las mismas secciones de franja que Hoy.
- "Estudio" deja de ser un momento y queda como una plantilla de creación, no como un valor de datos.

### Visión (`docs/vision/lestinaty-vision.md`)

- Nueva fila en la hoja de ruta: franjas del día, entre Tareas y Rutinas.

## Seguridad y privacidad

- Las columnas nuevas heredan las políticas RLS existentes de `habitos_planes`, `tareas_items` y `perfiles_usuario`; no se crean tablas ni grants nuevos.
- Los límites de franja son preferencias personales: cubiertos por la eliminación de cuenta existente. Actualizar `supabase/privacidad-schema.md` si se documenta el perfil.
- Las RPCs que devuelven hábitos o tareas de hoy incluyen `franja`; ninguna recibe `usuario_id` del cliente.

## Pruebas

- Unitarias: `franjaDeHora` (bordes y noche que cruza medianoche), agrupación y orden de secciones, franja vacía oculta, elemento atrasado visible tras terminar su franja.
- SQL remoto: migración deja hábitos y tareas existentes en `cualquier_momento`, el check de orden de límites rechaza valores inválidos, un plan nuevo guarda su franja sin romper la exclusión por rango de fechas.
- Regresión: rachas y niveles idénticos antes y después de la migración.

## Fases

1. Migración, dominio, `franjaDeHora` y tipos/mappers de hábito y tarea.
2. Selector de franja en creación y edición de hábitos y tareas.
3. Hoy agrupado por franjas.
4. Ajustes de límites de franja.
5. Insights por franja.

## Fuera de alcance

- Franjas múltiples por elemento.
- Reprogramar o penalizar automáticamente cuando una franja termina.
- Recomendaciones de Aby basadas en franjas (llegan con Aby adaptativo).
