import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({ Platform: { OS: 'android' } }));

import { resolverCapacidades } from './capacidades';

describe('capacidades por plataforma', () => {
  it('desactiva widgets y Google en iOS, pero conserva Horizon (Planes con Aby no depende de widgets)', () => {
    expect(resolverCapacidades('ios')).toEqual({
      comprasNativas: true,
      googleSignIn: false,
      notificacionesPush: true,
      widgets: false,
      horizon: true,
    });
  });

  it('conserva widgets y Horizon en Android', () => {
    expect(resolverCapacidades('android')).toEqual({
      comprasNativas: true,
      googleSignIn: true,
      notificacionesPush: true,
      widgets: true,
      horizon: true,
    });
  });
});
