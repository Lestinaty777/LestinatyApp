import { configDefaults, defineConfig } from 'vitest/config';

// .kilo/ guarda checkouts (worktrees) de otros agentes con su propia copia de
// los tests: Vitest los descubría y corría contra ESTE código con sus listas
// de excepciones ya desactualizadas, dando fallos que no eran de nadie.
export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, '**/.kilo/**', '**/.venv/**', 'android/**', 'ios/**'],
  },
});
