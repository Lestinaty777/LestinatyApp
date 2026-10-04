import type { FranjaDia } from '../../compartido/utilidades/franjas';

// Spec: docs/superpowers/specs/2026-10-04-rutinas-design.md

export type OrigenPasoRutina = 'habito' | 'tarea' | 'propio';
/** 'checklist' solo aparece en pasos que referencian una tarea checklist. */
export type ModoPasoRutina = 'simple' | 'cronometro' | 'contador' | 'checklist';
/** Modos que se pueden crear como paso propio de la rutina. */
export type ModoPasoPropio = Exclude<ModoPasoRutina, 'checklist'>;
export type FrecuenciaRutina = 'diaria' | 'dias_semana';
export type EstadoRutina = 'activa' | 'pausada' | 'archivada';

export type PasoRutina = {
  id: string;
  orden: number;
  origen: OrigenPasoRutina;
  habitoId: string | null;
  tareaId: string | null;
  titulo: string;
  iconoLucide: string | null;
  color: string | null;
  modo: ModoPasoRutina;
  /** Minutos (cronómetro) o cantidad (contador); null en pasos simples/checklist. */
  objetivoValor: number | null;
  unidad: string | null;
  /** false si el hábito/tarea no está programado hoy: no cuenta ni a favor ni en contra. */
  aplica: boolean;
  completo: boolean;
  valor: number | null;
};

export type Rutina = {
  id: string;
  titulo: string;
  descripcion: string | null;
  franja: FranjaDia;
  iconoLucide: string;
  color: string;
  estado: EstadoRutina;
  frecuencia: FrecuenciaRutina;
  /** isodow (1=lunes..7=domingo); null cuando la frecuencia es diaria. */
  diasSemana: number[] | null;
  /** "HH:mm" o null. */
  horaInicio: string | null;
  recordatorioActivo: boolean;
  mostrarNombreNotificacion: boolean;
  tocaHoy: boolean;
  pasos: PasoRutina[];
};

export type PasoNuevoRutina =
  | { origen: 'habito'; habitoId: string }
  | { origen: 'tarea'; tareaId: string }
  | { origen: 'propio'; titulo: string; modo: ModoPasoPropio; objetivoValor?: number; unidad?: string };

export type CrearRutinaInput = {
  titulo: string;
  descripcion?: string | null;
  franja: FranjaDia;
  iconoLucide: string;
  color: string;
  frecuencia: FrecuenciaRutina;
  diasSemana?: number[] | null;
  horaInicio?: string | null;
  recordatorioActivo?: boolean;
  mostrarNombreNotificacion?: boolean;
  pasos: PasoNuevoRutina[];
};

export type ResultadoPasoPropio = { pasoId: string; valor: number; completo: boolean };

export const MAX_PASOS_RUTINA = 20;
