import { describe, expect, it } from 'vitest';
import { rutaDeIcono } from './rutaIcono';

const VERDE = 135; // hue típico de los iconos de assets/icons/ui
const MORADO = 266; // gemas, insignias

describe('rutaDeIcono', () => {
  it('Esmeralda (sin rotación de tema): imagen normal, sea verde o no', () => {
    expect(rutaDeIcono({ hue: VERDE })).toBe('imagen');
    expect(rutaDeIcono({ hue: MORADO })).toBe('imagen');
  });

  it('con tema activo, solo los iconos verdes usan Skia', () => {
    expect(rutaDeIcono({ hue: VERDE, deltaHue: 193 })).toBe('skia');
    expect(rutaDeIcono({ hue: MORADO, deltaHue: 193 })).toBe('imagen');
    expect(rutaDeIcono({ hue: 47, deltaHue: -60 })).toBe('imagen'); // amarillos: notificaciones, agenda
  });

  it('con tema activo y hue desconocido hay que decodificar: Skia', () => {
    expect(rutaDeIcono({ deltaHue: 193 })).toBe('skia');
  });

  it('un teñido forzado siempre rota, incluso un icono que no es verde', () => {
    expect(rutaDeIcono({ hue: MORADO, color: 2 })).toBe('skia');
    expect(rutaDeIcono({ hue: MORADO, hueDestino: 275 })).toBe('skia');
  });

  it('oscurecer también necesita matriz', () => {
    expect(rutaDeIcono({ hue: VERDE, oscurecido: 0.8 })).toBe('skia');
    expect(rutaDeIcono({ hue: VERDE, oscurecido: 1 })).toBe('imagen');
  });
});
