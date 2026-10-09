import { describe, expect, it, vi } from 'vitest';

const { plataforma } = vi.hoisted(() => ({ plataforma: { OS: 'ios' as 'android' | 'ios' } }));
vi.mock('react-native', () => ({ Platform: plataforma }));
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

  it('reports noDisponible when RevenueCat is not initialized (iOS)', async () => {
    expect(await obtenerEstadoHorizon()).toBe('noDisponible');
  });

  // Bypass temporal (decisión 2026-10-05, ver cliente.native.ts): Android no
  // tiene todavía un producto Horizon real, así que siempre reporta activo
  // — incluso sin RevenueCat inicializado. Sacar este test junto con el
  // bypass cuando el producto de Android exista.
  it('en Android siempre reporta activo mientras no haya producto real (bypass temporal)', async () => {
    plataforma.OS = 'android';
    try {
      expect(await obtenerEstadoHorizon()).toBe('activo');
    } finally {
      plataforma.OS = 'ios';
    }
  });
});
