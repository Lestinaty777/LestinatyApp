# Agente Conversacional Aby Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar la pestaña central Tienda por Aby, un constructor conversacional visual que produce propuestas mock de senderos estructurados y seguros.

**Architecture:** La ruta `/(principal)/tienda` se conserva, pero monta `AgenteAbyPantalla` y se presenta como Aby con un heptagono en la barra. Un reducer local puro conserva las cuatro decisiones de creacion y una capa mock las transforma en una propuesta validada por Zod y `ActionPack`; la futura Edge Function de Supabase reutilizara exactamente ese contrato sin exponer la clave de Gemini al cliente.

**Tech Stack:** Expo Router, React Native, React Native Animated, TypeScript, Zod, Zustand existente, expo-haptics, expo-blur, react-native-safe-area-context, Supabase Edge Functions futura.

**Spec:** `docs/superpowers/specs/2026-08-30-agente-aby-design.md`

## Global Constraints

- Mantener `/(principal)/tienda` como ruta temporal; la etiqueta visible de la pestaña es `Aby`.
- `GEMINI_API_KEY` no puede existir en Expo, `app.json`, `EXPO_PUBLIC_*` ni en codigo cliente.
- La primera entrega usa respuestas mock locales; no realiza peticiones de red.
- Una propuesta contiene de 3 a 5 nodos y cada nodo contiene exactamente un widget principal y hasta dos de apoyo.
- Solo se aceptan `WidgetAccionId` registrados en `src/modulos/senderos/motor/sdui/tipos.ts`.
- Usar `hapticSeguro` para cada seleccion y confirmacion.
- Usar `Animated` con driver nativo; no cargar 3D en runtime ni la lamina de referencias `assets/personaje/aby.png` como avatar final.
- No hay runner de pruebas configurado; cada tarea se verifica con `npm run typecheck`, `git diff --check` y la prueba manual especificada.

---

### Task 1: Contrato validado y estado puro de conversacion

**Files:**
- Create: `src/modulos/aby/contrato/aby.contrato.ts`
- Create: `src/modulos/aby/estado/abyConversacion.reducer.ts`
- Create: `src/modulos/aby/datos/propuestaAby.mock.ts`

**Interfaces:**
- Produces: `TipoSenderoAby = 'ciclico' | 'finito'`.
- Produces: `ConfiguracionConversacionAby`, `PreguntaVisualAby`, `RespuestaAgenteAby` y `PropuestaSenderoAby`.
- Produces: `propuestaSenderoAbySchema` y `validarPropuestaSenderoAby(valor: unknown): PropuestaSenderoAby`.
- Produces: `estadoInicialConversacionAby`, `reducirConversacionAby(estado, accion)` y `obtenerSiguienteRespuestaMock(configuracion)`.
- Consumes: `ActionPack`, `WidgetAccionId` y `validarActionPack` de `src/modulos/senderos/motor/sdui`.

- [ ] **Step 1: Definir el contrato de respuestas y propuesta**

Crear tipos que impidan UI arbitraria y separen texto, pregunta y propuesta:

```ts
export type PreguntaIdAby = 'tipo' | 'frecuencia' | 'duracion';
export type PreguntaVisualAby = {
  id: PreguntaIdAby;
  opciones: readonly { etiqueta: string; valor: string }[];
  tipo: 'chips' | 'dias' | 'cards';
  titulo: string;
};

export type PropuestaSenderoAby = {
  categoriaId: string;
  configuracion: ConfiguracionConversacionAby;
  descripcion: string;
  nodos: readonly { actionPack: ActionPack; descripcion: string; id: string; titulo: string }[];
  subcategoriaId: string;
  titulo: string;
};
```

El schema Zod rechaza nodos fuera de 3-5, ids de widget fuera de `IDS_WIDGET_ACCION`, packs sin un principal y configuraciones incompatibles con `validarActionPack`.

- [ ] **Step 2: Implementar reducer sin efectos secundarios**

Usar acciones discriminadas y no guardar componentes React:

