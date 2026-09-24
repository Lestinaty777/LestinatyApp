import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const raiz = process.cwd();
const leer = (ruta: string) => readFileSync(join(raiz, ruta), 'utf8');

describe('aislamiento de widgets fuera de Android', () => {
  it('mantiene una ruta base sin la pantalla Android', () => {
    const ruta = leer('app/habitos/widgets.tsx');

    expect(ruta).toContain('<Redirect href="/(principal)/hoy" />');
    expect(ruta).not.toContain('WidgetsHabitosPantalla');
  });

  it('mantiene el entry point base libre de paquetes Android', () => {
    for (const ruta of [
      'index.ts',
      'src/plataforma/widgets/registrar.ts',
      'src/modulos/habitos/widgets/widgetFoco.servicio.ts',
      'src/modulos/habitos/widgets/widgetCalendario.servicio.ts',
      'src/modulos/habitos/cronometro.servicio.ts',
    ]) {
      const contenido = leer(ruta);
      expect(contenido).not.toContain('react-native-android-widget');
      expect(contenido).not.toContain('modules/habito-widget');
    }
  });

  it('conserva las implementaciones en variantes Android', () => {
    expect(existsSync(join(raiz, 'app/habitos/widgets.android.tsx'))).toBe(true);
    expect(existsSync(join(raiz, 'src/plataforma/widgets/registrar.android.ts'))).toBe(true);
    expect(existsSync(join(raiz, 'src/modulos/habitos/widgets/widgetFoco.servicio.android.tsx'))).toBe(true);
    expect(existsSync(join(raiz, 'src/modulos/habitos/widgets/widgetCalendario.servicio.android.tsx'))).toBe(true);
    expect(existsSync(join(raiz, 'src/modulos/habitos/cronometro.servicio.android.ts'))).toBe(true);
  });
});
