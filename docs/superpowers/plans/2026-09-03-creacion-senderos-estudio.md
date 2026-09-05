# Creación de Senderos de Estudio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar la entrada de categorías generales de Aby por cuatro intenciones de estudio y entregar un creador visual cerrado de `Tengo un examen` que termina en una propuesta de sendero estructurada.

**Architecture:** Un catálogo puro describe las cuatro intenciones y alimenta un componente de tarjetas glass. Al elegir examen, un creador guiado propio controla cinco pasos, sin historial ni burbujas de chat. El reducer y contrato de Aby almacenan respuestas tipadas; la Edge Function usa Gemini solamente después del quinto paso para devolver una propuesta validada.

**Tech Stack:** Expo Router 57, React Native 0.86, TypeScript, Vitest 4, Zod 4, Supabase Edge Functions/Deno, Gemini 2.5 Flash, `lucide-react-native`.

**Spec:** `docs/superpowers/specs/2026-09-03-flujo-creacion-estudio-design.md`

## Global Constraints

- Conservar `FondoBiomaAby`, árboles, aurora, mandala y animaciones progresivas actuales.
- No añadir una quinta tarjeta de técnicas de estudio; las técnicas son recomendaciones dentro de senderos.
- La pantalla inicial usa cuatro tarjetas `RecuadroGlass` en cuadrícula 2 x 2, no tabs.
- El color inicial es azul académico; los estados seleccionados usan azul, verde, amarillo y rojo coral.
- No descargar, almacenar ni reproducir libros no autorizados; ISBN y portada solo aportan metadata en entregas futuras.
- La clave de Gemini permanece exclusivamente en la Edge Function.
- La carga de PDF/OCR, lookup ISBN, búsqueda web, diagnóstico adaptativo y persistencia de senderos quedan fuera de este plan.
- Mantener compatibilidad Android, iOS y web; usar `Animated` con `useNativeDriver: true` solo para `opacity` y `transform`.

---

## File Structure

- Create: `src/modulos/aby/datos/intencionesEstudioAby.ts` -- catálogo de intenciones, colores, copy, iconos y placeholders.
- Create: `src/modulos/aby/datos/intencionesEstudioAby.test.ts` -- contrato del catálogo puro.
- Create: `src/modulos/aby/componentes/IntencionesEstudioAby.tsx` -- cuadrícula glass y microinteracción de selección.
- Modify: `src/modulos/aby/componentes/TituloCrearAby.tsx` -- título y subtítulo de estudio conservando mandala y entradas animadas.
- Modify: `src/modulos/aby/componentes/EntradaAby.tsx` -- botón negro sin intención y color de intención al seleccionarla.
- Modify: `src/modulos/aby/contrato/aby.contrato.ts` -- configuración, preguntas y propuesta de estudio validadas con Zod.
- Modify: `src/modulos/aby/contrato/aby.contrato.test.ts` -- validación de configuración, preguntas de texto y propuesta de examen.
- Modify: `src/modulos/aby/estado/abyConversacion.reducer.ts` -- acciones y progreso del flujo de examen.
- Modify: `src/modulos/aby/estado/abyConversacion.reducer.test.ts` -- transiciones, edición e invalidación de datos dependientes.
- Modify: `src/modulos/aby/datos/propuestaAby.mock.ts` -- flujo local determinista para las cinco preguntas de examen y propuesta de estudio.
- Create: `src/modulos/aby/datos/propuestaAby.mock.test.ts` -- orden y contenido del flujo local.
- Modify: `src/modulos/aby/componentes/PreguntaVisualAby.tsx` -- soporte para pregunta de texto sin inventar botones visuales.
- Modify: `src/modulos/aby/pantallas/AgenteAbyPantalla.tsx` -- composición de entrada, tarjetas, respuestas tipadas, fallback y reintento.
- Modify: `src/modulos/aby/servicios/aby.servicio.ts` -- solicitud remota de estudio con validación compartida.
- Modify: `supabase/functions/generar-sendero-aby/index.ts` -- schema y prompt de examen equivalentes al contrato cliente.
- Modify: `supabase/functions/generar-sendero-aby/README.md` -- payload, límites y despliegue actualizados.

