import { describe, expect, it } from 'vitest';

import { validarRespuestaAby } from './aby.contrato';

describe('validarRespuestaAby', () => {
  it('acepta una pregunta visual adaptativa con opciones seguras', () => {
    expect(validarRespuestaAby({
      mensaje: '¿Qué días tienes disponibles?',
      pregunta: {
        id: 'frecuencia-real',
        opciones: [{ etiqueta: 'Lunes y miércoles', valor: '1,3' }],
        tipo: 'chips',
        titulo: 'Elige una opción',
      },
      tipo: 'pregunta',
    }).tipo).toBe('pregunta');
  });

  it('rechaza un turno de pregunta sin pregunta visual', () => {
    expect(() => validarRespuestaAby({ mensaje: 'Texto incompleto', tipo: 'pregunta' })).toThrow();
  });
});
