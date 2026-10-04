# Lestinaty — Visión, modelo conceptual y hoja de ruta

Estado: **borrador de visión formalizado** (2026-10-04). Es el documento rector: los specs de cada feature (`docs/superpowers/specs/`) deben ser coherentes con él. Cuando un spec lo contradiga, se corrige uno de los dos explícitamente.

## 1. Qué es Lestinaty

Una aplicación de crecimiento personal que **convierte lo que una persona quiere lograr en un camino que puede recorrer**.

> Turn goals into paths. / Convierte lo que quieres lograr en un camino.

No es otra app de hábitos, lista de tareas, calendario ni clon de Notion/ClickUp. La diferenciación es conceptual: un lenguaje propio, **Senderos**, y una IA (Aby) que construye esos caminos.

## 2. Principio de producto

Toda funcionalidad nueva debe responder: **¿cómo ayuda esto a una persona a recorrer un Sendero?** Si no hay respuesta, no entra.

## 3. Glosario

| Término | Definición |
| --- | --- |
| **Sendero** | Camino con inicio, progreso, etapas y resultado. Es el lenguaje común de todo el producto. |
| **Nodo** | Unidad ejecutable y visible de un Sendero (una lección, un día, un paso, una tarea). |
| **Hábito** | Acción recurrente cuyo progreso es la **constancia**. Tiene su propio Sendero (7 niveles de crecimiento). |
| **Tarea** | Acción ejecutable con un *modo*: simple, checklist, contador (cantidad) o cronómetro. |
| **Rutina** | Secuencia ordenada de pasos (hábitos, tareas o acciones propias) que se ejecuta como una sesión. |
| **Plan** | Sendero de etapas (días/semanas/secciones) hacia un objetivo. |
| **Curso** | Sendero creado para enseñar a otras personas; se publica y se vende. |
| **Equipo** | Conjunto de Senderos individuales conectados por dependencias hacia un objetivo común. |
| **Aby** | Agente de IA que convierte una intención en Senderos reales (estructura, no solo texto). |
| **Marketplace** | Lugar donde los creadores publican y venden Senderos/cursos. |

## 4. Modelos de progreso

Todos los Senderos comparten *inicio → progreso → etapas → avance → resultado*, pero cada tipo mide el progreso distinto:

| Tipo de Sendero | Progreso = | Ejemplo |
| --- | --- | --- |
| Hábito | Constancia en el tiempo (niveles 1–7: 3, 7, 14, 28, 50, 70 días…) | Meditar a diario |
| Plan / objetivo | Completar etapas | Crear una app en 6 semanas |
| Rutina | Completar la secuencia en una sesión + racha de días completos | Rutina de estudio de 45 min |
| Curso | Aprendizaje (lecciones, evaluaciones) | Japonés en 30 días |
| Equipo | Cumplir dependencias entre personas | Diseño desbloquea Implementación |

Los hábitos **no se eliminan ni se reescriben**: son el primer y más simple ejemplo del concepto.

## 5. Arquitectura conceptual

```text
                        SENDERO
                           │
       ┌───────────────────┼───────────────────┐
    HÁBITO               TAREA               RUTINA
  (constancia)         (ejecutable)     (secuencia de pasos)
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                  PLAN / CURSO / EQUIPO
                           │
                          ABY
```

Reglas de diseño:

1. **Una sola fuente de verdad por acción.** Completar un hábito o una tarea dentro de una rutina registra el progreso en el hábito/tarea; la rutina nunca duplica el registro.
2. **Modos de ejecución compartidos.** Simple, checklist, contador y cronómetro son modos de un nodo/tarea, reutilizables en tareas, rutinas, planes y cursos.
3. **Dependencias como dato.** "Este nodo se desbloquea cuando aquel se complete" es una relación explícita entre nodos (base del modo cooperativo).
4. **Migración aditiva.** Cada fase reutiliza lo anterior; no se reescriben tablas con datos reales de usuarios. Lo nuevo se expone sobre lo existente (vistas, tablas puente).
5. **Seguridad por defecto.** RLS en toda tabla personal, identidad derivada de `auth.uid()`, escrituras sensibles (gemas, progreso) en RPCs transaccionales e idempotentes.

## 6. Aby

