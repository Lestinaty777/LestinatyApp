import { describe, expect, it } from 'vitest';
import { colores, coloresDeMarca } from '../fundamentos/colores';
import { crearTonoMaster, TONO_ESMERALDA } from './masterColor';

describe('tokens de marca', () => {
  it('en Esmeralda son idénticos al objeto estático colores', () => {
    const marca = coloresDeMarca(TONO_ESMERALDA.escala);
    for (const clave of ['primario', 'primarioOscuro', 'primarioTexto', 'primarioSuave'] as const) expect(marca[clave]).toBe(colores[clave]);
  });

  it('con otro paquete cambian los 4 tokens de marca, pero no los semánticos', () => {
    const marca = coloresDeMarca(crearTonoMaster('sakura', '#FC70AF').escala);
    for (const clave of ['primario', 'primarioOscuro', 'primarioTexto', 'primarioSuave'] as const) expect(marca[clave], clave).not.toBe(colores[clave]);
    // éxito, error y acento son semánticos: siguen fuera de la marca (no se tiñen con el tema)
    expect(Object.keys(marca).sort()).toEqual(['primario', 'primarioOscuro', 'primarioSuave', 'primarioTexto']);
  });
});
