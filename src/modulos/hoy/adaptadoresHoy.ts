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
