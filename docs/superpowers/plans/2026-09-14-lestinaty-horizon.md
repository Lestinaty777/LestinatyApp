# Lestinaty Horizon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gate the habit-widget gallery and its $129 MXN/month Horizon paywall with RevenueCat entitlement `horizon`.

**Architecture:** Keep RevenueCat access in a focused Horizon purchase service, expose its state through one React Query hook, and make both entry points route through a shared access resolver. The paywall consumes RevenueCat offerings dynamically; the gallery is a preview-only UI until native Android/iOS widget work is added.

**Tech Stack:** Expo Router, React Native, React Query, `react-native-purchases`, `expo-linear-gradient`, existing MasterGlass design system.

**Spec:** `docs/superpowers/specs/2026-09-14-lestinaty-horizon-design.md`

## Global Constraints

- Commercial name: **Lestinaty Horizon**; entitlement identifier: `horizon`.
- Primary offer is $129 MXN monthly; show RevenueCat's localized price when available.
- Do not grant Pro access locally when RevenueCat keys or offerings are absent.
- Do not build Android App Widgets or iOS WidgetKit in this phase.
- Recordatorios shows its Horizon tip after the list, or before the empty state when there are no habits.

---

### Task 1: Horizon RevenueCat service and entitlement state

**Files:**
- Create: `src/nucleo/compras/horizon.ts`
- Create: `src/nucleo/compras/horizon.test.ts`
- Modify: `src/nucleo/compras/revenueCat.ts`

**Interfaces:**
- Consumes: initialized `Purchases` client from `revenueCat.ts`.
- Produces: `ESTADO_HORIZON`, `obtenerEstadoHorizon()`, `obtenerPaquetesHorizon()`, `comprarHorizon()`, `restaurarHorizon()`.

- [ ] **Step 1: Write the failing entitlement test**

```ts
import { describe, expect, it } from 'vitest';
import { resolverEstadoHorizon } from './horizon';

describe('resolverEstadoHorizon', () => {
  it('activa Horizon solo cuando el entitlement horizon está activo', () => {
    expect(resolverEstadoHorizon({ entitlements: { active: { horizon: { identifier: 'horizon' } } } } as never)).toBe('activo');
    expect(resolverEstadoHorizon({ entitlements: { active: {} } } as never)).toBe('inactivo');
  });
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- src/nucleo/compras/horizon.test.ts`

Expected: FAIL because `./horizon` does not exist.

- [ ] **Step 3: Implement the pure resolver and RevenueCat calls**

```ts
export const ENTITLEMENT_HORIZON = 'horizon';
export type EstadoHorizon = 'activo' | 'inactivo' | 'noDisponible';

export function resolverEstadoHorizon(info: CustomerInfo): EstadoHorizon {
  return info.entitlements.active[ENTITLEMENT_HORIZON] ? 'activo' : 'inactivo';
}
```

Use one exported `comprasInicializadas()` helper from `revenueCat.ts`; return
`noDisponible` before calling Purchases when no platform API key was configured.
Select only packages whose `packageType` is monthly or whose product identifier
contains `horizon`; return an empty array if the current offering is absent.

- [ ] **Step 4: Add missing-offering and clamping tests**

```ts
it('reports noDisponible when RevenueCat is not initialized', async () => {
  expect(await obtenerEstadoHorizon()).toBe('noDisponible');
});
```

- [ ] **Step 5: Run focused tests and typecheck**

Run: `npm test -- src/nucleo/compras/horizon.test.ts && npm run typecheck`

Expected: all tests pass and TypeScript exits with code 0.

- [ ] **Step 6: Commit the service**

```bash
git add src/nucleo/compras/revenueCat.ts src/nucleo/compras/horizon.ts src/nucleo/compras/horizon.test.ts
git commit -m "feat: add Horizon RevenueCat entitlement service"
```

### Task 2: Shared Horizon React Query hook and access resolver

