import { describe, expect, it } from 'vitest';

import { buscarPlantillasHabitos, PLANTILLAS_HABITOS } from './plantillasHabitos';

describe('buscarPlantillasHabitos', () => {
  it('devuelve todas las plantillas cuando no hay texto de búsqueda', () => {
    expect(buscarPlantillasHabitos('')).toBe(PLANTILLAS_HABITOS);
  });

  it('encuentra por título sin importar mayúsculas/minúsculas', () => {
    expect(buscarPlantillasHabitos('MEDITAR').map((p) => p.iconoId)).toContain('meditar');
  });

  it('encuentra por palabra clave aunque no aparezca en el título', () => {
    expect(buscarPlantillasHabitos('pesas').map((p) => p.iconoId)).toContain('hacer-ejercicio');
  });

  it('no revienta con una búsqueda sin resultados', () => {
    expect(buscarPlantillasHabitos('xyzxyz')).toEqual([]);
  });
});
