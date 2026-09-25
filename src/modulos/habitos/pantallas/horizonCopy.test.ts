import { expect, it } from 'vitest';

import { textoCtaHorizon } from './horizonCopy';

it('never invents a price when no offering is available', () => {
  expect(textoCtaHorizon(null)).toBe('Suscribirse a Horizon');
});