Aby es la interfaz natural para pasar de intención a estructura: recibe "quiero aprender japonés en 30 días" y **crea Senderos reales** (secciones, días, tareas, rutinas, hábitos, dependencias) que la persona puede editar después.

Requisito: Aby solo se amplía cuando existe un **esquema destino estable** donde persistir lo generado. Por eso el modelo de Rutinas y Planes va antes que generación avanzada.

Reglas de seguridad ya vigentes y que se mantienen: Gemini solo se llama desde Edge Function, la propuesta es privada hasta que la persona la acepta, y la aceptación es transaccional.

## 7. Cooperación

Para un objetivo compartido, Aby genera **un Sendero por persona** más las dependencias entre ellos. No son listas compartidas: son Senderos individuales conectados. Escala de 2 personas a equipos pequeños. Requiere diseñar con cuidado RLS multiusuario y permisos entre personas antes de implementarse.

## 8. Cursos y marketplace

Un curso es un Sendero publicado: contenido + tareas + hábitos + rutinas + evaluaciones, organizado en secciones y días. Se vende un **camino estructurado hacia un resultado**, no solo información.

Estrategia de validación (sin construir el marketplace primero):

1. El fundador crea 2–3 cursos propios y los publica en la app.
2. Se venden con RevenueCat (producto no consumible).
3. Se mide: conversión, finalización, reembolsos, qué temas tienen demanda.
4. Se invita a unos pocos creadores externos.
5. Solo si ambos validan, se construye el marketplace (pagos a terceros, comisión, moderación).

Ingresos potenciales a largo plazo: comisión por venta, suscripción de creadores, Aby para generar cursos, analytics, suscripción de estudiantes.

## 9. Experiencia visual

Voxel/isométrico, mapas, árboles, caminos, nodos, mundos y pequeñas animaciones. El progreso **se ve**, no es solo un porcentaje. Se evita la estética de herramienta empresarial (Jira, Trello, hojas de cálculo). Un hábito completado produce lluvia, un árbol crece, un Sendero completo desbloquea una zona, un curso tiene su propio mundo, un equipo ve converger caminos.

## 10. Hoja de ruta

| Fase | Contenido | Estado |
| --- | --- | --- |
| 1 | Hábitos: constancia, árboles, gemas, Senderos individuales | Hecho |
| 2 | Tareas con modos (simple, checklist, contador, cronómetro) | En curso (rama `mejoras`) |
| 3 | **Rutinas** que agrupan hábitos y tareas | Spec: `2026-10-04-rutinas-design.md` |
| 4 | Planes por días/secciones (Senderos de etapas) | Pendiente |
| 5 | Modelo unificado de Sendero + dependencias entre nodos | Pendiente (spec propio) |
| 6 | Aby genera Senderos reales (planes y rutinas) | Parcial: estudio |
| 7 | Cooperativo | Pendiente |
| 8 | Cursos propios publicados y vendidos | Pendiente |
| 9 | Marketplace | Solo tras validar la fase 8 |

Orden deliberado: Rutinas antes que el modelo unificado, porque obliga a definir pasos heterogéneos con casos reales; el modelo unificado se abstrae de lo que Tareas y Rutinas demuestren necesitar, en vez de diseñarse en abstracto.

## 11. Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Alcance de varios años | Fases con valor propio; cada una reutiliza la anterior; marketplace condicionado a validación |
| Tres familias de tablas sin modelo común (`habitos_*`, `tareas_*`, `senderos`) | Spec de modelo unificado en la fase 5, migración aditiva |
| Aby sin esquema destino estable | Rutinas y Planes primero |
| Multiusuario (equipo, marketplace) complica RLS y pagos | Diseño explícito antes de implementar; sin pagos a terceros hasta validar |
| Duplicar recompensas (gemas) al anidar hábitos/tareas en rutinas | Regla de fuente de verdad única; recompensas definidas por spec |
| Licencia: `main` BUSL-1.1, `mejoras` propietaria | Decidir antes de fusionar; revisar promesas hechas a jueces de Shipaton |

## 12. Preguntas abiertas

- ¿El modelo unificado usa una tabla `senderos` polimórfica o vistas sobre las familias existentes?
- ¿Los cursos se compran por curso, por suscripción o ambos?
- ¿Quién modera los cursos de terceros y bajo qué política de contenido/reembolso de App Store y Google Play?
- ¿Cómo se representa visualmente un Sendero cooperativo en el mapa?
