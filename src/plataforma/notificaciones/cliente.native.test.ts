import { beforeEach, describe, expect, it, vi } from 'vitest';

const { plataforma, rpc, getSession, refreshSession, getIdAsync, getPermissionAsync, requestPermission } = vi.hoisted(() => ({
  plataforma: { OS: 'android' as 'android' | 'ios' | 'web' },
  rpc: vi.fn(),
  getSession: vi.fn(),
  refreshSession: vi.fn(),
  getIdAsync: vi.fn(),
  getPermissionAsync: vi.fn(),
  requestPermission: vi.fn(),
}));

(globalThis as { __DEV__?: boolean }).__DEV__ = true;

vi.mock('react-native', () => ({ Platform: plataforma }));
vi.mock('expo-router', () => ({ router: { push: vi.fn() } }));
vi.mock('../../servicios/base-datos/supabase', () => ({
  obtenerClienteSupabase: () => ({ auth: { getSession, refreshSession }, rpc }),
  supabaseEstaConfigurado: () => true,
}));
vi.mock('react-native-onesignal', () => ({
  LogLevel: { Verbose: 'verbose', Warn: 'warn' },
  OneSignal: {
    Debug: { setLogLevel: vi.fn() },
    Notifications: { addEventListener: vi.fn(), getPermissionAsync, requestPermission },
    User: { pushSubscription: { addEventListener: vi.fn(), getIdAsync } },
    login: vi.fn(),
    logout: vi.fn(),
    initialize: vi.fn(),
  },
}));

describe('cliente nativo de notificaciones', () => {
  beforeEach(() => {
    vi.resetModules();
    plataforma.OS = 'android';
    rpc.mockReset();
    getSession.mockReset();
    refreshSession.mockReset();
    getIdAsync.mockReset();
    getPermissionAsync.mockReset();
    requestPermission.mockReset();
    rpc.mockResolvedValue({ error: null });
    getIdAsync.mockResolvedValue('onesignal-subscription');
    getPermissionAsync.mockResolvedValue(true);
    getSession.mockResolvedValue({ data: { session: { expires_at: Date.now() / 1000 + 3600 } } });
    refreshSession.mockResolvedValue({ data: { session: null }, error: new Error('Sin sesión') });
  });

  it('inicializar nunca solicita permiso de notificaciones al arrancar', async () => {
    const { inicializarNotificaciones } = await import('./cliente.native');
    inicializarNotificaciones();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(requestPermission).not.toHaveBeenCalled();
  });

  it('en iOS registra el dispositivo con p_plataforma "ios"', async () => {
    plataforma.OS = 'ios';
    const { inicializarNotificaciones } = await import('./cliente.native');
    inicializarNotificaciones();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(rpc).toHaveBeenCalledWith('registrar_dispositivo_notificacion', expect.objectContaining({ p_plataforma: 'ios' }));
  });

  it('en Android registra el dispositivo con p_plataforma "android"', async () => {
    plataforma.OS = 'android';
    const { inicializarNotificaciones } = await import('./cliente.native');
    inicializarNotificaciones();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(rpc).toHaveBeenCalledWith('registrar_dispositivo_notificacion', expect.objectContaining({ p_plataforma: 'android' }));
  });

  it('una sesión inválida no llama al RPC de registro', async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    const { inicializarNotificaciones, identificarUsuarioNotificaciones } = await import('./cliente.native');
    inicializarNotificaciones();
    identificarUsuarioNotificaciones('usuario-1');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(rpc).not.toHaveBeenCalled();
  });

  it('la denegación del permiso devuelve estado denegado sin lanzar', async () => {
    requestPermission.mockResolvedValue(false);
    const { inicializarNotificaciones, solicitarPermisoYRegistrar } = await import('./cliente.native');
    inicializarNotificaciones();
    await expect(solicitarPermisoYRegistrar()).resolves.toEqual({ estado: 'denegado' });
  });

  it('la concesión del permiso devuelve estado concedido', async () => {
    requestPermission.mockResolvedValue(true);
    const { inicializarNotificaciones, solicitarPermisoYRegistrar } = await import('./cliente.native');
    inicializarNotificaciones();
    await expect(solicitarPermisoYRegistrar()).resolves.toEqual({ estado: 'concedido' });
  });
});
