import { describe, expect, it } from 'vitest';

import { validarRespuestaCreacionAby } from '../contrato/respuestaCreacionAby.schema';

function leccionPack(id: string) {
  return {
    id: `leccion-${id}`,
    pasos: [
      {
        config: { personaje: 'explicando', texto: `Explicacion de ${id}.` },
        id: `teoria-${id}`,
        tipo: 'teoria-corta',
      },
    ],
    titulo: `Leccion ${id}`,
  };
}

const pathSinExamen = {
  conexiones: [
    { destinoId: 'nodo-2', origenId: 'nodo-1' },
    { destinoId: 'nodo-3', origenId: 'nodo-2' },
    { destinoId: 'nodo-4', origenId: 'nodo-3' },
    { destinoId: 'nodo-5', origenId: 'nodo-4' },
    { destinoId: 'nodo-6', origenId: 'nodo-5' },
  ],
  descripcion: 'Ruta para reforzar el calculo diferencial.',
  intencion: 'aprender',
  nodos: Array.from({ length: 6 }, (_, indice) => ({
    descripcion: `Descripcion de la leccion ${indice + 1}.`,
    id: `nodo-${indice + 1}`,
    lessonPack: leccionPack(String(indice + 1)),
    objetivo: `Objetivo ${indice + 1}.`,
    tiempoEstimadoMinutos: 20,
    tipo: 'leccion',
    titulo: `Leccion ${indice + 1}`,
  })),
  titulo: 'Calculo diferencial',
};

describe('validarRespuestaCreacionAby', () => {
  it('rechaza una propuesta remota sin la evaluacion final', () => {
    expect(() => validarRespuestaCreacionAby({
      path: pathSinExamen,
      propuestaId: '00000000-0000-4000-8000-000000000001',
    })).toThrow(/evaluacion/i);
  });
});
