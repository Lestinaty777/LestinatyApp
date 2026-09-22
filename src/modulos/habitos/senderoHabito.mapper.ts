import type { ResumenSenderoHabito, SeccionSenderoHabito, TransicionSendero } from './senderoHabito.tipos';

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null;
}

function mapearSeccion(payload: unknown): SeccionSenderoHabito {
  if (!esObjeto(payload)
    || typeof payload.nivel !== 'number'
    || payload.estado == null
    || payload.dias_completados == null
    || payload.dias_requeridos == null
  ) {
    throw new Error('Resumen de Senderos inválido.');
  }
  return {
    ciclo: Number(payload.ciclo ?? 1),
    diasCompletados: Number(payload.dias_completados),
    diasRequeridos: Number(payload.dias_requeridos),
    disponibleDesde: payload.disponible_desde == null ? null : String(payload.disponible_desde),
    estado: payload.estado as SeccionSenderoHabito['estado'],
    nivel: payload.nivel as SeccionSenderoHabito['nivel'],
    puedeAvanzarHoy: Boolean(payload.puede_avanzar_hoy),
    totalDiasNivel7: Number(payload.total_dias_nivel7 ?? payload.dias_completados),
  };
}

export function mapearResumenSendero(payload: unknown): ResumenSenderoHabito {
  if (!esObjeto(payload) || !Array.isArray(payload.secciones)) {
    throw new Error('Resumen de Senderos inválido.');
  }
  const secciones = payload.secciones.map(mapearSeccion);
  const actual = secciones.find((seccion) => seccion.estado === 'actual');
  const nivelActual = actual?.nivel ?? Math.max(0, ...secciones.filter((seccion) => seccion.estado === 'completado').map((seccion) => seccion.nivel));
  return { nivelActual, secciones };
}

export function mapearTransicionSendero(payload: unknown): TransicionSendero | null {
  if (!esObjeto(payload)) return null;
  return {
    cicloActual: Number(payload.ciclo_actual),
    cicloAnterior: Number(payload.ciclo_anterior),
    cofreFinalReclamado: true,
    gemas: Number(payload.gemas),
    nivelActual: Number(payload.nivel_actual),
    nivelAnterior: Number(payload.nivel_anterior),
    tipo: payload.tipo as TransicionSendero['tipo'],
  };
}
