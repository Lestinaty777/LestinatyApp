# Tareas diarias y cofres temáticos

## Objetivo

Conservar las dos vistas de la sección **Hoy**, pero darles propósitos distintos:

- **Hábitos** conserva la timeline actual de Senderos sin cambios visuales ni de tema.
- **Tareas** muestra misiones simples relacionadas con progreso real de hábitos. Las misiones se completan automáticamente; las gemas sólo se acreditan cuando la persona toca y abre un cofre.

Las tareas no son hábitos nuevos y no premian abrir la app, tocar botones ni registrar progreso incompleto.

## Alcance inicial

Cada misión se evalúa por fecha local de la persona y sólo puede reclamarse una vez.

| Código | Texto ES | Condición validada por servidor | Gemas |
| --- | --- | --- | ---: |
| `sendero_1_nodo` | Da tu primer paso | La persona avanzó al menos un nodo real de cualquier Sendero hoy. | 4 |
| `sendero_2_nodos` | Sigue explorando | La persona avanzó al menos dos nodos reales de Senderos hoy. | 7 |
| `sendero_dia_completo` | Día completo | La persona completó todos los nodos programados hoy. Sólo existe si hay uno o más nodos programados. | 10 |

Una jornada totalmente completada puede desbloquear las tres misiones: máximo de 21 gemas al día. Las recompensas de nivel y cofres de Senderos ya existentes siguen intactas.

## Referidos

Referidos es una **misión especial permanente**, no una tarea diaria ni un reclamo adicional.

- Muestra el código y el progreso real del sistema existente.
- Su botón reutiliza la misma acción de compartir de `TarjetaReferidosGemas`.
- No acredita gemas al compartir.
- El sistema existente conserva la recompensa de 100 gemas para ambas personas cuando el invitado alcanza nivel 2 por primera vez.

Archivos que ya implementan esa regla:

- `supabase/migrations/20260916_24_referidos.sql`
- `supabase/migrations/20260917_27_rpc_resumen_referidos.sql`
- `src/modulos/tienda/componentes/TarjetaReferidosGemas.tsx`
- `src/modulos/tienda/gemas.servicio.ts`

## Qué significa «avanzar un nodo»

La fuente de verdad es el progreso acumulado real de Senderos, no una señal enviada por el cliente. Un nodo avanza cuando `privacidad.registrar_progreso_habito` registra un valor que cumple la meta de un día programado. Para tareas diarias:

- contar cada hábito programado y completado para la fecha local actual como un nodo avanzado;
- contar nodos sólo una vez por hábito y día, aunque la persona edite el registro varias veces;
- `sendero_dia_completo` exige que todos los hábitos/nodos programados para hoy estén completados;
- no mostrar tareas si la persona no tiene hábitos programados hoy; se puede mostrar un estado vacío que invite a crear o programar un hábito.

`registrarProgresoHabito()` ya recibe del backend `transicionSendero`, `nivel` y el resultado del registro. Tras una mutación exitosa, React Query únicamente invalida la consulta de tareas; nunca acredita las gemas en el cliente.

## Persistencia y seguridad

Nueva migración, sin alterar las tablas ni RPCs existentes de Senderos o Referidos.

### Tabla

```sql
create table public.tareas_diarias_reclamadas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  fecha_local date not null,
  tarea_codigo text not null check (tarea_codigo in (
    'sendero_1_nodo', 'sendero_2_nodos', 'sendero_dia_completo'
  )),
  gemas integer not null check (gemas > 0),
  reclamado_en timestamptz not null default now(),
  unique (usuario_id, fecha_local, tarea_codigo)
);
```

Activar RLS: la persona puede leer sólo sus propios reclamos. No necesita inserción directa desde cliente.

### Ledger

Ampliar el `check` de `comercio.movimientos_gemas.motivo` con `tarea_diaria`. Cada movimiento debe incluir una referencia determinista:

```text
tarea-diaria:<YYYY-MM-DD>:<tarea_codigo>
```

Esto complementa la unicidad de la tabla y facilita auditoría.

### RPCs

`comercio.obtener_tareas_diarias()`:

- exige sesión;
- calcula `fecha_local` desde `perfiles_usuario.zona_horaria`;
- calcula nodos programados y completados con las mismas reglas de `registrar_progreso_habito` / `habitos_es_dia_programado`;
- consulta los reclamos de ese día;
- devuelve para cada tarea: código, título no localizado/código, gemas, progreso, meta y estado (`bloqueada`, `disponible`, `reclamada`);
- no devuelve una tarea `sendero_dia_completo` si no había nodos programados.

`comercio.reclamar_tarea_diaria(p_tarea_codigo text)`:

