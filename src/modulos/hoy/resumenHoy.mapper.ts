// Valida defensivamente lo que devuelve public.obtener_resumen_hoy (jsonb,
// migración 83). Mismo criterio que rutinas.mapper.ts: si la forma cambia,
// fallar aquí con un mensaje claro.

export type ResumenHoy = {
  racha: number;
  /** isodow de los días de esta semana con alguna acción: 1 = lunes … 7 = domingo. */
  diasActivosSemana: number[];
  xpTotal: number;
};

export const RESUMEN_HOY_VACIO: ResumenHoy = { racha: 0, diasActivosSemana: [], xpTotal: 0 };

function enteroNoNegativo(valor: unknown, campo: string): number {
  const numero = Number(valor);
  if (valor === null || valor === undefined || !Number.isFinite(numero) || numero < 0) {
    throw new Error(`Hoy: "${campo}" inválido.`);
  }
  return Math.floor(numero);
}

export function mapearResumenHoy(crudo: unknown): ResumenHoy {
  if (typeof crudo !== 'object' || crudo === null || Array.isArray(crudo)) throw new Error('Hoy: resumen inválido.');
  const fila = crudo as Record<string, unknown>;
  if (!Array.isArray(fila.dias_activos_semana)) throw new Error('Hoy: "dias_activos_semana" inválido.');
  const dias = fila.dias_activos_semana.map((dia) => Number(dia)).filter((dia) => Number.isInteger(dia) && dia >= 1 && dia <= 7);
  return {
    racha: enteroNoNegativo(fila.racha, 'racha'),
    diasActivosSemana: [...new Set(dias)].sort((a, b) => a - b),
    xpTotal: enteroNoNegativo(fila.xp_total, 'xp_total'),
  };
}

/** Índice 0–6 (lunes–domingo) del día de la semana de una fecha local. */
export function indiceDiaSemana(fecha: Date): number {
  return (fecha.getDay() + 6) % 7;
}
