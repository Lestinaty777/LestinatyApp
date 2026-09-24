import { beforeEach, describe, expect, it, vi } from 'vitest';

const { plataforma, entornoMock, setLogLevel, configure, getOfferings, purchasePackage, getCustomerInfo, restorePurchases, logIn, logOut } = vi.hoisted(() => ({
  plataforma: { OS: 'ios' as 'android' | 'ios' | 'web' },
  entornoMock: { revenueCatAppleKey: 'apple-key', revenueCatGoogleKey: 'google-key' },
  setLogLevel: vi.fn(),
  configure: vi.fn(),
  getOfferings: vi.fn(),
  purchasePackage: vi.fn(),
  getCustomerInfo: vi.fn(),
  restorePurchases: vi.fn(),
  logIn: vi.fn(),
  logOut: vi.fn(),
}));

(globalThis as { __DEV__?: boolean }).__DEV__ = true;

vi.mock('react-native', () => ({ Platform: plataforma }));
vi.mock('../../nucleo/configuracion/entorno', () => ({ entorno: entornoMock }));
vi.mock('react-native-purchases', () => ({
  default: { setLogLevel, configure, getOfferings, purchasePackage, getCustomerInfo, restorePurchases, logIn, logOut },
  LOG_LEVEL: { DEBUG: 'DEBUG', WARN: 'WARN' },
  PACKAGE_TYPE: { MONTHLY: 'MONTHLY', CUSTOM: 'CUSTOM' },
  PURCHASES_ERROR_CODE: { PURCHASE_CANCELLED_ERROR: 'PURCHASE_CANCELLED_ERROR', PAYMENT_PENDING_ERROR: 'PAYMENT_PENDING_ERROR' },
}));

function paqueteFalso(id: string, productId: string, tipo: 'MONTHLY' | 'CUSTOM' = 'CUSTOM') {
  return { identifier: id, packageType: tipo, product: { identifier: productId, priceString: '$1.99' } };
}

describe('cliente nativo de compras', () => {
  beforeEach(() => {
    vi.resetModules();
    plataforma.OS = 'ios';
    entornoMock.revenueCatAppleKey = 'apple-key';
    entornoMock.revenueCatGoogleKey = 'google-key';
    setLogLevel.mockReset();
    configure.mockReset();
    getOfferings.mockReset();
    purchasePackage.mockReset();
    getCustomerInfo.mockReset();
    restorePurchases.mockReset();
    logIn.mockReset();
    logOut.mockReset();
  });

  it('en iOS configura con la clave de Apple', async () => {
    const { inicializarCompras } = await import('./cliente.native');
    inicializarCompras();
    expect(configure).toHaveBeenCalledWith({ apiKey: 'apple-key' });
  });

  it('en Android configura con la clave de Google', async () => {
    plataforma.OS = 'android';
    const { inicializarCompras } = await import('./cliente.native');
    inicializarCompras();
    expect(configure).toHaveBeenCalledWith({ apiKey: 'google-key' });
  });

  it('sin clave para la plataforma actual, el catálogo queda no_configurada', async () => {
    entornoMock.revenueCatAppleKey = '';
    const { inicializarCompras, obtenerCatalogoGemas } = await import('./cliente.native');
    inicializarCompras();
    await expect(obtenerCatalogoGemas()).resolves.toMatchObject({ estado: 'no_configurada' });
    expect(configure).not.toHaveBeenCalled();
  });

  it('en web el catálogo es no_disponible', async () => {
    plataforma.OS = 'web';
    const { obtenerCatalogoGemas } = await import('./cliente.native');
    await expect(obtenerCatalogoGemas()).resolves.toEqual({ estado: 'no_disponible', motivo: 'plataforma' });
  });

  it('la cancelación de la compra devuelve estado cancelada', async () => {
    getOfferings.mockResolvedValue({ current: { availablePackages: [paqueteFalso('gemas_100', 'com.lestinaty.app.gemas.100')] } });
    purchasePackage.mockRejectedValue({ code: 'PURCHASE_CANCELLED_ERROR', message: 'cancelado' });

    const { inicializarCompras, obtenerCatalogoGemas, comprarPaquete } = await import('./cliente.native');
    inicializarCompras();
    const catalogo = await obtenerCatalogoGemas();
    expect(catalogo.estado).toBe('lista');

    await expect(comprarPaquete('gemas_100')).resolves.toEqual({ estado: 'cancelada' });
  });

  it('un pago pendiente devuelve estado pendiente', async () => {
    getOfferings.mockResolvedValue({ current: { availablePackages: [paqueteFalso('gemas_100', 'com.lestinaty.app.gemas.100')] } });
    purchasePackage.mockRejectedValue({ code: 'PAYMENT_PENDING_ERROR', message: 'pendiente' });

    const { inicializarCompras, obtenerCatalogoGemas, comprarPaquete } = await import('./cliente.native');
    inicializarCompras();
    await obtenerCatalogoGemas();

    await expect(comprarPaquete('gemas_100')).resolves.toEqual({ estado: 'pendiente' });
  });

  it('un error real devuelve un mensaje seguro sin lanzar', async () => {
    getOfferings.mockResolvedValue({ current: { availablePackages: [paqueteFalso('gemas_100', 'com.lestinaty.app.gemas.100')] } });
    purchasePackage.mockRejectedValue({ code: 'STORE_PROBLEM_ERROR', message: 'algo salió mal' });

    const { inicializarCompras, obtenerCatalogoGemas, comprarPaquete } = await import('./cliente.native');
    inicializarCompras();
    await obtenerCatalogoGemas();

    await expect(comprarPaquete('gemas_100')).resolves.toEqual({ estado: 'error', mensajeSeguro: 'algo salió mal' });
  });

  it('la restauración vacía se distingue de un error', async () => {
    getCustomerInfo.mockResolvedValue({ entitlements: { active: {} } });
    restorePurchases.mockResolvedValue({ entitlements: { active: {} } });

    const { inicializarCompras, restaurarCompras } = await import('./cliente.native');
    inicializarCompras();
    await expect(restaurarCompras()).resolves.toEqual({ estado: 'sin_compras' });
  });

  it('la restauración con entitlement activo devuelve restaurada', async () => {
    restorePurchases.mockResolvedValue({ entitlements: { active: { horizon: { identifier: 'horizon' } } } });

    const { inicializarCompras, restaurarCompras } = await import('./cliente.native');
    inicializarCompras();
    await expect(restaurarCompras()).resolves.toEqual({ estado: 'restaurada', horizonActivo: true });
  });

  it('un error de restauración devuelve un mensaje seguro', async () => {
    restorePurchases.mockRejectedValue(new Error('sin red'));

    const { inicializarCompras, restaurarCompras } = await import('./cliente.native');
    inicializarCompras();
    await expect(restaurarCompras()).resolves.toEqual({ estado: 'error', mensajeSeguro: 'sin red' });
  });
});
