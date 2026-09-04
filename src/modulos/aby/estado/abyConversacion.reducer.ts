import type { ConfiguracionEstudioAby, PreguntaIdAby, PropuestaSenderoAby, RespuestaAgenteAby } from '../contrato/aby.contrato';
import type { IntencionEstudioAbyId } from '../datos/intencionesEstudioAby';

export type EstadoConversacionAby = {
  cargando: boolean;
  configuracion: ConfiguracionEstudioAby;
  pasosCompletados: number;
  propuestaConfirmada: PropuestaSenderoAby | null;
  propuestaTemporal: PropuestaSenderoAby | null;
  ultimoTurno: RespuestaAgenteAby | null;
};

export type AccionConversacionAby =
  | { tipo: 'definir-intencion'; valor: IntencionEstudioAbyId }
  | { objetivo: string; tipo: 'definir-objetivo' }
  | { fechaExamen: string; tipo: 'definir-fecha-examen' }
  | { alcance: string; tipo: 'definir-alcance' }
  | { fuente: string; tipo: 'definir-fuente' }
  | { disponibilidadSemanal: '2' | '4' | '6' | '8'; tipo: 'definir-disponibilidad' }
  | { nivelInicial: 'inicio' | 'basico' | 'intermedio'; tipo: 'definir-nivel' }
  | { tipo: 'descartar-propuesta' }
  | { tipo: 'confirmar-propuesta' }
  | { tipo: 'recibir-turno'; turno: RespuestaAgenteAby }
  | { cargando: boolean; tipo: 'definir-cargando' }
  | { preguntaId: PreguntaIdAby; tipo: 'editar' }
  | { tipo: 'reiniciar' };

export const configuracionInicialAby: ConfiguracionEstudioAby = {
  alcance: '', disponibilidadSemanal: null, fechaExamen: null, fuente: '',
  intencion: null, nivelInicial: null, objetivo: '',
};

export const estadoInicialConversacionAby: EstadoConversacionAby = {
  cargando: false, configuracion: configuracionInicialAby, pasosCompletados: 0,
  propuestaConfirmada: null, propuestaTemporal: null, ultimoTurno: null,
};

function contarPasos(configuracion: ConfiguracionEstudioAby) {
  if (configuracion.intencion !== 'examen') return [configuracion.intencion, configuracion.objetivo].filter(Boolean).length;
  return [configuracion.intencion, configuracion.objetivo, configuracion.fechaExamen, configuracion.alcance, configuracion.disponibilidadSemanal, configuracion.nivelInicial].filter(Boolean).length;
}

function conConfiguracion(configuracion: ConfiguracionEstudioAby): EstadoConversacionAby {
  return { ...estadoInicialConversacionAby, configuracion, pasosCompletados: contarPasos(configuracion) };
}

export function reducirConversacionAby(estado: EstadoConversacionAby, accion: AccionConversacionAby): EstadoConversacionAby {
  const actual = estado.configuracion;
  if (accion.tipo === 'reiniciar') return estadoInicialConversacionAby;
  if (accion.tipo === 'definir-cargando') return { ...estado, cargando: accion.cargando };
  if (accion.tipo === 'descartar-propuesta') return { ...estado, propuestaTemporal: null };
  if (accion.tipo === 'confirmar-propuesta') return { ...estado, propuestaConfirmada: estado.propuestaTemporal, propuestaTemporal: null };
  if (accion.tipo === 'recibir-turno') return { ...estado, cargando: false, propuestaTemporal: accion.turno.tipo === 'propuesta' ? accion.turno.propuesta : null, ultimoTurno: accion.turno };
  if (accion.tipo === 'definir-intencion') return conConfiguracion({ ...configuracionInicialAby, intencion: accion.valor });
  if (accion.tipo === 'definir-objetivo') return conConfiguracion({ ...actual, objetivo: accion.objetivo.trim() });
  if (accion.tipo === 'definir-fecha-examen') return conConfiguracion({ ...actual, fechaExamen: accion.fechaExamen });
  if (accion.tipo === 'definir-alcance') return conConfiguracion({ ...actual, alcance: accion.alcance.trim() });
  if (accion.tipo === 'definir-fuente') return conConfiguracion({ ...actual, fuente: accion.fuente.trim() });
  if (accion.tipo === 'definir-disponibilidad') return conConfiguracion({ ...actual, disponibilidadSemanal: accion.disponibilidadSemanal });
  if (accion.tipo === 'definir-nivel') return conConfiguracion({ ...actual, nivelInicial: accion.nivelInicial });

  if (accion.preguntaId === 'fecha-examen') return conConfiguracion({ ...actual, alcance: '', disponibilidadSemanal: null, fechaExamen: null, fuente: '', nivelInicial: null });
  if (accion.preguntaId === 'alcance') return conConfiguracion({ ...actual, alcance: '', disponibilidadSemanal: null, fuente: '', nivelInicial: null });
  if (accion.preguntaId === 'fuente') return conConfiguracion({ ...actual, fuente: '' });
  if (accion.preguntaId === 'disponibilidad-semanal') return conConfiguracion({ ...actual, disponibilidadSemanal: null, nivelInicial: null });
  return conConfiguracion({ ...actual, nivelInicial: null });
}
