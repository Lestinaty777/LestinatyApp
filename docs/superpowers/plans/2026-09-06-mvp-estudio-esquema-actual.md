# MVP de Estudio con el Esquema Actual Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar el primer bucle de aprendizaje de Lestinaty: crear una propuesta con Aby, confirmarla como Sendero, abrir sus lecciones SDUI y avanzar localmente entre nodos.

**Architecture:** El modelo remoto actual conserva `meta -> sendero -> seccion -> nodo`; el MVP lo muestra como `sendero -> nodos -> leccion`. Gemini devuelve un `PathSchema` cerrado de cinco lecciones y una evaluación, incluyendo los `lesson_pack` completos antes de activar la sección, porque el contenido activo es inmutable. Expo solo renderiza contratos Zod validados; las Edge Functions son las únicas que usan `service_role`.

**Tech Stack:** Expo Router 57, React Native 0.86, TypeScript, Vitest, Zod, Supabase Edge Functions, PostgREST, AsyncStorage y Gemini 2.5 Flash.

**Spec:** `docs/superpowers/specs/2026-08-31-progresion-senderos-metas-design.md`, `docs/superpowers/specs/2026-09-03-flujo-creacion-estudio-design.md`, `supabase/senderos.md`.

## Global Constraints

- No modificar tablas, columnas, triggers, políticas RLS ni schemas de Supabase en este plan.
- Usar exclusivamente `categoria_codigo = 'estudio'`.
- El primer Sendero contiene cinco nodos de tipo `leccion`, uno de tipo `evaluacion`, sus conexiones lineales y el cofre ya exigido por la migración.
- Soportar únicamente las intenciones `aprender` y `examen`; ocultar o deshabilitar las demás opciones de creación.
- La UI usa `aprender`, pero la configuración actual de Aby conserva `intencion = 'materia'`; el adaptador convierte entre ambos valores antes de invocar Gemini.
- No construir gemas, cofres reclamables, social, plantillas, analíticas, repaso espaciado, hábitos, rutinas, categorías académicas ni onboarding completo.
- Gemini devuelve datos; no JSX, estilos, colores ni instrucciones arbitrarias de UI.
- Validar toda respuesta de Gemini con Zod tanto en la Edge Function como en Expo.
- Generar cada `lesson_pack` durante la creación del Sendero. La carga diferida de lecciones no es posible con el esquema actual porque `sendero_nodos` se vuelve inmutable al activar la sección.
- Progreso de nodos en esta entrega se persiste solo en AsyncStorage por dispositivo. El progreso sincronizado en Supabase queda bloqueado hasta crear una tabla específica de progreso.

## Límite del Esquema Actual

El esquema actual no contiene `usuario_nodo_progreso`, `intentos_leccion`, `respuestas_leccion` ni una RPC de aceptación transaccional. Por tanto este plan puede entregar una creación compensable desde Edge Function y progreso local, pero no puede afirmar progreso sincronizado ni atomicidad SQL total.

El cierre de producto posterior a este plan requiere una migración mínima que agregue progreso por usuario y una función SQL `aceptar_propuesta_aby`. Esa migración no forma parte de este documento.

---

## File Structure

- `src/modulos/aby/contrato/pathEstudio.schema.ts`: contrato puro del camino generado por Gemini.
- `src/modulos/aby/contrato/pathEstudio.schema.test.ts`: validación del camino de seis nodos.
- `src/modulos/aby/servicios/aby.servicio.ts`: invocación de generación y aceptación remotas.
- `supabase/functions/generar-sendero-aby/index.ts`: generación, validación y persistencia de propuesta.
- `supabase/functions/aceptar-propuesta-aby/index.ts`: creación compensable de la jerarquía ya validada.
- `src/modulos/senderos/senderos.servicio.ts`: consultas de senderos activos propios.
- `src/modulos/senderos/tipos.ts`: modelo de lectura remoto para biblioteca y mapa.
- `src/modulos/senderos/estado/progresoLocalSendero.ts`: estado local versionado por sendero y nodo.
- `src/nucleo/navegacion/tabsMvp.config.ts`: catálogo puro de destinos persistentes de la navegación MVP.
- `src/modulos/senderos/pantallas/DetalleSenderoPantalla.tsx`: mapa real y apertura del nodo actual.
- `app/senderos/leccion.tsx`: carga el nodo real en lugar de `MOCK_LECCION`.
- `src/modulos/senderos/componentes/lecciones/LessonRunner.tsx`: ejecutor sin vidas, con resultado estructurado.
- `src/modulos/inicio/pantallas/InicioPantalla.tsx`: estado `Hoy` con siguiente nodo real.
- `app/(principal)/_layout.tsx`: navegación MVP con `Hoy`, `Senderos`, `Crear` y `Tú`.
- `app/(principal)/tu.tsx`: entrada de perfil que redirige a la configuración existente.

