export function obtenerRutaNotificacion(datos: unknown): `/habitos/${string}` | null {
  if (!datos || typeof datos !== 'object' || !('ruta' in datos)) return null;
  const ruta = (datos as { ruta?: unknown }).ruta;
  if (typeof ruta !== 'string' || !/^\/habitos\/[^/?#]+$/.test(ruta)) return null;
  return ruta as `/habitos/${string}`;
}
