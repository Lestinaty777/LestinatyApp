import { describe, expect, it } from 'vitest';

import { obtenerRutaNotificacion } from './rutaNotificacion';

describe('obtenerRutaNotificacion', () => {
  it('acepta solo rutas internas de hábitos con un identificador', () => {
    expect(obtenerRutaNotificacion({ ruta: '/habitos/8f0e0bc9-0ff0-4695-b155-a755a544b408' }))
      .toBe('/habitos/8f0e0bc9-0ff0-4695-b155-a755a544b408');
  });

  it('ignora rutas externas o incompletas enviadas por una notificación', () => {
    expect(obtenerRutaNotificacion({ ruta: 'https://otro-sitio.example/habitos/1' })).toBeNull();
    expect(obtenerRutaNotificacion({ ruta: '/habitos/' })).toBeNull();
  });
});
