import { describe, expect, it, vi } from 'vitest';

const almacenamientoNativo = { getItem: vi.fn(), removeItem: vi.fn(), setItem: vi.fn() };
vi.mock('@react-native-async-storage/async-storage', () => ({ default: almacenamientoNativo }));

import { sincronizarRenovacionSesion, opcionesSesionPersistente } from './sesion';

describe('opcionesSesionPersistente', () => {
  it('persiste el refresh token en almacenamiento nativo', () => {
    const opciones = opcionesSesionPersistente(almacenamientoNativo);

    expect(opciones.persistSession).toBe(true);
    expect(opciones.storage).toBe(almacenamientoNativo);
    expect(opciones.autoRefreshToken).toBe(true);
  });
});

describe('sincronizarRenovacionSesion', () => {
  it('renueva solo mientras la app está en primer plano', () => {
    const auth = { startAutoRefresh: vi.fn(), stopAutoRefresh: vi.fn() };

    sincronizarRenovacionSesion('active', auth);
    sincronizarRenovacionSesion('background', auth);

    expect(auth.startAutoRefresh).toHaveBeenCalledTimes(1);
    expect(auth.stopAutoRefresh).toHaveBeenCalledTimes(1);
  });
});
