import { describe, expect, it } from 'vitest';

import { construirSenderoDesdePropuesta, type RepositorioConstruccionSendero } from './construirSenderoDesdePropuesta';

const path = {
  conexiones: [
    { destinoId: 'nodo-2', origenId: 'nodo-1' },
    { destinoId: 'nodo-3', origenId: 'nodo-2' },
    { destinoId: 'nodo-4', origenId: 'nodo-3' },
    { destinoId: 'nodo-5', origenId: 'nodo-4' },
    { destinoId: 'evaluacion-final', origenId: 'nodo-5' },
  ],
  descripcion: 'Ruta para preparar calculo diferencial.',
  intencion: 'aprender' as const,
  nodos: [
    ...Array.from({ length: 5 }, (_, indice) => ({
      descripcion: `Descripcion ${indice + 1}.`,
      id: `nodo-${indice + 1}`,
      lessonPack: { id: `pack-${indice + 1}`, pasos: [{ config: { personaje: 'explicando' as const, texto: 'Explicacion original.' }, id: `paso-${indice + 1}`, tipo: 'teoria-corta' as const }], titulo: `Pack ${indice + 1}` },
      objetivo: `Objetivo ${indice + 1}.`,
      tiempoEstimadoMinutos: 20,
      tipo: 'leccion' as const,
      titulo: `Leccion ${indice + 1}`,
    })),
    {
      descripcion: 'Evaluacion de los conceptos estudiados.',
      id: 'evaluacion-final',
      lessonPack: { id: 'pack-final', pasos: [{ config: { personaje: 'celebrando' as const, texto: 'Evaluacion final.' }, id: 'paso-final', tipo: 'teoria-corta' as const }], titulo: 'Pack final' },
      objetivo: 'Comprobar el dominio alcanzado.',
      tiempoEstimadoMinutos: 30,
      tipo: 'evaluacion' as const,
      titulo: 'Evaluacion final',
    },
  ],
  titulo: 'Calculo diferencial',
};

function crearRepositorioFalso(): RepositorioConstruccionSendero {
  return {
    aceptarPropuesta: async () => undefined,
    activarNivel: async () => undefined,
    activarSendero: async () => undefined,
    crearCofre: async () => undefined,
    crearConexiones: async () => undefined,
    crearMeta: async () => ({ id: 'meta-1' }),
    crearNivel: async () => ({ id: 'nivel-1' }),
    crearNodos: async (nodos) => Object.fromEntries(nodos.map((nodo) => [nodo.pathId, `db-${nodo.pathId}`])),
    crearSendero: async () => ({ id: 'sendero-1' }),
    eliminarMeta: async () => undefined,
    marcarPropuestaFallida: async () => undefined,
  };
}

describe('construirSenderoDesdePropuesta', () => {
  it('construye meta, sendero, sección, seis nodos, conexiones y cofre', async () => {
    const resultado = await construirSenderoDesdePropuesta(crearRepositorioFalso(), {
      path,
      propuestaId: '00000000-0000-4000-8000-000000000001',
      usuarioId: '00000000-0000-4000-8000-000000000002',
    });

    expect(resultado.operaciones).toEqual([
      'meta', 'sendero', 'seccion', 'nodos', 'conexiones', 'cofre', 'activar-seccion', 'activar-sendero', 'aceptar-propuesta',
    ]);
    expect(resultado.senderoId).toBe('sendero-1');
  });
});
