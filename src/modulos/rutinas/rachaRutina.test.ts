import { describe, expect, it } from 'vitest';

import { agruparFechasPorRutina, calcularRachaRutina, diasConSesionEstaSemana, rutinaTocaEnFecha } from './rachaRutina';

const diaria = { frecuencia: 'diaria' as const, diasSemana: null };
// 2026-10-09 es viernes (isodow 5). Lunes, miércoles y viernes:
const lmv = { frecuencia: 'dias_semana' as const, diasSemana: [1, 3, 5] };

describe('rutinaTocaEnFecha', () => {
  it('una rutina diaria toca siempre', () => {
    expect(rutinaTocaEnFecha(diaria, '2026-10-10')).toBe(true);
  });

  it('una rutina por días toca solo en sus días (isodow)', () => {
    expect(rutinaTocaEnFecha(lmv, '2026-10-09')).toBe(true); // viernes
    expect(rutinaTocaEnFecha(lmv, '2026-10-08')).toBe(false); // jueves
    expect(rutinaTocaEnFecha(lmv, '2026-10-05')).toBe(true); // lunes
    expect(rutinaTocaEnFecha({ frecuencia: 'dias_semana', diasSemana: [7] }, '2026-10-11')).toBe(true); // domingo
  });
});

describe('calcularRachaRutina', () => {
  it('sin sesiones completas es 0', () => {
    expect(calcularRachaRutina(new Set(), diaria, '2026-10-09')).toBe(0);
  });

  it('cuenta días seguidos terminando hoy', () => {
    expect(calcularRachaRutina(new Set(['2026-10-07', '2026-10-08', '2026-10-09']), diaria, '2026-10-09')).toBe(3);
  });

  it('hoy pendiente no rompe la racha: se cuenta hasta ayer', () => {
    expect(calcularRachaRutina(new Set(['2026-10-07', '2026-10-08']), diaria, '2026-10-09')).toBe(2);
  });

  it('un día programado sin completar rompe la racha', () => {
    expect(calcularRachaRutina(new Set(['2026-10-05', '2026-10-06', '2026-10-08', '2026-10-09']), diaria, '2026-10-09')).toBe(2);
  });

  it('los días que no tocaban no suman ni rompen', () => {
    // viernes 9, miércoles 7 y lunes 5 completos; martes y jueves no tocaban.
    expect(calcularRachaRutina(new Set(['2026-10-05', '2026-10-07', '2026-10-09']), lmv, '2026-10-09')).toBe(3);
    // una sesión hecha un día que no tocaba no cuenta
    expect(calcularRachaRutina(new Set(['2026-10-08', '2026-10-09']), lmv, '2026-10-09')).toBe(1);
  });

  it('si hoy no toca, la racha es la que venía', () => {
    expect(calcularRachaRutina(new Set(['2026-10-07', '2026-10-09']), lmv, '2026-10-10')).toBe(2); // sábado
  });

  it('respeta la ventana', () => {
    const fechas = new Set(['2026-10-09', '2026-10-08', '2026-10-07', '2026-10-06']);
    expect(calcularRachaRutina(fechas, diaria, '2026-10-09', 2)).toBe(2);
  });
});

describe('agruparFechasPorRutina', () => {
  it('agrupa fechas por rutina sin duplicar', () => {
    const mapa = agruparFechasPorRutina([
      { rutinaId: 'a', fechaLocal: '2026-10-08' }, { rutinaId: 'a', fechaLocal: '2026-10-09' },
      { rutinaId: 'a', fechaLocal: '2026-10-09' }, { rutinaId: 'b', fechaLocal: '2026-10-09' },
    ]);
    expect([...mapa.get('a') ?? []].sort()).toEqual(['2026-10-08', '2026-10-09']);
    expect(mapa.get('b')?.size).toBe(1);
  });
});

describe('diasConSesionEstaSemana', () => {
  // 2026-10-09 es viernes: la semana va del lunes 5 al domingo 11.
  const f = (fechaLocal: string) => ({ fechaLocal });

  it('devuelve los isodow de esta semana con alguna sesión, sin repetir y en orden', () => {
    expect(diasConSesionEstaSemana([f('2026-10-09'), f('2026-10-05'), f('2026-10-07'), f('2026-10-07')], '2026-10-09')).toEqual([1, 3, 5]);
  });

  it('ignora la semana pasada y los días posteriores a hoy', () => {
    expect(diasConSesionEstaSemana([f('2026-10-04'), f('2026-09-30'), f('2026-10-10')], '2026-10-09')).toEqual([]);
  });

  it('un lunes solo puede contar el propio lunes; un domingo, la semana entera', () => {
    expect(diasConSesionEstaSemana([f('2026-10-05'), f('2026-10-04')], '2026-10-05')).toEqual([1]);
    expect(diasConSesionEstaSemana([f('2026-10-05'), f('2026-10-11')], '2026-10-11')).toEqual([1, 7]);
  });
});
