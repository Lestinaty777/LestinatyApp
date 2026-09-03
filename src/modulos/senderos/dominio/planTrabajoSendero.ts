export type TipoSendero = 'ciclico' | 'finito' | 'mantenimiento' | 'puntual';
export type HerramientaNodo = 'checklist-asistida' | 'cronometro' | 'registro';

export type TareaNodo = {
  ayuda: string;
  evidencia: string;
  herramienta: HerramientaNodo;
  id: string;
  titulo: string;
};

export type NodoPlan = {
  descripcion: string;
  id: string;
  tareas: readonly [TareaNodo, TareaNodo?, TareaNodo?];
  titulo: string;
};

export type PlanTrabajoSendero = {
  ciclo?: { diaActual: number; totalDias: number };
  id: string;
  nodos: readonly NodoPlan[];
  tipo: TipoSendero;
};

const tarea = (id: string, titulo: string, herramienta: HerramientaNodo, ayuda: string, evidencia: string): TareaNodo => ({ ayuda, evidencia, herramienta, id, titulo });

const planRutinaManana: PlanTrabajoSendero = {
  ciclo: { diaActual: 8, totalDias: 21 },
  id: 'rutina-manana',
  tipo: 'ciclico',
  nodos: [
    { descripcion: 'Construye una entrada suave a tu mañana. No busques intensidad; busca continuidad.', id: 'ritual-arranque', titulo: 'Ritual de arranque', tareas: [
      tarea('preparar', 'Prepara tu espacio', 'checklist-asistida', 'Deja agua, ropa cómoda y el teléfono en silencio. Todo debe estar listo antes de empezar.', 'Espacio preparado'),
      tarea('respirar', 'Respira durante 2 min', 'cronometro', 'Siéntate cómodo. Inhala cuatro segundos y exhala seis; vuelve a contar si te distraes.', 'Temporizador completado'),
      tarea('intencion', 'Elige una intención', 'registro', 'Escribe una frase breve y realista para orientar tu mañana, no una meta perfecta.', 'Intención registrada'),
    ] },
    { descripcion: 'Activa el cuerpo con una secuencia corta que puedas repetir mañana.', id: 'movimiento-base', titulo: 'Movimiento base', tareas: [
      tarea('movilidad', 'Haz movilidad suave', 'cronometro', 'Empieza por cuello, hombros y espalda. Mantén un ritmo que te permita respirar con calma.', '5 minutos de movilidad'),
      tarea('agua', 'Toma un vaso de agua', 'checklist-asistida', 'Déjalo visible desde el inicio para que la acción no dependa de recordarlo.', 'Agua tomada'),
    ] },
  ],
};

const planCaminar: PlanTrabajoSendero = {
  id: 'caminar', tipo: 'finito', nodos: [
    { descripcion: 'Prepara una caminata posible hoy, no una sesión ideal que se quede pendiente.', id: 'salida-posible', titulo: 'Define una salida posible', tareas: [
      tarea('ruta', 'Elige una ruta de 10 min', 'checklist-asistida', 'Escoge un recorrido cercano, iluminado y fácil de abandonar si lo necesitas.', 'Ruta definida'),
      tarea('hora', 'Reserva una hora concreta', 'registro', 'Escribe una hora que encaje con tu día. Evita expresiones vagas como “más tarde”.', 'Hora registrada'),
    ] },
    { descripcion: 'Haz la primera sesión y recoge una señal útil para el siguiente hito.', id: 'primera-sesion', titulo: 'Completa tu primera caminata', tareas: [
      tarea('caminar', 'Camina 10 min', 'cronometro', 'Empieza lento. El objetivo es terminar con energía suficiente para volver a hacerlo.', 'Temporizador completado'),
      tarea('sensacion', 'Registra cómo terminó', 'registro', 'Anota una palabra: ligero, normal o pesado. Ajustaremos el siguiente nodo con esa señal.', 'Sensación registrada'),
    ] },
  ],
};

const planPredeterminado: PlanTrabajoSendero = {
  id: 'predeterminado', tipo: 'finito', nodos: [
    { descripcion: 'Empieza con una acción pequeña y clara antes de ampliar el plan.', id: 'primer-avance', titulo: 'Primer avance', tareas: [
      tarea('definir', 'Define el siguiente paso', 'registro', 'Escribe la acción más pequeña que puedas completar hoy.', 'Siguiente paso registrado'),
    ] },
  ],
};

const planes: Record<string, PlanTrabajoSendero> = { caminar: planCaminar, 'rutina-manana': planRutinaManana };

export function obtenerPlanTrabajoSendero(id: string): PlanTrabajoSendero {
  return planes[id] ?? { ...planPredeterminado, id };
}
