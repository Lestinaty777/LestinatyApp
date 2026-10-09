import { franjaDeHora, LIMITES_FRANJA_DEFECTO, type FranjaConcreta, type LimitesFranja } from '../../compartido/utilidades/franjas';

// "¿En qué franja cumples más?" — se deriva de la hora en que se registró cada
// cosa y de los límites del perfil; no se guarda ningún dato nuevo.
// Spec: docs/superpowers/specs/2026-10-04-franjas-del-dia-design.md (Insights).

/** Con menos registros no se afirma nada: la sección queda "en observación". */
export const MINIMO_REGISTROS_FRANJA = 7;

export type ResumenFranjas = {
  conteo: Record<FranjaConcreta, number>;
  total: number;
  /** Franja con más registros; null si faltan datos o hay empate en cabeza. */
  mejor: FranjaConcreta | null;
  estado: 'listo' | 'en_observacion';
};

/**
 * `marcas` son instantes ISO (registrado_at / completada_en). La hora se toma
 * en la zona del dispositivo, que la app mantiene igual a la del perfil
 * (sincronizarZonaHorariaDispositivo). Las marcas ilegibles se ignoran.
 */
export function resumirFranjas(marcas: readonly string[], limites: LimitesFranja = LIMITES_FRANJA_DEFECTO): ResumenFranjas {
  const conteo: Record<FranjaConcreta, number> = { manana: 0, tarde: 0, noche: 0 };
  let total = 0;
  for (const marca of marcas) {
    const fecha = new Date(marca);
    if (Number.isNaN(fecha.getTime())) continue;
    conteo[franjaDeHora(fecha.getHours(), limites)] += 1;
    total += 1;
  }
  if (total < MINIMO_REGISTROS_FRANJA) return { conteo, total, mejor: null, estado: 'en_observacion' };
  const ordenadas = (Object.keys(conteo) as FranjaConcreta[]).sort((a, b) => conteo[b] - conteo[a]);
  const empate = conteo[ordenadas[0]] === conteo[ordenadas[1]];
  return { conteo, total, mejor: empate ? null : ordenadas[0], estado: 'listo' };
}

/** Porcentaje (0–100, entero) de cada franja sobre el total; 0 si no hay registros. */
export function porcentajesFranjas(resumen: Pick<ResumenFranjas, 'conteo' | 'total'>): Record<FranjaConcreta, number> {
  const parte = (franja: FranjaConcreta) => (resumen.total > 0 ? Math.round((resumen.conteo[franja] * 100) / resumen.total) : 0);
  return { manana: parte('manana'), tarde: parte('tarde'), noche: parte('noche') };
}
