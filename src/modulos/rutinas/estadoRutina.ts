import type { PasoRutina, Rutina } from './rutinas.tipos';

export type ResumenRutina = {
  /** Pasos que cuentan hoy (los que no están programados hoy no suman ni restan). */
  aplican: number;
  completos: number;
  /** 0–100, entero. 0 si no aplica ningún paso. */
  porcentaje: number;
  /** Todos los pasos que aplican están completos (y hay al menos uno). */
  completa: boolean;
};

export function resumirPasos(pasos: readonly PasoRutina[]): ResumenRutina {
  const aplicables = pasos.filter((paso) => paso.aplica);
  const completos = aplicables.filter((paso) => paso.completo).length;
  const aplican = aplicables.length;
  return {
    aplican,
    completos,
    porcentaje: aplican === 0 ? 0 : Math.round((completos * 100) / aplican),
    completa: aplican > 0 && completos === aplican,
  };
}

export function resumirRutina(rutina: Pick<Rutina, 'pasos'>): ResumenRutina {
  return resumirPasos(rutina.pasos);
}

/**
 * Pendiente hoy = toca hoy, tiene algo que hacer hoy y no está completa. Una
 * rutina cuyos pasos no aplican hoy no se puede completar, así que no cuenta
 * como pendiente.
 */
export function estaPendienteHoy(rutina: Pick<Rutina, 'pasos' | 'tocaHoy' | 'estado'>): boolean {
  if (rutina.estado !== 'activa' || !rutina.tocaHoy) return false;
  const resumen = resumirRutina(rutina);
  return resumen.aplican > 0 && !resumen.completa;
}

export type ResumenDiaRutinas = { totalHoy: number; completadasHoy: number; porcentaje: number };

/** Progreso del día de la lista de rutinas: solo cuentan las activas que tocan hoy con algo que hacer. */
export function resumirDiaRutinas(rutinas: readonly Pick<Rutina, 'pasos' | 'tocaHoy' | 'estado'>[]): ResumenDiaRutinas {
  const delDia = rutinas.filter((rutina) => rutina.estado === 'activa' && rutina.tocaHoy && resumirRutina(rutina).aplican > 0);
  const completadasHoy = delDia.filter((rutina) => resumirRutina(rutina).completa).length;
  return {
    totalHoy: delDia.length,
    completadasHoy,
    porcentaje: delDia.length === 0 ? 0 : Math.round((completadasHoy * 100) / delDia.length),
  };
}

/** Siguiente paso por hacer: el primero que aplica y no está completo. */
export function siguientePaso(pasos: readonly PasoRutina[]): PasoRutina | null {
  return [...pasos].sort((a, b) => a.orden - b.orden).find((paso) => paso.aplica && !paso.completo) ?? null;
}
