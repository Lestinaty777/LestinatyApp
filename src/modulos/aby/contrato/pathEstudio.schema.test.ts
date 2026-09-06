import { describe, expect, it } from 'vitest';

import { validarPathEstudio } from './pathEstudio.schema';

function leccionPack(id: string) {
  return {
    id: `leccion-${id}`,
    pasos: [
      {
        config: { personaje: 'explicando', texto: `Explicacion de ${id}.` },
        id: `teoria-${id}`,
        tipo: 'teoria-corta',
      },
      {
        config: { indiceCorrecto: 0, opciones: ['Correcta', 'Incorrecta'], pregunta: `Pregunta de ${id}.` },
        id: `pregunta-${id}`,
        tipo: 'opcion-multiple',
      },
    ],
    titulo: `Leccion ${id}`,
  };
}

const nodosValidos = [
  ...Array.from({ length: 5 }, (_, indice) => ({
    descripcion: `Descripcion de la leccion ${indice + 1}.`,
    id: `nodo-${indice + 1}`,
    lessonPack: leccionPack(String(indice + 1)),
    objetivo: `Objetivo ${indice + 1}.`,
    tiempoEstimadoMinutos: 20,
    tipo: 'leccion' as const,
    titulo: `Leccion ${indice + 1}`,
  })),
  {
    descripcion: 'Evaluacion final de los conceptos aprendidos.',
    id: 'examen-final',
    lessonPack: leccionPack('examen'),
    objetivo: 'Comprobar el dominio del sendero.',
    tiempoEstimadoMinutos: 30,
    tipo: 'evaluacion' as const,
    titulo: 'Examen final',
  },
];

const pathValido = {
  conexiones: [
    { destinoId: 'nodo-2', origenId: 'nodo-1' },
    { destinoId: 'nodo-3', origenId: 'nodo-2' },
    { destinoId: 'nodo-4', origenId: 'nodo-3' },
    { destinoId: 'nodo-5', origenId: 'nodo-4' },
    { destinoId: 'examen-final', origenId: 'nodo-5' },
  ],
  descripcion: 'Ruta guiada para dominar calculo diferencial.',
  intencion: 'aprender',
  nodos: nodosValidos,
  titulo: 'Calculo diferencial',
};

describe('validarPathEstudio', () => {
  it('acepta cinco lecciones, una evaluacion final y conexiones lineales', () => {
    const path = validarPathEstudio(pathValido);

    expect(path.nodos.filter((nodo) => nodo.tipo === 'leccion')).toHaveLength(5);
    expect(path.nodos.filter((nodo) => nodo.tipo === 'evaluacion')).toHaveLength(1);
    expect(path.conexiones).toHaveLength(5);
  });

  it('rechaza una evaluacion que no esta al final del camino', () => {
    const nodosConExamenTemprano = [...nodosValidos];
    [nodosConExamenTemprano[0], nodosConExamenTemprano[5]] = [nodosConExamenTemprano[5], nodosConExamenTemprano[0]];

    expect(() => validarPathEstudio({ ...pathValido, nodos: nodosConExamenTemprano })).toThrow(/evaluacion final/i);
  });

  it('rechaza una conexion que salta un nodo', () => {
    const conexionesConSalto = [...pathValido.conexiones];
    conexionesConSalto[0] = { destinoId: 'nodo-3', origenId: 'nodo-1' };

    expect(() => validarPathEstudio({ ...pathValido, conexiones: conexionesConSalto })).toThrow(/lineales/i);
  });
});