## Data Interfaces

```ts
export const INTENCIONES_ESTUDIO_ABY = ['examen', 'materia', 'habito-estudio', 'rutina-estudio'] as const;
export type IntencionEstudioAbyId = typeof INTENCIONES_ESTUDIO_ABY[number];

export type ConfiguracionEstudioAby = {
  alcance: string;
  disponibilidadSemanal: '2' | '4' | '6' | '8' | null;
  fechaExamen: string | null;
  fuente: string;
  intencion: IntencionEstudioAbyId | null;
  nivelInicial: 'inicio' | 'basico' | 'intermedio' | null;
  objetivo: string;
};

export type PreguntaIdAby =
  | 'fecha-examen'
  | 'alcance'
  | 'fuente'
  | 'disponibilidad-semanal'
  | 'nivel-inicial';

export type PreguntaVisualAby = {
  id: PreguntaIdAby;
  opciones: readonly { etiqueta: string; valor: string }[];
  placeholder?: string;
  tipo: 'cards' | 'chips' | 'texto';
  titulo: string;
};
```

`fechaExamen` se guarda como `YYYY-MM-DD`. La UI acepta `DD/MM/AAAA` y la normaliza antes de despachar la acción; no se envía a Gemini una fecha ambigua.

### Task 1: Catálogo de intenciones y tarjetas glass

**Files:**
- Create: `src/modulos/aby/datos/intencionesEstudioAby.ts`
- Create: `src/modulos/aby/datos/intencionesEstudioAby.test.ts`
- Create: `src/modulos/aby/componentes/IntencionesEstudioAby.tsx`
- Modify: `src/modulos/aby/componentes/TituloCrearAby.tsx`
- Modify: `src/modulos/aby/componentes/EntradaAby.tsx`

**Interfaces:**
- Produces: `IntencionEstudioAbyId`, `intencionesEstudioAby`, `colorIntencionEstudioAby()` and `<IntencionesEstudioAby />`.
- Consumes: `RecuadroGlass`, `Texto`, `hapticSeguro`, Lucide icons and `MandalaAby`.

- [ ] **Step 1: Write the failing catalog test**

```ts
import { describe, expect, it } from 'vitest';
import { colorIntencionEstudioAby, intencionesEstudioAby } from './intencionesEstudioAby';

describe('intencionesEstudioAby', () => {
  it('expone las cuatro intenciones universitarias con colores y ejemplos únicos', () => {
    expect(intencionesEstudioAby.map((item) => item.id)).toEqual([
      'examen', 'materia', 'habito-estudio', 'rutina-estudio',
    ]);
    expect(new Set(intencionesEstudioAby.map((item) => item.color))).toHaveLength(4);
    expect(new Set(intencionesEstudioAby.map((item) => item.placeholder))).toHaveLength(4);
  });

  it('usa azul académico antes de seleccionar una intención', () => {
    expect(colorIntencionEstudioAby(null)).toBe('#377DDE');
    expect(colorIntencionEstudioAby('examen')).toBe('#377DDE');
  });
});
```

- [ ] **Step 2: Run the test and verify it fails because the module does not exist**

Run: `npm test -- src/modulos/aby/datos/intencionesEstudioAby.test.ts`

Expected: FAIL with a module-not-found error for `./intencionesEstudioAby`.

- [ ] **Step 3: Implement the smallest catalog**

```ts
export const INTENCIONES_ESTUDIO_ABY = ['examen', 'materia', 'habito-estudio', 'rutina-estudio'] as const;
export type IntencionEstudioAbyId = typeof INTENCIONES_ESTUDIO_ABY[number];

export const intencionesEstudioAby = [
  { color: '#377DDE', descripcion: 'Prepárate con un plan hasta tu fecha.', id: 'examen', icono: 'archivo', placeholder: 'Ej. Parcial de anatomía el 18 de octubre', titulo: 'Tengo un examen' },
  { color: '#3A9B68', descripcion: 'Construye bases tema por tema.', id: 'materia', icono: 'birrete', placeholder: 'Ej. Quiero dominar cálculo diferencial', titulo: 'Dominar una materia' },
  { color: '#D5A119', descripcion: 'Estudia con constancia cada semana.', id: 'habito-estudio', icono: 'fuego', placeholder: 'Ej. Quiero estudiar inglés sin dejarlo', titulo: 'Hábito de estudio' },
  { color: '#D85B54', descripcion: 'Ordena sesiones, prioridades y descansos.', id: 'rutina-estudio', icono: 'calendario', placeholder: 'Ej. Organiza mi semana de estudio', titulo: 'Organizar mi rutina' },
] as const;

export function colorIntencionEstudioAby(intencion: IntencionEstudioAbyId | null) {
  return intencionesEstudioAby.find((item) => item.id === intencion)?.color ?? '#377DDE';
}
```

