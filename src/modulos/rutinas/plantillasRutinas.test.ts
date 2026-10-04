/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { PLANTILLAS_RUTINAS } from './plantillasRutinas';
import { MAX_PASOS_RUTINA } from './rutinas.tipos';

// Se lee el registro como texto: importarlo cargaría los PNG con require()
// (mismo criterio que registroIconos.test.ts).
const REGISTRO = readFileSync(join(process.cwd(), 'src/diseno/iconos/registroIconos.ts'), 'utf8');
const [bloqueContenido] = REGISTRO.split('const ICONOS_INTERFAZ');
const IDS_ICONOS = new Set([...bloqueContenido.matchAll(/^\s+'?([\w/-]+)'?: icono\(/gm)].map(([, id]) => id));

describe('PLANTILLAS_RUTINAS', () => {
  it.each(PLANTILLAS_RUTINAS.map((plantilla) => [plantilla.id, plantilla] as const))('%s usa un ícono registrado', (_id, plantilla) => {
    expect(IDS_ICONOS.has(plantilla.iconoId)).toBe(true);
  });

  it('tiene ids únicos y entre 1 y el máximo de pasos', () => {
    const ids = PLANTILLAS_RUTINAS.map((plantilla) => plantilla.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const plantilla of PLANTILLAS_RUTINAS) {
      expect(plantilla.pasos.length).toBeGreaterThanOrEqual(1);
      expect(plantilla.pasos.length).toBeLessThanOrEqual(MAX_PASOS_RUTINA);
    }
  });

  it('los pasos con meta numérica la declaran y los simples no', () => {
    for (const plantilla of PLANTILLAS_RUTINAS) {
      for (const paso of plantilla.pasos) {
        if (paso.modo === 'simple') expect(paso.objetivoValor).toBeUndefined();
        else expect(paso.objetivoValor).toBeGreaterThan(0);
      }
    }
  });
});