**Files:**
- Create: `src/nucleo/compras/useHorizon.ts`
- Create: `src/nucleo/compras/horizonAcceso.ts`
- Create: `src/nucleo/compras/horizonAcceso.test.ts`

**Interfaces:**
- Consumes: `EstadoHorizon` and `obtenerEstadoHorizon` from Task 1.
- Produces: `CLAVE_HORIZON`, `useHorizon()`, `rutaParaHorizon(estado)`.

- [ ] **Step 1: Write the failing routing test**

```ts
import { expect, it } from 'vitest';
import { rutaParaHorizon } from './horizonAcceso';

it('sends an inactive user to the Horizon paywall', () => {
  expect(rutaParaHorizon('inactivo')).toBe('/horizon');
  expect(rutaParaHorizon('activo')).toBe('/habitos/widgets');
});
```

- [ ] **Step 2: Run it and verify it fails**

Run: `npm test -- src/nucleo/compras/horizonAcceso.test.ts`

Expected: FAIL because `./horizonAcceso` does not exist.

- [ ] **Step 3: Implement the resolver and hook**

```ts
export const CLAVE_HORIZON = ['compras', 'horizon'] as const;
export function useHorizon() {
  return useQuery({ queryKey: CLAVE_HORIZON, queryFn: obtenerEstadoHorizon, staleTime: 30_000 });
}
export function rutaParaHorizon(estado: EstadoHorizon) {
  return estado === 'activo' ? '/habitos/widgets' : '/horizon';
}
```

For `noDisponible`, route to `/horizon` so the paywall can explain that the
offer is not yet available.

- [ ] **Step 4: Run focused tests and typecheck**

Run: `npm test -- src/nucleo/compras/horizonAcceso.test.ts && npm run typecheck`

Expected: all tests pass and TypeScript exits with code 0.

- [ ] **Step 5: Commit the access layer**

```bash
git add src/nucleo/compras/useHorizon.ts src/nucleo/compras/horizonAcceso.ts src/nucleo/compras/horizonAcceso.test.ts
git commit -m "feat: add shared Horizon access state"
```

### Task 3: Horizon paywall and protected widget gallery

**Files:**
- Create: `src/modulos/habitos/pantallas/HorizonPaywallPantalla.tsx`
- Create: `src/modulos/habitos/pantallas/WidgetsHabitosPantalla.tsx`
- Create: `app/horizon.tsx`
- Create: `app/habitos/widgets.tsx`
- Modify: `app/_layout.tsx`

**Interfaces:**
- Consumes: `useHorizon`, `obtenerPaquetesHorizon`, `comprarHorizon`, `restaurarHorizon`, `CLAVE_HORIZON` from Tasks 1–2.
- Produces: `/horizon` and `/habitos/widgets` routes.

- [ ] **Step 1: Write the failing pure paywall copy-state test**

```ts
import { expect, it } from 'vitest';
import { textoCtaHorizon } from './horizonCopy';

it('shows the monthly reference price when no offering is available', () => {
  expect(textoCtaHorizon(null)).toBe('Horizon por $129 MXN al mes');
});
```

- [ ] **Step 2: Run it and verify it fails**

Run: `npm test -- src/modulos/habitos/pantallas/horizonCopy.test.ts`

Expected: FAIL because `horizonCopy.ts` does not exist.

- [ ] **Step 3: Implement `horizonCopy.ts` and the paywall**

Render the three Horizon benefits (widgets, progreso de hoy, hábito destacado),
the real localized `package.product.priceString` when present, and the literal
fallback `Horizon por $129 MXN al mes` when it is absent. Disable purchase when
there is no package. On successful buy or restore, invalidate `CLAVE_HORIZON`
and `router.replace('/habitos/widgets')`. A cancelled purchase stays silent;
an exception displays `No pudimos completar la compra. Inténtalo de nuevo.`

- [ ] **Step 4: Implement the protected gallery**

If `useHorizon()` returns anything other than `activo`, immediately replace the
route with `/horizon`. For active users, render three non-interactive preview
cards using MasterGlass: Registro rápido, Progreso de hoy and Hábito destacado.
Include the explicit caption `Los widgets para tu inicio llegarán pronto.`

