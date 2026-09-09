import { describe, expect, it } from 'vitest';

import { resolverCategoriaRuta } from './categorias';

describe('resolverCategoriaRuta', () => {
  it('acepta las cinco categorías de hábitos', () => {
    expect(resolverCategoriaRuta('impacto')).toBe('impacto');
  });

  it('rechaza una categoría inexistente', () => {
    expect(resolverCategoriaRuta('rachas')).toBeNull();
  });
});
