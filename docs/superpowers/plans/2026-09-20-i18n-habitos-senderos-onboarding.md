# i18n de hábitos, senderos y onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Traducir al español e inglés cada texto visible de las pantallas acordadas, reutilizando i18next existente.

**Architecture:** `src/servicios/i18n/recursos.ts` conserva el único namespace `translation` y suma secciones por dominio/pantalla con paridad ES/EN. Cada componente React obtiene `t` mediante `useTranslation()`; los servicios sin React usan `i18n.t` cuando corresponda. No se cambian rutas, assets, datos ni estructura de UI.

**Tech Stack:** TypeScript, React Native, Expo, i18next, react-i18next, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-20-i18n-habitos-senderos-onboarding-design.md`

## Global Constraints

- El español conserva literalmente el texto actual; inglés es natural y contextual.
- Incluye accesibilidad, alertas, placeholders, botones y mensajes dinámicos con interpolación.
- Excluye `metas`, `miEspacio`, valores internos Supabase, enums, assets, iconos, rutas y comentarios.
- Cada bloque se verifica antes de iniciar el siguiente.

---

### Task 1: Base verificable de recursos

**Files:**
- Modify: `src/servicios/i18n/recursos.ts`
- Create: `src/servicios/i18n/recursos.test.ts`

**Interfaces:**
- Produces: secciones raíz equivalentes para `recursosI18n.es.translation` y `recursosI18n.en.translation`.

- [x] **Step 1: Escribir prueba de presencia de secciones bilingües**

```ts
expect(Object.keys(recursosI18n.es.translation).sort())
  .toEqual(Object.keys(recursosI18n.en.translation).sort());
