import { describe, expect, it } from 'vitest';

import { obtenerDecoracionBiomaAby } from './decoracionBiomaAby.config';

describe('obtenerDecoracionBiomaAby', () => {
  it('usa un fondo neutro sin categoria y dos arboles al seleccionar un bioma', () => {
    expect(obtenerDecoracionBiomaAby(null).colorPastel).toBe('#FBFAF7');
    const salud = obtenerDecoracionBiomaAby('salud');
    expect(salud.colorPastel).toBe('#EAF8EC');
    expect(salud.arbolInferior).toBeTruthy();
    expect(salud.arbolSuperior).toBeTruthy();
  });
});