```ts
export type AccionConversacionAby =
  | { tipo: 'definir-objetivo'; objetivo: string }
  | { tipo: 'definir-tipo'; valor: TipoSenderoAby }
  | { tipo: 'definir-dias'; diasSemana: number[] }
  | { tipo: 'definir-duracion'; duracionMinutos: number }
  | { tipo: 'editar'; preguntaId: PreguntaIdAby }
  | { tipo: 'reiniciar' };
```

`reducirConversacionAby` debe retornar un nuevo estado y calcular `pasosCompletados` desde datos no nulos. `editar` elimina solo la respuesta asociada y cualquier respuesta posterior dependiente.

- [ ] **Step 3: Implementar generador mock validado**

`obtenerSiguienteRespuestaMock` devuelve una pregunta pendiente en orden `tipo`, `frecuencia`, `duracion`. Con la configuracion completa, crea propuestas deterministas: un objetivo que contenga `ejercicio` usa categoria `salud`/`ejercicio`; cualquier otro objetivo usa `rutinas`/`manana`. Cada propuesta usa 3 nodos y widgets ya registrados (`cronometro`, `contador`, `checklist-asistida`, `registro`). Pasar el objeto por `validarPropuestaSenderoAby` antes de devolverlo.

- [ ] **Step 4: Verificar contrato y estado**

Run: `npm run typecheck`

Expected: PASS.

Run: `git diff --check`

Expected: sin salida.

Manual: desde una consola temporal o pantalla de desarrollo, confirmar que una propuesta con cuatro widgets, dos widgets principales o id `widget-inventado` lanza error de validacion y que editar frecuencia conserva objetivo/tipo pero elimina duracion.

### Task 2: Componentes visuales reutilizables de Aby

**Files:**
- Create: `src/modulos/aby/componentes/AvatarAby.tsx`
- Create: `src/modulos/aby/componentes/MensajeAby.tsx`
- Create: `src/modulos/aby/componentes/PreguntaVisualAby.tsx`
- Create: `src/modulos/aby/componentes/ResumenSenderoAby.tsx`
- Create: `src/modulos/aby/componentes/PropuestaSenderoAby.tsx`

**Interfaces:**
- Consumes: tipos de `aby.contrato.ts`, `RecuadroGlass`, `Texto`, `colores`, `hapticSeguro`.
- Produces: componentes sin estado de negocio; todos reciben datos y callbacks mediante props.

- [ ] **Step 1: Crear `AvatarAby` con fallback estable**

Aceptar `pose: 'saludando' | 'pensando' | 'celebrando'` y una fuente opcional de imagen. Si no existe un PNG individual, renderizar una esfera, alas geometricas y tunica morada con `View`; no importar `assets/personaje/aby.png` porque es una lamina RGB de referencias. La entrada solo anima opacidad y desplazamiento con `Animated`:

```tsx
export function AvatarAby({ pose }: { pose: PoseAby }) {
  // La pose define el gesto; el fallback no depende de renders 3D.
}
```

- [ ] **Step 2: Crear mensajes y pregunta visual accesible**

`MensajeAby` muestra texto corto con `accessibilityRole="text"`. `PreguntaVisualAby` renderiza cards, chips o dias segun `pregunta.tipo`; cada opcion usa `Pressable`, `accessibilityRole="button"`, `accessibilityState={{ selected }}` y llama una unica vez a `onSeleccionar(valor)` tras `hapticSeguro('seleccion')`.

Para dias, usar `L M X J V S D` con valores `1` a `7`; permitir seleccionar varios. Para tipo, ofrecer `Rutina recurrente` y `Objetivo con final`. Para duracion, ofrecer `10 min`, `25 min`, `45 min`, `Otro`.

- [ ] **Step 3: Crear resumen y propuesta compacta**

