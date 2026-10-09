import type { FiltroFranja, FranjaDia } from '../../compartido/utilidades/franjas';
import { FRANJAS_ORDEN } from '../../compartido/utilidades/franjas';
import type { Rutina } from '../rutinas/rutinas.tipos';

export const TOPE_PENDIENTES_POR_FRANJA = 5;

export type ElementoHoy = {
  tipo: 'habito' | 'tarea' | 'rutina';
  id: string;
  titulo: string;
  iconoLucide: string | null;
  color: string | null;
  franja: FranjaDia;
  completado: boolean;
  /** Texto corto de avance ya calculado, p. ej. "2 de 5 pasos" o "3/8 vasos"; null si no aplica. */
  detalle: string | null;
};

export type SeccionHoy = {
  franja: FranjaDia;
  pendientes: ElementoHoy[];      // como máximo `tope`, salvo que la franja esté expandida
  pendientesOcultos: number;      // cuántos pendientes quedaron fuera por el tope
  completados: ElementoHoy[];
};

export type PlanDelDia = {
  secciones: SeccionHoy[];                       // solo las franjas visibles para el filtro, sin secciones vacías
  conteos: Record<FiltroFranja, number>;         // pendientes por botón (siempre de todo el día)
  total: number;
  completados: number;
};

/**
 * Devuelve los ids de hábitos y tareas que son pasos de rutinas activas que tocan hoy,
 * para que no aparezcan sueltos ni duplicados en el plan del día.
 */
export function idsDeRutinasDeHoy(rutinas: readonly Rutina[]): {
  habitos: Set<string>;
  tareas: Set<string>;
} {
  const habitos = new Set<string>();
  const tareas = new Set<string>();

  for (const rutina of rutinas) {
    if (rutina.estado === 'activa' && rutina.tocaHoy) {
      for (const paso of rutina.pasos) {
        if (paso.origen === 'habito' && paso.habitoId) {
          habitos.add(paso.habitoId);
        } else if (paso.origen === 'tarea' && paso.tareaId) {
          tareas.add(paso.tareaId);
        }
      }
    }
  }

  return { habitos, tareas };
}

export function construirPlanDelDia(entrada: {
  habitos: ElementoHoy[];
  tareas: ElementoHoy[];
  rutinas: ElementoHoy[];
  /** Ids de hábitos y tareas que son paso de una rutina que toca hoy: no se muestran sueltos. */
  idsEnRutinas: { habitos: ReadonlySet<string>; tareas: ReadonlySet<string> };
  filtro: FiltroFranja;
  expandidas: ReadonlySet<FranjaDia>;
  tope?: number;
}): PlanDelDia {
  const {
    habitos,
    tareas,
    rutinas,
    idsEnRutinas,
    filtro,
    expandidas,
    tope = TOPE_PENDIENTES_POR_FRANJA,
  } = entrada;

  // Regla 1: Filtrar hábitos y tareas cuyos IDs pertenezcan a rutinas activas de hoy
  const habitosFiltrados = habitos.filter((h) => !idsEnRutinas.habitos.has(h.id));
  const tareasFiltradas = tareas.filter((t) => !idsEnRutinas.tareas.has(t.id));
  const rutinasFiltradas = rutinas; // Rutinas se conservan

  // Conteo de totales y completados de todo el día (regla 9)
  const todosElementos = [...rutinasFiltradas, ...habitosFiltrados, ...tareasFiltradas];
  const total = todosElementos.length;
  const completados = todosElementos.filter((e) => e.completado).length;

  // Conteos de pendientes por franja y 'todo' (regla 5)
  const pendientesTotales = todosElementos.filter((e) => !e.completado);
  const conteos: Record<FiltroFranja, number> = {
    manana: pendientesTotales.filter((e) => e.franja === 'manana').length,
    tarde: pendientesTotales.filter((e) => e.franja === 'tarde').length,
    noche: pendientesTotales.filter((e) => e.franja === 'noche').length,
    todo: pendientesTotales.length,
  };

  // Franjas a procesar según el filtro activo (reglas 2, 3, 4)
  const franjasAProcesar: FranjaDia[] =
    filtro === 'todo'
      ? (FRANJAS_ORDEN as FranjaDia[])
      : [filtro];

  const secciones: SeccionHoy[] = [];

  for (const franja of franjasAProcesar) {
    // Regla 6: orden rutinas, luego hábitos, luego tareas
    const pendientesDeFranja: ElementoHoy[] = [
      ...rutinasFiltradas.filter((r) => r.franja === franja && !r.completado),
      ...habitosFiltrados.filter((h) => h.franja === franja && !h.completado),
      ...tareasFiltradas.filter((t) => t.franja === franja && !t.completado),
    ];

    const completadosDeFranja: ElementoHoy[] = [
      ...rutinasFiltradas.filter((r) => r.franja === franja && r.completado),
      ...habitosFiltrados.filter((h) => h.franja === franja && h.completado),
      ...tareasFiltradas.filter((t) => t.franja === franja && t.completado),
    ];

    // Regla 8: sección vacía sin pendientes ni completados no se devuelve
    if (pendientesDeFranja.length === 0 && completadosDeFranja.length === 0) {
      continue;
    }

    // Regla 7: tope y expandidas
    const estaExpandida = expandidas.has(franja);
    let pendientes: ElementoHoy[];
    let pendientesOcultos = 0;

    if (estaExpandida || pendientesDeFranja.length <= tope) {
      pendientes = pendientesDeFranja;
      pendientesOcultos = 0;
    } else {
      pendientes = pendientesDeFranja.slice(0, tope);
      pendientesOcultos = pendientesDeFranja.length - tope;
    }

    secciones.push({
      franja,
      pendientes,
      pendientesOcultos,
      completados: completadosDeFranja,
    });
  }

  return {
    secciones,
    conteos,
    total,
    completados,
  };
}
