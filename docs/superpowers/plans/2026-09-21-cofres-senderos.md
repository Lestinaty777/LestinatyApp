# Cofres de Senderos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir cofres reclamables y tematizados a los mapas de hábitos, con gemas free seguras y recompensa final de nivel diferida.

**Architecture:** Los hitos de cofre se derivan de días completados, sin entrar a la lista de nodos. Supabase guarda y acredita cada reclamo de manera transaccional; la UI consulta el estado y muestra un cofre disponible o cerrado. Los PNG usan `MasterChanger`; el vídeo se selecciona de siete variantes WebM preteñidas.

**Tech Stack:** Expo/React Native, expo-video, React Query, Supabase PostgreSQL/RPC, FFmpeg, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-21-cofres-senderos-design.md`

## Global Constraints

- Recompensas y aleatoriedad se verifican solo en servidor.
- No aumentar `cantidadNodos` ni modificar la progresión de días.
- Cofre reclamado: siempre `cofre-cerrado.png` y no presionable.
- Usar `colorMasterMasCercano` para elegir el WebM y `MasterChanger` para PNG.
- Vídeo local, una reproducción, sin loop.

---

### Task 1: Contrato puro de hitos y colores de cofre

**Files:**
- Create: `src/modulos/habitos/cofresSendero.ts`
- Test: `src/modulos/habitos/cofresSendero.test.ts`

**Consumes:** `DIAS_REQUERIDOS_POR_NIVEL`, `colorMasterMasCercano`.

**Produces:** `cofresDesbloqueables(diasCompletados, diasNivel)` y `videoCofreParaColor(colorPaquete)`.

- [ ] **Step 1: Write the failing test**

```ts
expect(cofresDesbloqueables(6, 7)).toEqual([
  { clave: 'menor:3', tipo: 'menor', umbral: 3 },
  { clave: 'menor:6', tipo: 'menor', umbral: 6 },
]);
expect(cofresDesbloqueables(7, 7)).toContainEqual({ clave: 'final:7', tipo: 'final', umbral: 7 });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/modulos/habitos/cofresSendero.test.ts`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Write minimal implementation**

```ts
export function cofresDesbloqueables(diasCompletados: number, diasNivel: number) {
  const menores = Array.from({ length: Math.floor(diasCompletados / 3) }, (_, indice) => ({ clave: `menor:${(indice + 1) * 3}`, tipo: 'menor' as const, umbral: (indice + 1) * 3 }));
  return diasCompletados >= diasNivel ? [...menores, { clave: `final:${diasNivel}`, tipo: 'final' as const, umbral: diasNivel }] : menores;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/modulos/habitos/cofresSendero.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/modulos/habitos/cofresSendero.ts src/modulos/habitos/cofresSendero.test.ts
git commit -m "feat: define sendero chest milestones"
```

### Task 2: Recompensa persistente y reclamo idempotente

**Files:**
- Create: `supabase/migrations/20260921_43_cofres_senderos.sql`
- Test: `supabase/tests/06_cofres_senderos.sql`
- Modify: `src/modulos/habitos/habitos.servicio.ts`

**Consumes:** hitos `(habito_id, nivel, umbral, tipo)` y `comercio.acreditar_gemas`.

**Produces:** RPC `reclamar_cofre_sendero(p_habito_id uuid, p_nivel integer, p_umbral integer, p_tipo text)` que devuelve `{gemas, reclamado_at}`.

- [ ] **Step 1: Write the failing SQL test**

```sql
select public.reclamar_cofre_sendero(current_setting('app.smoke_habito')::uuid, 1, 3, 'menor');
-- asserts: cantidad between 8 and 15; second call returns the same claim and no saldo adicional
```

- [ ] **Step 2: Run the migration test in a disposable Supabase database**

Expected: FAIL because the RPC and table do not exist.

- [ ] **Step 3: Add migration**

```sql
create table public.habitos_cofres_reclamados (
  usuario_id uuid not null references auth.users(id), habito_id uuid not null references public.habitos_items(id),
  nivel smallint not null, umbral smallint not null, tipo text not null check (tipo in ('menor','final')),
  gemas integer not null, reclamado_at timestamptz not null default now(),
  primary key (usuario_id, habito_id, nivel, umbral, tipo)
);
```

La función debe validar propiedad, contar días completos del plan del nivel y usar `floor(random() * 8)::int + 8` solo durante el `insert`. Debe ampliar el constraint de motivos con `recompensa_cofre_sendero`. La recompensa final se vuelve pendiente y se acredita solo desde esta RPC.

- [ ] **Step 4: Add typed service wrappers and invalidate saldo/cofres after claim**

```ts
export async function reclamarCofreSendero(input: { habitoId: string; nivel: number; umbral: number; tipo: 'menor' | 'final' }) { /* rpc */ }
```

- [ ] **Step 5: Run SQL test and TypeScript tests**

Run: `npm test -- src/modulos/habitos/cofresSendero.test.ts`

Expected: PASS; SQL test passes against the migration.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260921_43_cofres_senderos.sql supabase/tests/06_cofres_senderos.sql src/modulos/habitos/habitos.servicio.ts
git commit -m "feat: add idempotent sendero chest rewards"
```

### Task 3: Assets de vídeo tematizados

**Files:**
- Create: `scripts/generar-videos-cofre-tema.sh`
- Create: `assets/ilustraciones/senderos/biomas/cofres/abrir-cofre-{1..7}.webm`
- Create: `src/modulos/habitos/cofreVideoTema.ts`
- Test: `src/modulos/habitos/cofreVideoTema.test.ts`

**Consumes:** `abrir-cofre.webm`, `ColorMaster` 1–7.

**Produces:** `obtenerVideoCofreTema(color: ColorMaster): AVPlaybackSource`.

- [ ] **Step 1: Write failing registry test**

```ts
for (const color of [1, 2, 3, 4, 5, 6, 7] as const) expect(obtenerVideoCofreTema(color)).toBeDefined();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/modulos/habitos/cofreVideoTema.test.ts`

Expected: FAIL because no variant registry exists.

- [ ] **Step 3: Generate variants and registry**

El script usa `ffmpeg -vf hue=h=<delta>` sobre el WebM verde, fija códec VP9 con alpha preservado si el archivo de origen lo incluye, y documenta los siete deltas. El registro usa `require()` estático por variante.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/modulos/habitos/cofreVideoTema.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/generar-videos-cofre-tema.sh assets/ilustraciones/senderos/biomas/cofres src/modulos/habitos/cofreVideoTema.ts src/modulos/habitos/cofreVideoTema.test.ts
git commit -m "feat: add themed chest opening videos"
```

### Task 4: Cofres interactivos en el mapa

**Files:**
- Create: `src/modulos/senderos/componentes/mapa/CofreSendero.tsx`
- Modify: `src/modulos/habitos/hooks/useSenderoHabito.ts`
- Modify: `src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx`
- Modify: `src/modulos/senderos/pantallas/MapaSenderosPantalla.tsx`
- Test: `src/modulos/habitos/cofresSendero.test.ts`

**Consumes:** estado remoto de cofres, hitos puros, `reclamarCofreSendero`, `TonoDelHabito`.

**Produces:** capas de cofre posicionadas junto a su nodo de desbloqueo, apertura local y saldo actualizado.

- [ ] **Step 1: Write failing projection test**

```ts
expect(proyectarCofresEnMapa({ diasCompletados: 6, diasNivel: 7, reclamados: [] })).toHaveLength(2);
expect(proyectarCofresEnMapa({ diasCompletados: 6, diasNivel: 7, reclamados: ['menor:3'] })[0].reclamado).toBe(true);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/modulos/habitos/cofresSendero.test.ts`

Expected: FAIL because the projection does not exist.

- [ ] **Step 3: Implement component and map layer**

`CofreSendero` renders `MasterChanger` for `cofre.png` disponible and `cofre-cerrado.png` reclamado. Al tocar uno desbloqueado, reproduce una sola vez `VideoView`, llama la RPC, invalida `CLAVE_SALDO_GEMAS`, y lo deja cerrado. `ContenedorMapaSenderos` recibe capas de cofre separadas de `nodos` y las posiciona al costado del nodo de umbral.

- [ ] **Step 4: Run unit tests and manual Android check**

Run: `npm test -- src/modulos/habitos/cofresSendero.test.ts`

Expected: PASS. Manual: reclamar, reabrir mapa, verificar cofre cerrado y saldo persistente.

- [ ] **Step 5: Commit**

```bash
git add src/modulos/senderos/componentes/mapa/CofreSendero.tsx src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx src/modulos/senderos/pantallas/MapaSenderosPantalla.tsx src/modulos/habitos/hooks/useSenderoHabito.ts src/modulos/habitos/cofresSendero.test.ts
git commit -m "feat: render claimable themed sendero chests"
```
