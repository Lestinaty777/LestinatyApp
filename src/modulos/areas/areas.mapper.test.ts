import { describe, expect, it } from 'vitest';

import { recursosI18n } from '../../servicios/i18n/recursos';
import { mapearArea, mapearAreaResumen, mapearAreas, nombreArea } from './areas.mapper';
import { CODIGOS_AREA_SISTEMA } from './areas.tipos';

const sistema = { id: 'a1', usuario_id: null, codigo: 'cuerpo', nombre: 'Cuerpo', color: '#EF4444', icono_lucide: 'Dumbbell', orden: 10 };
const propia = { id: 'a2', usuario_id: 'u1', codigo: null, nombre: 'Familia', color: '#14B8A6', icono_lucide: 'Heart', orden: 100 };

describe('mapearArea', () => {
  it('distingue áreas del sistema y propias', () => {
    expect(mapearArea(sistema)).toEqual({ id: 'a1', codigo: 'cuerpo', nombre: 'Cuerpo', color: '#EF4444', iconoLucide: 'Dumbbell', orden: 10, esDelSistema: true });
    expect(mapearArea(propia)).toMatchObject({ codigo: null, esDelSistema: false });
  });

  it('mapea listas y rechaza lo que no es una lista', () => {
    expect(mapearAreas([sistema, propia])).toHaveLength(2);
    expect(() => mapearAreas(null)).toThrow();
  });

  it('rechaza filas rotas', () => {
    expect(() => mapearArea({ ...sistema, color: 'rojo' })).toThrow('color');
    expect(() => mapearArea({ ...sistema, nombre: '' })).toThrow('nombre');
    expect(() => mapearAreaResumen(undefined)).toThrow();
  });
});

describe('nombreArea', () => {
  const t = (clave: string) => `[${clave}]`;

  it('traduce las del sistema por código y deja el nombre de las propias', () => {
    expect(nombreArea({ codigo: 'cuerpo', nombre: 'Cuerpo' }, t)).toBe('[areas.sistema.cuerpo]');
    expect(nombreArea({ codigo: null, nombre: 'Familia' }, t)).toBe('Familia');
  });

  it('hay traducción en es y en para los siete códigos del sistema', () => {
    for (const idioma of ['es', 'en'] as const) {
      const claves = Object.keys((recursosI18n[idioma].translation as unknown as { areas: { sistema: Record<string, string> } }).areas.sistema);
      expect(claves.sort()).toEqual([...CODIGOS_AREA_SISTEMA].sort());
    }
  });
});
