import { describe, expect, it } from 'vitest';

import { areaDeElemento, areaPorMeta, mapearMeta, mapearMetas, progresoPlazoMeta } from './metas.mapper';

const remota = {
  id: 'm1', titulo: 'Correr 5 km', descripcion: null, estado: 'activa', icono_lucide: null, color: '#EF4444',
  fecha_inicio: '2026-09-30', duracion_dias: 30, dia_actual: 9, dias_restantes: 21, lograda_en: null, orden: 0,
  area: { id: 'a1', codigo: 'cuerpo', nombre: 'Cuerpo', color: '#EF4444', icono_lucide: 'Dumbbell' },
  conteos: { habitos: 1, tareas: '1', rutinas: 0, planes: 1 },
};

describe('mapearMeta', () => {
  it('mapea la respuesta de obtener_metas', () => {
    expect(mapearMeta(remota)).toEqual({
      id: 'm1', titulo: 'Correr 5 km', descripcion: null, estado: 'activa', iconoLucide: null, color: '#EF4444',
      fechaInicio: '2026-09-30', duracionDias: 30, diaActual: 9, diasRestantes: 21, logradaEn: null, orden: 0,
      area: { id: 'a1', codigo: 'cuerpo', nombre: 'Cuerpo', color: '#EF4444', iconoLucide: 'Dumbbell' },
      conteos: { habitos: 1, tareas: 1, rutinas: 0, planes: 1 },
    });
  });

  it('acepta una meta sin área ni plazo (las del flujo antiguo de Aby)', () => {
    const meta = mapearMeta({ ...remota, area: null, color: null, duracion_dias: null, dias_restantes: null, dia_actual: 0, conteos: undefined });
    expect(meta).toMatchObject({ area: null, color: null, duracionDias: null, diasRestantes: null, diaActual: 0 });
    expect(meta.conteos).toEqual({ habitos: 0, tareas: 0, rutinas: 0, planes: 0 });
  });

  it('rechaza respuestas rotas', () => {
    expect(() => mapearMeta({ ...remota, estado: 'inventado' })).toThrow('estado');
    expect(() => mapearMeta({ ...remota, titulo: '' })).toThrow('titulo');
    expect(() => mapearMeta({ ...remota, area: { id: 'a1' } })).toThrow();
    expect(() => mapearMetas({})).toThrow();
    expect(mapearMetas([remota])).toHaveLength(1);
  });
});

describe('progresoPlazoMeta', () => {
  it('es null sin plazo', () => {
    expect(progresoPlazoMeta({ duracionDias: null, diaActual: 12 })).toBeNull();
  });

  it('calcula día, total y porcentaje, sin pasarse del total', () => {
    expect(progresoPlazoMeta({ duracionDias: 30, diaActual: 9 })).toEqual({ dia: 9, total: 30, porcentaje: 30 });
    expect(progresoPlazoMeta({ duracionDias: 30, diaActual: 45 })).toEqual({ dia: 30, total: 30, porcentaje: 100 });
    expect(progresoPlazoMeta({ duracionDias: 30, diaActual: 0 })).toEqual({ dia: 0, total: 30, porcentaje: 0 });
  });
});

describe('área de un elemento', () => {
  const areas = areaPorMeta([{ id: 'm1', area: { id: 'a1', codigo: 'cuerpo', nombre: 'Cuerpo', color: '#EF4444', iconoLucide: 'Dumbbell' } }, { id: 'm2', area: null }]);

  it('es la de su meta', () => {
    expect(areaDeElemento('m1', areas)).toBe('a1');
  });

  it('no tiene área sin meta, con una meta sin área o con una meta desconocida', () => {
    expect(areaDeElemento(null, areas)).toBeNull();
    expect(areaDeElemento(undefined, areas)).toBeNull();
    expect(areaDeElemento('m2', areas)).toBeNull();
    expect(areaDeElemento('otra', areas)).toBeNull();
  });
});
