import { describe, expect, it } from 'vitest';

import { MINIMO_REGISTROS_FRANJA, porcentajesFranjas, resumirFranjas } from './insightsFranjas';

/** Instante ISO cuya hora LOCAL es la indicada, sea cual sea la zona donde corre el test. */
const aLas = (hora: number, dia = 9) => new Date(2026, 9, dia, hora, 30).toISOString();

describe('resumirFranjas', () => {
  it('con pocos registros queda en observación y no destaca ninguna franja', () => {
    const resumen = resumirFranjas([aLas(8), aLas(9), aLas(20)]);
    expect(resumen).toMatchObject({ estado: 'en_observacion', mejor: null, total: 3 });
    expect(resumen.conteo).toEqual({ manana: 2, tarde: 0, noche: 1 });
  });

  it('con suficientes registros destaca la franja con más', () => {
    const marcas = [aLas(6), aLas(7), aLas(8), aLas(9), aLas(13), aLas(15), aLas(21)];
    expect(marcas.length).toBe(MINIMO_REGISTROS_FRANJA);
    expect(resumirFranjas(marcas)).toEqual({ conteo: { manana: 4, tarde: 2, noche: 1 }, total: 7, mejor: 'manana', estado: 'listo' });
  });

  it('la madrugada cuenta como noche', () => {
    const marcas = [aLas(1), aLas(2), aLas(3), aLas(4), aLas(23), aLas(8), aLas(14)];
    expect(resumirFranjas(marcas).mejor).toBe('noche');
  });

  it('respeta los límites personalizados', () => {
    const marcas = Array.from({ length: 7 }, () => aLas(6));
    expect(resumirFranjas(marcas).mejor).toBe('manana');
    expect(resumirFranjas(marcas, { mananaDesde: 8, tardeDesde: 13, nocheDesde: 20 }).mejor).toBe('noche');
  });

  it('con empate en cabeza no destaca ninguna', () => {
    const marcas = [aLas(6), aLas(7), aLas(8), aLas(13), aLas(14), aLas(15), aLas(21)];
    expect(resumirFranjas(marcas)).toMatchObject({ estado: 'listo', mejor: null });
  });

  it('ignora marcas ilegibles', () => {
    expect(resumirFranjas(['no-es-fecha', '', aLas(8)]).total).toBe(1);
  });
});

describe('porcentajesFranjas', () => {
  it('reparte sobre el total y da 0 sin registros', () => {
    expect(porcentajesFranjas({ conteo: { manana: 4, tarde: 2, noche: 2 }, total: 8 })).toEqual({ manana: 50, tarde: 25, noche: 25 });
    expect(porcentajesFranjas({ conteo: { manana: 0, tarde: 0, noche: 0 }, total: 0 })).toEqual({ manana: 0, tarde: 0, noche: 0 });
  });
});
