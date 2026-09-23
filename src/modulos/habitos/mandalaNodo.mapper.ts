import type { EstadoMandala, InfoMandalaNodo, InfoMandalaPendiente, ResultadoGuardarMandala, TrazoMandala } from './mandalaNodo.tipos';

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null;
}

function mapearTrazos(valor: unknown): TrazoMandala[] | null {
  if (!Array.isArray(valor)) return null;
  return valor
    .filter((punto): punto is Record<string, unknown> => esObjeto(punto))
    .map((punto) => ({ x: Number(punto.x), y: Number(punto.y) }));
}

// null es un resultado válido (ningún registro pasó a completo en esta
// llamada) — sólo se lanza si llega un payload no-nulo con forma inválida.
export function mapearMandalaPendiente(payload: unknown): InfoMandalaPendiente | null {
  if (payload == null) return null;
  if (!esObjeto(payload) || typeof payload.registro_id !== 'string') {
    throw new Error('Mandala pendiente inválida.');
  }
  return {
    registroId: payload.registro_id,
    estado: payload.estado as EstadoMandala,
    semilla: String(payload.semilla ?? ''),
    paqueteId: payload.paquete_id == null ? null : String(payload.paquete_id),
    color: payload.color == null ? null : String(payload.color),
    nivel: Number(payload.nivel),
    ciclo: Number(payload.ciclo ?? 1),
    nodoDia: Number(payload.nodo_dia),
  };
}

export function mapearMandalasHabito(filas: unknown): InfoMandalaNodo[] {
  if (!Array.isArray(filas)) return [];
  return filas.map((fila): InfoMandalaNodo => {
    if (!esObjeto(fila) || typeof fila.registro_id !== 'string') {
      throw new Error('Fila de mandala inválida.');
    }
    return {
      registroId: fila.registro_id,
      nivel: Number(fila.nivel),
      ciclo: Number(fila.ciclo ?? 1),
      nodoDia: Number(fila.nodo_dia),
      estado: fila.estado as EstadoMandala,
      semilla: String(fila.semilla ?? ''),
      trazos: mapearTrazos(fila.trazos),
      paqueteId: fila.paquete_id == null ? null : String(fila.paquete_id),
      color: fila.color == null ? null : String(fila.color),
    };
  });
}

export function mapearResultadoGuardarMandala(payload: unknown): ResultadoGuardarMandala {
  if (!esObjeto(payload) || typeof payload.registro_id !== 'string') {
    throw new Error('Resultado de guardar mandala inválido.');
  }
  return {
    registroId: payload.registro_id,
    estado: payload.estado as EstadoMandala,
    paqueteId: payload.paquete_id == null ? null : String(payload.paquete_id),
    color: payload.color == null ? null : String(payload.color),
    nivel: Number(payload.nivel),
    ciclo: Number(payload.ciclo ?? 1),
    nodoDia: Number(payload.nodo_dia),
  };
}
