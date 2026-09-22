import { describe, expect, it } from 'vitest';
import { mapearResumenSendero, mapearTransicionSendero } from './senderoHabito.mapper';

const seccion = (over: Partial<Record<string, unknown>> = {}) => ({
  nivel: 1,
  estado: 'bloqueado',
  ciclo: 1,
  dias_completados: 0,
  dias_requeridos: 3,
  puede_avanzar_hoy: false,
  disponible_desde: null,
  total_dias_nivel7: 0,
  ...over,
});

describe('mapearResumenSendero', () => {
  it('mapea las siete secciones y deriva el nivel actual', () => {
    const payload = {
      habito_id: 'habito-1',
      secciones: [
        seccion({ nivel: 1, estado: 'completado', dias_completados: 3, dias_requeridos: 3, disponible_desde: '2026-01-01' }),
        seccion({ nivel: 2, estado: 'completado', dias_completados: 7, dias_requeridos: 7 }),
        seccion({ nivel: 3, estado: 'completado', dias_completados: 12, dias_requeridos: 12 }),
        seccion({ nivel: 4, estado: 'completado', dias_completados: 18, dias_requeridos: 18 }),
        seccion({ nivel: 5, estado: 'completado', dias_completados: 25, dias_requeridos: 25 }),
        seccion({ nivel: 6, estado: 'completado', dias_completados: 33, dias_requeridos: 33 }),
        seccion({ nivel: 7, estado: 'actual', ciclo: 2, dias_completados: 8, dias_requeridos: 42, total_dias_nivel7: 50, puede_avanzar_hoy: true }),
      ],
    };

    const resultado = mapearResumenSendero(payload);
    expect(resultado.nivelActual).toBe(7);
    expect(resultado.secciones).toHaveLength(7);
    expect(resultado.secciones[0]).toMatchObject({ nivel: 1, estado: 'completado', diasCompletados: 3, diasRequeridos: 3 });
    expect(resultado.secciones[6]).toMatchObject({ nivel: 7, estado: 'actual', ciclo: 2, diasCompletados: 8, diasRequeridos: 42, totalDiasNivel7: 50 });
  });

  it('mapea disponible_desde null como null y valores numéricos serializados como string', () => {
    const payload = {
      habito_id: 'habito-1',
      secciones: [seccion({ estado: 'actual', dias_completados: '2', dias_requeridos: '3', puede_avanzar_hoy: true })],
    };
    const resultado = mapearResumenSendero(payload);
    expect(resultado.secciones[0]).toMatchObject({ diasCompletados: 2, diasRequeridos: 3, disponibleDesde: null, puedeAvanzarHoy: true });
  });

  it('lanza un error con payload incompleto', () => {
    expect(() => mapearResumenSendero({ habito_id: 'habito-1' })).toThrowError('Resumen de Senderos inválido.');
    expect(() => mapearResumenSendero(null)).toThrowError('Resumen de Senderos inválido.');
    expect(() => mapearResumenSendero({ secciones: [{ nivel: 1 }] })).toThrowError('Resumen de Senderos inválido.');
  });
});

describe('mapearTransicionSendero', () => {
  it('devuelve null cuando no hubo transición', () => {
    expect(mapearTransicionSendero(null)).toBeNull();
    expect(mapearTransicionSendero(undefined)).toBeNull();
  });

  it('mapea una transición de nivel', () => {
    const payload = {
      tipo: 'nivel', nivel_anterior: 1, nivel_actual: 2, ciclo_anterior: 1, ciclo_actual: 1,
      cofre_final_reclamado: true, gemas: 10,
    };
    expect(mapearTransicionSendero(payload)).toEqual({
      tipo: 'nivel', nivelAnterior: 1, nivelActual: 2, cicloAnterior: 1, cicloActual: 1,
      cofreFinalReclamado: true, gemas: 10,
    });
  });

  it('mapea una transición de ciclo de maestría', () => {
    const payload = {
      tipo: 'ciclo_maestria', nivel_anterior: 7, nivel_actual: 7, ciclo_anterior: 1, ciclo_actual: 2,
      cofre_final_reclamado: true, gemas: 35,
    };
    expect(mapearTransicionSendero(payload)?.tipo).toBe('ciclo_maestria');
  });
});
