# Progresión de niveles y maestría infinita en Senderos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir cada cumplimiento diario válido en un nodo de Senderos, desbloquear mapas mediante un cofre final automático y mantener el nivel 7 como ciclos infinitos de 42 días.

**Architecture:** Supabase será la única fuente de verdad para días válidos, niveles, ciclos, cofres y gemas. Una migración consolidada reemplazará el pago paralelo por nivel con cofres idempotentes, y una RPC de resumen entregará las siete secciones. React Native mostrará siete cards ligeras, montará un solo mapa y reproducirá el WebM del paquete únicamente después de confirmar la transacción remota.

**Tech Stack:** PostgreSQL/Supabase RPC y RLS, TypeScript, React Native/Expo Router, TanStack Query, React Native Reanimated, `expo-video`, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-22-progresion-senderos-niveles-design.md`

## Global Constraints

- Un cumplimiento válido avanza como máximo un nodo por `(hábito, fecha local)`.
- Los mapas 1–6 requieren exactamente 3, 7, 12, 18, 25 y 33 días; nivel 7 usa ciclos de 42.
- El cofre final se acredita en la misma transacción que termina el recorrido; nunca existe un segundo pago `recompensa_nivel`.
- Nivel 7 entrega 35 gemas por cofre final de ciclo; cofres intermedios entregan 8–15 gemas.
- Las siete cards usan `MasterGlass` con radio fijo de 12 px, `MasterColorContext`, etapa del paquete y `MasterProgressbar`.
- Solo una escena procedural y un vídeo local sin loop pueden estar montados al mismo tiempo.
- Niveles anteriores son consultables y no permiten registrar progreso; niveles futuros permanecen bloqueados.
- No usar `supabase db push`: el historial remoto no representa las migraciones locales.
- La migración nueva debe funcionar con o sin `20260922_36_cofres_senderos.sql` previamente aplicada.
- Preservar el worktree sucio. Antes de cada tarea registrar `git status --short`; no incluir cambios preexistentes del usuario en commits.
- `SUPABASE_ACESSS_TOKEN` está escrito con tres `S` en el `.env`; la herramienta admite también el nombre correcto `SUPABASE_ACCESS_TOKEN` y nunca imprime ninguno.

## Review Focus

- Dos llamadas simultáneas o un doble toque para el mismo día deben producir un solo nodo, cofre y crédito; Task 2 incluye una prueba SQL concurrente/idempotente y Task 7 la repite vía API.
- Reducir después el valor de un registro que ya completó el día no debe relockear mapas ni retroceder un ciclo; Task 2 prueba que el valor completado se conserva de forma monotónica.
- Un cambio de frecuencia/meta dentro del mismo nivel no debe reiniciar días; Task 2 crea dos segmentos históricos y exige el total conjunto.
- Los límites de maestría 41/42, 42/42, 83/84 y 84/84 deben producir ciclos y cofres correctos; Tasks 1 y 2 los fijan con pruebas.
- Si la app se cierra, el vídeo falla o reducción de movimiento está activa después del commit remoto, al volver debe verse el mapa nuevo sin repetir gemas; Tasks 6 y 7 cubren estado/fallback y recarga remota.

---

### Task 1: Contrato puro de niveles, ciclos y nodos

**Files:**
- Create: `src/modulos/habitos/senderoNiveles.ts`
- Create: `src/modulos/habitos/senderoNiveles.test.ts`
- Create: `src/modulos/habitos/construirNodosDias.test.ts`
- Modify: `src/modulos/habitos/diasNivel.ts`
- Modify: `src/modulos/habitos/construirNodosDias.ts`
- Modify: `src/modulos/senderos/datos/mapaEjercicio.mock.ts`
- Modify: `src/modulos/senderos/Mapas/mapaNivel7.ts`

**Interfaces:**
- Consumes: `DIAS_REQUERIDOS_POR_NIVEL` y `NodoMapaSendero` actuales.
- Produces: `DIAS_POR_MAPA`, `RECOMPENSA_COFRE_FINAL`, `calcularProgresoMaestria(totalDiasNivel7)`, `diasAcumuladosAntesDeNivel(nivel, ciclo?)` y nodos con `ciclo`/modo consulta.

- [ ] **Step 1: Escribir las pruebas fallidas de ciclos y cantidades**

```ts
import { describe, expect, it } from 'vitest';
import { calcularProgresoMaestria, DIAS_POR_MAPA, RECOMPENSA_COFRE_FINAL } from './senderoNiveles';
import { diasAcumuladosAntesDeNivel } from './diasNivel';

