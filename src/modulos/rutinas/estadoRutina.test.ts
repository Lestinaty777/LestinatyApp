import { describe, expect, it } from 'vitest';

import { estaPendienteHoy, resumirDiaRutinas, resumirPasos, siguientePaso } from './estadoRutina';
import type { PasoRutina, Rutina } from './rutinas.tipos';

function paso(sobrescribir: Partial<PasoRutina> = {}): PasoRutina {
  return {
    id: 'p', orden: 1, origen: 'propio', habitoId: null, tareaId: null, tareaTipo: null, tareaFrecuencia: null, esencial: true, titulo: 'Paso', iconoLucide: null, color: null,
    modo: 'simple', objetivoValor: null, unidad: null, aplica: true, completo: false, valor: null, ...sobrescribir,
  };
}
function rutina(pasos: PasoRutina[], sobrescribir: Partial<Rutina> = {}): Pick<Rutina, 'pasos' | 'tocaHoy' | 'estado'> {
  return { pasos, tocaHoy: true, estado: 'activa', ...sobrescribir };
}

describe('resumirPasos', () => {
  it('calcula avance sobre los pasos que aplican hoy', () => {
    const resumen = resumirPasos([paso({ completo: true }), paso({ id: 'b', orden: 2 }), paso({ id: 'c', orden: 3, aplica: false })]);
    expect(resumen).toEqual({ aplican: 2, completos: 1, requeridos: 2, requeridosCompletos: 1, porcentaje: 50, completa: false });
  });

  it('un paso que no aplica hoy no cuenta aunque esté marcado completo', () => {
    expect(resumirPasos([paso({ aplica: false, completo: true })])).toEqual({ aplican: 0, completos: 0, requeridos: 0, requeridosCompletos: 0, porcentaje: 0, completa: false });
  });

  it('está completa cuando todos los que aplican están completos', () => {
    const resumen = resumirPasos([paso({ completo: true }), paso({ id: 'b', orden: 2, completo: true }), paso({ id: 'c', orden: 3, aplica: false })]);
    expect(resumen.completa).toBe(true);
    expect(resumen.porcentaje).toBe(100);
  });

  it('sin pasos nunca está completa', () => {
    expect(resumirPasos([]).completa).toBe(false);
  });

  it('solo los esenciales deciden si la sesión está completa; los opcionales no suman ni restan al avance', () => {
    const resumen = resumirPasos([
      paso({ completo: true }), paso({ id: 'b', orden: 2, esencial: false }), paso({ id: 'c', orden: 3, completo: true }),
    ]);
    expect(resumen).toMatchObject({ aplican: 3, completos: 2, requeridos: 2, requeridosCompletos: 2, porcentaje: 100, completa: true });
  });

  it('un esencial pendiente impide completar aunque los opcionales estén hechos', () => {
    const resumen = resumirPasos([paso(), paso({ id: 'b', orden: 2, esencial: false, completo: true })]);
    expect(resumen).toMatchObject({ requeridos: 1, requeridosCompletos: 0, porcentaje: 0, completa: false });
  });

  it('si ningún esencial aplica hoy se requieren todos los que aplican', () => {
    const solo = [paso({ esencial: true, aplica: false }), paso({ id: 'b', orden: 2, esencial: false })];
    expect(resumirPasos(solo)).toMatchObject({ requeridos: 1, requeridosCompletos: 0, completa: false });
    const hecho = [paso({ esencial: true, aplica: false }), paso({ id: 'b', orden: 2, esencial: false, completo: true })];
    expect(resumirPasos(hecho)).toMatchObject({ requeridos: 1, requeridosCompletos: 1, completa: true });
  });

  it('redondea el porcentaje', () => {
    const pasos = [paso({ completo: true }), paso({ id: 'b', orden: 2 }), paso({ id: 'c', orden: 3 })];
    expect(resumirPasos(pasos).porcentaje).toBe(33);
  });
});

describe('estaPendienteHoy', () => {
  it('pendiente si toca hoy, está activa y falta algo', () => {
    expect(estaPendienteHoy(rutina([paso()]))).toBe(true);
  });

  it('no es pendiente si está completa', () => {
    expect(estaPendienteHoy(rutina([paso({ completo: true })]))).toBe(false);
  });

  it('no es pendiente si no toca hoy, está pausada o ningún paso aplica', () => {
    expect(estaPendienteHoy(rutina([paso()], { tocaHoy: false }))).toBe(false);
    expect(estaPendienteHoy(rutina([paso()], { estado: 'pausada' }))).toBe(false);
    expect(estaPendienteHoy(rutina([paso({ aplica: false })]))).toBe(false);
  });
});

describe('resumirDiaRutinas', () => {
  it('cuenta solo las activas que tocan hoy con algo que hacer', () => {
    const resumen = resumirDiaRutinas([
      rutina([paso({ completo: true })]),
      rutina([paso()]),
      rutina([paso()], { tocaHoy: false }),
      rutina([paso({ aplica: false })]),
      rutina([paso()], { estado: 'pausada' }),
    ]);
    expect(resumen).toEqual({ totalHoy: 2, completadasHoy: 1, porcentaje: 50 });
  });

  it('devuelve ceros sin rutinas', () => {
    expect(resumirDiaRutinas([])).toEqual({ totalHoy: 0, completadasHoy: 0, porcentaje: 0 });
  });
});

describe('siguientePaso', () => {
  it('devuelve el primero por orden que aplica y no está completo', () => {
    const siguiente = siguientePaso([
      paso({ id: 'c', orden: 3 }), paso({ id: 'a', orden: 1, completo: true }), paso({ id: 'b', orden: 2, aplica: false }),
    ]);
    expect(siguiente?.id).toBe('c');
  });

  it('null si no queda nada por hacer', () => {
    expect(siguientePaso([paso({ completo: true })])).toBeNull();
  });
});
