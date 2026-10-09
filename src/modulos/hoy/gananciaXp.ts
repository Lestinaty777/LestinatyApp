import { nivelDesdeXp } from './nivelUsuario';

// Qué mostrar cuando el XP total cambia: cuánto se ganó y si eso hizo subir de
// nivel. El XP se calcula en el servidor (obtener_resumen_hoy, migración 83),
// así que la diferencia entre dos lecturas es exactamente lo ganado: no hay que
// saber aquí cuánto vale cada acción.

export type GananciaXp = { xpGanado: number; nivelAnterior: number; nivelNuevo: number; subioNivel: boolean };

/**
 * null cuando no hay nada que celebrar: primera lectura (`anterior` undefined,
 * si no cada arranque de la app parecería una ganancia), lectura en curso, XP
 * igual, o XP que baja (se desmarcó algo).
 */
export function detectarGananciaXp(anterior: number | undefined, actual: number | undefined): GananciaXp | null {
  if (anterior === undefined || actual === undefined) return null;
  if (!Number.isFinite(anterior) || !Number.isFinite(actual) || actual <= anterior) return null;
  const nivelAnterior = nivelDesdeXp(anterior).nivel;
  const nivelNuevo = nivelDesdeXp(actual).nivel;
  return { xpGanado: actual - anterior, nivelAnterior, nivelNuevo, subioNivel: nivelNuevo > nivelAnterior };
}

/** Cuánto dura en pantalla cada aviso, en milisegundos. Subir de nivel se queda más. */
export function duracionAvisoXp(ganancia: Pick<GananciaXp, 'subioNivel'>): number {
  return ganancia.subioNivel ? 3200 : 1700;
}