`ResumenSenderoAby` muestra objetivo, tipo, frecuencia y duracion con un boton `Editar` por decision. `PropuestaSenderoAby` muestra titulo, categoria, 3-5 nodos y cantidad de herramientas, sin intentar montar widgets completos. Sus botones son `Ajustar propuesta` y `Crear mi sendero`; el segundo puede quedar conectado a callback local de exito en esta entrega.

- [ ] **Step 4: Verificar componentes aislados**

Run: `npm run typecheck`

Expected: PASS.

Run: `git diff --check`

Expected: sin salida.

Manual Android: confirmar contraste con fondo claro, seleccion multiple de dias, foco accesible, haptic por seleccion y fallback de Aby sin una imagen individual.

### Task 3: Pantalla de chat guiado y comportamiento de teclado

**Files:**
- Create: `src/modulos/aby/pantallas/AgenteAbyPantalla.tsx`
- Create: `src/modulos/aby/componentes/EntradaAby.tsx`

**Interfaces:**
- Consumes: reducer de Task 1 y componentes de Task 2.
- Produces: `AgenteAbyPantalla()` sin llamadas de red y `EntradaAby({ onEnviar, deshabilitada })`.

- [ ] **Step 1: Componer historial y estado inicial**

Usar `SafeAreaView`, `KeyboardAvoidingView` y `FlatList` invertido solo si facilita el anclaje de entrada; si no, usar lista normal y `scrollToEnd` despues de cada turno. El contenido inicial se compone de saludo, seis cards de inicio y `EntradaAby`. Al tocar una card o enviar texto no vacio, despachar `definir-objetivo` y agregar el mensaje del usuario antes de renderizar la siguiente pregunta mock.

- [ ] **Step 2: Conectar decisiones y edicion**

Cada seleccion actualiza el reducer, agrega una representacion corta del valor como mensaje del usuario y consulta `obtenerSiguienteRespuestaMock`. Al completar las cuatro decisiones, montar `ResumenSenderoAby` y luego `PropuestaSenderoAby` en lugar de otra pregunta. `Editar` vuelve al turno correspondiente sin perder las decisiones anteriores no dependientes.

- [ ] **Step 3: Implementar entrada que no quede tras el teclado**

`EntradaAby` usa `TextInput`, boton de enviar y `returnKeyType="send"`. En Android, `KeyboardAvoidingView` debe usar `behavior="height"`; en iOS, `behavior="padding"`. La `FlatList` tiene `contentContainerStyle` con espacio inferior suficiente para la entrada y la barra de tabs absoluta. Deshabilitar enviar con texto vacio o mientras una transicion local esta en curso.

- [ ] **Step 4: Confirmar propuesta local**

Al tocar `Crear mi sendero`, ejecutar `hapticSeguro('confirmacion')`, mostrar un mensaje de Aby `Tu sendero esta listo para integrarse a Mis senderos.` y conservar la `PropuestaSenderoAby` en estado local para la futura persistencia. No navegar ni crear datos persistentes en esta entrega.

- [ ] **Step 5: Verificar flujo completo**

Run: `npm run typecheck`

Expected: PASS.

Run: `git diff --check`

Expected: sin salida.

Manual Expo Go Android: abrir la pantalla, usar `Hacer ejercicio`, elegir ciclico, tres dias y 25 min; editar dias; crear propuesta; escribir un objetivo libre; abrir teclado y confirmar que entrada/lista siguen visibles; cambiar de tab y volver sin excepcion.

### Task 4: Sustituir Tienda en la navegacion central por Aby

**Files:**
- Modify: `app/(principal)/tienda.tsx`
- Modify: `app/(principal)/_layout.tsx`
- Modify: `src/nucleo/navegacion/BarraTabs.tsx`
- Delete: `src/modulos/tienda/pantallas/TiendaPantalla.tsx`

**Interfaces:**
- Consumes: `AgenteAbyPantalla` de Task 3.
- Produces: ruta central `/tienda` que monta Aby y pestaña visible `Aby` con icono heptagono.

- [ ] **Step 1: Crear icono heptagono sin dependencia adicional**

