import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

const { hasPlayServices, signIn, signInWithIdToken } = vi.hoisted(() => ({
  hasPlayServices: vi.fn(),
  signIn: vi.fn(),
  signInWithIdToken: vi.fn(),
}));

vi.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: vi.fn(),
    hasPlayServices: (...args: unknown[]) => hasPlayServices(...args),
    signIn: (...args: unknown[]) => signIn(...args),
  },
  isCancelledResponse: (respuesta: { type: string }) => respuesta.type === 'cancelled',
  isSuccessResponse: (respuesta: { type: string }) => respuesta.type === 'success',
}));

vi.mock('../../servicios/base-datos/supabase', () => ({
  obtenerClienteSupabase: () => ({
    auth: { signInWithIdToken: (...args: unknown[]) => signInWithIdToken(...args) },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  }),
}));

describe('Google fuera de Android', () => {
  it('declara plataforma no disponible sin cargar el SDK', async () => {
    const { iniciarSesionConGoogle } = await import('./google');
    await expect(iniciarSesionConGoogle()).resolves.toEqual({ estado: 'no_disponible', motivo: 'plataforma' });
  });

  it('inicializarGoogle no hace nada fuera de Android', async () => {
    const { inicializarGoogle } = await import('./google');
    expect(() => inicializarGoogle()).not.toThrow();
  });
});

describe('Google en Android (adaptador nativo)', () => {
  it('la cancelación del picker devuelve estado cancelado, no un error', async () => {
    hasPlayServices.mockResolvedValueOnce(true);
    signIn.mockResolvedValueOnce({ type: 'cancelled' });

    const { iniciarSesionConGoogle } = await import('./google.android');
    await expect(iniciarSesionConGoogle()).resolves.toEqual({ estado: 'cancelado' });
  });

  it('el éxito devuelve el usuario autenticado', async () => {
    hasPlayServices.mockResolvedValueOnce(true);
    signIn.mockResolvedValueOnce({ type: 'success', data: { idToken: 'token-falso' } });
    signInWithIdToken.mockResolvedValueOnce({ data: { user: { id: 'usuario-1', email: 'a@b.com' } }, error: null });

    const { iniciarSesionConGoogle } = await import('./google.android');
    await expect(iniciarSesionConGoogle()).resolves.toEqual({
      estado: 'autenticado',
      usuario: { id: 'usuario-1', email: 'a@b.com' },
    });
  });
});

describe('aislamiento estático del SDK de Google', () => {
  it('solo google.android.ts menciona el paquete nativo de Google Sign-In', () => {
    const base = readFileSync(new URL('./google.ts', import.meta.url), 'utf8');
    const android = readFileSync(new URL('./google.android.ts', import.meta.url), 'utf8');

    expect(base).not.toContain('@react-native-google-signin/google-signin');
    expect(android).toContain('@react-native-google-signin/google-signin');
  });
});
