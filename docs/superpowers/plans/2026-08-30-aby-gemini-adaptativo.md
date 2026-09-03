# Aby Gemini Adaptativo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Conectar Aby con Gemini para realizar una entrevista adaptativa dentro de las siete categorias y devolver propuestas temporales de senderos que la persona confirma antes de persistir.

**Architecture:** Expo conserva todo el renderizado y la validacion de UI; solo llama a `generar-sendero-aby` en Supabase. La Edge Function autentica a la persona, limita una generacion por usuario, llama a Gemini con JSON estructurado y valida la respuesta antes de devolver un turno de pregunta o una propuesta. El cliente usa un reducer para conservar historial, respuestas confirmadas, carga y propuesta temporal.

**Tech Stack:** Expo Router, React Native Animated, TypeScript, Zod, Zustand, Supabase Edge Functions, Gemini Generate Content REST API.

**Spec:** `docs/superpowers/specs/2026-08-30-agente-aby-design.md`

## Global Constraints

- Aby solo clasifica en `rutinas`, `salud`, `tareas`, `habitos`, `relaciones`, `finanzas` y `estudio`.
- `GEMINI_API_KEY` se configura exclusivamente como secreto de Supabase; nunca se agrega a Expo, `app.json`, `EXPO_PUBLIC_*` ni `src/`.
- Gemini responde JSON; no devuelve JSX, estilos, rutas arbitrarias ni widgets fuera de `IDS_WIDGET_ACCION`.
- Toda propuesta tiene 3 a 5 nodos y cada `ActionPack` contiene exactamente un widget principal y hasta dos de apoyo.
- La propuesta es temporal hasta `Sí, crear sendero`; no se crean filas persistentes en esta entrega.
- En Android e iOS, cada botón conserva `accessibilityRole`, `accessibilityState` y `hapticSeguro`.
- Cada tarea termina con su test focalizado, `npm run typecheck` y `git diff --check`.

---

### Task 1: Contrato de turnos adaptativos

**Files:**
- Modify: `src/modulos/aby/contrato/aby.contrato.ts`
- Modify: `src/modulos/aby/estado/abyConversacion.reducer.ts`
- Modify: `src/modulos/aby/estado/abyConversacion.reducer.test.ts`
- Create: `src/modulos/aby/contrato/aby.contrato.test.ts`

**Interfaces:**
- Produces `PreguntaVisualAby` con `id: string`, `tipo: 'cards' | 'chips' | 'dias'`, `titulo` y opciones limitadas.
- Produces `RespuestaAgenteAby` discriminada: `{ tipo: 'pregunta'; mensaje; pregunta }` o `{ tipo: 'propuesta'; mensaje; propuesta }`.
- Produces `SolicitudGeminiAby` con historial maximo de 12 mensajes y configuracion validada.
- Produces estado local con `cargando`, `propuestaTemporal` y acciones `recibir-turno`, `descartar-propuesta`, `confirmar-propuesta` y `reiniciar`.

- [ ] **Step 1: Escribir pruebas fallidas del contrato de turno**

```ts
it('acepta una pregunta visual segura sin permitir una categoria fuera del catalogo', () => {
  expect(validarRespuestaAby({
    mensaje: '¿Qué dias tienes disponibles?',
    pregunta: { id: 'frecuencia', opciones: [], tipo: 'dias', titulo: 'Elige tus dias' },
    tipo: 'pregunta',
  }).tipo).toBe('pregunta');

  expect(() => validarPropuestaSenderoAby({ ...propuestaValida, categoriaId: 'personalizada' }))
    .toThrow();
});
```

- [ ] **Step 2: Ejecutar la prueba para confirmar el fallo**

Run: `npm test -- --run src/modulos/aby/contrato/aby.contrato.test.ts`

Expected: FAIL porque `validarRespuestaAby` no existe.

- [ ] **Step 3: Implementar schemas y tipos discriminados**

En `aby.contrato.ts`, definir `preguntaVisualAbySchema`, `respuestaAgenteAbySchema` y `validarRespuestaAby(valor)`. Mantener `propuestaSenderoAbySchema` y hacer que `categoriaId` use el enum de las siete categorias. Limitar cada opcion a etiqueta y valor de 80 caracteres; limitar la pregunta a 8 opciones y el titulo a 120 caracteres.

En el reducer, guardar `ultimoTurno: RespuestaAgenteAby | null`, `propuestaTemporal: PropuestaSenderoAby | null` y `cargando: boolean`. `recibir-turno` coloca la propuesta solo si `turno.tipo === 'propuesta'`; `descartar-propuesta` la elimina; `confirmar-propuesta` la conserva como confirmada solo en memoria.