En `BarraTabs.tsx`, agregar `nombre: 'aby'` al tipo `NombreIconoTab` y usar `react-native-svg` para un heptagono dentro de `IconoTab`. El estado activo llena el poligono con el color de Aby (`#5B2E91` o el color definido por el diseno de Aby) e invierte el detalle a blanco. El estado inactivo usa trazo gris. Reutilizar las interpolaciones existentes de escala/opacidad; no crear hooks condicionales.

```tsx
<Svg width={tamanoIconoTab} height={tamanoIconoTab} viewBox="0 0 24 24">
  <Polygon points="12,2 19.8,5.7 21.7,14.1 16.3,20.8 7.7,20.8 2.3,14.1 4.2,5.7" />
</Svg>
```

- [ ] **Step 2: Cambiar solo la representacion de la ruta existente**

Mantener `Tabs.Screen name="tienda"`, cambiar su `title` a `Aby` y pasar `nombre="aby"` al icono. Mantener `BotonTiendaContextual` solo si sigue siendo necesario para la accion contextual de Senderos; si su semantica confunde, extraer un nombre neutral `BotonCentralContextual` sin alterar el comportamiento de modo enfoque.

- [ ] **Step 3: Montar Aby y retirar placeholder de Tienda**

Actualizar `app/(principal)/tienda.tsx`:

```tsx
import { AgenteAbyPantalla } from '../../src/modulos/aby/pantallas/AgenteAbyPantalla';

export default AgenteAbyPantalla;
```

Eliminar `TiendaPantalla.tsx` solo despues de confirmar con `rg "TiendaPantalla" app src` que no tiene consumidores.

- [ ] **Step 4: Verificacion final de navegacion**

Run: `npm run typecheck`

Expected: PASS.

Run: `git diff --check`

Expected: sin salida.

Manual Expo Go Android e iOS: confirmar que el heptagono esta centrado, que Aby abre desde la tercera pestaña, que el modo enfoque de Senderos conserva su accion contextual cuando corresponde, y que Hoy, Senderos, Metas y Ruta siguen navegando.

### Task 5: Preparar limite de servidor para Gemini sin exponer secretos

**Files:**
- Create: `supabase/functions/generar-sendero-aby/index.ts`
- Create: `supabase/functions/generar-sendero-aby/README.md`
- Create: `supabase/migrations/20260830000000_aby_generation_locks.sql`
- Modify: `src/modulos/aby/contrato/aby.contrato.ts`

**Interfaces:**
- Consumes: request `{ historial: MensajeAby[]; configuracion: ConfiguracionConversacionAby }` y secreto de servidor `GEMINI_API_KEY`.
- Produces: `RespuestaAgenteAby` validada y errores `{ codigo: 'limite' | 'modelo' | 'validacion'; mensaje: string }`.
- Does not produce: ningun secreto o cliente Gemini en `src/`.

- [ ] **Step 1: Crear contrato de request y error**

Agregar schemas Zod que limiten el historial a 12 mensajes de maximo 500 caracteres y definan el resultado:

```ts
export const solicitudGeminiAbySchema = z.object({
  configuracion: configuracionConversacionAbySchema,
  historial: z.array(mensajeAbySchema).max(12),
});
export const errorAbySchema = z.object({
  codigo: z.enum(['limite', 'modelo', 'validacion']),
  mensaje: z.string(),
});
```

- [ ] **Step 2: Crear bloqueo persistente por usuario**

Crear la migracion con una tabla exclusiva de bloqueos efimeros:

```sql
create table public.aby_generation_locks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  locked_at timestamptz not null default now()
);

alter table public.aby_generation_locks enable row level security;
```

La Edge Function usa `SUPABASE_SERVICE_ROLE_KEY` solo en el servidor para insertar `{ user_id: user.id }`. Si el `insert` devuelve conflicto de clave primaria, responde `429` con `{ codigo: 'limite', mensaje: 'Aby aun esta preparando tu propuesta.' }`. Un bloque `finally` borra el registro del usuario despues de responder, tanto en exito como en error.

