import { describe, expect, it, vi } from 'vitest';

const { inicializarGoogle, inicializarCompras, inicializarOneSignal } = vi.hoisted(() => ({
  inicializarGoogle: vi.fn(),
  inicializarCompras: vi.fn(),
  inicializarOneSignal: vi.fn(),
}));

vi.mock('./autenticacion/google', () => ({ inicializarGoogle }));
vi.mock('../nucleo/compras/revenueCat', () => ({ inicializarCompras }));
vi.mock('../nucleo/notificaciones/oneSignal', () => ({ inicializarOneSignal }));

describe('inicializarPlataforma', () => {
  it('ejecuta las tres integraciones exactamente una vez cada una, aunque una falle', async () => {
    inicializarOneSignal.mockImplementation(() => {
      throw new Error('OneSignal no disponible');
    });

    const { inicializarPlataforma } = await import('./inicializarPlataforma');
    await inicializarPlataforma();

    expect(inicializarGoogle).toHaveBeenCalledTimes(1);
    expect(inicializarCompras).toHaveBeenCalledTimes(1);
    expect(inicializarOneSignal).toHaveBeenCalledTimes(1);
  });
});
