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

describe('obtenerRutaNotificacion — rutinas y tareas', () => {
  it('acepta la ruta de una rutina por id', () => {
    expect(obtenerRutaNotificacion({ ruta: '/rutinas/8f0e0bc9-0ff0-4695-b155-a755a544b408' })).toBe('/rutinas/8f0e0bc9-0ff0-4695-b155-a755a544b408');
  });

  it('lleva una tarea a la pantalla de Tareas, que es la que existe', () => {
    expect(obtenerRutaNotificacion({ ruta: '/tareas/8f0e0bc9-0ff0-4695-b155-a755a544b408' })).toBe('/tareas');
  });

  it('rechaza rutas desconocidas, con consulta o con más segmentos', () => {
    expect(obtenerRutaNotificacion({ ruta: '/tienda/gemas' })).toBeNull();
    expect(obtenerRutaNotificacion({ ruta: '/rutinas/' })).toBeNull();
    expect(obtenerRutaNotificacion({ ruta: '/rutinas/1/otra' })).toBeNull();
    expect(obtenerRutaNotificacion({ ruta: '/rutinas/1?x=1' })).toBeNull();
    expect(obtenerRutaNotificacion({ ruta: 42 })).toBeNull();
  });
});
