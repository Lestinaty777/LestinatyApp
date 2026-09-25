import { beforeEach, describe, expect, it, vi } from 'vitest';

const { capacidades } = vi.hoisted(() => ({
  capacidades: { widgets: true, horizon: true, googleSignIn: true, comprasNativas: true, notificacionesPush: true },
}));

vi.mock('react-native', () => ({ Platform: { OS: 'android' } }));
vi.mock('../../plataforma/capacidades', () => ({ capacidades }));

import { rutaParaHorizon } from './horizonAcceso';

describe('rutaParaHorizon', () => {
  beforeEach(() => {
    capacidades.widgets = true;
    capacidades.horizon = true;
  });

  it('sends an inactive user to the Horizon paywall when Horizon is offered', () => {
    expect(rutaParaHorizon('inactivo')).toBe('/horizon');
    expect(rutaParaHorizon('activo')).toBe('/habitos/widgets');
  });

  it('never routes to the paywall where Horizon has no real benefit (no widgets)', () => {
    capacidades.widgets = false;
    capacidades.horizon = false;
    expect(rutaParaHorizon('inactivo')).toBe('/(principal)/hoy');
    expect(rutaParaHorizon('activo')).toBe('/(principal)/hoy');
  });
});
