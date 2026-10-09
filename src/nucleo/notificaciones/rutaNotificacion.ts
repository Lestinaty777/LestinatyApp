export type RutaNotificacion = `/habitos/${string}` | `/rutinas/${string}` | '/tareas';

// Solo rutas internas conocidas: lo que llega en una notificación no es de
// fiar. Hábitos y rutinas tienen pantalla por id; las tareas no (se abren en
// la pantalla de Tareas), así que /tareas/<id> lleva a /tareas.
export function obtenerRutaNotificacion(datos: unknown): RutaNotificacion | null {
  if (!datos || typeof datos !== 'object' || !('ruta' in datos)) return null;
  const ruta = (datos as { ruta?: unknown }).ruta;
  if (typeof ruta !== 'string') return null;
  if (/^\/(habitos|rutinas)\/[^/?#]+$/.test(ruta)) return ruta as RutaNotificacion;
  if (/^\/tareas\/[^/?#]+$/.test(ruta)) return '/tareas';
  return null;
}
