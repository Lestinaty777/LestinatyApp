/// <reference types="node" />
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Las ilustraciones de Esmeralda (árbol etapa7, arbusto) no se escriben fijas en las pantallas: cambian con
// la personalización (useAssetsPaqueteTema). Solo son legítimas donde son MARCA: el onboarding y el splash
// (el usuario aún no eligió tema) y los registros de assets que las definen.
const RAIZ = process.cwd();
const PERMITIDOS = [
  'src/modulos/senderos/algoritmo/registroPaquetesArbol.ts',
  'src/modulos/habitos/paqueteVisual.assets.ts',
  'src/modulos/habitos/usePaqueteTema.ts',
];
const PERMITIDOS_PREFIJO = ['src/modulos/onboarding/', 'src/nucleo/arranque/'];

const fuentes = (dir: string): string[] =>
  readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) return nombre === 'node_modules' ? [] : fuentes(ruta);
    return /\.tsx?$/.test(nombre) && !nombre.includes('.test.') ? [ruta] : [];
  });

const archivos = [...fuentes(join(RAIZ, 'src')), ...fuentes(join(RAIZ, 'app'))]
  .map((ruta) => ruta.slice(RAIZ.length + 1).split('\\').join('/'))
  .filter((ruta) => !PERMITIDOS.includes(ruta) && !PERMITIDOS_PREFIJO.some((prefijo) => ruta.startsWith(prefijo)));

// 1) el asset de Esmeralda o la copia de su árbol; 2) pedirlo por nombre con el id fijo.
const FIJOS = [
  /paquetes\/Esmeralda\//,
  /hoy\/fondos\/habitos\.png/,
  /obtenerEtapaSietePaquete\(\s*['"]esmeralda['"]/,
  /obtenerAssetsPaquete(?:Habito)?\(\s*['"]esmeralda['"]/,
];

describe('ilustraciones del paquete', () => {
  it('ninguna pantalla fija el árbol o el arbusto de Esmeralda: usan useAssetsPaqueteTema()', () => {
    const infractores = archivos.flatMap((ruta) => {
      const texto = readFileSync(join(RAIZ, ruta), 'utf8');
      return FIJOS.filter((patron) => patron.test(texto)).map((patron) => `${ruta} (${patron.source})`);
    });
    expect(infractores).toEqual([]);
  });
});
