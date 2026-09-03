import { describe, expect, it } from 'vitest';

import { calcularEncuadreSuperiorIzquierdo } from './encuadreVideoAby';

describe('calcularEncuadreSuperiorIzquierdo', () => {
  it('cubre el contenedor manteniendo el origen en la esquina superior izquierda', () => {
    expect(calcularEncuadreSuperiorIzquierdo(360, 640)).toEqual({ height: 640, left: 0, top: 0, width: 360 });
    expect(calcularEncuadreSuperiorIzquierdo(360, 640, 853, 1844)).toMatchObject({ left: 0, top: 0, width: 360 });
  });
});
