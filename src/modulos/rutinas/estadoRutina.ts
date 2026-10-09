import type { PasoRutina, Rutina } from './rutinas.tipos';

export type ResumenRutina = {
  /** Pasos que cuentan hoy (los que no están programados hoy no suman ni restan). */
  aplican: number;
  completos: number;
  /**
   * Pasos que hay que completar para dar la sesión por hecha: los esenciales que
   * aplican hoy; si ninguno aplica hoy, todos los que aplican. Debe coincidir con
   * cerrar_rutina_dia (migración 81).
   */
  requeridos: number;
  requeridosCompletos: number;
  /** 0–100, entero: avance hacia completar la sesión (los pasos opcionales no suman ni restan). */
  porcentaje: number;
  /** Todos los requeridos están completos (y hay al menos uno). */
  completa: boolean;
};

export function resumirPasos(pasos: readonly PasoRutina[]): ResumenRutina {
  const aplicables = pasos.filter((paso) => paso.aplica);
  const esenciales = aplicables.filter((paso) => paso.esencial);
  const requeridosLista = esenciales.length > 0 ? esenciales : aplicables;
  const requeridosCompletos = requeridosLista.filter((paso) => paso.completo).length;
  const requeridos = requeridosLista.length;
  return {
    aplican: aplicables.length,
    completos: aplicables.filter((paso) => paso.completo).length,
    requeridos,
    requeridosCompletos,
    porcentaje: requeridos === 0 ? 0 : Math.round((requeridosCompletos * 100) / requeridos),
    completa: requeridos > 0 && requeridosCompletos === requeridos,
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

/**
 * Devuelve un mapa de hábitos y tareas apuntando a los títulos de las rutinas activas que los contienen.
 */
export function rutinasPorOrigen(rutinas: readonly Rutina[]): {
  habitos: Map<string, string[]>;
  tareas: Map<string, string[]>;
} {
  const habitos = new Map<string, string[]>();
  const tareas = new Map<string, string[]>();

  for (const rutina of rutinas) {
    if (rutina.estado !== 'activa') continue;
    for (const paso of rutina.pasos) {
      if (paso.origen === 'habito' && paso.habitoId) {
        const lista = habitos.get(paso.habitoId) ?? [];
        lista.push(rutina.titulo);
        habitos.set(paso.habitoId, lista);
      } else if (paso.origen === 'tarea' && paso.tareaId) {
        const lista = tareas.get(paso.tareaId) ?? [];
        lista.push(rutina.titulo);
        tareas.set(paso.tareaId, lista);
      }
    }
  }

  return { habitos, tareas };
}