describe('progresión de Senderos', () => {
  it('mantiene los recorridos 1-6 y hace infinito el mapa 7', () => {
    expect(DIAS_POR_MAPA).toEqual({ 1: 3, 2: 7, 3: 12, 4: 18, 5: 25, 6: 33, 7: 42 });
    expect(RECOMPENSA_COFRE_FINAL).toEqual({ 1: 10, 2: 15, 3: 20, 4: 25, 5: 30, 6: 35, 7: 35 });
  });

  it.each([
    [0, { ciclo: 1, diasCompletados: 0, ciclosCompletados: 0 }],
    [41, { ciclo: 1, diasCompletados: 41, ciclosCompletados: 0 }],
    [42, { ciclo: 2, diasCompletados: 0, ciclosCompletados: 1 }],
    [83, { ciclo: 2, diasCompletados: 41, ciclosCompletados: 1 }],
    [84, { ciclo: 3, diasCompletados: 0, ciclosCompletados: 2 }],
  ])('calcula maestría para %i días', (total, esperado) => {
    expect(calcularProgresoMaestria(total)).toEqual({ ...esperado, diasRequeridos: 42, totalDias: total });
  });

  it('mantiene numeración global entre ciclos', () => {
    expect(diasAcumuladosAntesDeNivel(7, 1)).toBe(98);
    expect(diasAcumuladosAntesDeNivel(7, 2)).toBe(140);
  });
});
```

- [ ] **Step 2: Ejecutar las pruebas y confirmar RED**

Run: `npm test -- src/modulos/habitos/senderoNiveles.test.ts`

Expected: FAIL porque `senderoNiveles.ts` y las exportaciones todavía no existen.

- [ ] **Step 3: Implementar las constantes y cálculo puro**

```ts
export const DIAS_POR_MAPA = { 1: 3, 2: 7, 3: 12, 4: 18, 5: 25, 6: 33, 7: 42 } as const;
export const RECOMPENSA_COFRE_FINAL = { 1: 10, 2: 15, 3: 20, 4: 25, 5: 30, 6: 35, 7: 35 } as const;

export function calcularProgresoMaestria(totalDiasNivel7: number) {
  const totalDias = Math.max(0, Math.floor(totalDiasNivel7));
  return {
    ciclo: Math.floor(totalDias / DIAS_POR_MAPA[7]) + 1,
    ciclosCompletados: Math.floor(totalDias / DIAS_POR_MAPA[7]),
    diasCompletados: totalDias % DIAS_POR_MAPA[7],
    diasRequeridos: DIAS_POR_MAPA[7],
    totalDias,
  };
}
```

Actualizar `diasAcumuladosAntesDeNivel(nivel, ciclo = 1)` para sumar 98 días antes de nivel 7 y añadir `(ciclo - 1) * 42` dentro de maestría. Mantener `DIAS_REQUERIDOS_POR_NIVEL` por compatibilidad con el wizard.

- [ ] **Step 4: Probar nodos por ciclo, bloqueo diario y modo consulta**

Agregar en `construirNodosDias.test.ts`:

```ts
it('incluye ciclo en cofres de maestría y no habilita acciones históricas', () => {
  const nodos = construirNodosDias(42, 42, 7, new Map(), {
    ciclo: 2, puedeAvanzarHoy: false, soloLectura: true,
  });
  expect(nodos[2].cofre).toMatchObject({ ciclo: 2, nodoDia: 3, tipo: 'intermedio' });
  expect(nodos[41].cofre).toMatchObject({ ciclo: 2, gemasMin: 35, gemasMax: 35, tipo: 'final' });
  expect(nodos.every((nodo) => nodo.estado !== 'activo')).toBe(true);
});

it('bloquea el siguiente nodo hasta el próximo día programado', () => {
  const nodos = construirNodosDias(1, 3, 1, new Map(), {
    ciclo: 1, puedeAvanzarHoy: false, soloLectura: false,
  });
  expect(nodos.map((nodo) => nodo.estado)).toEqual(['completado', 'bloqueado', 'bloqueado']);
});
```

Extender `InfoCofre` con `ciclo: number` y la función con un quinto argumento opcional:

```ts
type OpcionesNodos = { ciclo?: number; puedeAvanzarHoy?: boolean; soloLectura?: boolean };
```

El nodo siguiente solo es `activo` cuando no es histórico y `puedeAvanzarHoy` es verdadero. `mapaNivel7.ts` debe importar `DIAS_POR_MAPA[7]` y describirse como recorrido de maestría, no como mapa decorativo.

- [ ] **Step 5: Ejecutar GREEN del dominio**

Run: `npm test -- src/modulos/habitos/senderoNiveles.test.ts src/modulos/habitos/construirNodosDias.test.ts src/modulos/habitos/hooks/useSenderoHabito.test.ts`

Expected: PASS, incluidas las pruebas existentes de cofres.

- [ ] **Step 6: Registrar el cambio sin capturar hunks preexistentes**

Run: `git status --short` y `git diff -- src/modulos/habitos/diasNivel.ts src/modulos/habitos/construirNodosDias.ts src/modulos/senderos/datos/mapaEjercicio.mock.ts src/modulos/senderos/Mapas/mapaNivel7.ts`.

Commit únicamente los archivos nuevos y los hunks confirmados como propios. Si un archivo ya estaba modificado al iniciar, dejar ese archivo sin stage y anotarlo en el ledger de ejecución.

---

### Task 2: Migración consolidada, economía idempotente y progreso remoto

**Files:**
- Create: `supabase/tests/ejecutar_sql_management.mjs`
- Create: `supabase/tests/06_senderos_progresion_infinita.sql`
- Create: `supabase/migrations/20260922_46_progresion_senderos_infinita.sql`
- Modify: `supabase/tests/05_comercio_gemas_nivel_habito.sql`

**Interfaces:**
- Consumes: `public.habitos_items`, `habitos_planes`, `habitos_registros`, `comercio.billeteras_gemas`, `comercio.movimientos_gemas` y `public.habitos_es_dia_programado` auditados.
- Produces: `public.obtener_resumen_sendero_habito(uuid)`, `public.reclamar_cofre_sendero(uuid,integer,integer,text,integer)`, respuesta extendida de `public.registrar_progreso_habito` y tabla de cofres con ciclo.

- [ ] **Step 1: Crear el ejecutor SQL de administración sin filtrar secretos**

`ejecutar_sql_management.mjs` debe leer `.env.local` o `.env`, resolver el token como `SUPABASE_ACCESS_TOKEN ?? SUPABASE_ACESSS_TOKEN`, derivar el project ref del hostname de `EXPO_PUBLIC_SUPABASE_URL`, leer exactamente el archivo recibido en `process.argv[2]` y enviar `{ query }` a:

```js
`https://api.supabase.com/v1/projects/${projectRef}/database/query`
```

Debe imprimir solo el JSON devuelto o el mensaje HTTP, nunca headers, URL con credenciales ni variables de entorno.

- [ ] **Step 2: Escribir primero el smoke SQL que falla**

El archivo debe envolver fixtures en `begin; ... rollback;`, tomar un usuario real sin imprimirlo, configurar `request.jwt.claims` y comprobar con excepciones `assert_failure`:

```sql
if to_regprocedure('public.obtener_resumen_sendero_habito(uuid)') is null then
  raise exception 'falta obtener_resumen_sendero_habito' using errcode = 'assert_failure';
