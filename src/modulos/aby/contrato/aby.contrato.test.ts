import { describe, expect, it } from 'vitest';

import { configuracionEstudioAbySchema, validarRespuestaAby } from './aby.contrato';

describe('validarRespuestaAby', () => {
  it('acepta una pregunta visual adaptativa con opciones seguras', () => {
    expect(validarRespuestaAby({
      mensaje: '¿Qué días tienes disponibles?',
      pregunta: {
        id: 'disponibilidad-semanal',
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

  it('acepta el contexto mínimo validado de un examen', () => {
    expect(configuracionEstudioAbySchema.parse({
      alcance: 'Capítulos 1 al 4',
      disponibilidadSemanal: '4',
      fechaExamen: '2026-10-18',
      fuente: '',
      intencion: 'examen',
      nivelInicial: 'basico',
      objetivo: 'Parcial de Anatomía',
    }).fechaExamen).toBe('2026-10-18');
  });
});
