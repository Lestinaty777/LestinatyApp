import { describe, expect, it, vi } from 'vitest';

const { inicializarNotificaciones, identificarUsuarioNotificaciones, cerrarSesionNotificaciones, solicitarPermisoYRegistrar } = vi.hoisted(() => ({
  inicializarNotificaciones: vi.fn(),
  identificarUsuarioNotificaciones: vi.fn(),
  cerrarSesionNotificaciones: vi.fn(),
  solicitarPermisoYRegistrar: vi.fn(),
}));

vi.mock('../../plataforma/notificaciones/cliente.native', () => ({
  inicializarNotificaciones,
  identificarUsuarioNotificaciones,
  cerrarSesionNotificaciones,
  solicitarPermisoYRegistrar,
}));

describe('fachada de compatibilidad oneSignal.ts', () => {
  it('reexporta los nombres históricos delegando al cliente real de la plataforma', async () => {
    const modulo = await import('./oneSignal');

    modulo.inicializarOneSignal();
    expect(inicializarNotificaciones).toHaveBeenCalledTimes(1);

    modulo.identificarUsuarioOneSignal('usuario-1');
    expect(identificarUsuarioNotificaciones).toHaveBeenCalledWith('usuario-1');

    modulo.cerrarSesionOneSignal();
    expect(cerrarSesionNotificaciones).toHaveBeenCalledTimes(1);

    await modulo.solicitarPermisoYRegistrar();
    expect(solicitarPermisoYRegistrar).toHaveBeenCalledTimes(1);
  });
});