- [ ] **Step 4: Implement `<IntencionesEstudioAby />` and adapt title/input styling**

Use a two-column `View` with each `Pressable` wrapping `RecuadroGlass`. Render `FileText`, `GraduationCap`, `Flame` and `CalendarClock`; call `hapticSeguro('seleccion')` before `onSeleccionar(id)`. Use an `Animated.Value` per card for `scale` and `opacity`; selection changes only `backgroundColor`, `borderColor`, shadow and icon color. Do not animate layout height.

Update `TituloCrearAby` to render exactly:

```tsx
<Texto>APRUEBA TUS EXÁMENES</Texto>
<Texto>CON UN PLAN HECHO PARA TI.</Texto>
<Texto>Cuéntale a Lestinaty qué necesitas estudiar.</Texto>
```

Keep `MandalaAby` above the heading and preserve the staggered `translateX`/`opacity` entrance. Extend `EntradaAby` with `colorEnviar?: string` and default it to `'#141414'`; its caller supplies the selected intent color.

- [ ] **Step 5: Run the catalog test and typecheck**

Run: `npm test -- src/modulos/aby/datos/intencionesEstudioAby.test.ts`

Expected: PASS.

Run: `npm run typecheck`

Expected: PASS with no TypeScript diagnostics.

- [ ] **Step 6: Commit the visual catalog**

```bash
git add src/modulos/aby/datos/intencionesEstudioAby.ts src/modulos/aby/datos/intencionesEstudioAby.test.ts src/modulos/aby/componentes/IntencionesEstudioAby.tsx src/modulos/aby/componentes/TituloCrearAby.tsx src/modulos/aby/componentes/EntradaAby.tsx
git commit -m "feat: add study creation intents"
```

### Task 2: Contrato validado para el flujo de examen

**Files:**
- Modify: `src/modulos/aby/contrato/aby.contrato.ts`
- Modify: `src/modulos/aby/contrato/aby.contrato.test.ts`

**Interfaces:**
- Consumes: `IntencionEstudioAbyId` from `intencionesEstudioAby.ts`.
- Produces: `ConfiguracionEstudioAby`, `PreguntaIdAby`, `configuracionEstudioAbySchema`, `validarRespuestaAby` and `validarPropuestaSenderoAby`.

- [ ] **Step 1: Add a failing contract test for a complete exam proposal**

```ts
it('acepta una propuesta de examen con fecha ISO, alcance y nivel', () => {
  const respuesta = validarRespuestaAby({
    mensaje: 'Tu plan ya está listo.',
    propuesta: {
      categoriaId: 'estudio',
      configuracion: {
        alcance: 'Capítulos 1 al 4', disponibilidadSemanal: '4', fechaExamen: '2026-10-18',
        fuente: 'Índice de Anatomía Humana', intencion: 'examen', nivelInicial: 'basico',
        objetivo: 'Prepararme para el parcial de Anatomía',
      },
      descripcion: 'Un repaso progresivo con práctica y recuperación activa.',
      nodos: [nodoValido('bases'), nodoValido('practica'), nodoValido('repaso')],
      subcategoriaId: 'anatomia', titulo: 'Parcial de Anatomía',
    },
    tipo: 'propuesta',
  });
  expect(respuesta.tipo).toBe('propuesta');
});
```

Define `nodoValido(id)` in the test file with one valid `checklist-asistida` widget, matching the current contract test fixtures.

- [ ] **Step 2: Run the contract test and verify it fails for the missing study shape**

