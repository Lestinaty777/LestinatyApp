import { describe, expect, it } from 'vitest';

import { resolverIdHabito } from './detalle';

describe('resolverIdHabito', () => {
  it('acepta un id de hábito único', () => {
    expect(resolverIdHabito('agua')).toBe('agua');
  });

  it('rechaza un id vacío', () => {
    expect(resolverIdHabito('')).toBeNull();
  });
});
