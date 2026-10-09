import type { HabitoHoyDetalle } from '../habitos/semanaProgramada';
import type { HabitoResumen } from '../habitos/tipos';
import type { Rutina } from '../rutinas/rutinas.tipos';
import { resumirRutina } from '../rutinas/estadoRutina';
import type { TareaHoyDetalle } from '../tareas/tareas.tipos';
import type { ElementoHoy } from './planDelDia';

/**
 * Convierte un hábito activo con su detalle de hoy a ElementoHoy.
 */
export function habitoAElemento(
  habito: HabitoResumen,
  detalle: HabitoHoyDetalle | undefined,
): ElementoHoy {
  const franja = detalle?.franja ?? 'cualquier_momento';
  const completado = habito.completado;
  const detalleTexto =
    habito.tipoMeta === 'check'
      ? null
      : `${habito.valorHoy}/${habito.meta} ${habito.unidad ?? ''}`.trim();

  return {
    tipo: 'habito',
    id: habito.id,
    titulo: habito.titulo,
    iconoLucide: habito.iconoLucide,
    color: habito.color,
    franja,
    completado,
    detalle: detalleTexto,
  };
}

/**
 * Convierte una tarea de hoy a ElementoHoy.
 */
export function tareaAElemento(tarea: TareaHoyDetalle): ElementoHoy {
  const completado = tarea.completada;
  const detalleTexto =
    tarea.tipo === 'simple' || tarea.tipo === 'checklist'
      ? null
      : `${tarea.valorHoy}/${tarea.objetivoValor} ${tarea.unidad ?? ''}`.trim();

  return {
    tipo: 'tarea',
    id: tarea.id,
    titulo: tarea.titulo,
    iconoLucide: tarea.iconoLucide,
    color: tarea.color,
    franja: tarea.franja,
    completado,
    detalle: detalleTexto,
  };
}

/**
 * Convierte una rutina a ElementoHoy.
 * Usa `formatoPasos(completos, total)` que provee el llamador ya traducido (ej. "2 de 5 pasos").
 */
export function rutinaAElemento(
  rutina: Rutina,
  formatoPasos: (completos: number, total: number) => string,
): ElementoHoy {
  const resumen = resumirRutina(rutina);
  const detalleTexto = formatoPasos(resumen.completos, resumen.aplican);

  return {
    tipo: 'rutina',
    id: rutina.id,
    titulo: rutina.titulo,
    iconoLucide: rutina.iconoLucide,
    color: rutina.color,
    franja: rutina.franja,
    completado: resumen.completa,
    detalle: detalleTexto,
  };
}

export type AvanceCategoria = { hechos: number; total: number };

/** Avance del día por tipo, para la cuadrícula de categorías de Hoy. Una rutina cuenta como hecha con la misma regla que su sesión (pasos esenciales). */
export function resumirCategoriasHoy(entrada: {
  habitos: readonly Pick<HabitoResumen, 'completado'>[];
  tareas: readonly Pick<TareaHoyDetalle, 'completada'>[];
  rutinas: readonly Pick<Rutina, 'pasos' | 'tocaHoy' | 'estado'>[];
}): { habitos: AvanceCategoria; tareas: AvanceCategoria; rutinas: AvanceCategoria } {
  const rutinasHoy = entrada.rutinas.filter((rutina) => rutina.tocaHoy && rutina.estado === 'activa');
  return {
    habitos: { hechos: entrada.habitos.filter((habito) => habito.completado).length, total: entrada.habitos.length },
    tareas: { hechos: entrada.tareas.filter((tarea) => tarea.completada).length, total: entrada.tareas.length },
    rutinas: { hechos: rutinasHoy.filter((rutina) => resumirRutina(rutina).completa).length, total: rutinasHoy.length },
  };
}

/** "2/5", o cadena vacía si no hay nada de ese tipo hoy. */
export function textoAvance(avance: AvanceCategoria): string {
  return avance.total > 0 ? `${avance.hechos}/${avance.total}` : '';
}
