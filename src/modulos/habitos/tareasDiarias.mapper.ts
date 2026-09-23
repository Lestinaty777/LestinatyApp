import type { CodigoTareaDiaria, EstadoTareaDiaria, ResultadoReclamoTarea, ResumenTareasDiarias, TareaDiaria } from './tareasDiarias.tipos';

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null;
}

function mapearTarea(payload: unknown): TareaDiaria {
  if (!esObjeto(payload) || typeof payload.codigo !== 'string' || typeof payload.estado !== 'string') {
    throw new Error('Tarea diaria inválida.');
  }
  return {
    codigo: payload.codigo as CodigoTareaDiaria,
    gemas: Number(payload.gemas ?? 0),
    progreso: Number(payload.progreso ?? 0),
    meta: Number(payload.meta ?? 0),
    estado: payload.estado as EstadoTareaDiaria,
  };
}

// El mapper confía en `progreso` tal cual llega del RPC — no recalcula nodos
// avanzados en el cliente. La regla de "un mismo hábito editado varias veces
// cuenta una vez" vive en el SQL de privacidad.obtener_tareas_diarias
// (cuenta hábitos, no registros), así que se prueba con SQL/integración, no
// aquí.
export function mapearResumenTareasDiarias(remoto: unknown): ResumenTareasDiarias {
  if (!esObjeto(remoto) || !Array.isArray(remoto.tareas)) {
    throw new Error('Resumen de tareas diarias inválido.');
  }
  return {
    fechaLocal: String(remoto.fecha_local ?? ''),
    nodosProgramados: Number(remoto.nodos_programados ?? 0),
    tareas: remoto.tareas.map(mapearTarea),
  };
}

export function mapearResultadoReclamoTarea(remoto: unknown): ResultadoReclamoTarea {
  if (!esObjeto(remoto) || typeof remoto.tarea_codigo !== 'string') {
    throw new Error('Resultado de reclamo de tarea diaria inválido.');
  }
  return {
    exito: Boolean(remoto.exito),
    tareaCodigo: remoto.tarea_codigo as CodigoTareaDiaria,
    gemas: Number(remoto.gemas ?? 0),
    saldo: Number(remoto.saldo ?? 0),
    yaReclamado: Boolean(remoto.ya_reclamado),
  };
}