end if;
```

Crear fixtures separados para:

1. nivel 1 con dos días cumplidos previos y el tercero registrado mediante RPC;
2. dos planes contiguos del mismo nivel para probar que una edición no reinicia;
3. nivel 7 con 41 y después 42 días;
4. nivel 7 con 83 y después 84 días;
5. un registro ya completo actualizado con valor menor;
6. un reclamo intermedio repetido.

En cada fixture guardar el saldo previo y exigir saldo final exacto, una sola fila de cofre y una sola referencia de ledger.

- [ ] **Step 3: Ejecutar RED contra el esquema remoto actual**

Run: `node supabase/tests/ejecutar_sql_management.mjs supabase/tests/06_senderos_progresion_infinita.sql`

Expected: FAIL indicando que falta `public.obtener_resumen_sendero_habito` o `habitos_cofres_reclamados`.

- [ ] **Step 4: Implementar el esquema de cofres compatible con migración 36 ausente/presente**

La migración debe crear la tabla cuando no exista, añadir `ciclo integer not null default 1`, borrar por nombre la constraint vieja `habitos_cofres_unicidad` si existe y crear:

```sql
unique (usuario_id, habito_id, nivel, ciclo, tipo, nodo_dia)
```

Mantener RLS de solo lectura propia, revocar escrituras a `anon/authenticated` y conceder operación directa únicamente a `service_role`. El check de movimientos debe admitir `cofre_intermedio` y `cofre_final` sin retirar motivos actuales.

- [ ] **Step 5: Hacer idempotentes todos los créditos con referencia**

Crear además del índice IAP existente:

```sql
create unique index if not exists movimientos_gemas_credito_referencia_uniq
on comercio.movimientos_gemas (persona_id, motivo, referencia)
where cantidad > 0 and referencia is not null;
```

Redefinir `comercio.acreditar_gemas` para validar cantidad/motivo, insertar primero el movimiento con `on conflict do nothing returning id`, devolver el saldo actual cuando no insertó y solo después incrementar la billetera. Los motivos válidos de crédito serán `compra_iap`, `ajuste_soporte`, `referido_nivel2`, `trial_horizon_bono`, `cofre_intermedio` y `cofre_final`. Mantener `EXECUTE` solo para `service_role` y el propietario interno.

Actualizar el test 05: repetir `ajuste_soporte` con la misma referencia debe conservar el saldo; referencias distintas deben acreditar por separado.

- [ ] **Step 6: Implementar conteo histórico y resumen de siete secciones**

Crear una función privada que cuente fechas distintas uniendo cada registro al plan vigente en esa fecha:

```sql
join public.habitos_planes p
  on p.habito_id = r.habito_id
 and r.fecha_local >= p.desde_fecha
 and (p.hasta_fecha is null or r.fecha_local < p.hasta_fecha)