- [ ] **Step 4: Añadir prueba del reducer para propuesta temporal**

```ts
it('no confirma ni persiste una propuesta hasta una accion explicita', () => {
  const conPropuesta = reducirConversacionAby(estadoInicialConversacionAby, {
    tipo: 'recibir-turno',
    turno: propuestaRemotaValida,
  });
  expect(conPropuesta.propuestaTemporal).toBeDefined();
  expect(conPropuesta.propuestaConfirmada).toBeNull();

  expect(reducirConversacionAby(conPropuesta, { tipo: 'confirmar-propuesta' }).propuestaConfirmada)
    .toEqual(propuestaRemotaValida.propuesta);
});
```

- [ ] **Step 5: Verificar contrato y reducer**

Run: `npm test -- --run src/modulos/aby/contrato/aby.contrato.test.ts src/modulos/aby/estado/abyConversacion.reducer.test.ts && npm run typecheck && git diff --check`

Expected: tests y TypeScript pasan; `git diff --check` no reporta cambios nuevos.

### Task 2: Edge Function de Gemini por turno

**Files:**
- Modify: `supabase/functions/generar-sendero-aby/index.ts`
- Modify: `supabase/functions/generar-sendero-aby/README.md`
- Modify: `supabase/migrations/20260830000000_aby_generation_locks.sql`

**Interfaces:**
- Consumes POST autenticado `{ configuracion, historial }`.
- Produces `RespuestaAgenteAby` JSON validada o `{ codigo: 'autenticacion' | 'limite' | 'modelo' | 'validacion'; mensaje }`.
- Uses `GEMINI_API_KEY` only via `Deno.env.get`.

- [ ] **Step 1: Escribir casos de validacion de request como funciones puras**

Extraer de `index.ts` las funciones `validarSolicitudAby(cuerpo)` y `validarRespuestaModeloAby(cuerpo)`. Crear `supabase/functions/generar-sendero-aby/validacion_test.ts` con:

```ts
Deno.test('rechaza historial de trece mensajes', () => {
  const resultado = validarSolicitudAby({ configuracion: configuracionValida, historial: Array.from({ length: 13 }, mensajeValido) });
  assertEquals(resultado.success, false);
});
```

- [ ] **Step 2: Ejecutar la prueba para confirmar el fallo**

Run: `supabase functions serve generar-sendero-aby --no-verify-jwt`

Expected: el test o la importacion falla antes de extraer `validarSolicitudAby`. Si el CLI no esta instalado, documentar el bloqueo y ejecutar la validacion de cliente de Task 1 antes de continuar.

- [ ] **Step 3: Implementar respuesta estructurada completa**

Mantener JWT, lock por usuario y timeout de 20 segundos. Enviar a Gemini `generationConfig.responseMimeType = 'application/json'` y un `responseSchema` REST con dos ramas: pregunta visual segura o propuesta. El prompt del sistema debe incluir:

```text
Eres Aby, guia de Lestinaty. Clasifica exclusivamente en rutinas, salud,
tareas, habitos, relaciones, finanzas o estudio. Haz una sola pregunta que
falte por turno. Si el objetivo es amplio, propon un primer sendero concreto,
no una meta. Devuelve solo JSON conforme al schema.
```

Usar el encabezado `x-goog-api-key` en vez de interpolar la clave en la URL. Validar el texto devuelto con Zod antes de responder al cliente. Eliminar el lock en `finally` incluso cuando Gemini devuelve 4xx, timeout o JSON invalido.

- [ ] **Step 4: Documentar secretos y despliegue**

Actualizar README con:

```bash
supabase secrets set GEMINI_API_KEY=valor-secreto
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=valor-service-role
supabase db push
supabase functions deploy generar-sendero-aby
```

Indicar que `EXPO_PUBLIC_ABY_REMOTO=true` solo habilita el cliente y no contiene secretos.

- [ ] **Step 5: Verificar la funcion**

Run: `supabase functions serve generar-sendero-aby --no-verify-jwt`

Expected: la funcion inicia y un POST invalido devuelve 400 sin filtrar claves.

Run: `rg -n "GEMINI_API_KEY|EXPO_PUBLIC_GEMINI" app src app.json package.json`

Expected: cero referencias a clave Gemini en cliente.

### Task 3: Servicio remoto y fallback visible

**Files:**
- Modify: `src/modulos/aby/servicios/aby.servicio.ts`
- Modify: `src/modulos/aby/servicios/aby.servicio.test.ts`
- Modify: `src/nucleo/configuracion/entorno.ts`

