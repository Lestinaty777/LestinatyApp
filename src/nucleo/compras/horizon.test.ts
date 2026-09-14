import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({ Platform: { OS: 'android' } }));
vi.mock('react-native-purchases', () => ({
  default: { getCustomerInfo: vi.fn(), getOfferings: vi.fn(), purchasePackage: vi.fn(), restorePurchases: vi.fn() },
  LOG_LEVEL: { DEBUG: 'DEBUG', WARN: 'WARN' },
  PACKAGE_TYPE: { MONTHLY: 'MONTHLY' },
}));

import { obtenerEstadoHorizon, resolverEstadoHorizon } from './horizon';

describe('resolverEstadoHorizon', () => {
  it('activa Horizon solo cuando el entitlement horizon está activo', () => {
    expect(resolverEstadoHorizon({ entitlements: { active: { horizon: { identifier: 'horizon' } } } } as never)).toBe('activo');
    expect(resolverEstadoHorizon({ entitlements: { active: {} } } as never)).toBe('inactivo');
  });

  it('reports noDisponible when RevenueCat is not initialized', async () => {
    expect(await obtenerEstadoHorizon()).toBe('noDisponible');
  });
});
