# Hábitos Productividad Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar creación premium, cumplimiento y cinco categorías de Hábitos conectadas a Supabase.

**Architecture:** La migración 10 amplía las RPC existentes sin crear tablas. Servicios tipados separan lista, creación, progreso y conexiones; la UI mantiene la composición de Inicio, mientras el wizard dedicado reemplaza el modal básico.

**Tech Stack:** Expo Router, React Native, React Query, TypeScript, Vitest, Supabase Postgres/RLS y `lucide-react-native`.

**Spec:** `docs/superpowers/specs/2026-09-10-habitos-productividad-design.md`

## Global Constraints

- Reutilizar las tablas `habitos-*` existentes; no crear duplicados.
- `CrearHabitoWizard` debe usar `Boton` variante `sendero` para sus acciones principales.
- Las cinco categorías usan datos reales y estados vacíos accionables.
- Expo no accede a `privacidad`, secretos ni a la cola de notificaciones.
- Toda mutación invalida panel, lista y detalle de hábito correspondientes.

---

### Task 1: Contrato de creación y lista completa

**Files:**
- Create: `supabase/migrations/20260910_10_habitos_creacion_premium.sql`
- Modify: `src/modulos/habitos/habitos.servicio.ts`
- Modify: `src/modulos/habitos/tipos.ts`
- Test: `src/modulos/habitos/creacionPremium.test.ts`

**Interfaces:**
- Produces `crear_habito(...)` ampliada y `obtenerHabitosActivos(): Promise<HabitoLista[]>`.

- [ ] Write a failing test proving the creation payload normalizes a daily check habit and a scheduled duration habit.
- [ ] Run `npm test -- src/modulos/habitos/creacionPremium.test.ts` and observe failure.
- [ ] Implement typed payload normalization and the RLS-backed active list query.
- [ ] Run the same test and `npm run typecheck`.

### Task 2: Wizard premium de creación

**Files:**
- Create: `src/modulos/habitos/componentes/CrearHabitoWizard.tsx`
- Create: `src/modulos/habitos/creacionWizard.estado.ts`
- Create: `src/modulos/habitos/creacionWizard.estado.test.ts`
- Modify: `src/modulos/habitos/pantallas/HabitosPantalla.tsx`

**Interfaces:**
- Consumes: `CrearHabitoInput` de Task 1.
- Produces: `onCrear(input: CrearHabitoInput)` solo al confirmar el quinto paso.

- [ ] Write failing reducer tests for navigation, validation and retained values after Back.
- [ ] Run `npm test -- src/modulos/habitos/creacionWizard.estado.test.ts` and observe failure.
- [ ] Implement reducer and full-screen five-step wizard with sendero buttons.
- [ ] Run wizard tests and typecheck.

### Task 3: Sincronizar panel, lista, acciones y detalle

**Files:**
- Modify: `src/modulos/habitos/habitos.servicio.ts`
- Modify: `src/modulos/habitos/pantallas/HabitosPantalla.tsx`
- Modify: `src/modulos/habitos/pantallas/DetalleHabitoPantalla.tsx`
- Test: `src/modulos/habitos/presentacion.test.ts`

**Interfaces:**
- Consumes: `PanelHabitos`, `HabitoLista` y mutaciones de Task 1.
- Produces: tabs realistas, refresco inmediato y navegación a detalle.

- [ ] Write failing presentation tests that map analytical IDs to habit names and distinguish every empty state.
- [ ] Run `npm test -- src/modulos/habitos/presentacion.test.ts` and observe failure.
- [ ] Query panel/lista separately, enrich results and invalidate all dependent queries after create/progress.
- [ ] Run relevant tests and typecheck.

### Task 4: Conexiones y análisis progresivo

**Files:**
- Modify: `supabase/migrations/20260910_10_habitos_creacion_premium.sql`
- Modify: `src/modulos/habitos/habitos.servicio.ts`
- Modify: `src/modulos/habitos/pantallas/HabitosPantalla.tsx`
- Test: `src/modulos/habitos/analiticaHabitos.test.ts`

**Interfaces:**
- Produces: creación de conexión manual y presentación de confianza/muestras para patrones, riesgo e impacto.

- [ ] Write failing tests for confidence copy at one, four and seven samples.
- [ ] Run `npm test -- src/modulos/habitos/analiticaHabitos.test.ts` and observe failure.
- [ ] Add RPC/servicio de conexión, progressive analytics fields and actionable UI cards.
- [ ] Run focused tests, complete suite and typecheck.

### Task 5: Aplicar migración y verificar remoto

**Files:**
- Modify: `supabase/privacidad-schema.md` only if the migration changes privacy behavior.
- Modify: `supabase/public-schema.md`
- Modify: `supabase/resumen.md`

**Interfaces:**
- Consumes: migration 10 and deployed notification flow.
- Produces: schema documentation and verified remote RPC contracts.

- [ ] Apply migration 10 using the existing Supabase management access.
- [ ] Verify new function signatures and existing data tables with read-only SQL.
- [ ] Run `npm test`, `npm run typecheck` and `git diff --check`.