```

Debe filtrar `p.nivel`, día programado y valor/meta correctos. `privacidad.obtener_resumen_sendero_habito` construye siete objetos con claves snake_case equivalentes a `SeccionSendero`; niveles sin plan son `bloqueado`, niveles inferiores son `completado`, y el máximo existente es `actual`. Para nivel 7 calcula ciclo/progreso módulo 42. `puede_avanzar_hoy` exige nivel actual, plan ya iniciado, día programado y ausencia de cumplimiento completo hoy.

Exponer un wrapper SQL `public.obtener_resumen_sendero_habito` con `security invoker`, `search_path=''`, propiedad validada y `EXECUTE` para `authenticated/service_role`.

- [ ] **Step 7: Implementar reclamo intermedio por nivel/ciclo**

Antes de crear las nuevas firmas, eliminar explícitamente los overloads heredados si existen para que PostgREST no encuentre llamadas ambiguas cuando la migración 36 ya fue aplicada:

```sql
drop function if exists public.reclamar_cofre_sendero(uuid, integer, text, integer);
drop function if exists comercio.reclamar_cofre_sendero(uuid, uuid, integer, text, integer);
drop function if exists public.obtener_cofres_reclamados_habito(uuid, integer);
```

La firma pública será:

```sql
public.reclamar_cofre_sendero(
  p_habito_id uuid,
  p_nivel integer,
  p_ciclo integer,
  p_tipo text,
  p_nodo_dia integer
) returns jsonb
```

Solo acepta `p_tipo='intermedio'`; el cofre final pertenece exclusivamente a `registrar_progreso_habito`. Validar múltiplo de tres, `p_nodo_dia < dias_requeridos`, ciclo actual/histórico alcanzado y días suficientes dentro del ciclo. Insertar el cofre con `on conflict do nothing`, reutilizar sus gemas guardadas al repetir y llamar a `acreditar_gemas` con referencia:

```text
cofre:<habito>:nivel:<nivel>:ciclo:<ciclo>:intermedio:<nodo>
```

La consulta de cofres reclamados debe exponer exactamente:

```sql
public.obtener_cofres_reclamados_habito(
  p_habito_id uuid,
  p_nivel integer,
  p_ciclo integer
) returns table (
  nodo_dia integer,
  ciclo integer,
  tipo text,
  gemas integer,
  reclamado_en timestamptz
)
```

- [ ] **Step 8: Redefinir el registro diario como transición atómica**

Preservar la firma de `privacidad.registrar_progreso_habito`. Bloquear `habitos_items` con `for update`, validar propiedad/fecha y hacer upsert monotónico: si el valor existente ya cumplió la meta histórica, una actualización menor conserva ese valor.

Después del upsert:

- niveles 1–6: al alcanzar su umbral, insertar cofre final ciclo 1, acreditar `5 * (nivel + 1)`, cerrar el plan y crear el siguiente desde `fecha_actual + 1`;
- nivel 7: al cruzar cada múltiplo nuevo de 42, insertar cofre final del ciclo terminado y acreditar 35; no crear nivel 8;
- no llamar `acreditar_recompensa_nivel_habito`;
- devolver campos existentes y `transicion_sendero`, con tipo `nivel` o `ciclo_maestria`.

La referencia final será:

```text
cofre:<habito>:nivel:<nivel>:ciclo:<ciclo>:final
```

- [ ] **Step 9: Migrar el pago histórico sin volver a acreditar**

Para cada movimiento `recompensa_nivel` cuya referencia cumple `<uuid>:nivel:<n>`, insertar con `on conflict do nothing` un cofre final del nivel `n-1`, ciclo 1, nodo final 3/7/12/18/25/33 y las gemas ya pagadas. No insertar movimientos ni actualizar billeteras durante este backfill.

- [ ] **Step 10: Aplicar la migración y ejecutar GREEN SQL**

La migración termina con `notify pgrst, 'reload schema';` después de crear/reemplazar todas las funciones públicas para que las firmas nuevas estén disponibles inmediatamente en la API.

Run:

```bash
node supabase/tests/ejecutar_sql_management.mjs supabase/migrations/20260922_46_progresion_senderos_infinita.sql
node supabase/tests/ejecutar_sql_management.mjs supabase/tests/06_senderos_progresion_infinita.sql
```

Expected: ambos comandos terminan con respuesta exitosa; el test revierte todos sus fixtures.

- [ ] **Step 11: Auditar el resultado remoto inmediatamente**

Consultar `pg_get_functiondef`, ACL, constraints, índices, políticas RLS, saldos negativos y duplicados. Expected: tabla con ciclo, dos índices de referencia compatibles, cero duplicados/negativos y ningún `EXECUTE` de acreditación para `authenticated`.

- [ ] **Step 12: Commit aislado de base de datos**

```bash
git add supabase/tests/ejecutar_sql_management.mjs supabase/tests/06_senderos_progresion_infinita.sql supabase/migrations/20260922_46_progresion_senderos_infinita.sql supabase/tests/05_comercio_gemas_nivel_habito.sql
git commit -m "feat: add atomic senderos progression"
```

Antes del commit inspeccionar `git diff --cached`; retirar cualquier hunk preexistente.

---

### Task 3: Tipos, mapper y servicio cliente de las siete secciones

**Files:**
- Create: `src/modulos/habitos/senderoHabito.tipos.ts`
- Create: `src/modulos/habitos/senderoHabito.mapper.ts`
- Create: `src/modulos/habitos/senderoHabito.mapper.test.ts`
- Create: `src/modulos/habitos/senderoHabito.servicio.ts`
- Modify: `src/modulos/habitos/tipos.ts`
- Modify: `src/modulos/habitos/habitos.servicio.ts`

**Interfaces:**
- Consumes: JSON snake_case de las RPC de Task 2.
- Produces: `ResumenSenderoHabito`, `SeccionSenderoHabito`, `TransicionSendero`, `obtenerResumenSenderoHabito`, `obtenerCofresReclamadosHabito(habitoId,nivel,ciclo)` y `reclamarCofreSendero` con ciclo.

- [ ] **Step 1: Escribir prueba fallida del mapper**

```ts
expect(mapearResumenSendero(payload)).toMatchObject({
  nivelActual: 7,
  secciones: [
    { nivel: 1, estado: 'completado', diasCompletados: 3, diasRequeridos: 3 },
    { nivel: 7, estado: 'actual', ciclo: 2, diasCompletados: 8, diasRequeridos: 42, totalDiasNivel7: 50 },
  ],
});
```

Agregar casos de `disponible_desde=null`, booleanos, números serializados y payload incompleto que debe lanzar `Error('Resumen de Senderos inválido.')`.

- [ ] **Step 2: Ejecutar RED**

Run: `npm test -- src/modulos/habitos/senderoHabito.mapper.test.ts`

Expected: FAIL por módulos inexistentes.

- [ ] **Step 3: Definir contratos TypeScript exactos**

```ts
export type EstadoSeccionSendero = 'completado' | 'actual' | 'bloqueado';
export type SeccionSenderoHabito = {
  nivel: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  ciclo: number;
  estado: EstadoSeccionSendero;
  diasCompletados: number;
  diasRequeridos: number;
  puedeAvanzarHoy: boolean;
  disponibleDesde: string | null;
  totalDiasNivel7: number;
};
export type ResumenSenderoHabito = { nivelActual: number; secciones: SeccionSenderoHabito[] };
export type TransicionSendero = {
  tipo: 'nivel' | 'ciclo_maestria';
  nivelAnterior: number;
  nivelActual: number;
  cicloAnterior: number;
  cicloActual: number;
  cofreFinalReclamado: true;
  gemas: number;
};
```

Extender `ResultadoRegistroHabito` con `transicionSendero: TransicionSendero | null` sin retirar campos existentes.

- [ ] **Step 4: Implementar mapper y wrappers RPC**

Mover los wrappers de cofres desde `habitos.servicio.ts` al nuevo servicio y reexportarlos temporalmente desde el archivo histórico para no romper imports. El nuevo servicio no debe silenciar un RPC inexistente con `[]`; después de la migración, un error remoto debe propagarse a React Query.

Mapear `transicion_sendero` en `registrarProgresoHabito` y conservar `gemasGanadas` como la cantidad del cofre final para consumidores anteriores.

- [ ] **Step 5: Ejecutar GREEN y regresión de servicios**

Run: `npm test -- src/modulos/habitos/senderoHabito.mapper.test.ts src/modulos/habitos/habitos.servicio.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit de archivos aislados**