```

- [x] **Step 2: Ejecutar la prueba en rojo antes de añadir las claves.**
- [x] **Step 3: Añadir las secciones raíz de los siete bloques a ambos idiomas y registrar cada cadena al extraerla.**
- [x] **Step 4: Ejecutar la prueba focalizada hasta que pase.**

### Task 2: Tab Hábitos y creación

**Files:**
- Modify: `src/modulos/habitos/pantallas/HabitosPantalla.tsx`
- Modify: `src/modulos/habitos/componentes/CrearHabitoWizard.tsx`
- Modify: `src/modulos/habitos/componentes/WidgetRegistrarProgreso.tsx`
- Modify: `src/servicios/i18n/recursos.ts`

**Interfaces:**
- Consumes: `t` de `useTranslation()` y claves `habitos.pantalla`, `habitos.crearWizard`, `habitos.registrarProgreso`.
- Produces: texto de tab, wizard y widget resuelto por idioma.

- [x] **Step 1: Inventariar todos los literales visibles de cada archivo con `rg -n "<Texto|accessibilityLabel|Alert\.alert|placeholder|>[^<{][^<]+<"`.**
- [x] **Step 2: Añadir cada literal exacto a ES y su traducción EN en la sección correspondiente, usando `{{variable}}` para valores interpolados.**
- [x] **Step 3: Agregar `useTranslation`, sustituir cada literal visible por `t('habitos.…')` y conservar valores de backend sin traducción.**
- [x] **Step 4: Ejecutar pruebas focalizadas, `npx tsc --noEmit` y confirmar que no hay errores nuevos en estos archivos.**

**Resultado verificado:** `recursos.test.ts`, `plantillasHabitos.test.ts` y `creacionPremium.test.ts`: 8 pruebas aprobadas. El typecheck conserva exclusivamente los 10 diagnósticos preexistentes de `WidgetRegistrarProgreso.tsx` y `SesionMisionPantalla.tsx`.

### Task 3: Tab Senderos y mapa

**Files:**
- Modify: `src/modulos/senderos/pantallas/SenderosPantalla.tsx`
- Modify: `src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx`
- Modify: `src/servicios/i18n/recursos.ts`

**Interfaces:**
- Consumes: claves `senderos.mapa` y `senderos.contenedorMapa`.
- Produces: alertas, tooltips, accesibilidad y contenido de mapa bilingües.

- [x] **Step 1: Inventariar textos visibles, alertas y descripciones de nodo.**
- [x] **Step 2: Registrar par ES/EN para el switcher y tooltip del mapa; reemplazarlo con `t`, interpolando metas y unidades.**
- [x] **Step 3: Auditar `MapaSenderosPantalla.tsx` y todo texto restante de sus componentes directos.**
- [x] **Step 4: Ejecutar `npx vitest run src/modulos/senderos/algoritmo/mapaProcedural.test.ts` y comprobación de TypeScript local.**

**Resultado verificado:** `mapaProcedural.test.ts` y `recursos.test.ts`: 13 pruebas aprobadas. El typecheck conserva exclusivamente los 10 diagnósticos preexistentes de `WidgetRegistrarProgreso.tsx` y `SesionMisionPantalla.tsx`.

### Task 4: Tienda, Insights y Perfil

**Files:**
- Modify: `src/modulos/tienda/pantallas/TiendaArbolesPantalla.tsx`
- Modify: `src/modulos/tienda/componentes/CarruselHeroTienda.tsx`
- Modify: `src/modulos/tienda/componentes/TarjetaReferidosGemas.tsx`
- Modify: `src/modulos/insights/pantallas/InsightsPantalla.tsx`
- Modify: `src/modulos/insights/componentes/GaleriaWidgetsModal.tsx`
- Modify: `src/modulos/direccion/pantallas/PerfilPantalla.tsx`
- Modify: `src/servicios/i18n/recursos.ts`

- [ ] **Step 1: Extraer literales visibles por archivo y agruparlos bajo `tienda`, `insights` y `perfil`.**
- [ ] **Step 2: Añadir los pares ES/EN exactos, reemplazar los literales y conservar precio/fecha/cantidad como variables interpoladas.**
- [ ] **Step 3: Ejecutar pruebas focalizadas existentes de tienda/insights y typecheck sin nuevos errores.**

### Task 5: Splash y onboarding

**Files:**
- Modify: `src/nucleo/arranque/AnimacionApertura.tsx`
- Modify: `src/modulos/onboarding/pantallas/IntroduccionAppPantalla.tsx`
- Modify: `src/modulos/onboarding/pantallas/AccesoOnboardingPantalla.tsx`
- Modify: `src/modulos/onboarding/componentes/FormularioAccesoOnboarding.tsx`
- Modify: `src/modulos/onboarding/pantallas/RegaloBienvenidaPantalla.tsx`
- Modify: `src/modulos/onboarding/componentes/CarruselArbolRegalo.tsx`
- Modify: `src/modulos/onboarding/componentes/SelectorArbolRegalo.tsx`
- Modify: `src/modulos/onboarding/pantallas/RegaloTrialHorizonPantalla.tsx`
- Modify: `src/servicios/i18n/recursos.ts`

- [ ] **Step 1: Inventariar textos y accesibilidad por pantalla, sin traducir nombres propios de paquetes.**
- [ ] **Step 2: Añadir secciones `arranque` y `onboarding` con ES/EN y reemplazar los literales con `t`.**
- [ ] **Step 3: Confirmar que interpolaciones de días, precio, prueba y nombre de paquete preserven las variables originales.**
- [ ] **Step 4: Ejecutar typecheck y las pruebas de onboarding existentes.**

### Task 6: Horizon, gemas y subpantallas de Hábitos

**Files:**
- Modify: `src/modulos/habitos/pantallas/HorizonPaywallPantalla.tsx`
- Modify: componente real montado por `app/tienda/gemas.tsx`
- Modify: `src/modulos/habitos/pantallas/DetalleHabitoPantalla.tsx`
- Modify: `src/modulos/habitos/pantallas/ProgresionHabitosPantalla.tsx`
- Modify: `src/modulos/habitos/pantallas/RecordatoriosHabitosPantalla.tsx`
- Modify: `src/modulos/habitos/pantallas/WidgetsHabitosPantalla.tsx`
- Modify: `src/modulos/habitos/pantallas/CategoriaHabitosPantalla.tsx`
- Modify: `src/servicios/i18n/recursos.ts`

- [ ] **Step 1: Resolver el componente de gemas desde la ruta antes de extraer strings.**
- [ ] **Step 2: Extraer, registrar y sustituir todo texto visible bajo `horizon`, `tienda.gemas` y `habitos.*`.**
- [ ] **Step 3: Usar interpolación para rachas, porcentajes, niveles, días, importes y metas.**
- [ ] **Step 4: Ejecutar pruebas de hábitos y typecheck, sin modificar errores previos de `Rebote`.**

### Task 7: Subpantallas de Senderos y verificación final

**Files:**
- Modify: `src/modulos/senderos/pantallas/DetalleSenderoPantalla.tsx`
- Modify: `src/modulos/senderos/pantallas/SesionMisionPantalla.tsx`
- Modify: `src/modulos/senderos/paginas/AnalisisSenderos.tsx`
- Modify: `src/modulos/senderos/pantallas/VistaPreviaPaquetePantalla.tsx`
- Modify: `src/servicios/i18n/recursos.ts`

- [ ] **Step 1: Extraer alertas, botones, etiquetas, cronómetro, accesibilidad y estados vacíos.**
- [ ] **Step 2: Registrar claves `senderos.detalle`, `senderos.mision`, `senderos.analisis` y `senderos.vistaPrevia`, después sustituir cada literal visible.**
- [ ] **Step 3: Ejecutar `npx tsc --noEmit`; confirmar que solo quedan los errores preexistentes documentados.**
- [ ] **Step 4: Ejecutar `npx vitest run` y revisar que no haya regresiones.**
