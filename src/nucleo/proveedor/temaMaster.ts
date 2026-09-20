// Preferencia de tema de color de la app: el paquete cuyo tono tiñe toda la UI.
// Se guarda id + color (no solo el id) para poder armar el tono al arrancar
// sin esperar a la red — el catálogo de paquetes vive en Supabase.
export type PreferenciaTemaMaster = { id: string; masterPackColor: string };

export const CLAVE_TEMA_MASTER = 'tema_master_v1';

const HEX_VALIDO = /^#[0-9a-fA-F]{6}$/;

/** Lee lo guardado; cualquier valor corrupto o inesperado cae a "sin preferencia" (Esmeralda). */
export function leerPreferenciaTema(crudo: string | null): PreferenciaTemaMaster | null {
  if (!crudo) return null;
  try {
    const dato: unknown = JSON.parse(crudo);
    if (!dato || typeof dato !== 'object') return null;
    const { id, masterPackColor } = dato as Record<string, unknown>;
    return typeof id === 'string' && id.length > 0 && typeof masterPackColor === 'string' && HEX_VALIDO.test(masterPackColor)
      ? { id, masterPackColor }
      : null;
  } catch {
    return null;
  }
}
