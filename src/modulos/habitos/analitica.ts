import { CategoriaHabitosId, EstadoPanelHabitos } from './tipos';

export const etiquetasCategoriasHabitos: Record<CategoriaHabitosId, string> = {
  hoy: 'Hoy',
  patrones: 'Patrones',
  conexiones: 'Conexiones',
  riesgo: 'Riesgo',
  impacto: 'Impacto',
};

export function porcentajeProgreso(valor: number, meta: number) {
  if (meta <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((valor / meta) * 100)));
}

export function obtenerEstadoAnalitica({ comparables, tipo }: { comparables: number; tipo: Exclude<CategoriaHabitosId, 'hoy'> }): EstadoPanelHabitos {
  if (tipo === 'patrones') return comparables >= 7 ? 'listo' : 'en_observacion';
  return comparables >= 7 ? 'listo' : 'en_observacion';
}

export function esCategoriaHabitosId(valor: string): valor is CategoriaHabitosId {
  return ['hoy', 'patrones', 'conexiones', 'riesgo', 'impacto'].includes(valor);
}

export function formatearProgreso(valor: number, meta: number, unidad: string | null) {
  if (!unidad) return valor >= meta ? 'Completado' : 'Pendiente';
  return `${valor}/${meta} ${unidad}`;
}