Agregar los archivos nuevos. Para `habitos.servicio.ts`/`tipos.ts`, que pueden contener cambios previos, stagear solo hunks propios después de inspeccionarlos; si se mezclan en el mismo hunk, dejarlos para el handoff sin commit.

---

### Task 4: Cards MasterGlass y carrusel horizontal de niveles

**Files:**
- Create: `src/modulos/senderos/componentes/niveles/carruselNiveles.modelo.ts`
- Create: `src/modulos/senderos/componentes/niveles/carruselNiveles.modelo.test.ts`
- Create: `src/modulos/senderos/componentes/niveles/TarjetaNivelSendero.tsx`
- Create: `src/modulos/senderos/componentes/niveles/CarruselNivelesSendero.tsx`

**Interfaces:**
- Consumes: `SeccionSenderoHabito`, paquete/color y `obtenerAssetsPaqueteHabito(paqueteId,nivel).base`.
- Produces: `CarruselNivelesSendero({ secciones, nivelSeleccionado, paqueteId, onSeleccionar })`.

- [ ] **Step 1: Escribir prueba fallida del modelo de interacción**

```ts
expect(esSeccionSeleccionable({ estado: 'bloqueado' })).toBe(false);
expect(esSeccionSeleccionable({ estado: 'completado' })).toBe(true);
expect(esSeccionSeleccionable({ estado: 'actual' })).toBe(true);
expect(indiceScrollParaNivel(7, 7)).toBe(6);
expect(indiceScrollParaNivel(0, 7)).toBe(0);
```

- [ ] **Step 2: Ejecutar RED e implementar helpers mínimos**

Run antes: `npm test -- src/modulos/senderos/componentes/niveles/carruselNiveles.modelo.test.ts`.

Expected: FAIL. Implementar clamps puros y repetir hasta PASS.

- [ ] **Step 3: Construir la card temática**

`TarjetaNivelSendero` debe tener ancho calculado `Math.min(anchoVentana * 0.78, 300)`, mínimo 116 px de alto, `MasterGlass blur colorBase={colorPaquete}` con radio 12, etapa de 76×92 a la izquierda y contenido a la derecha. Usar:

```tsx
<MasterProgressbar altura={8} porcentaje={(diasCompletados / diasRequeridos) * 100} />
```

Copy:

- bloqueado: `Nivel N · Bloqueado` y `Completa el nivel anterior`;
- actual 1–6: `Nivel N` y `X/Y días`;
- nivel 7: `Maestría · Ciclo N` y `X/42 días`;
- completado: `Nivel N · Completado` y barra al 100 %.

Usar `MasterIcon` para candado/check, no Lucide directo dentro de la card.

- [ ] **Step 4: Construir el ScrollView horizontal**

Usar `ScrollView` horizontal, `decelerationRate="fast"`, `snapToInterval={anchoCard + 12}`, `snapToAlignment="start"`, padding horizontal 20 y `showsHorizontalScrollIndicator={false}`. Un efecto llama `scrollTo({ x: indice * (anchoCard + 12), animated: !movimientoReducido })` al cambiar la selección. Cards bloqueadas llevan `disabled` y no llaman `onSeleccionar`.

