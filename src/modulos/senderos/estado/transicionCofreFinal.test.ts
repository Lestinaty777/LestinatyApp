import { describe, expect, it } from 'vitest';
import { transicionTrasRegistro } from './transicionCofreFinal';
import type { ResultadoRegistroHabito } from '../../habitos/tipos';

const base: ResultadoRegistroHabito = {
  fechaLocal: '2026-09-22',
  gemasGanadas: 0,
  habitoId: 'habito-1',
  id: 'registro-1',
  mandalaPendiente: null,
  nivel: 2,
  nota: null,
  subioNivel: false,
  transicionSendero: null,
  valor: 10,
};

describe('transicionTrasRegistro', () => {
  it('activa la reproducción cuando el registro trae una transición de sendero', () => {
    const resultado: ResultadoRegistroHabito = {
      ...base,
      subioNivel: true,
      transicionSendero: {
        cicloActual: 1, cicloAnterior: 1, cofreFinalReclamado: true,
        gemas: 15, nivelActual: 2, nivelAnterior: 1, tipo: 'nivel',
      },
    };
    expect(transicionTrasRegistro(resultado)).toEqual({
      estado: 'reproduciendo',
      transicion: resultado.transicionSendero,
    });
  });

  it('queda inactiva cuando no hay transición (registro normal, sin subir de nivel ni cerrar ciclo)', () => {
    expect(transicionTrasRegistro(base)).toEqual({ estado: 'inactiva', transicion: null });
  });

  it('rehidratar un resumen ya avanzado (sin transicionSendero) no vuelve a pedir reproducción', () => {
    const resultadoRehidratado: ResultadoRegistroHabito = { ...base, nivel: 3, transicionSendero: null };
    expect(transicionTrasRegistro(resultadoRehidratado).estado).toBe('inactiva');
  });
});
