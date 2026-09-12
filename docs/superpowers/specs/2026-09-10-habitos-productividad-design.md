# Hábitos: flujo profesional y sincronizado

## Objetivo

Convertir Hábitos en un flujo completo de productividad: crear un hábito con una configuración útil desde el primer día, cumplirlo en Hoy, navegar a su detalle y obtener análisis honestos y accionables en Patrones, Conexiones, Riesgo e Impacto.

## Experiencia

La pantalla principal mantiene la composición de Inicio: aurora verde, saludo de Hábitos, widgets, ilustración, `TabChanger` y los cinco tabs. `Categorías` abre en Hoy; `Hábitos` muestra todos los hábitos activos, no solo los que vencen hoy. Cada estado vacío conserva el icono y color del tab y explica la acción concreta que desbloquea el siguiente dato.

La creación pasa de modal a wizard de pantalla completa con cinco pasos: identidad; tipo/meta; frecuencia; recordatorio; resumen. Cada paso usa `Boton` variante `sendero`, permite volver sin perder datos y bloquea avanzar solo por validaciones comprensibles. El resumen muestra exactamente qué se guardará y crea el ítem y su primer plan mediante una única RPC.

## Datos y contratos

No se agregan tablas. La migración 10 amplía `public.crear_habito` para recibir `categoria`, `dificultad`, `disparador`, `recompensa`, frecuencia, meta, `recordatorio_activo`, `hora_recordatorio` y `mostrar_nombre_notificacion`. La operación sigue siendo transaccional y deriva el usuario de `auth.uid()`.

Un servicio de lista carga todos los `habitos_items` activos y su plan vigente con RLS. El panel existente sigue alimentando Hoy y análisis. Los datos con pares de IDs se enriquecen con los nombres/colores locales de la lista, sin intentar inferir causalidad que no existe en la base.

## Flujos de categoría

- **Hoy:** muestra solo hábitos programados para la fecha local, progreso y acción de cumplimiento. Mutar progreso invalida panel, lista y detalle.
- **Patrones:** muestra actividad disponible desde el primer registro y señala el nivel de confianza; no inventa una conclusión antes de siete muestras comparables.
- **Conexiones:** muestra coincidencias observadas y permite crear una conexión manual entre dos hábitos distintos cuando existan al menos dos hábitos.
- **Riesgo:** enseña la tendencia reciente frente a la línea base solo cuando el cálculo SQL tenga muestra suficiente; antes explica cuánto historial falta.
- **Impacto:** muestra relaciones manuales con datos de cumplimiento; antes de muestra suficiente explica que se necesitan registros de ambos hábitos en días compartidos.

## Sincronización y fallos

Cada mutación invalida `['habitos', 'panel']`, `['habitos', 'lista']` y el detalle implicado. La UI tiene skeleton/estado de carga, reintento explícito ante error, bloqueo del botón mientras guarda y feedback de éxito antes de navegar al detalle. Ningún estado vacío se representa como una lista técnica vacía.

## Límites

OneSignal consume el recordatorio ya guardado en `habitos_planes`; el wizard no envía notificaciones directamente. Las estadísticas se presentan como observaciones, no como recomendaciones médicas ni causalidad demostrada.
