import { expect, it } from 'vitest';

import { textoCtaHorizon } from './horizonCopy';

it('shows the monthly reference price when no offering is available', () => {
  expect(textoCtaHorizon(null)).toBe('Horizon por $129 MXN al mes');
});
