# Sesión guiada de rutinas

Parte de la [estrategia](../../vision/estrategia-y-monetizacion.md) (la acción diaria, la pieza que más hay que hacer bien) y de [Rutinas](2026-10-04-rutinas-design.md).

## Objetivo

Que hacer una rutina sea **una sesión que se recorre paso a paso**, con una sola pulsación para empezar, y que **un mal día no rompa la constancia**. Es lo que más cambia la experiencia diaria y lo que la gente retiene (el motivo nº 1 de abandono es no usar la app).

## Decisiones

1. **Pasos esenciales y opcionales.** Cada paso es esencial (por defecto) u opcional. Una rutina necesita al menos un paso esencial.
2. **Completar solo lo esencial cuenta como sesión completa.** Regla de "requeridos": los pasos esenciales que aplican hoy; si ninguno aplica hoy, todos los que aplican. Esto es la "constancia que perdona" (decisión propuesta en la estrategia, tomada para esta entrega).
3. **"Tengo X minutos".** Antes de empezar se elige el tiempo disponible (completa, 30, 15 o 5 min). La sesión incluye todos los esenciales y, en orden, los opcionales que quepan. Si los esenciales ya no caben, se avisa pero se permite hacerlos igual.
4. **El servidor es la fuente de verdad.** Si se cierra la app a mitad, al volver la sesión se rearma con los pasos que faltan. La sesión no guarda un estado propio de pasos.
5. **Sin gemas por completar una rutina** (como ya acordamos); los hábitos y tareas dentro de la rutina siguen dando lo suyo por sus propios RPCs.
6. **Un paso de hábito o de tarea se marca "hecho" con la meta completa**, igual que el atajo del círculo en Hoy. Pasos con progreso parcial real (contador de una tarea) siguen haciéndose desde su pantalla.

## Estimación de duración (heurística v1)

Los pasos no guardan una duración propia; se estima en cliente:

| Paso | Minutos |
| --- | --- |
| Cronómetro (propio, o de tarea/hábito de duración) | su objetivo (en minutos) |
| Contador | 5 |
| Checklist de tarea | 5 |
| Simple, hábito o tarea simple | 2 |

Una columna de minutos estimados por paso queda para cuando haga falta afinarlo.

## Modelo de datos (migración `20261005_73_rutinas_sesion.sql`)

- `rutinas_pasos.esencial boolean not null default true`.
- `obtener_rutinas_hoy` añade por paso `esencial`, `tarea_tipo` y `tarea_frecuencia` (para elegir el RPC correcto al marcar una tarea) y por rutina `sesion_iniciada_en` y `sesion_completada_en` (de `rutinas_registros` de hoy).
- `crear_rutina` acepta `esencial` por paso y exige al menos un esencial.
- `iniciar_rutina(p_rutina_id, p_fecha_local)`: crea o conserva el registro de la sesión de hoy (idempotente).
- `cerrar_rutina_dia(p_rutina_id, p_fecha_local)`: recalcula en el servidor si la rutina está completa con la regla de requeridos; si lo está, fija `completada_en` (una sola vez). Devuelve `completa`, requeridos y completados. No borra una compleción previa si después se deshace un paso.

## Interfaz

Ruta `app/rutinas/[id].tsx` (no se crea `app/rutinas/index.tsx`, que un test prohíbe a propósito).

1. **Preparar:** "¿Cuánto tiempo tienes?" con las opciones y una vista previa de lo que entra (esenciales marcados) y lo que se omite. Botón "Empezar" (inicia la sesión).
2. **En curso:** un paso a la vez en pantalla completa, con avance (paso n de m).
   - **Simple / hábito / tarea:** botón "Hecho".
   - **Contador (propio):** + y −; al llegar a la meta se completa; "Siguiente" guarda el avance parcial y sigue.
   - **Cronómetro (propio):** cuenta regresiva basada en la hora de fin (sigue bien aunque la app pase a segundo plano), pausa y reanudar; al llegar a cero se completa y avisa con vibración; "Listo antes" lo completa de una vez.
   - **Saltar** disponible siempre; un esencial saltado deja la sesión incompleta.
3. **Fin:** resumen. Si los esenciales están hechos: sesión completa (aunque falten opcionales). Si no: sesión parcial, con la opción de volver a los pasos esenciales pendientes. Al terminar se llama a `cerrar_rutina_dia`.

En las tarjetas de la lista, un botón **Empezar** o **Continuar** abre la sesión.

En el asistente de creación, cada paso se marca **Esencial u opcional**, y se exige al menos un esencial.

## Fuera de alcance (siguientes pasos)

- Racha de sesiones y su visual; mundo propio de la rutina (Ignate).
- Live Activities (iOS) y cronómetro persistente (Android): ver estrategia.
- Duración estimada editable por paso.
- Avance automático del paso con la app cerrada.
- Editar una rutina existente (incluida la marca esencial/opcional).

## Pruebas

- Vitest: `planearSesion`, estimación de minutos, relojes, resumen con regla de requeridos, mapper.
- Smoke SQL (`supabase/tests/11_sesion_rutinas.sql`): esencial por defecto y exigencia de al menos uno, regla de requeridos incluido el caso sin esenciales aplicables, `iniciar_rutina` idempotente, `cerrar_rutina_dia` con sesión completa e incompleta, aislamiento entre cuentas.
- Las pantallas y el cronómetro **no se pueden probar desde la sesión de desarrollo** (app nativa): hay que probarlos en un dispositivo.