- [ ] **Step 3: Crear Edge Function con respuesta segura**

La funcion verifica el JWT de Supabase antes de procesar. Lee `GEMINI_API_KEY` con `Deno.env.get`, rechaza si no existe y llama a Gemini exclusivamente desde el servidor. Crear un `AbortController` de 20 segundos para la solicitud. Convertir cualquier fallo de red, timeout o JSON invalido a `errorAbySchema`; nunca reenviar mensajes internos o la clave.

La llamada solicita JSON estructurado con el schema de `RespuestaAgenteAby`. Para que Deno no dependa del bundle React Native, declarar el schema de request/respuesta una segunda vez en `supabase/functions/generar-sendero-aby/index.ts` con `npm:zod@4`; mantener los mismos limites de `src/modulos/aby/contrato/aby.contrato.ts`. Validar la propuesta antes de responder `200`.

- [ ] **Step 4: Documentar configuracion de secretos**

En el README indicar exactamente:

```bash
supabase secrets set GEMINI_API_KEY=valor-secreto
supabase functions deploy generar-sendero-aby
```

Incluir que el cliente Expo llama a la funcion autenticada y que no se agrega ninguna variable `EXPO_PUBLIC_GEMINI_API_KEY`.

- [ ] **Step 5: Verificar que no hay filtracion de clave**

Run: `rg -n "GEMINI_API_KEY|EXPO_PUBLIC_GEMINI" app src app.json package.json`

Expected: sin resultados.

Run: `npm run typecheck && git diff --check`

Expected: PASS y sin salida de diff check.

Manual: invocar la funcion sin JWT y confirmar `401`; invocarla sin secreto en el entorno de pruebas y confirmar un error seguro sin el nombre ni valor del secreto.

### Task 6: Conectar el cliente solo despues de validar mock en dispositivo

**Files:**
- Modify: `src/modulos/aby/pantallas/AgenteAbyPantalla.tsx`
- Create: `src/modulos/aby/servicios/aby.servicio.ts`

**Interfaces:**
- Consumes: `supabase.functions.invoke('generar-sendero-aby', payload)` y `solicitudGeminiAbySchema`.
- Produces: `generarRespuestaAbyRemota(payload): Promise<RespuestaAgenteAby>`.

- [ ] **Step 1: Crear servicio de red aislado**

El servicio valida el payload antes de llamar, invoca la Edge Function autenticada y valida el JSON de respuesta. Su firma es:

```ts
export async function generarRespuestaAbyRemota(
  solicitud: SolicitudGeminiAby,
): Promise<RespuestaAgenteAby>;
```

No importa SDK de Google ni variables de entorno del cliente.

- [ ] **Step 2: Sustituir generador mock mediante bandera local**

Mantener `obtenerSiguienteRespuestaMock` como fallback. Definir una bandera interna no secreta `usarGemini = false` hasta que se pruebe la funcion. Si la funcion falla, agregar un mensaje breve de Aby y conservar el estado para reintentar; no volver al inicio ni duplicar mensajes del usuario.

- [ ] **Step 3: Verificar cliente y fallback**

Run: `npm run typecheck`

Expected: PASS.

Run: `git diff --check`

Expected: sin salida.

Manual Expo Go: con `usarGemini=false`, completar el flujo mock; con la funcion disponible y la bandera temporal en `true`, confirmar que una propuesta valida aparece. Desconectar red y confirmar que la conversacion queda intacta y aparece `No pude generar la propuesta. Intentalo de nuevo.`

- [ ] **Step 4: Commits por entregable**

Crear commits separados despues de que cada bloque funcione:

```bash
git add src/modulos/aby
git commit -m "feat: add Aby conversation flow"
git add app/(principal)/tienda.tsx app/(principal)/_layout.tsx src/nucleo/navegacion/BarraTabs.tsx
git commit -m "feat: replace store tab with Aby"
git add supabase/functions/generar-sendero-aby src/modulos/aby/servicios
git commit -m "feat: add secure Gemini bridge for Aby"
```
