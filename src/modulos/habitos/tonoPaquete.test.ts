import { describe, expect, it } from 'vitest';
import { TONO_ESMERALDA } from '../../diseno/tema/masterColor';
import { resumirHabitosActivos } from './resumenHabitosActivos';
import { tonoDelPaquete } from './tonoPaquete';

describe('tonoDelPaquete', () => {
  it('cada paquete conserva SU tono, distinto entre sí', () => {
    const mathist = tonoDelPaquete('mathist', '#B25FFB');
    const sakura = tonoDelPaquete('sakura', '#FC70AF');
    expect(mathist.id).toBe('mathist');
    expect(sakura.id).toBe('sakura');
    expect(mathist.escala).not.toEqual(sakura.escala);
    // Matiz Oklch (motor de la paleta migrado — ver masterColor.ts), no HSL:
    // el mismo morado mide un matiz distinto en cada espacio.
    expect(mathist.hue).toBeCloseTo(305, -1);
  });

  it('sin paquete, paquete desconocido o esmeralda: tono Esmeralda (el verde de siempre)', () => {
    expect(tonoDelPaquete(undefined, undefined)).toBe(TONO_ESMERALDA);
    expect(tonoDelPaquete('no-existe', '#B25FFB')).toBe(TONO_ESMERALDA);
    expect(tonoDelPaquete('esmeralda', '#029060')).toBe(TONO_ESMERALDA);
  });

  it('un paquete sin master_pack_color cae a Esmeralda en vez de inventar un tono', () => {
    expect(tonoDelPaquete('mathist', undefined)).toBe(TONO_ESMERALDA);
    expect(tonoDelPaquete('mathist', '')).toBe(TONO_ESMERALDA);
  });

  it('memoiza: el mismo paquete devuelve el mismo objeto (una lista repite paquetes)', () => {
    expect(tonoDelPaquete('mathist', '#B25FFB')).toBe(tonoDelPaquete('MATHIST', '#b25ffb'));
  });
});

describe('resumirHabitosActivos + color del paquete', () => {
  const base = { descripcion: null, icono_lucide: 'agua', color: '#029060', tipo_meta: 'check' as const, unidad: null };
  const plan = (habito_id: string) => ({ habito_id, frecuencia: 'diaria' as const, dias_semana: null, objetivo_valor: 1, desde_fecha: '2026-01-01', hasta_fecha: null });

  it('lleva el master_pack_color de cada hábito, venga como objeto o como lista', () => {
    const resumen = resumirHabitosActivos({
      fecha: '2026-09-20',
      items: [
        { ...base, id: 'a', titulo: 'A', paquete_id: 'mathist', arboles_paquetes: { master_pack_color: '#B25FFB' } },
        { ...base, id: 'b', titulo: 'B', paquete_id: 'sakura', arboles_paquetes: [{ master_pack_color: '#FC70AF' }] },
        { ...base, id: 'c', titulo: 'C', paquete_id: 'esmeralda', arboles_paquetes: null },
        { ...base, id: 'd', titulo: 'D', paquete_id: 'esmeralda' },
      ],
      planes: [plan('a'), plan('b'), plan('c'), plan('d')],
      registros: [],
    });
    expect(resumen.map((h) => [h.paqueteId, h.colorPaquete])).toEqual([['mathist', '#B25FFB'], ['sakura', '#FC70AF'], ['esmeralda', undefined], ['esmeralda', undefined]]);
    // el hábito conserva su paquete aunque su `color` guardado siga siendo el verde por defecto
    expect(resumen[0].color).toBe('#029060');
    expect(tonoDelPaquete(resumen[0].paqueteId, resumen[0].colorPaquete).id).toBe('mathist');
  });
});