- [ ] **Step 5: Verificar tipos y test del modelo**

Run:

```bash
npm test -- src/modulos/senderos/componentes/niveles/carruselNiveles.modelo.test.ts
npx tsc --noEmit --pretty false
```

Expected: test PASS. Para TypeScript, separar errores nuevos de la línea base preexistente y no corregir archivos ajenos.

- [ ] **Step 6: Commit de componentes nuevos**

```bash
git add src/modulos/senderos/componentes/niveles
git commit -m "feat: add senderos level carousel"
```

---

### Task 5: Selección de nivel, mapas históricos y un solo mapa montado

**Files:**
- Modify: `src/modulos/habitos/hooks/useSenderoHabito.ts`
- Create: `src/modulos/habitos/hooks/useSenderoHabito.modelo.ts`
- Create: `src/modulos/habitos/hooks/useSenderoHabito.modelo.test.ts`
- Modify: `src/modulos/senderos/pantallas/MapaSenderosPantalla.tsx`

**Interfaces:**
- Consumes: servicio de Task 3, carrusel de Task 4 y builder de Task 1.
- Produces: una pantalla que selecciona niveles desbloqueados, consulta cofres por nivel/ciclo y monta un único `ContenedorMapaSenderos`.

- [ ] **Step 1: Escribir pruebas fallidas de selección**

```ts
it('selecciona el nivel actual al cambiar de hábito o desbloquear', () => {
  expect(resolverNivelSeleccionado(undefined, 3, [1, 2, 3])).toBe(3);
  expect(resolverNivelSeleccionado(2, 3, [1, 2, 3])).toBe(2);
  expect(resolverNivelSeleccionado(4, 3, [1, 2, 3])).toBe(3);
});

it('marca niveles anteriores como consulta y el actual como editable', () => {
  expect(esMapaSoloLectura(2, 3)).toBe(true);
  expect(esMapaSoloLectura(3, 3)).toBe(false);
});
```

- [ ] **Step 2: Ejecutar RED, implementar helpers y obtener PASS**

Run: `npm test -- src/modulos/habitos/hooks/useSenderoHabito.modelo.test.ts`.

- [ ] **Step 3: Rehacer el hook alrededor del resumen remoto**

Firma:

```ts
useSenderoHabito(id: string | undefined, nivelSeleccionado?: number)
```

Consultas:

- `['habitos','sendero-resumen',id]` para las siete secciones;
- `['habitos','cofres',id,nivel,ciclo]` solo para la sección seleccionada.

Construir nodos con `soloLectura = nivelSeleccionado < nivelActual` y `puedeAvanzarHoy` de la sección. La mutación intermedia envía ciclo. Invalidar resumen, cofres y `CLAVE_SALDO_GEMAS` tras éxito.

- [ ] **Step 4: Integrar el carrusel en la pantalla**

Añadir estado `nivelSeleccionado`, sincronizado al nivel actual cuando cambia el hábito o aparece un nivel nuevo. Renderizar el carrusel entre la card del hábito y la escena. Sustituir `nivelVisible` por el nivel seleccionado para mapa, insignia, bioma y nodos.

Conservar la excepción visual `Prueba diamante`: sus siete cards permanecen seleccionables para QA, pero sus acciones no escriben progreso real.

No crear siete `ContenedorMapaSenderos`; el JSX debe contener una sola instancia con `key={`${habitoId}-${nivelSeleccionado}-${ciclo}`}`.

- [ ] **Step 5: Bloquear navegación de nodos históricos/futuros**

`onCompletarNodo` solo navega a `/senderos/mision` cuando la sección es actual, `puedeAvanzarHoy` es verdadera y el nodo está activo. Los niveles anteriores permiten scroll/tooltip; cards bloqueadas no cambian selección.

- [ ] **Step 6: Ejecutar regresión focalizada**

Run:

```bash
npm test -- src/modulos/habitos/hooks/useSenderoHabito.modelo.test.ts src/modulos/habitos/construirNodosDias.test.ts src/modulos/habitos/hooks/useSenderoHabito.test.ts
npx tsc --noEmit --pretty false
```

Expected: tests PASS y cero errores TypeScript nuevos en los archivos tocados.

- [ ] **Step 7: Preservar cambios preexistentes al cerrar la tarea**

`useSenderoHabito.ts` y `MapaSenderosPantalla.tsx` ya estaban modificados antes del plan. No hacer `git add` completo sobre ellos. Commit solo del modelo/test nuevo; dejar integración visible en el worktree si no puede stagearse sin capturar trabajo del usuario.

---

### Task 6: Vídeo por paquete y transición automática tras cofre final