Run: `npm test -- src/modulos/aby/contrato/aby.contrato.test.ts`

Expected: FAIL because the current configuration expects `diasSemana`, `duracionMinutos` and `tipo`.

- [ ] **Step 3: Replace the generic configuration schema with the study schema**

Implement the schema below and make `PropuestaSenderoAby.configuracion` use it:

```ts
export const configuracionEstudioAbySchema = z.object({
  alcance: z.string().trim().max(500),
  disponibilidadSemanal: z.enum(['2', '4', '6', '8']).nullable(),
  fechaExamen: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  fuente: z.string().trim().max(500),
  intencion: z.enum(INTENCIONES_ESTUDIO_ABY).nullable(),
  nivelInicial: z.enum(['inicio', 'basico', 'intermedio']).nullable(),
  objetivo: z.string().trim().min(1).max(240),
});
```

Change `PreguntaVisualAby.tipo` to `z.enum(['cards', 'chips', 'texto'])`, restrict IDs to `PreguntaIdAby`, and allow `placeholder` only as a trimmed string of at most 120 characters. Preserve action-pack validation unchanged.

- [ ] **Step 4: Add the invalid-date edge case and run the contract tests**

```ts
it('rechaza una fecha de examen ambigua', () => {
  expect(() => configuracionEstudioAbySchema.parse({
    alcance: '', disponibilidadSemanal: null, fechaExamen: '18/10/2026', fuente: '',
    intencion: 'examen', nivelInicial: null, objetivo: 'Anatomía',
  })).toThrow();
});
```

Run: `npm test -- src/modulos/aby/contrato/aby.contrato.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the study contract**

```bash
git add src/modulos/aby/contrato/aby.contrato.ts src/modulos/aby/contrato/aby.contrato.test.ts
git commit -m "feat: define validated study conversation contract"
```

### Task 3: Reducer and local deterministic exam flow

**Files:**
- Modify: `src/modulos/aby/estado/abyConversacion.reducer.ts`
- Modify: `src/modulos/aby/estado/abyConversacion.reducer.test.ts`
- Modify: `src/modulos/aby/datos/propuestaAby.mock.ts`
- Create: `src/modulos/aby/datos/propuestaAby.mock.test.ts`

**Interfaces:**
- Consumes: `ConfiguracionEstudioAby`, `PreguntaIdAby` and `IntencionEstudioAbyId`.
- Produces: reducer actions `definir-intencion`, `definir-objetivo`, `definir-fecha-examen`, `definir-alcance`, `definir-fuente`, `definir-disponibilidad`, `definir-nivel` and `editar`.

- [ ] **Step 1: Write the failing reducer test for dependent answers**

```ts
it('borra el alcance, fuente, disponibilidad y nivel al editar la fecha del examen', () => {
  const configurado = [
    { tipo: 'definir-intencion' as const, valor: 'examen' as const },
    { tipo: 'definir-objetivo' as const, objetivo: 'Parcial de Anatomía' },
    { tipo: 'definir-fecha-examen' as const, fechaExamen: '2026-10-18' },
    { tipo: 'definir-alcance' as const, alcance: 'Capítulos 1 al 4' },
    { tipo: 'definir-fuente' as const, fuente: 'Índice del libro' },
    { tipo: 'definir-disponibilidad' as const, disponibilidadSemanal: '4' as const },
    { tipo: 'definir-nivel' as const, nivelInicial: 'basico' as const },
  ].reduce(reducirConversacionAby, estadoInicialConversacionAby);

  expect(reducirConversacionAby(configurado, { preguntaId: 'fecha-examen', tipo: 'editar' }).configuracion).toMatchObject({
    alcance: '', disponibilidadSemanal: null, fechaExamen: null, fuente: '', nivelInicial: null,
    intencion: 'examen', objetivo: 'Parcial de Anatomía',
  });
});
```

- [ ] **Step 2: Run the reducer test and verify it fails because the action does not exist**

Run: `npm test -- src/modulos/aby/estado/abyConversacion.reducer.test.ts`

Expected: FAIL with a TypeScript or reducer assertion failure for `definir-intencion`.

- [ ] **Step 3: Implement study state and invalidation rules**

Use this initial configuration:

```ts
export const configuracionInicialAby: ConfiguracionEstudioAby = {
  alcance: '', disponibilidadSemanal: null, fechaExamen: null, fuente: '',
  intencion: null, nivelInicial: null, objetivo: '',
};
```

`contarPasos` must count only data required by `intencion === 'examen'`: intent,
objective, date, scope, availability and level. `fuente` remains optional. Editing
the date clears all answers that follow it; editing scope clears source,
availability and level; editing availability clears level. Editing the source
does not clear unrelated answers.

- [ ] **Step 4: Add a failing mock-flow test**

```ts
it('pregunta examen en el orden fecha, alcance, fuente, disponibilidad y nivel', () => {
  const base = { ...configuracionInicialAby, intencion: 'examen', objetivo: 'Parcial de Anatomía' };
  expect(obtenerSiguienteRespuestaMock(base).pregunta?.id).toBe('fecha-examen');
  expect(obtenerSiguienteRespuestaMock({ ...base, fechaExamen: '2026-10-18' }).pregunta?.id).toBe('alcance');
  expect(obtenerSiguienteRespuestaMock({ ...base, fechaExamen: '2026-10-18', alcance: '1 al 4' }).pregunta?.id).toBe('fuente');
});
```

- [ ] **Step 5: Implement local questions and a valid study proposal**

Define text questions for `fecha-examen`, `alcance` and `fuente`; define chips for
availability (`2`, `4`, `6`, `8`) and cards for level (`inicio`, `basico`,
`intermedio`). When required data is complete, return a three-node `estudio`
proposal with original node titles and valid action packs:

```ts
{ id: 'comprender-base', titulo: 'Comprende la base', ... }
{ id: 'practica-activa', titulo: 'Practica sin apuntes', ... }
{ id: 'repaso-final', titulo: 'Repaso antes del examen', ... }
```

For `materia`, `habito-estudio` and `rutina-estudio`, return only a first textual
question that states the selected intention and asks for its objective. Do not
reuse the five-question exam sequence for them.

- [ ] **Step 6: Run reducer and mock tests**

Run: `npm test -- src/modulos/aby/estado/abyConversacion.reducer.test.ts src/modulos/aby/datos/propuestaAby.mock.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit the local flow**

