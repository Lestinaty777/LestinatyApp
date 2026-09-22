import { fechaLocalDe } from '../../nucleo/dispositivo/fechaLocal';
import type { TipoMetaHabito } from './tipos';

export const VENTANA_RACHA_DIAS = 130;

export type FrecuenciaHabito = 'diaria' | 'dias_semana' | 'veces_semana';

export type FilaPlanSemana = {
  frecuencia: FrecuenciaHabito;
  dias_semana: number[] | null;
  objetivo_valor: number;
  desde_fecha: string;
  hasta_fecha: string | null;
  nivel?: number;
};

export type HabitoHoyDetalle = {
  diasCompletadosSemana: number[];
  diasProgramados: number[];
  esProgramadoHoy: boolean;
  habitoId: string;
  nivel: number;
  programadoHoy: boolean;
  racha: number;
};

export type ResultadoSemanaHabito = {
  diasCompletadosSemana: number[];
  diasProgramados: number[];
  esProgramadoHoy: boolean;
  programadoHoy: boolean;
};

export function fechaDesdeLocal(fecha: string): Date {
  return new Date(`${fecha}T12:00:00`);
}

export function sumarDias(fecha: string, dias: number): string {
  const resultado = fechaDesdeLocal(fecha);
  resultado.setDate(resultado.getDate() + dias);
  return fechaLocalDe(resultado);
}

export function idDiaDeFecha(fecha: string | Date): number {
  const d = typeof fecha === 'string' ? fechaDesdeLocal(fecha) : fecha;
  return ((d.getDay() + 6) % 7) + 1; // 1 = lunes ... 7 = domingo
}

export function planParaFecha<T extends { desde_fecha: string; hasta_fecha: string | null }>(
  planes: T[],
  fecha: string
): T | undefined {
  return planes.find((plan) => plan.desde_fecha <= fecha && (!plan.hasta_fecha || plan.hasta_fecha > fecha));
}

export function estaProgramadoEnFecha(
  plan: FilaPlanSemana | undefined,
  fecha: string | Date
): boolean {
  if (!plan) return false;
  if (plan.frecuencia !== 'dias_semana') return true;
  const idDia = idDiaDeFecha(fecha);
  return Boolean(plan.dias_semana?.includes(idDia));
}

export function estaMetaCompleta(
  tipo: TipoMetaHabito,
  valor: number,
  meta: number
): boolean {
  return tipo === 'check' ? valor > 0 : valor >= meta;
}

export function inicioSemana(fecha: string | Date): string {
  const fechaObj = typeof fecha === 'string' ? fechaDesdeLocal(fecha) : fecha;
  const diasDesdeLunes = (fechaObj.getDay() + 6) % 7;
  const lunes = new Date(fechaObj.getFullYear(), fechaObj.getMonth(), fechaObj.getDate(), 12, 0, 0);
  lunes.setDate(lunes.getDate() - diasDesdeLunes);
  return fechaLocalDe(lunes);
}

function hayDiaProgramadoEnSemana(
  planes: FilaPlanSemana[],
  inicioSemanaFecha: string
): boolean {
  return Array.from({ length: 7 }, (_, indice) => sumarDias(inicioSemanaFecha, indice)).some((fecha) => {
    const plan = planParaFecha(planes, fecha);
    return estaProgramadoEnFecha(plan, fecha);
  });
}

/**
 * Resuelve la semana visible y el estado programado para un hábito.
 * Si un hábito con días seleccionados se crea en un día no programado al final
 * de una semana (ej. L-V creado domingo), busca la primera semana relevante
 * para su programación (la siguiente semana con días programados) para no mostrar 0/0.
 */
export function calcularSemanaHabito(
  tipoMeta: TipoMetaHabito,
  planes: FilaPlanSemana[],
  registrosPorFecha: Map<string, number>,
  referencia = new Date()
): ResultadoSemanaHabito {
  const hoyLocal = fechaLocalDe(referencia);
  const planHoy = planParaFecha(planes, hoyLocal);
  const planVigente = planHoy ?? planes[0];

  const esProgramadoHoy = Boolean(planHoy && estaProgramadoEnFecha(planHoy, hoyLocal));

  if (!planVigente) {
    return {
      diasCompletadosSemana: [],
      diasProgramados: [],
      esProgramadoHoy: false,
      programadoHoy: false,
    };
  }

  const semanaActualInicio = inicioSemana(referencia);
  let inicioSemanaVisible = semanaActualInicio;

  if (!hayDiaProgramadoEnSemana(planes, semanaActualInicio)) {
    for (let offset = 1; offset <= 12; offset += 1) {
      const candidata = sumarDias(semanaActualInicio, offset * 7);
      if (hayDiaProgramadoEnSemana(planes, candidata)) {
        inicioSemanaVisible = candidata;
        break;
      }
    }
    if (inicioSemanaVisible === semanaActualInicio) {
      inicioSemanaVisible = sumarDias(semanaActualInicio, 7);
    }
  }

  const diasProgramados: number[] = [];
  const diasCompletadosSemana: number[] = [];

  for (let indice = 0; indice < 7; indice += 1) {
    const fecha = sumarDias(inicioSemanaVisible, indice);
    const plan = planParaFecha(planes, fecha);
    if (!estaProgramadoEnFecha(plan, fecha)) continue;
    const idDia = indice + 1;
    diasProgramados.push(idDia);
    const meta = Number(plan?.objetivo_valor ?? 0);
    const valor = registrosPorFecha.get(fecha) ?? 0;
    if (estaMetaCompleta(tipoMeta, valor, meta)) {
      diasCompletadosSemana.push(idDia);
    }
  }

  return {
    diasCompletadosSemana,
    diasProgramados,
    esProgramadoHoy,
    programadoHoy: esProgramadoHoy,
  };
}

export function calcularDetalleHabitoHoy({
  habitoId,
  tipoMeta,
  planes,
  registrosPorFecha,
  referencia = new Date(),
}: {
  habitoId: string;
  tipoMeta: TipoMetaHabito;
  planes: FilaPlanSemana[];
  registrosPorFecha: Map<string, number>;
  referencia?: Date;
}): HabitoHoyDetalle {
  const hoyLocal = fechaLocalDe(referencia);
  const planHoy = planParaFecha(planes, hoyLocal);
  const planVigente = planHoy ?? planes[0];
  const semana = calcularSemanaHabito(tipoMeta, planes, registrosPorFecha, referencia);

  let racha = 0;
  for (let indice = 0; indice < VENTANA_RACHA_DIAS; indice += 1) {
    const fecha = new Date(referencia.getFullYear(), referencia.getMonth(), referencia.getDate(), 12, 0, 0);
    fecha.setDate(fecha.getDate() - indice);
    const local = fechaLocalDe(fecha);
    const plan = planParaFecha(planes, local);
    if (!estaProgramadoEnFecha(plan, local)) continue;
    const meta = Number(plan?.objetivo_valor ?? 0);
    if (!estaMetaCompleta(tipoMeta, registrosPorFecha.get(local) ?? 0, meta)) break;
    racha += 1;
  }

  return {
    diasCompletadosSemana: semana.diasCompletadosSemana,
    diasProgramados: semana.diasProgramados,
    esProgramadoHoy: semana.esProgramadoHoy,
    habitoId,
    nivel: Number(planVigente?.nivel ?? 1),
    programadoHoy: semana.programadoHoy,
    racha,
  };
}
