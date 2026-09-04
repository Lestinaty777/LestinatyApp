import type { ConfiguracionEstudioAby, PreguntaVisualAby, PropuestaSenderoAby, RespuestaAgenteAby } from '../contrato/aby.contrato';
import { validarPropuestaSenderoAby } from '../contrato/aby.contrato';

const preguntas: Record<PreguntaVisualAby['id'], PreguntaVisualAby> = {
  'fecha-examen': { id: 'fecha-examen', opciones: [], placeholder: 'Ej. 18/10/2026', tipo: 'texto', titulo: '¿Cuándo es tu examen?' },
  alcance: { id: 'alcance', opciones: [], placeholder: 'Ej. Capítulos 1 al 4', tipo: 'texto', titulo: '¿Qué temas entran?' },
  fuente: { id: 'fuente', opciones: [], placeholder: 'Índice, temario o escribe “No tengo material”', tipo: 'texto', titulo: '¿Tienes material para orientarnos? (opcional)' },
  'disponibilidad-semanal': { id: 'disponibilidad-semanal', opciones: [{ etiqueta: '2 h', valor: '2' }, { etiqueta: '4 h', valor: '4' }, { etiqueta: '6 h', valor: '6' }, { etiqueta: '8 h+', valor: '8' }], tipo: 'chips', titulo: '¿Cuánto tiempo tienes por semana?' },
  'nivel-inicial': { id: 'nivel-inicial', opciones: [{ etiqueta: 'Estoy empezando', valor: 'inicio' }, { etiqueta: 'Entiendo lo básico', valor: 'basico' }, { etiqueta: 'Ya tengo base', valor: 'intermedio' }], tipo: 'cards', titulo: '¿Cómo te sientes con este tema?' },
};

function propuestaExamen(configuracion: ConfiguracionEstudioAby): PropuestaSenderoAby {
  return validarPropuestaSenderoAby({
    categoriaId: 'estudio', configuracion,
    descripcion: `Una ruta de estudio para cubrir ${configuracion.alcance} antes de tu examen.`,
    nodos: [
      { actionPack: { nodoId: 'comprender-base', version: 1, widgets: [{ config: { tareas: [{ id: 'conceptos', texto: 'Explica los conceptos base con tus palabras' }] }, id: 'checklist-asistida', rol: 'principal' }] }, descripcion: 'Construye una base clara antes de memorizar detalles.', id: 'comprender-base', titulo: 'Comprende la base' },
      { actionPack: { nodoId: 'practica-activa', version: 1, widgets: [{ config: { duracionSegundos: 1500 }, id: 'cronometro', rol: 'principal' }] }, descripcion: 'Practica recuperación activa sin mirar apuntes.', id: 'practica-activa', titulo: 'Practica sin apuntes' },
      { actionPack: { nodoId: 'repaso-final', version: 1, widgets: [{ config: { placeholder: '¿Qué tema debes reforzar?', tipoEntrada: 'texto' }, id: 'registro', rol: 'principal' }] }, descripcion: 'Detecta vacíos y prepara un último repaso.', id: 'repaso-final', titulo: 'Repaso antes del examen' },
    ], subcategoriaId: 'examen', titulo: configuracion.objetivo,
  });
}

export function obtenerSiguienteRespuestaMock(configuracion: ConfiguracionEstudioAby): RespuestaAgenteAby {
  if (!configuracion.intencion) return { mensaje: 'Elige la forma en que quieres avanzar.', tipo: 'mensaje' };
  if (!configuracion.objetivo) return { mensaje: 'Cuéntame qué necesitas estudiar.', tipo: 'mensaje' };
  if (configuracion.intencion !== 'examen') return { mensaje: 'Cuéntame tu objetivo y pronto armaremos este flujo especializado.', tipo: 'mensaje' };
  if (!configuracion.fechaExamen) return { mensaje: 'Vamos a construir un plan que llegue a tiempo.', pregunta: preguntas['fecha-examen'], tipo: 'pregunta' };
  if (!configuracion.alcance) return { mensaje: 'Primero delimitamos exactamente qué entra.', pregunta: preguntas.alcance, tipo: 'pregunta' };
  if (!configuracion.fuente) return { mensaje: 'Puedes compartir un índice o temario. También puedes continuar sin material.', pregunta: preguntas.fuente, tipo: 'pregunta' };
  if (!configuracion.disponibilidadSemanal) return { mensaje: 'Prefiero un ritmo realista que uno ideal.', pregunta: preguntas['disponibilidad-semanal'], tipo: 'pregunta' };
  if (!configuracion.nivelInicial) return { mensaje: 'Esto me ayuda a decidir por dónde iniciar.', pregunta: preguntas['nivel-inicial'], tipo: 'pregunta' };
  return { mensaje: 'Preparé un sendero para llegar con claridad al examen.', propuesta: propuestaExamen(configuracion), tipo: 'propuesta' };
}
