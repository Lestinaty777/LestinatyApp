import { beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.fn();
const getSession = vi.fn();
const refreshSession = vi.fn();
const getIdAsync = vi.fn();

(globalThis as { __DEV__?: boolean }).__DEV__ = true;

vi.mock('react-native', () => ({ Alert: { alert: vi.fn() }, Platform: { OS: 'android' } }));
vi.mock('expo-router', () => ({ router: { push: vi.fn() } }));
vi.mock('../../servicios/base-datos/supabase', () => ({
  obtenerClienteSupabase: () => ({ auth: { getSession, refreshSession }, rpc }),
  supabaseEstaConfigurado: () => true,
}));
vi.mock('react-native-onesignal', () => ({
  LogLevel: { Verbose: 'verbose', Warn: 'warn' },
  OneSignal: {
    Debug: { setLogLevel: vi.fn() },
    Notifications: { addEventListener: vi.fn(), getPermissionAsync: vi.fn(), requestPermission: vi.fn() },
    User: {
      pushSubscription: { addEventListener: vi.fn(), getIdAsync },
    },
    login: vi.fn(),
    logout: vi.fn(),
    initialize: vi.fn(),
  },
}));

describe('OneSignal y la sesión', () => {
  beforeEach(() => {
    vi.resetModules();
    rpc.mockReset();
    getSession.mockReset();
    refreshSession.mockReset();
    getIdAsync.mockReset();
    rpc.mockResolvedValue({ error: null });
    getIdAsync.mockResolvedValue('onesignal-subscription');
    getSession.mockResolvedValue({ data: { session: null } });
    refreshSession.mockResolvedValue({ data: { session: null }, error: new Error('Sin sesión') });
  });

  it('no registra el dispositivo cuando no hay una sesión de Supabase válida', async () => {
    const { identificarUsuarioOneSignal, inicializarOneSignal } = await import('./oneSignal');

    inicializarOneSignal();
    identificarUsuarioOneSignal('usuario-1');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(rpc).not.toHaveBeenCalled();
  });
});
