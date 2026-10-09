import type { FranjaDia } from '../../compartido/utilidades/franjas';
import type { DetalleHabito, TipoMetaHabito } from './tipos';

export type EdicionHabito = {
  titulo: string;
  descripcion: string;
  iconoLucide: string;
  tipoMeta: TipoMetaHabito;
  unidad: string;
  meta: number;
  frecuencia: 'diaria' | 'dias_semana' | 'veces_semana';
  diasSemana: number[];
  vecesPorSemana: number | null;
  recordatorioActivo: boolean;
  horaRecordatorio: string | null;
  mostrarNombreNotificacion: boolean;
  franja: FranjaDia;
};

export function validarEdicionHabito(edicion: EdicionHabito): string | null {
  if (!edicion.titulo.trim()) return 'Escribe un nombre para tu hábito.';
  if (!Number.isFinite(edicion.meta) || edicion.meta <= 0) return 'La meta debe ser mayor que cero.';
  if (edicion.frecuencia === 'dias_semana' && edicion.diasSemana.length === 0) return 'Selecciona al menos un día.';
  if (edicion.frecuencia === 'veces_semana' && (!edicion.vecesPorSemana || edicion.vecesPorSemana < 1 || edicion.vecesPorSemana > 7)) return 'Elige entre 1 y 7 veces por semana.';
  if (edicion.recordatorioActivo && !edicion.horaRecordatorio) return 'El recordatorio necesita una hora.';
  return null;
}

export function normalizarEdicionHabito(detalle: DetalleHabito): EdicionHabito {
  const { habito, programacion } = detalle;
  return { titulo: habito.titulo, descripcion: habito.descripcion ?? '', iconoLucide: habito.iconoLucide, tipoMeta: habito.tipoMeta, unidad: habito.unidad ?? '', meta: habito.meta, frecuencia: programacion.frecuencia, diasSemana: programacion.diasSemana, vecesPorSemana: programacion.vecesPorSemana, recordatorioActivo: programacion.recordatorioActivo, horaRecordatorio: programacion.horaRecordatorio, mostrarNombreNotificacion: programacion.mostrarNombreNotificacion, franja: programacion.franja };
}