```bash
git add src/modulos/aby/estado/abyConversacion.reducer.ts src/modulos/aby/estado/abyConversacion.reducer.test.ts src/modulos/aby/datos/propuestaAby.mock.ts src/modulos/aby/datos/propuestaAby.mock.test.ts
git commit -m "feat: add local exam creation flow"
```

### Task 4: Compose the mobile and web UI around study intent

**Files:**
- Modify: `src/modulos/aby/componentes/PreguntaVisualAby.tsx`
- Modify: `src/modulos/aby/pantallas/AgenteAbyPantalla.tsx`

**Interfaces:**
- Consumes: `IntencionesEstudioAby`, `colorIntencionEstudioAby`, study reducer actions, `PreguntaVisualAby` with `tipo: 'texto'`.
- Produces: a screen where selection sets an intent, typed responses fill the pending field, and selected cards retain the current background/trees.

- [ ] **Step 1: Write a failing pure helper test for date normalization**

Create `src/modulos/aby/pantallas/fechaEstudioAby.ts` and its test:

```ts
import { expect, it } from 'vitest';
import { normalizarFechaEstudioAby } from './fechaEstudioAby';

it('normaliza una fecha DD/MM/AAAA a ISO', () => {
  expect(normalizarFechaEstudioAby('18/10/2026')).toBe('2026-10-18');
});

it('rechaza una fecha de calendario inexistente', () => {
  expect(normalizarFechaEstudioAby('31/02/2026')).toBeNull();
});
```

- [ ] **Step 2: Run the test and verify it fails because the helper does not exist**

Run: `npm test -- src/modulos/aby/pantallas/fechaEstudioAby.test.ts`

Expected: FAIL with a module-not-found error for `./fechaEstudioAby`.

- [ ] **Step 3: Implement `normalizarFechaEstudioAby`**

