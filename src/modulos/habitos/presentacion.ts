import { porcentajeProgreso } from './analitica';
import { CategoriaHabitosId, TipoMetaHabito } from './tipos';

export const accesosCategoriasHabitos: { id: CategoriaHabitosId; etiqueta: string }[] = [
  { id: 'hoy', etiqueta: 'Hoy' },
  { id: 'patrones', etiqueta: 'Patrones' },
  { id: 'conexiones', etiqueta: 'Conexiones' },
  { id: 'riesgo', etiqueta: 'Riesgo' },
  { id: 'impacto', etiqueta: 'Impacto' },
];

export function crearModeloFilaHoy({ tipoMeta, meta, unidad, valorHoy }: { tipoMeta: TipoMetaHabito; meta: number; unidad: string | null; valorHoy: number }) {
  if (tipoMeta === 'check') return { progreso: valorHoy >= meta ? 100 : 0, texto: valorHoy >= meta ? 'Completado' : 'Pendiente' };
  return { progreso: porcentajeProgreso(valorHoy, meta), texto: `${valorHoy}/${meta} ${unidad ?? ''}`.trim() };
}
