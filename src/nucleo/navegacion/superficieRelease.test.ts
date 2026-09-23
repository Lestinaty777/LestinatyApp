import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const raiz = process.cwd();

const rutasRetiradas = [
  'app/(principal)/metas.tsx',
  'app/(principal)/mi-espacio.tsx',
  'app/(principal)/vista-paquete.tsx',
  'app/metas-lista/index.tsx',
  'app/metas/[id].tsx',
  'app/rutinas/index.tsx',
  'app/senderos/[id].tsx',
  'app/senderos/analisis.tsx',
  'app/senderos/leccion.tsx',
  'app/senderos/mision.tsx',
  'app/tareas/index.tsx',
] as const;

function leer(ruta: string) {
  return readFileSync(join(raiz, ruta), 'utf8');
}

describe('superficie de rutas del release de hábitos', () => {
  it.each(rutasRetiradas)('no registra %s', (ruta) => {
    expect(existsSync(join(raiz, ruta))).toBe(false);
  });

  it('no declara pantallas retiradas en los layouts', () => {
    const layoutRaiz = leer('app/_layout.tsx');
    const layoutPrincipal = leer('app/(principal)/_layout.tsx');

    expect(layoutRaiz).not.toMatch(/senderos\/(analisis|leccion|\[id\])|metas\/\[id\]/);
    expect(layoutPrincipal).not.toMatch(/name="(metas|mi-espacio)"/);
  });

  it('no conserva un layout de configuración sin pantallas', () => {
    expect(existsSync(join(raiz, 'app/configuracion/_layout.tsx'))).toBe(false);
  });
});

describe('Senderos de producción', () => {
  it('no incluye el modo especial Prueba diamante', () => {
    const pantalla = leer('src/modulos/senderos/pantallas/MapaSenderosPantalla.tsx');

    expect(pantalla).not.toContain('Prueba diamante');
    expect(pantalla).not.toContain('esPruebaDiamante');
    expect(pantalla).not.toContain('nodosPruebaDiamante');
  });

  it('no abre la lección mock cuando falta una acción real', () => {
    const contenedor = leer('src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx');

    expect(contenedor).not.toContain("pathname: '/senderos/leccion'");
    expect(contenedor).not.toContain('MOCKUP: Al darle comenzar');
  });
});