### Task 1: Cerrar los contratos de camino y lección

**Files:**
- Create: `src/modulos/aby/contrato/pathEstudio.schema.ts`
- Create: `src/modulos/aby/contrato/pathEstudio.schema.test.ts`
- Modify: `src/modulos/aby/contrato/aby.contrato.ts`
- Modify: `src/modulos/senderos/motor/sdui/lecciones/esquemaLeccion.ts`
- Modify: `src/modulos/senderos/motor/sdui/lecciones/tiposLeccion.ts`

**Interfaces:**
- Produces `PathEstudio`, `NodoPathEstudio`, `validarPathEstudio()` y `validarLeccionPack()`.
- Consumes `LeccionPack` y `leccionPackSchema` existentes.

- [ ] **Step 1: Escribir la prueba fallida del camino válido.**

```ts
it('acepta cinco lecciones, una evaluacion y conexiones lineales', () => {
  const path = validarPathEstudio(pathValido);
  expect(path.nodos.filter((nodo) => nodo.tipo === 'leccion')).toHaveLength(5);
  expect(path.nodos.filter((nodo) => nodo.tipo === 'evaluacion')).toHaveLength(1);
  expect(path.conexiones).toHaveLength(5);
});
```

- [ ] **Step 2: Ejecutar la prueba.**

Run: `npm test -- src/modulos/aby/contrato/pathEstudio.schema.test.ts`

Expected: falla porque `pathEstudio.schema.ts` no existe.

- [ ] **Step 3: Definir el contrato mínimo.**

```ts
export const pathEstudioSchema = z.object({
  descripcion: z.string().trim().min(1).max(600),
  intencion: z.enum(['aprender', 'examen']),
  nodos: z.array(z.object({
    descripcion: z.string().trim().min(1).max(600),
    id: z.string().regex(/^[a-z0-9-]+$/),
    lessonPack: leccionPackSchema,
    objetivo: z.string().trim().min(1).max(300),
    tiempoEstimadoMinutos: z.number().int().min(1).max(180),
    tipo: z.enum(['leccion', 'evaluacion']),
    titulo: z.string().trim().min(1).max(120),
  })).length(6),
  titulo: z.string().trim().min(1).max(120),
  conexiones: z.array(z.object({ origenId: z.string(), destinoId: z.string() })).length(5),
});
```

Refinar con `superRefine`: exigir cinco lecciones, una evaluación final en posición seis y conexiones `nodo-1 -> nodo-2` hasta `nodo-5 -> examen`.

- [ ] **Step 4: Reducir el registro SDUI inicial.**

Mantener únicamente widgets que ya tienen renderer funcional: `teoria-corta`, `opcion-multiple`, `rellenar-huecos`, `verdadero-falso`, `ordenar-lista` y `flashcard`. Rechazar `opcion-imagen`, `parejas-memoria` y `desafio-final` hasta que sus widgets se verifiquen sin mocks ni URLs vacías.

- [ ] **Step 5: Ejecutar validaciones.**

Run: `npm test -- src/modulos/aby/contrato/pathEstudio.schema.test.ts && npm run typecheck`

Expected: PASS.

### Task 2: Adaptar Gemini a propuestas persistibles

