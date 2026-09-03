import type { ConfiguracionConversacionAby, PreguntaIdAby, PropuestaSenderoAby, RespuestaAgenteAby, TipoSenderoAby } from '../contrato/aby.contrato';

export type EstadoConversacionAby = {
  cargando: boolean;
  configuracion: ConfiguracionConversacionAby;
  pasosCompletados: number;
  propuestaConfirmada: PropuestaSenderoAby | null;
  propuestaTemporal: PropuestaSenderoAby | null;
  ultimoTurno: RespuestaAgenteAby | null;
};

export type AccionConversacionAby =
  | { objetivo: string; tipo: 'definir-objetivo' }
  | { tipo: 'definir-tipo'; valor: TipoSenderoAby }
  | { diasSemana: number[]; tipo: 'definir-dias' }
  | { duracionMinutos: number; tipo: 'definir-duracion' }
  | { tipo: 'descartar-propuesta' }
  | { tipo: 'confirmar-propuesta' }
  | { tipo: 'recibir-turno'; turno: RespuestaAgenteAby }
  | { cargando: boolean; tipo: 'definir-cargando' }
  | { preguntaId: PreguntaIdAby; tipo: 'editar' }
  | { tipo: 'reiniciar' };

export const configuracionInicialAby: ConfiguracionConversacionAby = {
  diasSemana: [],
  duracionMinutos: null,
  objetivo: '',
  tipo: null,
};

export const estadoInicialConversacionAby: EstadoConversacionAby = {
  cargando: false,
  configuracion: configuracionInicialAby,
  pasosCompletados: 0,
  propuestaConfirmada: null,
  propuestaTemporal: null,
  ultimoTurno: null,
};

function contarPasos(configuracion: ConfiguracionConversacionAby) {
  return [
    configuracion.objetivo.trim().length > 0,
    configuracion.tipo !== null,
    configuracion.tipo === 'finito' || configuracion.diasSemana.length > 0,
    configuracion.duracionMinutos !== null,
  ].filter(Boolean).length;
}

function conConfiguracion(configuracion: ConfiguracionConversacionAby): EstadoConversacionAby {
  return { ...estadoInicialConversacionAby, configuracion, pasosCompletados: contarPasos(configuracion) };
}

export function reducirConversacionAby(estado: EstadoConversacionAby, accion: AccionConversacionAby): EstadoConversacionAby {
  const actual = estado.configuracion;

  if (accion.tipo === 'reiniciar') return estadoInicialConversacionAby;
  if (accion.tipo === 'definir-cargando') return { ...estado, cargando: accion.cargando };
  if (accion.tipo === 'descartar-propuesta') return { ...estado, propuestaTemporal: null };
  if (accion.tipo === 'confirmar-propuesta') return { ...estado, propuestaConfirmada: estado.propuestaTemporal, propuestaTemporal: null };
  if (accion.tipo === 'recibir-turno') return {
    ...estado,
    cargando: false,
    propuestaTemporal: accion.turno.tipo === 'propuesta' ? accion.turno.propuesta : null,
    ultimoTurno: accion.turno,
  };
  if (accion.tipo === 'definir-objetivo') return conConfiguracion({ ...actual, objetivo: accion.objetivo.trim() });
  if (accion.tipo === 'definir-tipo') return conConfiguracion({ ...actual, diasSemana: [], duracionMinutos: null, tipo: accion.valor });
  if (accion.tipo === 'definir-dias') return conConfiguracion({ ...actual, diasSemana: [...new Set(accion.diasSemana)].sort() });
  if (accion.tipo === 'definir-duracion') return conConfiguracion({ ...actual, duracionMinutos: accion.duracionMinutos });

  if (accion.preguntaId === 'tipo') return conConfiguracion({ ...actual, diasSemana: [], duracionMinutos: null, tipo: null });
  if (accion.preguntaId === 'frecuencia') return conConfiguracion({ ...actual, diasSemana: [], duracionMinutos: null });

  return conConfiguracion({ ...actual, duracionMinutos: null });
}