- [ ] **Step 5: Register Expo Router files and stack screens**

Export each screen from its `app/` file and add `horizon` plus
`habitos/widgets` to `app/_layout.tsx` with `headerShown: false`.

- [ ] **Step 6: Run focused, full tests, and typecheck**

Run: `npm test -- src/modulos/habitos/pantallas/horizonCopy.test.ts && npm test && npm run typecheck`

Expected: all tests pass and TypeScript exits with code 0.

- [ ] **Step 7: Commit the paywall and gallery**

```bash
git add app/_layout.tsx app/horizon.tsx app/habitos/widgets.tsx src/modulos/habitos/pantallas/HorizonPaywallPantalla.tsx src/modulos/habitos/pantallas/WidgetsHabitosPantalla.tsx src/modulos/habitos/pantallas/horizonCopy.ts src/modulos/habitos/pantallas/horizonCopy.test.ts
git commit -m "feat: add Lestinaty Horizon paywall and widget gallery"
```

### Task 4: Habits and reminders discovery entry points

**Files:**
- Modify: `src/modulos/habitos/pantallas/HabitosPantalla.tsx`
- Modify: `src/modulos/habitos/componentes/ListaRecordatoriosHabitos.tsx`
- Create: `src/modulos/habitos/componentes/HorizonTipRecordatorios.tsx`

**Interfaces:**
- Consumes: `useHorizon` and `rutaParaHorizon` from Task 2.
- Produces: a Widgets access from Hábitos and an end-of-list Horizon tip in Recordatorios.

- [ ] **Step 1: Write the failing placement test**

```ts
import { expect, it } from 'vitest';
import { posicionTipHorizon } from './horizonTipEstado';

it('places the Horizon tip after a non-empty reminder list', () => {
  expect(posicionTipHorizon(3)).toBe('final');
  expect(posicionTipHorizon(0)).toBe('antes-vacio');
});
```

- [ ] **Step 2: Run it and verify it fails**

Run: `npm test -- src/modulos/habitos/componentes/horizonTipEstado.test.ts`

Expected: FAIL because `horizonTipEstado.ts` does not exist.

- [ ] **Step 3: Implement the placement helper and `HorizonTipRecordatorios`**

`posicionTipHorizon(cantidad)` returns `antes-vacio` only for 0 and `final`
otherwise. The tip uses MasterGlass, one compact preview, copy
`Lleva tus hábitos a tu inicio`, and a CTA `Explorar widgets`. It resolves the
route from the current Horizon state, displays `Comprobando Horizon…` while
loading, and never claims installed native widgets.

- [ ] **Step 4: Add the Widgets entry in Hábitos**

Add a dedicated `Widgets` card below the existing four access cards instead of
adding a fifth narrow column. Its press handler uses `rutaParaHorizon` after
the hook has loaded.

- [ ] **Step 5: Insert the tip in Recordatorios**

Render the tip after `planes.map(...)` when `planes.length > 0`; when there are
no plans, render it immediately before `Crea un hábito para configurar su
recordatorio.` Keep the list's existing navigation callbacks unchanged.

- [ ] **Step 6: Run focused, full tests, and typecheck**

Run: `npm test -- src/modulos/habitos/componentes/horizonTipEstado.test.ts && npm test && npm run typecheck && git diff --check`

Expected: all tests pass, TypeScript exits with code 0, and diff check has no output.

- [ ] **Step 7: Commit the entry points**

```bash
git add src/modulos/habitos/pantallas/HabitosPantalla.tsx src/modulos/habitos/componentes/ListaRecordatoriosHabitos.tsx src/modulos/habitos/componentes/HorizonTipRecordatorios.tsx src/modulos/habitos/componentes/horizonTipEstado.ts src/modulos/habitos/componentes/horizonTipEstado.test.ts
git commit -m "feat: add Horizon widgets discovery entry points"
```