**Files:**
- Modify: `supabase/functions/generar-sendero-aby/index.ts`
- Modify: `supabase/functions/generar-sendero-aby/README.md`
- Modify: `src/modulos/aby/servicios/aby.servicio.ts`
- Create: `src/modulos/aby/servicios/aby.servicio.test.ts`

**Interfaces:**
- Consumes `PathEstudio` de Task 1 y configuración de `aprender` o `examen`.
- Produces `{ propuestaId: string; path: PathEstudio }`. El adaptador de Expo traduce `aprender` a `materia` al construir la configuración existente.

- [ ] **Step 1: Escribir una prueba fallida del adaptador remoto.**

```ts
it('rechaza una propuesta remota sin el examen final', () => {
  expect(() => validarRespuestaCreacionAby({ propuestaId: 'x', path: pathSinExamen }))
    .toThrow(/evaluacion/i);
});
```

- [ ] **Step 2: Ejecutar la prueba.**

Run: `npm test -- src/modulos/aby/servicios/aby.servicio.test.ts`

Expected: FAIL porque `validarRespuestaCreacionAby` no existe.

- [ ] **Step 3: Cambiar el prompt de Edge Function.**

Exigir JSON que coincida con `PathEstudio`: cinco lecciones, una evaluación final, seis `lessonPack` completos, conexiones lineales y textos originales. Para `examen`, usar fecha, temas y disponibilidad para distribuir duración. Para `aprender`, usar objetivo, nivel y tiempo diario. Prohibir contenido protegido reproducido y cualquier clave visual de UI.

- [ ] **Step 4: Persistir el borrador remoto.**

Tras validar la respuesta, insertar una fila en `public.aby_propuestas` con:

```ts
{
  configuracion: solicitud.configuracion,
  estado: 'lista',
  modelo: 'gemini-2.5-flash',
  propuesta: path,
  usuario_id: user.id,
}
```

Responder solo `{ propuestaId, path }`. En cualquier fallo, actualizar el borrador creado a `fallida` con `error_codigo` sin exponer el error interno.

- [ ] **Step 5: Actualizar Expo.**

Cambiar `generarRespuestaAbyRemota` por `generarPropuestaEstudioRemota`, validar `propuestaId` y `path`, y conservar las respuestas si falla la red para permitir reintento.

- [ ] **Step 6: Verificar.**

Run: `npm test -- src/modulos/aby/servicios/aby.servicio.test.ts && npm run typecheck`

Expected: PASS. Ejecutar además `deno check supabase/functions/generar-sendero-aby/index.ts` cuando Supabase CLI esté disponible.

### Task 3: Confirmar una propuesta con el esquema existente

**Files:**
- Create: `supabase/functions/aceptar-propuesta-aby/index.ts`
- Create: `supabase/functions/aceptar-propuesta-aby/README.md`
- Create: `supabase/functions/aceptar-propuesta-aby/construirSenderoDesdePropuesta.ts`
- Create: `supabase/functions/aceptar-propuesta-aby/construirSenderoDesdePropuesta.test.ts`
- Modify: `src/modulos/aby/servicios/aby.servicio.ts`

**Interfaces:**
- Consumes `{ propuestaId: string }` autenticado y el `PathEstudio` almacenado.
- Produces `{ senderoId: string }` solo después de activar sendero y sección.

- [ ] **Step 1: Escribir la prueba fallida de la jerarquía de inserción.**

```ts
it('construye meta, sendero, sección, seis nodos, conexiones y cofre', async () => {
  const resultado = await construirSenderoDesdePropuesta(clienteFalso, propuestaValida);
  expect(resultado.operaciones).toEqual([
    'meta', 'sendero', 'seccion', 'nodos', 'conexiones', 'cofre', 'activar-seccion', 'activar-sendero', 'aceptar-propuesta',
  ]);
});
```

- [ ] **Step 2: Ejecutar la prueba.**

Run: `deno test supabase/functions/aceptar-propuesta-aby/construirSenderoDesdePropuesta.test.ts`

Expected: FAIL porque `construirSenderoDesdePropuesta` no existe.

- [ ] **Step 3: Implementar la compensación segura.**