**Files:**
- Add: `assets/ilustraciones/senderos/biomas/cofres/abrir-cofre-{abyss,amber,aurelia,celesthia,crimsonmoon,diamante,eclipse,esmeralda,golden,ignate,lightmoon,mathist,moon,nevalhi,sakura,valvery,vida}.webm`
- Add: `scripts/generar-videos-cofre-paquetes.sh`
- Create: `src/modulos/habitos/cofreVideoPaquete.ts`
- Create: `src/modulos/habitos/cofreVideoPaquete.test.ts`
- Create: `src/modulos/senderos/estado/transicionCofreFinal.ts`
- Create: `src/modulos/senderos/estado/transicionCofreFinal.test.ts`
- Modify: `src/modulos/senderos/componentes/mapa/ModalAperturaCofre.tsx`
- Modify: `src/modulos/senderos/componentes/mapa/NodoCofreSendero.tsx`
- Modify: `src/modulos/senderos/pantallas/SesionMisionPantalla.tsx`

**Interfaces:**
- Consumes: `TransicionSendero`, 17 WebM locales y resultado de `registrarProgresoHabito`.
- Produces: `videoCofreParaPaquete(paqueteId)`, modal manual/automático y retorno al carrusel después de `playToEnd` o fallback.

- [ ] **Step 1: Escribir prueba fallida del registro estático de vídeos**

Probar los 17 ids (`abyss`, `amber`, `aurelia`, `celesthia`, `crimsonmoon`, `diamante`, `eclipse`, `esmeralda`, `golden`, `ignate`, `lightmoon`, `mathist`, `moon`, `nevalhi`, `sakura`, `valvery`, `vida`) y fallback Esmeralda. Cada entrada debe ser un `require()` estático a `abrir-cofre-<id>.webm`.

- [ ] **Step 2: Validar los assets, ejecutar RED e implementar el registro**

Ejecutar `bash -n scripts/generar-videos-cofre-paquetes.sh` y usar `ffprobe` sobre los 17 WebM para exigir archivo no vacío, VP9 con alpha, 646×634 y duración aproximada de 2.966 s. `master.mov` es una fuente local pesada: debe permanecer sin trackear y nunca aparecer en un `require()` de Expo ni en el commit.

Run: `npm test -- src/modulos/habitos/cofreVideoPaquete.test.ts`.

Expected primero FAIL, después PASS.

- [ ] **Step 3: Fijar el estado puro de transición**

`transicionCofreFinal.ts` exporta:

```ts
type EstadoTransicionCofre = 'inactiva' | 'reproduciendo' | 'lista_para_salir';
export function transicionTrasRegistro(resultado: ResultadoRegistroHabito) {
  return resultado.transicionSendero
    ? { estado: 'reproduciendo' as const, transicion: resultado.transicionSendero }
    : { estado: 'inactiva' as const, transicion: null };
}
```

Probar transición normal, ausencia de cofre y que rehidratar un resumen ya avanzado no solicita otra reproducción.

- [ ] **Step 4: Convertir el modal en manual/automático con `expo-video`**

Extender props con:

```ts
modo: 'manual' | 'automatico';
paqueteId: string;
gemasAcreditadas?: number;
movimientoReducido?: boolean;
onFinalizarAutomatico?: () => void;
```

Modo manual llama `onReclamar` una vez y después reproduce. Modo automático recibe las gemas ya confirmadas y reproduce al aparecer, sin botón de reclamo. Usar `useVideoPlayer`, `VideoView`, `surfaceType="textureView"`, `nativeControls={false}`, `player.loop=false`, listener `playToEnd` y respaldo de 4 segundos. Reducción de movimiento salta el vídeo y muestra el estado reclamado antes de continuar.

En error de vídeo o timeout, llamar una sola vez `onFinalizarAutomatico`. Limpiar listeners/timers al desmontar.

- [ ] **Step 5: Corregir el asset de estado reclamado**

En `NodoCofreSendero`, reclamado usa `cofre-cerrado.png`; disponible usa `cofre.png`. Bloqueado no debe ejecutar `onPress` útil ni iniciar animación infinita. La sacudida disponible debe cancelarse al cambiar de estado/desmontar.

- [ ] **Step 6: Conectar la misión al cofre final automático**

En `SesionMisionPantalla`, al éxito:

- invalidar `['habitos','sendero-resumen',habitoId]`, panel, detalles, cercanía, racha y saldo;
- si hay `transicionSendero`, mostrar modal automático con paquete/gemas y no mostrar la celebración vieja;
- al terminar, ejecutar `router.back()`; la pantalla de mapa seleccionará el nivel actual desde el resumen;
- sin transición, conservar la celebración diaria existente.

La mutación fallida no abre modal ni navega.

- [ ] **Step 7: Ejecutar pruebas y tipos**

Run:

```bash
npm test -- src/modulos/habitos/cofreVideoPaquete.test.ts src/modulos/senderos/estado/transicionCofreFinal.test.ts
npx tsc --noEmit --pretty false
```

Expected: tests PASS; cero errores nuevos en modal, nodo o misión.

- [ ] **Step 8: Commit seguro**

Commit de los 17 WebM, el script, registros/helpers/tests nuevos. No agregar `master.mov`. `ModalAperturaCofre.tsx`, `NodoCofreSendero.tsx` y `SesionMisionPantalla.tsx` están o pueden estar sucios; no stagearlos completos sin separar hunks.

---

### Task 7: Smoke remoto, verificación completa y auditoría final

**Files:**
- Create: `supabase/tests/06_senderos_progresion_remoto.mjs`
- Modify: `src/servicios/i18n/recursos.ts`
- Modify: `src/servicios/i18n/recursos.test.ts`
- Modify: `docs/superpowers/specs/2026-09-22-progresion-senderos-niveles-design.md` solo si la implementación obliga a registrar una decisión distinta.