**Interfaces:**
- Produces `generarTurnoAbyRemoto(solicitud): Promise<RespuestaAgenteAby>`.
- Consumes `validarRespuestaAby` y `supabase.functions.invoke('generar-sendero-aby')`.
- Exposes `entorno.abyRemotoHabilitado` only as feature flag.

- [ ] **Step 1: Escribir prueba fallida para validar un turno remoto**

```ts
it('rechaza una respuesta remota que no contiene pregunta ni propuesta', () => {
  expect(() => validarRespuestaAby({ mensaje: 'texto', tipo: 'pregunta' })).toThrow();
});
```

- [ ] **Step 2: Ejecutar la prueba para confirmar el fallo**

Run: `npm test -- --run src/modulos/aby/servicios/aby.servicio.test.ts`

Expected: FAIL hasta que el servicio use el schema discriminado de Task 1.

- [ ] **Step 3: Reemplazar el servicio finalista por servicio de turnos**

`generarTurnoAbyRemoto` valida request, invoca Supabase y valida la respuesta antes de devolverla. Convertir cualquier error de red, 401, 429, timeout o JSON invalido a un error de interfaz corto. No devolver `Error.message` del proveedor a la UI. Mantener el mock solo si `EXPO_PUBLIC_ABY_REMOTO !== 'true'`.

- [ ] **Step 4: Verificar servicio**

Run: `npm test -- --run src/modulos/aby/servicios/aby.servicio.test.ts && npm run typecheck && git diff --check`

Expected: PASS.

### Task 4: Entrevista adaptativa y confirmacion visual

**Files:**
- Modify: `src/modulos/aby/pantallas/AgenteAbyPantalla.tsx`
- Modify: `src/modulos/aby/componentes/PreguntaVisualAby.tsx`
- Modify: `src/modulos/aby/componentes/PropuestaSenderoAby.tsx`
- Modify: `src/modulos/aby/componentes/ResumenSenderoAby.tsx`
- Modify: `src/modulos/aby/componentes/DescubrimientoAby.tsx`

**Interfaces:**
- Consumes `generarTurnoAbyRemoto`, reducer de Task 1 y los mismos componentes visuales.
- Produces turnos una pregunta a la vez, propuesta temporal bajo el mensaje y acciones confirmar, ajustar y empezar de nuevo.

- [ ] **Step 1: Escribir prueba fallida para conversion de respuesta visual a historial**

Extraer `textoRespuestaAby(pregunta, valor)` a `src/modulos/aby/estado/textoRespuestaAby.ts` y crear `textoRespuestaAby.test.ts`:

```ts
it('serializa dias elegidos como una respuesta breve para Gemini', () => {
  expect(textoRespuestaAby(preguntaDias, ['1', '3', '5'])).toBe('L - X - V');
});
```

- [ ] **Step 2: Ejecutar la prueba para confirmar el fallo**

Run: `npm test -- --run src/modulos/aby/estado/textoRespuestaAby.test.ts`

Expected: FAIL porque el serializador no existe.

- [ ] **Step 3: Implementar ciclo de turnos sin doble peticion**

Al enviar texto o elegir una opcion: agregar el mensaje local, marcar carga, llamar una sola vez al servicio y montar el turno validado. Deshabilitar entrada y opciones durante carga. Con feature flag apagado, usar el mock existente; con flag encendido, no mezclar respuesta mock y remota. La seleccion del cuestionario inicial se convierte en contexto y dispara el primer turno remoto.

- [ ] **Step 4: Renderizar propuesta temporal bajo el mensaje de Aby**

`PropuestaSenderoAby` recibe `propuesta` y tres callbacks:

```ts
type Props = {
  propuesta: PropuestaSenderoAby;
  onConfirmar: () => void;
  onAjustar: () => void;
  onEmpezarDeNuevo: () => void;
};
```

Mostrar categoria, subcategoria, titulo, descripcion, frecuencia, duracion y una mini ruta de 3 a 5 nodos. `onConfirmar` usa haptic de confirmacion y solo marca la propuesta como confirmada en memoria; `onAjustar` agrega el mensaje `Quiero ajustar el plan` y pide un nuevo turno; `onEmpezarDeNuevo` limpia reducer, historial, color visual de Aby y vuelve al estado inicial.

- [ ] **Step 5: Verificar el flujo completo**

Run: `npm test -- --run && npm run typecheck && git diff --check`

Expected: suite y TypeScript pasan; sin errores de espacios introducidos.

Manual Expo Go Android: activar `EXPO_PUBLIC_ABY_REMOTO=true`, enviar un objetivo, contestar tres preguntas, ajustar una propuesta, reiniciar, repetir y confirmar. Verificar que una peticion fallida conserva historial, que teclado no cubre la entrada y que el heptagono conserva negro sin categoria y usa el color de la categoria elegida.