Accept only `/^(\d{2})\/(\d{2})\/(\d{4})$/`, construct the date using
`Date.UTC(year, month - 1, day)`, compare all UTC parts to reject overflow, and
return `YYYY-MM-DD`; otherwise return `null`.

- [ ] **Step 4: Adapt `PreguntaVisualAby` and `AgenteAbyPantalla`**

In `PreguntaVisualAby`, render title and lateral tree for `tipo: 'texto'`, but no
empty option container. In `AgenteAbyPantalla`:

1. Replace `CategoriasRapidasAby` with `IntencionesEstudioAby`.
2. Store the selected `intencion` in the reducer and use
   `colorIntencionEstudioAby(estado.configuracion.intencion)` for mandala,
   selected card and send button.
3. Keep `FondoBiomaAby` with `categoriaActiva="estudio"` while an intent is
   selected, so existing study trees remain visible.
4. Make `agregarTexto` inspect the pending question ID. It dispatches objective,
   normalizes date before `definir-fecha-examen`, and fills scope/source as plain
   trimmed text.
5. When date normalization returns `null`, keep the typed value visible and show
   `Usa el formato DD/MM/AAAA, por ejemplo 18/10/2026.` below the input; do not
   call the remote service.
6. For options, dispatch availability or level from their exact value.
7. Reset `respuestaRemota` whenever configuration changes and include the full
   configuration in the remote request key.
8. Preserve the discovery route behind `No sé por dónde empezar`; it must clear
   selected intent only when the user explicitly enters discovery.
9. Add an inline retry control when remote generation fails. Keep local mock
   proposal visible as fallback; never clear answers or send the user back to
   the initial screen.

- [ ] **Step 5: Run the helper and affected suite**

Run: `npm test -- src/modulos/aby/pantallas/fechaEstudioAby.test.ts src/modulos/aby/contrato/aby.contrato.test.ts src/modulos/aby/estado/abyConversacion.reducer.test.ts src/modulos/aby/datos/propuestaAby.mock.test.ts`

Expected: PASS.

- [ ] **Step 6: Run the app-level typecheck**

Run: `npm run typecheck`

Expected: PASS with no diagnostics.

- [ ] **Step 7: Commit the UI flow**

```bash
git add src/modulos/aby/componentes/PreguntaVisualAby.tsx src/modulos/aby/pantallas/AgenteAbyPantalla.tsx src/modulos/aby/pantallas/fechaEstudioAby.ts src/modulos/aby/pantallas/fechaEstudioAby.test.ts
git commit -m "feat: adapt Aby screen for study exams"
```

### Task 5: Send validated study payloads to Gemini

**Files:**
- Modify: `src/modulos/aby/servicios/aby.servicio.ts`
- Modify: `supabase/functions/generar-sendero-aby/index.ts`
- Modify: `supabase/functions/generar-sendero-aby/README.md`

**Interfaces:**
- Consumes: `configuracionEstudioAbySchema`, `validarRespuestaAby`, `SolicitudGeminiAby`.
- Produces: an Edge Function that only accepts valid study payloads and generates safe JSON exam questions/proposals.

- [ ] **Step 1: Write the failing service contract test**

Create `src/modulos/aby/servicios/aby.servicio.test.ts`:

```ts
import { expect, it } from 'vitest';
import { solicitudAby } from './aby.servicio';

it('envía la configuración completa de un examen sin campos genéricos de hábitos', () => {
  const solicitud = solicitudAby({
    alcance: 'Capítulos 1 al 4', disponibilidadSemanal: '4', fechaExamen: '2026-10-18',
    fuente: 'Índice', intencion: 'examen', nivelInicial: 'basico', objetivo: 'Parcial de Anatomía',
  }, []);

  expect(solicitud.configuracion).toMatchObject({ intencion: 'examen', fechaExamen: '2026-10-18' });
  expect(solicitud.configuracion).not.toHaveProperty('diasSemana');
});
```

- [ ] **Step 2: Run the test and verify it fails against the legacy schema**

Run: `npm test -- src/modulos/aby/servicios/aby.servicio.test.ts`

Expected: FAIL because the service still imports the generic configuration schema.