La función debe:

1. Autenticar al usuario con su JWT.
2. Leer `aby_propuestas` propia con `estado = 'lista'` y no expirada.
3. Cambiar condicionalmente el estado a `generando`; si no devuelve fila, responder conflicto.
4. Insertar meta semilla, sendero `borrador`, sección `borrador`, seis nodos, cinco conexiones y cofre.
5. Actualizar sección a `activo`, sendero a `activo` y propuesta a `aceptada` con `aceptada_at`.
6. Si cualquier paso falla, borrar la meta creada para cascada de contenido y marcar propuesta como `fallida`.

No insertar el cofre como recompensa reclamable ni modificar gemas.

- [ ] **Step 4: Exponer el cliente.**

```ts
export async function aceptarPropuestaAby(propuestaId: string): Promise<{ senderoId: string }> {
  const { data, error } = await obtenerClienteSupabase().functions.invoke('aceptar-propuesta-aby', {
    body: { propuestaId },
  });
  if (error) throw new Error('No pudimos crear tu sendero. Inténtalo de nuevo.');
  return z.object({ senderoId: z.string().uuid() }).parse(data);
}
```

- [ ] **Step 5: Verificar manualmente.**

Crear una propuesta válida, confirmarla una vez y comprobar que existe una meta, un sendero activo, una sección activa, seis nodos, cinco conexiones y un cofre. Repetir la confirmación y comprobar que no crea un segundo sendero.

### Task 4: Convertir Aby en el creador MVP

**Files:**
- Modify: `src/modulos/aby/pantallas/AgenteAbyPantalla.tsx`
- Modify: `src/modulos/aby/componentes/IntencionesEstudioAby.tsx`
- Modify: `src/modulos/aby/componentes/PropuestaSenderoAby.tsx`
- Create: `src/modulos/aby/estado/creacionSenderoMvp.reducer.test.ts`

**Interfaces:**
- Consumes `generarPropuestaEstudioRemota()` y `aceptarPropuestaAby()`.
- Produces navegación a `/senderos/[id]` después de aceptar.

- [ ] **Step 1: Escribir la prueba fallida del flujo de intención.**

```ts
it('solo permite aprender y examen en el MVP', () => {
  expect(intencionesMvp.map((item) => item.id)).toEqual(['aprender', 'examen']);
});
```

- [ ] **Step 2: Ejecutar la prueba.**

Run: `npm test -- src/modulos/aby/estado/creacionSenderoMvp.reducer.test.ts`

Expected: FAIL porque el catálogo MVP no existe.

- [ ] **Step 3: Reducir la UI a dos entradas.**

`Aprender algo` solicita objetivo, nivel y minutos diarios. `Preparar examen` reutiliza `CreadorExamenAby`, corrigiendo fechas para que sean relativas al día actual. Retirar del flujo las tarjetas de hábito, rutina y descubrimiento; no borrar sus componentes todavía.

- [ ] **Step 4: Conectar confirmación.**

El botón `Crear mi sendero` debe deshabilitarse mientras acepta, mostrar error recuperable y, si tiene éxito, ejecutar `router.replace({ pathname: '/senderos/[id]', params: { id: senderoId } })`.

- [ ] **Step 5: Ejecutar pruebas y verificar Android.**

Run: `npm test -- src/modulos/aby && npm run typecheck`

Expected: PASS. En Android: completar ambos flujos, cancelar una propuesta, reintentar un fallo y confirmar que no aparece UI de chat largo.

### Task 5: Leer Senderos reales y eliminar datos mock de la biblioteca

**Files:**
- Modify: `src/modulos/senderos/tipos.ts`
- Modify: `src/modulos/senderos/senderos.servicio.ts`
- Create: `src/modulos/senderos/senderos.servicio.test.ts`
- Modify: `src/modulos/senderos/pantallas/SenderosPantalla.tsx`

**Interfaces:**
- Produces `listarSenderosActivos(): Promise<SenderoResumen[]>` y `obtenerSendero(id): Promise<SenderoDetalle | null>`.

