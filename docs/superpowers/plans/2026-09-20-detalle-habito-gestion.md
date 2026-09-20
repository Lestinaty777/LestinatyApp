# Gestión de hábitos desde Detalle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mostrar todos los hábitos activos en Senderos y permitir editar o archivar un hábito de forma segura desde su detalle simplificado.

**Architecture:** Una migración añade RPCs transaccionales para editar la identidad y sustituir el plan vigente sin solapamientos, y para archivar sin borrar historial. Los servicios exponen esas RPCs; Senderos consume la consulta global existente. Detalle pasa a una hoja con hero, progreso, programación y formularios internos de edición/archivo.

**Tech Stack:** Expo/React Native, TypeScript, TanStack Query, Supabase Postgres RPC, Vitest, MasterGlass/MasterButton/Lucide.

**Spec:** `docs/superpowers/specs/2026-09-20-detalle-habito-gestion-design.md`

## Global Constraints

- Usar fecha local (`fechaLocalHoy`) para la vigencia de un plan.
- Editar conserva registros, semilla, paquete y nivel vigente.
- Archivar cambia estado, no elimina datos ni crea pantalla de archivados.
- Senderos y “Mis hábitos” muestran solo `estado = activo`, sin filtro de día programado.
- Todo texto nuevo debe existir en español e inglés.

---

### Task 1: RPCs seguras de edición y archivado

**Files:**
- Create: `supabase/migrations/20260920_42_gestion_detalle_habito.sql`
- Test: `supabase/tests/06_gestion_detalle_habito.sql`

**Interfaces:**
- Produces `public.actualizar_habito_desde_detalle(...) returns jsonb`.
- Produces `public.archivar_habito(uuid) returns jsonb`.

- [ ] **Step 1: Write the failing SQL tests**

```sql
select is(
  (select estado from public.habitos_items where id = v_habito),
  'activo',
  'el hábito permanece activo después de editar'
);
select is(
  (select count(*) from public.habitos_planes where habito_id = v_habito and hasta_fecha is null),
  1::bigint,
  'editar deja exactamente un plan abierto'
);
select is((select estado from public.habitos_items where id = v_habito), 'archivado', 'archivar no elimina el hábito');
```

- [ ] **Step 2: Run the SQL test in the Supabase local test runner**

Run: `supabase test db supabase/tests/06_gestion_detalle_habito.sql`

Expected: FAIL because neither RPC exists.

- [ ] **Step 3: Add the migration**

```sql
update public.habitos_planes
set hasta_fecha = p_desde_fecha
where habito_id = p_habito_id and hasta_fecha is null;

insert into public.habitos_planes
  (habito_id, frecuencia, dias_semana, veces_por_semana, objetivo_valor,
   desde_fecha, recordatorio_activo, hora_recordatorio,
   mostrar_nombre_notificacion, nivel)
values
  (p_habito_id, p_frecuencia, p_dias_semana, p_veces_por_semana,
   p_objetivo_valor, p_desde_fecha, p_recordatorio_activo,
   p_hora_recordatorio, p_mostrar_nombre_notificacion, v_nivel);
```

Validate owner with `usuario_id = auth.uid()`, validate reminder hour when enabled,
update only editable item fields, and archive with:

```sql
update public.habitos_items
set estado = 'archivado', archivado_at = now(), updated_at = now()
where id = p_habito_id and usuario_id = auth.uid();
```

- [ ] **Step 4: Run SQL test again**

Run: `supabase test db supabase/tests/06_gestion_detalle_habito.sql`

Expected: PASS.

- [ ] **Step 5: Commit the migration and test**

```bash
git add supabase/migrations/20260920_42_gestion_detalle_habito.sql supabase/tests/06_gestion_detalle_habito.sql
git commit -m "feat: manage habit details safely"
```

### Task 2: Servicios y resumen global de hábitos

**Files:**
- Modify: `src/modulos/habitos/habitos.servicio.ts`
- Modify: `src/modulos/habitos/tipos.ts`
- Create: `src/modulos/habitos/gestionDetalleHabito.ts`
- Create: `src/modulos/habitos/gestionDetalleHabito.test.ts`

**Interfaces:**
- Produces `actualizarHabitoDesdeDetalle(input): Promise<void>`.
- Produces `archivarHabito(id): Promise<void>`.
- Produces `normalizarEdicionHabito(detalle): EdicionHabito` for the form.

- [ ] **Step 1: Write the failing unit tests**

```ts
expect(normalizarEdicionHabito(detalle)).toMatchObject({
  titulo: 'Meditar', frecuencia: 'dias_semana', diasSemana: [1, 2, 3, 4, 5], meta: 10,
});
expect(validarEdicionHabito({ ...edicion, diasSemana: [] })).toBe('Selecciona al menos un día.');
```

- [ ] **Step 2: Run the focused test**

Run: `npm test -- src/modulos/habitos/gestionDetalleHabito.test.ts`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement types, normalizer and service wrappers**

```ts
export async function archivarHabito(habitoId: string): Promise<void> {
  const { error } = await obtenerClienteSupabase().rpc('archivar_habito', { p_habito_id: habitoId });
  if (error) throw error;
}
```

`actualizarHabitoDesdeDetalle` must call the edit RPC with `fechaLocalHoy()`;
the form normalizer must map null week days to `[]` and preserve the plan level
through the RPC rather than sending a client-controlled level.

- [ ] **Step 4: Run focused tests**

