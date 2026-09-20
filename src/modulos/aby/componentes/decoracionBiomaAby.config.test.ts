import { describe, expect, it } from 'vitest';

import { obtenerDecoracionBiomaAby } from './decoracionBiomaAby.config';
import { ESCALA_ESMERALDA } from '../../../diseno/tema/escalaEsmeralda';

describe('obtenerDecoracionBiomaAby', () => {
  it('usa un fondo neutro sin categoria y dos arboles al seleccionar un bioma', () => {
    expect(obtenerDecoracionBiomaAby(null).colorPastel).toBe('#FBFAF7');
    const salud = obtenerDecoracionBiomaAby('salud');
    expect(salud.colorPastel).toBe(ESCALA_ESMERALDA.hoja.l97);
    expect(salud.arbolInferior).toBeTruthy();
    expect(salud.arbolSuperior).toBeTruthy();
  });
});
