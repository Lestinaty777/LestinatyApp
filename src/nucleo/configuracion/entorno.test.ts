import { describe, expect, it } from 'vitest';

import { validarVariablesPublicasRelease } from './entorno';

const envCompletoIOS = {
  EXPO_PUBLIC_SUPABASE_URL: 'https://proyecto.supabase.co',
  EXPO_PUBLIC_SUPABASE_ANON_KEY: 'clave-anon',
  EXPO_PUBLIC_REVENUECAT_APPLE_KEY: 'clave-apple',
};

const envCompletoAndroid = {
  EXPO_PUBLIC_SUPABASE_URL: 'https://proyecto.supabase.co',
  EXPO_PUBLIC_SUPABASE_ANON_KEY: 'clave-anon',
  EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY: 'clave-google',
};

describe('validarVariablesPublicasRelease', () => {
  it('pasa con el entorno completo de iOS sin exigir la clave de Google', () => {
    expect(validarVariablesPublicasRelease(envCompletoIOS, 'ios')).toEqual({ valido: true, variablesFaltantesOInvalidas: [] });
  });

  it('pasa con el entorno completo de Android sin exigir la clave de Apple', () => {
    expect(validarVariablesPublicasRelease(envCompletoAndroid, 'android')).toEqual({ valido: true, variablesFaltantesOInvalidas: [] });
  });

  it('falla y nombra la variable cuando falta la URL de Supabase', () => {
    const { valido, variablesFaltantesOInvalidas } = validarVariablesPublicasRelease({ ...envCompletoIOS, EXPO_PUBLIC_SUPABASE_URL: undefined }, 'ios');
    expect(valido).toBe(false);
    expect(variablesFaltantesOInvalidas).toContain('EXPO_PUBLIC_SUPABASE_URL');
  });

  it('rechaza una URL con IP numérica o localhost en vez de un hostname público', () => {
    expect(validarVariablesPublicasRelease({ ...envCompletoIOS, EXPO_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321' }, 'ios').valido).toBe(false);
    expect(validarVariablesPublicasRelease({ ...envCompletoIOS, EXPO_PUBLIC_SUPABASE_URL: 'https://localhost' }, 'ios').valido).toBe(false);
  });

  it('no exige EXPO_PUBLIC_ABY_REMOTO — Aby remoto (Gemini) es opcional, apagado por defecto', () => {
    expect(validarVariablesPublicasRelease({ ...envCompletoIOS, EXPO_PUBLIC_ABY_REMOTO: 'false' }, 'ios').valido).toBe(true);
    expect(validarVariablesPublicasRelease(envCompletoIOS, 'ios').valido).toBe(true);
  });

  it('exige la clave de RevenueCat de la plataforma actual', () => {
    const resultado = validarVariablesPublicasRelease({ ...envCompletoIOS, EXPO_PUBLIC_REVENUECAT_APPLE_KEY: undefined }, 'ios');
    expect(resultado.valido).toBe(false);
    expect(resultado.variablesFaltantesOInvalidas).toContain('EXPO_PUBLIC_REVENUECAT_APPLE_KEY');
  });
});