Run: `npm test -- src/modulos/habitos/gestionDetalleHabito.test.ts src/modulos/habitos/resumenHabitosActivos.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit service layer**

```bash
git add src/modulos/habitos/habitos.servicio.ts src/modulos/habitos/tipos.ts src/modulos/habitos/gestionDetalleHabito.ts src/modulos/habitos/gestionDetalleHabito.test.ts
git commit -m "feat: expose habit edit and archive actions"
```

### Task 3: Senderos con el inventario activo completo

**Files:**
- Modify: `src/modulos/senderos/pantallas/MapaSenderosPantalla.tsx:24,122-131,570-580`
- Test: `src/modulos/habitos/resumenHabitosActivos.test.ts`

**Interfaces:**
- Consumes `obtenerHabitosActivos(): Promise<HabitoResumen[]>`.

- [ ] **Step 1: Extend the regression test**

```ts
expect(resumirHabitosActivos({ fecha: '2026-09-20', items, planes, registros: [] })
  .map((habito) => habito.id)).toContain('meditar');
```

- [ ] **Step 2: Run the test and verify it is green**

Run: `npm test -- src/modulos/habitos/resumenHabitosActivos.test.ts`

Expected: PASS; this confirms the source already supplies non-scheduled active habits.

- [ ] **Step 3: Replace Senderos’ panel query**

```ts
const consultaHabitos = useQuery({
  queryKey: ['habitos', 'activos'],
  queryFn: () => obtenerHabitosActivos(),
});
const habitosReales = consultaHabitos.data ?? [];
```

Keep `obtenerDetallesHabitosHoy()` only for supplemental racha/nivel card data;
empty/loading states must use `consultaHabitos`.

- [ ] **Step 4: Run unit tests and typecheck**

Run: `npm test -- src/modulos/habitos/resumenHabitosActivos.test.ts && npm run typecheck`

Expected: unit test PASS; report any pre-existing type errors separately.

- [ ] **Step 5: Commit Senderos change**

```bash
git add src/modulos/senderos/pantallas/MapaSenderosPantalla.tsx src/modulos/habitos/resumenHabitosActivos.test.ts
git commit -m "fix: show all active habits in trails"
```

### Task 4: Hoja Detalle compacta, editable y archivables

**Files:**
- Modify: `src/modulos/habitos/pantallas/DetalleHabitoPantalla.tsx`
- Modify: `src/servicios/i18n/recursos.ts`
- Test: `src/modulos/habitos/gestionDetalleHabito.test.ts`

**Interfaces:**
- Consumes `EdicionHabito`, `actualizarHabitoDesdeDetalle`, `archivarHabito`.
- Invalidates `['habitos','panel']`, `['habitos','activos']`, `['habitos','detalle', id]`, `['habitos','detalles-hoy']`, `['habitos','cercania-nivel']`, and `['habitos','mejor-racha']` after mutation.

- [ ] **Step 1: Add form-state test cases**

```ts
expect(validarEdicionHabito({ ...base, recordatorioActivo: true, horaRecordatorio: null }))
  .toBe('El recordatorio necesita una hora.');
expect(validarEdicionHabito({ ...base, titulo: '   ' }))
  .toBe('Escribe un nombre para tu hábito.');
```

- [ ] **Step 2: Run the focused test**

Run: `npm test -- src/modulos/habitos/gestionDetalleHabito.test.ts`

Expected: FAIL until validation messages are implemented.

- [ ] **Step 3: Replace the visual hierarchy**

Use a single scroll view within `HojaDeslizante`: compact header, `AuroraBoreal`,
MasterGlass hero using `buscarIconoHabito`, progress CTA, schedule card, short
week/racha summary, and a final actions card. Remove the seven-day animated bar
chart and advice card. Use `MasterButton` for save/register and Lucide controls
only when there is no matching `/assets/icons/ui` asset.

- [ ] **Step 4: Add edit and archive sheets**

The edit sheet loads `normalizarEdicionHabito(d)`, allows only the fields in the
spec, disables Save while invalid or pending, and refetches the detail after save.
The archive confirmation must say history is kept and call `archivarHabito`; on
success close the detail sheet.

- [ ] **Step 5: Add Spanish and English copy**

Add keys for `editHabit`, `archiveHabit`, `archiveConfirmTitle`,
`archiveConfirmDescription`, `saveChanges`, `schedule`, `everyDay`,
`selectedDays`, and validation messages in both resource trees.

- [ ] **Step 6: Run focused tests and typecheck**

Run: `npm test -- src/modulos/habitos/gestionDetalleHabito.test.ts src/modulos/habitos/resumenHabitosActivos.test.ts && npm run typecheck`

Expected: tests PASS; report unrelated pre-existing typecheck failures.

- [ ] **Step 7: Commit UI and translations**

```bash
git add src/modulos/habitos/pantallas/DetalleHabitoPantalla.tsx src/servicios/i18n/recursos.ts src/modulos/habitos/gestionDetalleHabito.test.ts
git commit -m "feat: manage habits from detail sheet"
```

### Task 5: Full regression verification

**Files:**
- Verify only.

- [ ] **Step 1: Verify whitespace and changed files**

Run: `git diff --check && git status --short`

Expected: no whitespace errors; separate pre-existing user changes from this feature.

- [ ] **Step 2: Run all tests**

Run: `npm test`

Expected: PASS with zero failed tests.

- [ ] **Step 3: Apply and test migration against the project database**

Run: `supabase db push && supabase test db supabase/tests/06_gestion_detalle_habito.sql`

Expected: migration applied and SQL test PASS.