- [ ] **Step 3: Update the app service to use the study contract**

Replace `configuracionConversacionAbySchema` with
`configuracionEstudioAbySchema` in `solicitudSchema`; preserve the twelve-message
history cap and `validarRespuestaAby(data)` after Edge Function invocation.

- [ ] **Step 4: Update the Edge Function schemas and prompt**

Mirror the same Zod configuration fields in
`supabase/functions/generar-sendero-aby/index.ts`. Update the instruction to
include:

```text
La intención actual es de estudio. Para 'examen', pregunta solo el siguiente dato faltante en este orden: fecha ISO, alcance, fuente opcional, disponibilidad semanal y nivel inicial. Cuando fecha, alcance, disponibilidad y nivel estén completos, devuelve una propuesta categoría 'estudio' con 3 a 5 nodos. No afirmes haber leído un libro ni cites fuentes no entregadas. Genera explicaciones y ejercicios originales; nunca reproduzcas texto extenso de material protegido.
```

Set `preguntaSchema.max(8)` to match the client and accept `texto` as type. Keep the lock insertion, authentication, 20-second abort, response parsing and lock cleanup unchanged.

Update the README with the exact request body and state that ISBN/PDF/OCR are not implemented in this function yet.

- [ ] **Step 5: Run client tests and Deno check**

Run: `npm test -- src/modulos/aby/servicios/aby.servicio.test.ts src/modulos/aby/contrato/aby.contrato.test.ts`

Expected: PASS.

Run: `supabase functions serve generar-sendero-aby --no-verify-jwt`

Expected: Function starts locally without schema/import errors. Stop it after confirming startup.

- [ ] **Step 6: Commit remote contract changes**

```bash
git add src/modulos/aby/servicios/aby.servicio.ts src/modulos/aby/servicios/aby.servicio.test.ts supabase/functions/generar-sendero-aby/index.ts supabase/functions/generar-sendero-aby/README.md
git commit -m "feat: generate validated study exam paths"
```

### Task 6: Full verification and device acceptance

**Files:**
- Modify only if verification exposes a defect in the files above.

**Interfaces:**
- Consumes: completed Tasks 1-5.
- Produces: evidence that the refactor is type-safe and behaves correctly in Expo on Android and web.

- [ ] **Step 1: Run all Aby unit tests**

Run: `npm test -- src/modulos/aby`

Expected: PASS with no test failures.

- [ ] **Step 2: Run full static verification**

Run: `npm run typecheck`

Expected: PASS with no TypeScript diagnostics.

- [ ] **Step 3: Manually verify Android in Expo Go**

Check all of the following:

1. Central tab displays mandala, existing trees, title, subtitle, input and four glass cards.
2. Each card emits haptic feedback where available and applies only its own accent.
3. `Tengo un examen` asks date, scope, optional source, availability and level in that exact order.
4. Invalid date displays the specified helper and preserves the input.
5. The generated proposal shows three study nodes and `Crear mi sendero` action.
6. Opening discovery hides the cards without losing animation stability; returning restores them.
7. Keyboard never covers the active input or current question.
8. Tapping selection repeatedly does not remove Lucide icons or flash the cards.

- [ ] **Step 4: Manually verify web**

Run: `npm run web`

Verify the same flow in a browser at mobile and desktop widths, including keyboard behavior, card grid wrapping and focus order.

## Spec Coverage Review

- Four colored glass intents, updated copy, retained mandala/aurora/trees: Tasks 1 and 4.
- Five progressive study data points and deterministic exam order: Tasks 2 and 3.
- Specific non-exam intents without pretending they are exam flows: Task 3 and Task 4.
- Validated client/server contract and safe Gemini instruction: Tasks 2 and 5.
- Date parsing, remote fallback and retry behavior: Task 4.
- Copyright boundary in generation behavior: Task 5.
- Android and web validation: Task 6.

## Self-Review

- No unresolved placeholders or deferred implementation steps exist inside a task.
- All referenced types are defined in the Data Interfaces section or produced by an earlier task.
- The plan deliberately excludes PDF/OCR, ISBN lookup, web grounding, diagnosis and persistence, as required by the approved scope.
