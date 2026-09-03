import type { ConfiguracionConversacionAby, PreguntaVisualAby, PropuestaSenderoAby, RespuestaAgenteAby } from '../contrato/aby.contrato';
import { validarPropuestaSenderoAby } from '../contrato/aby.contrato';

const preguntas: Record<string, PreguntaVisualAby> = {
  tipo: {
    id: 'tipo',
    opciones: [
      { etiqueta: 'Rutina recurrente', valor: 'ciclico' },
      { etiqueta: 'Objetivo con final', valor: 'finito' },
    ],
    tipo: 'cards',
    titulo: 'Como quieres avanzar?',
  },
  frecuencia: {
    id: 'frecuencia',
    opciones: [],
    tipo: 'dias',
    titulo: 'Que dias te encajan mejor?',
  },
  duracion: {
    id: 'duracion',
    opciones: [
      { etiqueta: '10 min', valor: '10' },
      { etiqueta: '25 min', valor: '25' },
      { etiqueta: '45 min', valor: '45' },
    ],
    tipo: 'chips',
    titulo: 'Cuanto tiempo real tienes por sesion?',
  },
};

function propuestaEjercicio(configuracion: ConfiguracionConversacionAby): PropuestaSenderoAby {
  return validarPropuestaSenderoAby({
    categoriaId: 'salud',
    configuracion,
    descripcion: 'Una ruta breve para construir movimiento constante sin empezar demasiado fuerte.',
    nodos: [
      { actionPack: { nodoId: 'preparar', version: 1, widgets: [{ config: { tareas: [{ id: 'ropa', texto: 'Prepara ropa comoda' }] }, id: 'checklist-asistida', rol: 'principal' }] }, descripcion: 'Deja la friccion fuera antes de tu primera sesion.', id: 'preparar', titulo: 'Prepara el inicio' },
      { actionPack: { nodoId: 'mover', version: 1, widgets: [{ config: { duracionSegundos: (configuracion.duracionMinutos ?? 10) * 60 }, id: 'cronometro', rol: 'principal' }, { config: { meta: 3, unidad: 'rondas' }, id: 'contador', rol: 'apoyo' }] }, descripcion: 'Completa una sesion sostenible y registra tu ritmo.', id: 'mover', titulo: 'Muevete a tu ritmo' },
      { actionPack: { nodoId: 'registrar', version: 1, widgets: [{ config: { placeholder: 'Como termino tu cuerpo?', tipoEntrada: 'texto' }, id: 'registro', rol: 'principal' }] }, descripcion: 'Guarda una senal breve para ajustar tu proxima sesion.', id: 'registrar', titulo: 'Cierra con una senal' },
    ],
    subcategoriaId: 'ejercicio',
    titulo: 'Movimiento posible',
  });
}

function propuestaRutina(configuracion: ConfiguracionConversacionAby): PropuestaSenderoAby {
  return validarPropuestaSenderoAby({
    categoriaId: 'rutinas',
    configuracion,
    descripcion: 'Una secuencia corta que convierte tu objetivo en una rutina que cabe en un dia normal.',
    nodos: [
      { actionPack: { nodoId: 'preparar', version: 1, widgets: [{ config: { tareas: [{ id: 'espacio', texto: 'Prepara tu espacio' }] }, id: 'checklist-asistida', rol: 'principal' }] }, descripcion: 'Prepara una version facil de repetir.', id: 'preparar', titulo: 'Crea la senal de inicio' },
      { actionPack: { nodoId: 'hacer', version: 1, widgets: [{ config: { duracionSegundos: (configuracion.duracionMinutos ?? 10) * 60 }, id: 'cronometro', rol: 'principal' }] }, descripcion: 'Dedica tiempo protegido a la accion principal.', id: 'hacer', titulo: 'Haz la accion central' },
      { actionPack: { nodoId: 'cerrar', version: 1, widgets: [{ config: { placeholder: 'Que tan posible se sintio?', tipoEntrada: 'texto' }, id: 'registro', rol: 'principal' }] }, descripcion: 'Registra una frase para que Aby pueda ajustar el siguiente ciclo.', id: 'cerrar', titulo: 'Cierra y aprende' },
    ],
    subcategoriaId: 'manana',
    titulo: 'Rutina posible',
  });
}

export function obtenerSiguienteRespuestaMock(configuracion: ConfiguracionConversacionAby): RespuestaAgenteAby {
  if (!configuracion.objetivo.trim()) return { mensaje: 'Que quieres construir hoy?', tipo: 'mensaje' };
  if (!configuracion.tipo) return { mensaje: 'Vamos a darle una forma que puedas sostener.', pregunta: preguntas.tipo, tipo: 'pregunta' };
  if (configuracion.tipo === 'ciclico' && configuracion.diasSemana.length === 0) return { mensaje: 'Elige los dias que se sienten realistas.', pregunta: preguntas.frecuencia, tipo: 'pregunta' };
  if (!configuracion.duracionMinutos) return { mensaje: 'Prefiero que empecemos con tiempo real, no ideal.', pregunta: preguntas.duracion, tipo: 'pregunta' };

  const propuesta = /ejercicio|entren|correr|caminar|movimiento/i.test(configuracion.objetivo)
    ? propuestaEjercicio(configuracion)
    : propuestaRutina(configuracion);

  return { mensaje: 'Prepare una ruta completa. Puedes ajustarla antes de crearla.', propuesta, tipo: 'propuesta' };
}
