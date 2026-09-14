import { expect, it } from 'vitest';

import { rutaParaHorizon } from './horizonAcceso';

it('sends an inactive user to the Horizon paywall', () => {
  expect(rutaParaHorizon('inactivo')).toBe('/horizon');
  expect(rutaParaHorizon('activo')).toBe('/habitos/widgets');
});
