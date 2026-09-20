import { describe, expect, it } from 'vitest';
import { leerPreferenciaTema } from './temaMaster';

describe('leerPreferenciaTema', () => {
  it('lee una preferencia válida', () => {
    expect(leerPreferenciaTema('{"id":"sakura","masterPackColor":"#FC70AF"}')).toEqual({ id: 'sakura', masterPackColor: '#FC70AF' });
  });

  it.each([null, '', 'no es json', '42', 'null', '{}', '{"id":"sakura"}', '{"id":"","masterPackColor":"#FC70AF"}', '{"id":"sakura","masterPackColor":"rosa"}', '{"id":1,"masterPackColor":"#FC70AF"}'])('descarta %s', (crudo) => {
    expect(leerPreferenciaTema(crudo)).toBeNull();
  });
});