1. Exige sesión y valida el código contra una lista cerrada.
2. Vuelve a calcular las condiciones en el servidor para la fecha local.
3. Rechaza tareas bloqueadas o inexistentes.
4. Inserta el reclamo; la restricción única resuelve doble toque, reintento o dos dispositivos.
5. Acredita las gemas con `comercio.acreditar_gemas` y registra `tarea_diaria` con referencia determinista.
6. Devuelve tarea, gemas otorgadas y saldo resultante.

La transacción debe ser atómica. Ninguna cantidad de gemas viene de React Native.

## UI y tema

En `HabitosPantalla.tsx`, la vista del toggle hoy existente debe quedar:

```text
[ Hábitos ] -> TimelineHabitosHoy actual
[ Tareas ]  -> TareasDiariasHoy
```

No cambiar el comportamiento ni el color global de `TimelineHabitosHoy`.

`TareasDiariasHoy` muestra:

- encabezado con avance diario, por ejemplo `2 de 3 misiones listas`;
- filas de misión con progreso y estado;
- cofre cerrado para `disponible`, cofre abierto para `reclamada`;
- llamada a la acción para la misión especial de referidos y sus métricas existentes.

### Cofre temático

El cofre pertenece al **tema global seleccionado**, no al paquete del hábito que avanzó. Debe heredar el `MasterColorContext` que ya envuelve la pantalla:

```tsx
const esc = useEscala();

<MasterChanger
  fuente={ASSET_COFRE_CERRADO}
  colorDestino={colorMasterMasCercano(esc.jade.l34)}
/>
```

Se reutiliza la interacción de cofres ya existente:

- `assets/ilustraciones/senderos/biomas/cofres/cofre-cerrado.png`
- `assets/ilustraciones/senderos/biomas/cofres/cofre.png`
- `src/modulos/senderos/componentes/mapa/NodoCofreSendero.tsx`
- `src/modulos/senderos/componentes/mapa/ModalAperturaCofre.tsx`

El cofre disponible hace rebote/sacudida suave, halo del color activo y badge accesible `¡Reclamar!`. Al tocarlo, un modal ejecuta el RPC, anima apertura y hace brotar gemas. Sólo se marca abierto después de respuesta exitosa.

Para animación del tema, usar el asset `abrir-cofre-<paquete>.webm` correspondiente al tema activo. Si no existe, usar `abrir-cofre-esmeralda.webm`. El mapeo debe tener fallback explícito; nunca construir un `require()` dinámico.

## Estructura propuesta

```text
src/modulos/habitos/
  tareasDiarias.tipos.ts
  tareasDiarias.servicio.ts
  tareasDiarias.test.ts
  componentes/
    TareasDiariasHoy.tsx
    CofreTareaDiaria.tsx
    ModalAperturaCofreTarea.tsx
supabase/migrations/
  20260922_37_tareas_diarias.sql
```

Extraer de `TarjetaReferidosGemas.tsx` una función/componente de compartir sólo si evita duplicar la llamada a `Share.share`; no refactorizar su presentación fuera de lo necesario.

Añadir las cadenas ES/EN a `src/servicios/i18n/recursos.ts` bajo una sección consistente de `habitos.tareasDiarias`.

## React Query e invalidación

- Consulta: `['habitos', 'tareas-diarias']`.
- Tras `registrarProgresoHabito()` con éxito: invalidar esa consulta junto con las consultas actuales de panel/senderos.
- Tras reclamar: invalidar `['habitos', 'tareas-diarias']` y `CLAVE_SALDO_GEMAS`.
- No usar actualización optimista para saldo ni marcar cofre reclamado hasta la respuesta del RPC.

## Pruebas y verificación

Pruebas unitarias de cálculo/mapeo:

- cero, uno y dos nodos completados;
- todos los nodos programados completados;
- ningún hábito programado hoy;
- un mismo hábito editado varias veces cuenta una vez;
- tareas reclamadas se mapean a estado `reclamada`.

Pruebas de integración/RPC o SQL:

- no reclamar con condición insuficiente;
- no doble reclamo el mismo día;
- dos dispositivos/reintentos no duplican gemas;
- fecha local respeta zona horaria;
- ledger usa `tarea_diaria` y referencia determinista;
- Referidos no se acredita por esta funcionalidad.

Pruebas de UI:

- cambio de toggle no altera `TimelineHabitosHoy`;
- cofre disponible hereda `MasterColorContext`;
- cofre reclamado no vuelve a abrirse;
- fallback de asset de animación es Esmeralda.

Ejecutar:

```bash
npx tsc --noEmit
npx vitest run
```

Los errores preexistentes conocidos en `WidgetRegistrarProgreso.tsx` y `SesionMisionPantalla.tsx` no se deben modificar; no deben aparecer errores nuevos.