**Interfaces:**
- Consumes: todas las tareas previas y el proyecto remoto ya migrado.
- Produces: evidencia reproducible de progresión real, limpieza de fixtures y auditoría post-despliegue.

- [ ] **Step 1: Añadir claves i18n y su cobertura**

Agregar estas claves bajo `senderos.levels` en todos los idiomas soportados y extender el test de paridad para exigirlas:

```ts
locked: 'Bloqueado'
completed: 'Completado'
masteryCycle: 'Maestría · Ciclo {{cycle}}'
daysProgress: '{{completed}}/{{required}} días'
completePrevious: 'Completa el nivel anterior'
availableNextScheduledDay: 'Disponible en tu próximo día programado'
finalChest: 'Cofre final'
gemsReward: '+{{gems}} gemas'
videoFallback: 'Tu recompensa está lista'
```

Mantener traducciones naturales equivalentes en cada recurso existente; ninguna lengua puede omitir claves aunque inicialmente reutilice el texto español como respaldo explícito.

- [ ] **Step 2: Escribir smoke remoto con usuario desechable**

Reutilizar el patrón de `02_plataforma_privacidad_remoto.mjs`: crear usuario admin con `SUPABASE_SECRET_KEY`, iniciar sesión, crear hábito desde dos días atrás, registrar dos fechas previas y hoy, y afirmar:

```js
assert(result.transicion_sendero.tipo === 'nivel', 'Debe desbloquear nivel 2.');
assert(result.transicion_sendero.gemas === 10, 'El cofre final debe entregar 10 gemas.');
assert(summary.secciones.length === 7, 'El resumen debe traer siete secciones.');
assert(summary.secciones[1].estado === 'actual', 'Nivel 2 debe estar desbloqueado.');
```

Repetir el registro de hoy y confirmar saldo sin cambio y una sola fila de cofre final. El bloque `finally` siempre elimina el usuario, incluso ante fallo.

- [ ] **Step 3: Ejecutar smoke remoto**

Run: `node supabase/tests/06_senderos_progresion_remoto.mjs`

Expected: `Remote Senderos progression smoke test passed.` y usuario de prueba eliminado.

- [ ] **Step 4: Ejecutar suite focalizada y completa**

Run:

```bash
npm test -- src/modulos/habitos/senderoNiveles.test.ts src/modulos/habitos/construirNodosDias.test.ts src/modulos/habitos/senderoHabito.mapper.test.ts src/modulos/senderos/componentes/niveles/carruselNiveles.modelo.test.ts src/modulos/habitos/hooks/useSenderoHabito.modelo.test.ts src/modulos/habitos/cofreVideoPaquete.test.ts src/modulos/senderos/estado/transicionCofreFinal.test.ts src/servicios/i18n/recursos.test.ts
npm test
npx tsc --noEmit --pretty false
```

Expected: todos los tests PASS. Comparar TypeScript con la línea base y listar únicamente errores preexistentes si el repositorio completo no está limpio.

- [ ] **Step 5: Verificación visual en dispositivo/emulador**

Comprobar un hábito de nivel 1 y `Prueba diamante`:

- siete cards visibles en scroll horizontal;
- etapa correcta y color del paquete;
- bloqueos/consulta correctos;
- solo una escena montada;
- completar nodo 3 abre vídeo, muestra +10 y vuelve al mapa 2;
- primer nodo del mapa 2 bloqueado hasta el siguiente día programado;
- reducción de movimiento usa fallback estático;
- volver a abrir la app no repite cofre ni gemas.

- [ ] **Step 6: Repetir auditoría remota de seguridad/economía**

Consultar funciones, ACL, RLS, constraints, índices y agregados. Expected:

- cero billeteras negativas;
- cero créditos duplicados por `(persona,motivo,referencia)`;
- cero cofres duplicados por nivel/ciclo/nodo;
- `authenticated` sin escritura directa en planes/registros/comercio;
- `public.acreditar_gemas` ejecutable solo por `service_role`;
- ningún movimiento nuevo con `motivo='recompensa_nivel'` después del corte.

- [ ] **Step 7: Revisar el diff completo antes del handoff**

Run: `git diff --check`, `git status --short` y revisar archivo por archivo. No revertir ni reformatear cambios ajenos. Confirmar que los 17 WebM siguen presentes y que ningún secreto fue añadido al índice.

- [ ] **Step 8: Commit final solo donde sea seguro**

Agregar el smoke remoto y nuevos tests. Para `recursos.ts` u otros archivos previamente sucios, stagear solo hunks propios o dejarlos explícitamente sin commit. Mensaje sugerido: `test: verify senderos progression remotely`.

---

## Completion Contract

El trabajo no está completo hasta que:

1. la migración remota y el smoke SQL pasan;
2. el smoke con usuario real desechable pasa y limpia su cuenta;
3. la suite Vitest focalizada y completa pasa;
4. no hay errores TypeScript nuevos;
5. la auditoría remota confirma idempotencia, permisos y saldos;
6. la revisión visual confirma carrusel, mapa único, vídeo/fallback y transición;
7. el diff final no contiene secretos ni cambios ajenos.
