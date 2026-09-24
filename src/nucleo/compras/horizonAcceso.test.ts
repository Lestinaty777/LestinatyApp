import { expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({ Platform: { OS: 'android' } }));
vi.mock('../../plataforma/capacidades', () => ({ capacidades: { widgets: true, googleSignIn: true, comprasNativas: true, notificacionesPush: true } }));

import { rutaParaHorizon } from './horizonAcceso';

it('sends an inactive user to the Horizon paywall', () => {
  expect(rutaParaHorizon('inactivo')).toBe('/horizon');
  expect(rutaParaHorizon('activo')).toBe('/habitos/widgets');
});
