import { expect, it } from 'vitest';

import { posicionTipHorizon } from './horizonTipEstado';

it('places the Horizon tip after a non-empty reminder list', () => {
  expect(posicionTipHorizon(3)).toBe('final');
  expect(posicionTipHorizon(0)).toBe('antes-vacio');
});
