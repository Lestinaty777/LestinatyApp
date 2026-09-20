# Gestión de hábitos desde Detalle

## Objetivo

Senderos y “Mis hábitos” deben mostrar todos los hábitos activos, aun si no
están programados hoy. La hoja Detalle debe convertirse en el lugar compacto
desde el que una persona entiende, registra, edita o archiva su hábito.

## Experiencia

Detalle mantiene la hoja deslizable y agrega scroll seguro. La jerarquía es:

1. Cabecera con volver, icono real de `assets/icons/ui`, nombre, nivel y menú.
2. Hero MasterGlass con aurora suave y el árbol del paquete.
3. Progreso de hoy y CTA de registro.
4. Programación: meta, días/frecuencia y recordatorio.
5. Resumen de racha/semana, sin la gráfica pesada actual.
6. Acciones: editar y archivar.

Editar abre un formulario en la propia hoja. Permite título, descripción,
icono, tipo/meta/unidad, frecuencia, días, veces por semana y recordatorio.

Archivar pide confirmación; no hay pantalla de archivados en esta iteración.

## Datos y seguridad

Se agrega una RPC transaccional para editar un hábito propio: actualiza sus
campos de identidad y cierra el plan vigente para insertar el nuevo plan con
la fecha local actual, preservando planes y registros históricos. Conserva el
nivel vigente y configura recordatorio en el plan nuevo.

Una RPC de archivado valida propiedad y cambia `estado` a `archivado`, con
`archivado_at`. No borra ítems, planes, registros, gemas ni semilla.

Tras guardar o archivar se invalidan panel, activos, detalle, progreso,
cercanía, racha y saldo cuando corresponda.

## Senderos

La pestaña de hábitos de Senderos toma la fuente de hábitos activos, no el
panel “Hoy”. Los hábitos no programados hoy siguen siendo navegables hacia su
sendero, pero no se presentan como pendientes de hoy.

## Pruebas

- Un hábito de lunes a viernes aparece en las listas globales en sábado.
- La edición conserva el nivel y crea una nueva vigencia sin solapamientos.
- Archivar oculta el hábito de consultas activas sin borrar su historial.
- La UI diferencia vacío de “Hoy” de ausencia total de hábitos.