- [ ] **Step 1: Escribir la prueba fallida de mapeo.**

```ts
it('mapea un sendero activo con su sección y seis nodos ordenados', () => {
  expect(mapearSenderoDetalle(filaRemota).nodos.map((nodo) => nodo.orden)).toEqual([1, 2, 3, 4, 5, 6]);
});
```

- [ ] **Step 2: Ejecutar la prueba.**

Run: `npm test -- src/modulos/senderos/senderos.servicio.test.ts`

Expected: FAIL porque `mapearSenderoDetalle` no existe.

- [ ] **Step 3: Implementar consultas RLS propias.**

Usar `senderos.estado = 'activo'`, unión anidada con `metas`, `sendero_niveles`, `sendero_nodos` y `sendero_cofres`. Ordenar por creación descendente para biblioteca y por `numero`, `orden` para detalle. No consultar ni exponer `aby_generation_locks`.

- [ ] **Step 4: Sustituir mocks de Senderos.**

Mantener los árboles, mapa y microinteracciones actuales. El estado vacío muestra `Crea tu primer sendero` y navega al creador. No renderizar categorías, subcategorías, análisis, compartidos ni explorar en el MVP.

- [ ] **Step 5: Verificar.**

Run: `npm test -- src/modulos/senderos/senderos.servicio.test.ts && npm run typecheck`

Expected: PASS.

### Task 6: Conectar el mapa y la pantalla de lección a datos persistidos

**Files:**
- Modify: `src/modulos/senderos/pantallas/DetalleSenderoPantalla.tsx`
- Modify: `src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx`
- Modify: `app/senderos/[id].tsx`
- Modify: `app/senderos/leccion.tsx`
- Modify: `src/modulos/senderos/componentes/lecciones/LessonRunner.tsx`
- Create: `src/modulos/senderos/componentes/lecciones/LessonRunner.test.tsx`

**Interfaces:**
- Consumes `SenderoDetalle` y `LeccionPack` validados desde Task 5.
- Produces el tipo `ResultadoLeccion = { aprobado: boolean; duracionMs: number; respuestas: readonly { correcto: boolean | null; pasoId: string }[] }` al finalizar una lección.

- [ ] **Step 1: Escribir la prueba fallida del resultado de lección.**

```tsx
it('termina sin vidas y devuelve un resultado aprobado', async () => {
  const terminar = vi.fn();
  render(<LessonRunner color="#377DDE" leccion={leccionValida} onTerminar={terminar} />);
  await completarWidgetsCorrectamente();
  expect(terminar).toHaveBeenCalledWith(expect.objectContaining({ aprobado: true }));
});
```

- [ ] **Step 2: Ejecutar la prueba.**

Run: `npm test -- src/modulos/senderos/componentes/lecciones/LessonRunner.test.tsx`

Expected: FAIL porque `onTerminar` actualmente recibe un booleano y el runner usa vidas.

- [ ] **Step 3: Eliminar vidas y mocks.**

Eliminar `vidas`, corazones y cualquier cierre por respuestas incorrectas. Cada widget reporta resultado; el runner acumula respuestas, muestra feedback y permite terminar la lección. La ruta `app/senderos/leccion.tsx` recibe `senderoId` y `nodoId`, carga `lesson_pack` del nodo y rechaza una lección inválida con retorno seguro.

- [ ] **Step 4: Usar el mapa real.**

`ContenedorMapaSenderos` recibe nodos remotos en vez de `obtenerNodosMapaMock`. El primer nodo no completado localmente es actual; los posteriores son bloqueados. El tap abre solo el nodo actual o completado.

- [ ] **Step 5: Verificar.**

Run: `npm test -- src/modulos/senderos/componentes/lecciones/LessonRunner.test.tsx && npm run typecheck`

Expected: PASS. Manual Android: abrir un sendero creado, completar lección, volver y comprobar que el siguiente nodo queda disponible en memoria.

### Task 7: Persistir progreso local y construir Hoy

