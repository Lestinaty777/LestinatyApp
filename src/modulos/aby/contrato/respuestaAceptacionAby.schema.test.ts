import { describe, expect, it } from 'vitest';

import { validarRespuestaAceptacionAby } from './respuestaAceptacionAby.schema';

describe('validarRespuestaAceptacionAby', () => {
  it('acepta solamente un sendero identificado por UUID', () => {
    expect(validarRespuestaAceptacionAby({ senderoId: '00000000-0000-4000-8000-000000000001' })).toEqual({
      senderoId: '00000000-0000-4000-8000-000000000001',
    });
    expect(() => validarRespuestaAceptacionAby({ senderoId: 'sendero-local' })).toThrow();
  });
});
