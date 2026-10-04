import { describe, expect, it } from 'vitest';

import { esErrorGemasInsuficientes, mapearPlantillaRutina, mapearPlantillasRutinas, mapearResultadoCompraPlantilla } from './plantillasRutinas';

const gratuita = {
  id: 'sesion-de-estudio', titulo: 'Sesión de estudio', descripcion: '45 minutos con foco', franja: 'tarde', icono_id: 'estudiar',
  autor: 'Lestinaty', precio_gemas: 0, num_pasos: 2, duracion_min: 10, desbloqueada: true,
  pasos: [
    { titulo: 'Repasar', modo: 'cronometro', objetivo_valor: 10, unidad: 'min' },
    { titulo: 'Resolver', modo: 'contador', objetivo_valor: '20', unidad: 'ejercicios' },
    { titulo: 'Cerrar', modo: 'simple' },
  ],
};
const bloqueada = { ...gratuita, id: 'premium', precio_gemas: 100, desbloqueada: false, pasos: null };

describe('mapearPlantillaRutina', () => {
  it('mapea una plantilla desbloqueada con sus pasos', () => {
    const plantilla = mapearPlantillaRutina(gratuita);
    expect(plantilla).toMatchObject({ id: 'sesion-de-estudio', iconoId: 'estudiar', precioGemas: 0, numPasos: 2, duracionMin: 10, desbloqueada: true });
    expect(plantilla.pasos).toEqual([
      { titulo: 'Repasar', modo: 'cronometro', objetivoValor: 10, unidad: 'min' },
      { titulo: 'Resolver', modo: 'contador', objetivoValor: 20, unidad: 'ejercicios' },
      { titulo: 'Cerrar', modo: 'simple' },
    ]);
  });

  it('una plantilla bloqueada no expone pasos aunque el servidor los enviara', () => {
    expect(mapearPlantillaRutina(bloqueada).pasos).toBeNull();
    expect(mapearPlantillaRutina({ ...bloqueada, pasos: gratuita.pasos }).pasos).toBeNull();
  });

  it('rechaza una desbloqueada sin contenido y datos inválidos', () => {
    expect(() => mapearPlantillaRutina({ ...gratuita, pasos: null })).toThrow(/contenido/);
    expect(() => mapearPlantillaRutina({ ...gratuita, franja: 'madrugada' })).toThrow(/franja/);
    expect(() => mapearPlantillaRutina({ ...gratuita, pasos: [{ titulo: 'x', modo: 'raro' }] })).toThrow(/modo/);
    expect(() => mapearPlantillaRutina({ ...gratuita, precio_gemas: 'caro' })).toThrow(/precio_gemas/);
    expect(() => mapearPlantillaRutina(null)).toThrow();
  });
});

describe('mapearPlantillasRutinas', () => {
  it('mapea listas y rechaza lo que no lo es', () => {
    expect(mapearPlantillasRutinas([gratuita, bloqueada])).toHaveLength(2);
    expect(mapearPlantillasRutinas([])).toEqual([]);
    expect(() => mapearPlantillasRutinas({})).toThrow();
  });
});

describe('mapearResultadoCompraPlantilla', () => {
  it('mapea el resultado del RPC', () => {
    expect(mapearResultadoCompraPlantilla({ plantilla_id: 'p', ya_desbloqueada: false, saldo_restante: '150' })).toEqual({ plantillaId: 'p', yaDesbloqueada: false, saldoRestante: 150 });
  });
});

describe('esErrorGemasInsuficientes', () => {
  it('reconoce el check_violation del RPC y nada más', () => {
    expect(esErrorGemasInsuficientes({ code: '23514', message: 'No tienes gemas suficientes.' })).toBe(true);
    expect(esErrorGemasInsuficientes({ code: '22023' })).toBe(false);
    expect(esErrorGemasInsuficientes(null)).toBe(false);
    expect(esErrorGemasInsuficientes(new Error('x'))).toBe(false);
  });
});
