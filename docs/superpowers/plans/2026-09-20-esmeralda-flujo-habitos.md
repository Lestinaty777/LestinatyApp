# Esmeralda en el flujo de hábitos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Usar siempre el paquete Esmeralda para un hábito sin semilla y eliminar Selva del flujo de hábitos y senderos.

**Architecture:** Centralizar la resolución de paquete y de sus etapas en los módulos de paquetes existentes. El mapa, el wizard y las vistas de hábito consumirán esa fuente, de modo que `etapa1.png` a `etapa7.png` procedan siempre del paquete asignado, con Esmeralda como fallback.

**Tech Stack:** TypeScript, React Native, Expo, Vitest.

**Spec:** Diseño aprobado en la conversación del 2026-09-20.

## Global Constraints

- El alcance es hábitos y senderos; Salud, ABY y Perfil conservan Selva.
- Un hábito sin semilla usa `esmeralda`.
- No se modifican assets ni cambios existentes no relacionados.

---

### Task 1: Resolver un paquete de hábito único

**Files:**
- Modify: `src/modulos/senderos/algoritmo/registroBiomas.ts`
- Modify: `src/modulos/habitos/habitos.servicio.ts`
- Test: `src/modulos/senderos/algoritmo/registroBiomas.test.ts`

**Interfaces:**
- Produces: `obtenerAssetsBioma('habitos', paqueteId, nivel)` siempre resuelve las siete etapas de un paquete registrado o Esmeralda.

- [ ] **Step 1: Write the failing test**

```ts
expect(obtenerAssetsBioma('habitos', undefined, 3)
  .find((asset) => asset.rol === 'arbol-principal')?.nombre)
  .toBe('esmeralda etapa 3');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/modulos/senderos/algoritmo/registroBiomas.test.ts`

- [ ] **Step 3: Write minimal implementation**

```ts
const paquete = obtenerAssetsPaquete(paqueteId) ?? obtenerAssetsPaquete('esmeralda');
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/modulos/senderos/algoritmo/registroBiomas.test.ts`

### Task 2: Llevar los assets de paquete a las vistas de hábito

**Files:**
- Modify: `src/modulos/habitos/componentes/CrearHabitoWizard.tsx`
- Modify: `src/modulos/habitos/componentes/TarjetaSenderoHabito.tsx`
- Modify: `src/modulos/habitos/pantallas/HabitosPantalla.tsx`
- Modify: `src/modulos/habitos/pantallas/DetalleHabitoPantalla.tsx`
- Modify: `src/modulos/senderos/pantallas/SesionMisionPantalla.tsx`

**Interfaces:**
- Consumes: paquete resuelto y sus `etapas`, `arbusto`, `flor` y `semilla`.
- Produces: todas las vistas de hábito muestran el paquete asignado o Esmeralda.

- [ ] **Step 1: Write focused failing tests for each resolver puro afectado**
- [ ] **Step 2: Run each test and verify its expected failure**
- [ ] **Step 3: Sustituir `obtenerAssetsSelvaPorTono` y `ARBUSTO_SELVA_BASE` por los assets del paquete resuelto**
- [ ] **Step 4: Run the focused tests**

### Task 3: Verificar etapas en senderos y regresión

**Files:**
- Modify: `src/modulos/senderos/algoritmo/mapaProcedural.test.ts`
- Test: `src/modulos/habitos/habitos.servicio.test.ts`

**Interfaces:**
- Consumes: `paqueteId` resuelto y nivel 1-7.
- Produces: senderos conserva sus roles actual/anterior/anterior-2 usando las imágenes del paquete real.

- [ ] **Step 1: Write a failing test para el fallback Esmeralda y sus etapas 1-3**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implementar el cambio mínimo de fallback y actualizar consumidores**
- [ ] **Step 4: Run focused tests and `npm run typecheck`**
