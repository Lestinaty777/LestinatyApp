import { describe, expect, it } from 'vitest';

import { estadoInicialConversacionAby, reducirConversacionAby } from './abyConversacion.reducer';

describe('reducirConversacionAby', () => {
  it('borra respuestas posteriores cuando se edita la fecha de examen', () => {
    const configurado = [
      { tipo: 'definir-intencion' as const, valor: 'examen' as const },
      { objetivo: 'Parcial de Anatomía', tipo: 'definir-objetivo' as const },
      { fechaExamen: '2026-10-18', tipo: 'definir-fecha-examen' as const },
      { alcance: 'Capítulos 1 al 4', tipo: 'definir-alcance' as const },
      { fuente: 'Índice del libro', tipo: 'definir-fuente' as const },
      { disponibilidadSemanal: '4' as const, tipo: 'definir-disponibilidad' as const },
      { nivelInicial: 'basico' as const, tipo: 'definir-nivel' as const },
    ].reduce(reducirConversacionAby, estadoInicialConversacionAby);

    const editado = reducirConversacionAby(configurado, { preguntaId: 'fecha-examen', tipo: 'editar' });

    expect(editado.configuracion).toEqual({
      alcance: '', disponibilidadSemanal: null, fechaExamen: null, fuente: '',
      intencion: 'examen', nivelInicial: null, objetivo: 'Parcial de Anatomía',
    });
    expect(editado.pasosCompletados).toBe(2);
  });
});