**Files:**
- Create: `src/modulos/senderos/estado/progresoLocalSendero.ts`
- Create: `src/modulos/senderos/estado/progresoLocalSendero.test.ts`
- Modify: `src/modulos/inicio/pantallas/InicioPantalla.tsx`
- Modify: `app/(principal)/inicio.tsx`

**Interfaces:**
- Produces `cargarProgresoLocal(senderoId)`, `completarNodoLocal(senderoId, nodoId)`, `completarNodoLocalEnMemoria(completados, nodoId)` y `obtenerNodoActual(nodos, progreso)`.

- [ ] **Step 1: Escribir la prueba fallida de desbloqueo.**

```ts
it('desbloquea únicamente el nodo posterior al último completado', () => {
  const progreso = completarNodoLocalEnMemoria(['nodo-1'], 'nodo-1');
  expect(obtenerNodoActual(['nodo-1', 'nodo-2', 'nodo-3'], progreso)).toBe('nodo-2');
});
```

- [ ] **Step 2: Ejecutar la prueba.**

Run: `npm test -- src/modulos/senderos/estado/progresoLocalSendero.test.ts`

Expected: FAIL porque no existe el módulo.

- [ ] **Step 3: Implementar almacenamiento local versionado.**

Usar una sola clave `lestinaty:progreso-senderos:v1`. Guardar por `senderoId` una lista ordenada y sin duplicados de nodos completados. Si cambia la lista remota de nodos, descartar IDs desconocidos al cargar.

- [ ] **Step 4: Simplificar Inicio a Hoy.**

Eliminar `ASIGNATURAS` mock. Consultar senderos activos, resolver el primero con nodo actual y mostrar título, siguiente nodo, tiempo estimado y `Continuar`. Si no hay senderos, mostrar una acción única hacia Crear.

- [ ] **Step 5: Verificar.**

Run: `npm test -- src/modulos/senderos/estado/progresoLocalSendero.test.ts && npm run typecheck`

Expected: PASS. Cerrar y abrir la app en Android; el nodo desbloqueado debe conservarse en el mismo dispositivo.

### Task 8: Reducir la navegación al MVP

**Files:**
- Modify: `app/(principal)/_layout.tsx`
- Modify: `src/nucleo/navegacion/BarraTabs.tsx`
- Create: `src/nucleo/navegacion/tabsMvp.config.ts`
- Create: `src/nucleo/navegacion/tabsMvp.config.test.ts`
- Create: `app/(principal)/tu.tsx`

**Interfaces:**
- Produces tabs `Hoy`, `Senderos` y `Tú`, más una acción central `Crear` que abre Aby como ruta modal o pantalla completa.

- [ ] **Step 1: Escribir una prueba de configuración de tabs.**

```ts
it('expone Hoy, Senderos y Tú como destinos persistentes', () => {
  expect(TABS_MVP.map((tab) => tab.id)).toEqual(['inicio', 'senderos', 'tu']);
});
```

- [ ] **Step 2: Ejecutar la prueba.**

Run: `npm test -- src/nucleo/navegacion/tabsMvp.config.test.ts`

Expected: FAIL porque `TABS_MVP` no existe.

- [ ] **Step 3: Implementar configuración MVP.**

Extraer configuración pura de tabs. Mantener el heptágono central, pero usarlo como acción de creación que abre Aby y no como biblioteca de tienda. Reutilizar la ruta de configuración existente para `Tú`; no duplicar otra pantalla.

- [ ] **Step 4: Verificar navegación.**

Run: `npm test -- src/nucleo/navegacion/tabsMvp.config.test.ts && npm run typecheck`

Expected: PASS. Manual Android: abrir Crear, cancelar, cambiar entre las tres tabs y comprobar que no aparece una tab muerta.

## Criterio de Salida de Este Plan

Una persona autenticada puede elegir `Aprender algo` o `Preparar examen`, recibir una propuesta con cinco lecciones y una evaluación, confirmarla, verla como Sendero activo, abrir el primer nodo, completar una lección SDUI y desbloquear el siguiente nodo en el mismo dispositivo.

No se declara progreso sincronizado ni analítica pedagógica hasta implementar la migración de progreso y la aceptación SQL transaccional.
