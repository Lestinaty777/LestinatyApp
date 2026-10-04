import { describe, expect, it } from 'vitest';

import {
  agruparPorFranja, contarPendientesPorFiltro, filtrarPorFranja, franjaActual, franjaDeHora, limitesValidos,
  LIMITES_FRANJA_DEFECTO, sugerirFranjaPorHora, type FranjaDia,
} from './franjas';

describe('franjaDeHora', () => {
  it.each([
    [0, 'noche'], [4, 'noche'], [5, 'manana'], [11, 'manana'], [12, 'tarde'], [18, 'tarde'], [19, 'noche'], [23, 'noche'],
  ] as const)('hora %i -> %s con los límites por defecto', (hora, esperada) => {
    expect(franjaDeHora(hora)).toBe(esperada);
  });

  it('respeta límites personalizados (turno de noche)', () => {
    const limites = { mananaDesde: 14, tardeDesde: 18, nocheDesde: 22 };
    expect(franjaDeHora(13, limites)).toBe('noche');
    expect(franjaDeHora(14, limites)).toBe('manana');
    expect(franjaDeHora(21, limites)).toBe('tarde');
    expect(franjaDeHora(22, limites)).toBe('noche');
  });

  it.each([-1, 24, 7.5, Number.NaN])('rechaza la hora inválida %s', (hora) => {
    expect(() => franjaDeHora(hora)).toThrow(RangeError);
  });
});

describe('franjaActual', () => {
  it('usa la hora local de la fecha recibida', () => {
    expect(franjaActual(new Date(2026, 9, 4, 8, 30))).toBe('manana');
    expect(franjaActual(new Date(2026, 9, 4, 15, 0))).toBe('tarde');
    expect(franjaActual(new Date(2026, 9, 4, 23, 59))).toBe('noche');
  });
});

describe('sugerirFranjaPorHora', () => {
  it('sugiere según la hora HH:mm', () => {
    expect(sugerirFranjaPorHora('07:30')).toBe('manana');
    expect(sugerirFranjaPorHora('12:00')).toBe('tarde');
    expect(sugerirFranjaPorHora('21:15')).toBe('noche');
  });

  it('devuelve null si la hora no es válida', () => {
    expect(sugerirFranjaPorHora('')).toBeNull();
    expect(sugerirFranjaPorHora('7:30')).toBeNull();
    expect(sugerirFranjaPorHora('24:00')).toBeNull();
    expect(sugerirFranjaPorHora('08:60')).toBeNull();
  });
});

describe('limitesValidos', () => {
  it('acepta los límites por defecto', () => {
    expect(limitesValidos(LIMITES_FRANJA_DEFECTO)).toBe(true);
  });

  it('rechaza orden incorrecto, iguales y fuera de rango', () => {
    expect(limitesValidos({ mananaDesde: 12, tardeDesde: 12, nocheDesde: 19 })).toBe(false);
    expect(limitesValidos({ mananaDesde: 12, tardeDesde: 8, nocheDesde: 19 })).toBe(false);
    expect(limitesValidos({ mananaDesde: 5, tardeDesde: 12, nocheDesde: 24 })).toBe(false);
    expect(limitesValidos({ mananaDesde: -1, tardeDesde: 12, nocheDesde: 19 })).toBe(false);
  });
});

type Item = { id: string; franja: FranjaDia; hecho: boolean };
const items: Item[] = [
  { id: 'a', franja: 'manana', hecho: false },
  { id: 'b', franja: 'manana', hecho: true },
  { id: 'c', franja: 'tarde', hecho: false },
  { id: 'd', franja: 'noche', hecho: false },
  { id: 'e', franja: 'cualquier_momento', hecho: false },
];

describe('agruparPorFranja', () => {
  it('agrupa y deja vacías las franjas sin elementos', () => {
    const grupos = agruparPorFranja(items.filter((item) => item.franja !== 'tarde'));
    expect(grupos.manana.map((item) => item.id)).toEqual(['a', 'b']);
    expect(grupos.tarde).toEqual([]);
    expect(grupos.cualquier_momento.map((item) => item.id)).toEqual(['e']);
  });
});

describe('filtrarPorFranja', () => {
  it('"todo" incluye lo que no tiene franja', () => {
    expect(filtrarPorFranja(items, 'todo').map((item) => item.id)).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('una franja concreta no incluye lo que no tiene franja', () => {
    expect(filtrarPorFranja(items, 'manana').map((item) => item.id)).toEqual(['a', 'b']);
    expect(filtrarPorFranja(items, 'noche').map((item) => item.id)).toEqual(['d']);
  });
});

describe('contarPendientesPorFiltro', () => {
  it('cuenta solo lo pendiente; "todo" incluye lo sin franja', () => {
    expect(contarPendientesPorFiltro(items, (item) => !item.hecho)).toEqual({ manana: 1, tarde: 1, noche: 1, todo: 4 });
  });

  it('devuelve ceros si no hay elementos', () => {
    expect(contarPendientesPorFiltro([], () => true)).toEqual({ manana: 0, tarde: 0, noche: 0, todo: 0 });
  });
});
