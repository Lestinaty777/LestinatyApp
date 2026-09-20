import type { CrearHabitoInput } from './habitos.servicio';
import { i18n } from '../../servicios/i18n/i18n';

export type PlantillaHabito = {
  iconoId: string;
  titulo: string;
  tipoMeta: CrearHabitoInput['tipoMeta'];
  meta: number;
  /** Solo aplica a tipoMeta 'cantidad' — 'duracion' siempre son minutos, 'check' no usa unidad. */
  unidad?: string;
  /** Términos extra para la búsqueda, además del título y el id del ícono. */
  palabrasClave?: string[];
};

// Una plantilla por cada ícono disponible en el selector de hábitos (ver
// src/diseno/iconos/registroIconos.ts) — elegir una deja el hábito "listo"
// (título, tipo de meta, cantidad/duración e ícono) en un solo toque, sin que
// deje de ser editable después en el propio wizard. Las insignias de nivel
// (nivel1..nivel7) se excluyen a propósito: son medallas de progreso, no
// representan ningún tipo de hábito real.
export const PLANTILLAS_HABITOS: PlantillaHabito[] = [
  { iconoId: 'aguacate', titulo: 'Comer más saludable', tipoMeta: 'cantidad', meta: 3, unidad: 'porciones', palabrasClave: ['comida', 'nutrición', 'fruta'] },
  { iconoId: 'almohada', titulo: 'Tomar una siesta', tipoMeta: 'check', meta: 1, palabrasClave: ['dormir', 'descanso', 'siesta', 'sueño'] },
  { iconoId: 'arbol', titulo: 'Salir a la naturaleza', tipoMeta: 'duracion', meta: 20, palabrasClave: ['naturaleza', 'aire libre', 'parque'] },
  { iconoId: 'audifonos', titulo: 'Escuchar un podcast', tipoMeta: 'duracion', meta: 15, palabrasClave: ['música', 'podcast', 'audio'] },
  { iconoId: 'bateria', titulo: 'Recargar energía', tipoMeta: 'check', meta: 1, palabrasClave: ['descanso', 'energía', 'recargar'] },
  { iconoId: 'bicicleta', titulo: 'Andar en bicicleta', tipoMeta: 'duracion', meta: 20, palabrasClave: ['ciclismo', 'ejercicio', 'bici'] },
  { iconoId: 'botella', titulo: 'Llevar mi botella de agua', tipoMeta: 'check', meta: 1, palabrasClave: ['agua', 'hidratación', 'botella'] },
  { iconoId: 'brocoli', titulo: 'Comer verduras', tipoMeta: 'cantidad', meta: 3, unidad: 'porciones', palabrasClave: ['comida', 'vegetales', 'nutrición'] },
  { iconoId: 'cafe', titulo: 'Limitar mi café a una taza', tipoMeta: 'check', meta: 1, palabrasClave: ['cafeína', 'bebida'] },
  { iconoId: 'calendario', titulo: 'Planear mi día', tipoMeta: 'check', meta: 1, palabrasClave: ['organización', 'planificar', 'agenda'] },
  { iconoId: 'cama', titulo: 'Dormir temprano', tipoMeta: 'check', meta: 1, palabrasClave: ['dormir', 'sueño', 'descanso'] },
  { iconoId: 'camara', titulo: 'Tomar una foto del día', tipoMeta: 'check', meta: 1, palabrasClave: ['fotografía', 'recuerdos'] },
  { iconoId: 'caminar', titulo: 'Caminar', tipoMeta: 'cantidad', meta: 5000, unidad: 'pasos', palabrasClave: ['caminata', 'pasos', 'ejercicio'] },
  { iconoId: 'cerebro', titulo: 'Ejercitar la mente', tipoMeta: 'duracion', meta: 15, palabrasClave: ['mental', 'rompecabezas', 'aprender'] },
  { iconoId: 'colores', titulo: 'Dibujar o pintar', tipoMeta: 'duracion', meta: 20, palabrasClave: ['arte', 'dibujo', 'pintura', 'creatividad'] },
  { iconoId: 'comida', titulo: 'Comer saludable', tipoMeta: 'check', meta: 1, palabrasClave: ['nutrición', 'dieta'] },
  { iconoId: 'computadora', titulo: 'Trabajo enfocado', tipoMeta: 'duracion', meta: 30, palabrasClave: ['trabajo', 'código', 'productividad'] },
  { iconoId: 'corazon', titulo: 'Practicar gratitud', tipoMeta: 'check', meta: 1, palabrasClave: ['gratitud', 'amor', 'bienestar'] },
  { iconoId: 'correr', titulo: 'Correr', tipoMeta: 'duracion', meta: 20, palabrasClave: ['running', 'ejercicio', 'cardio'] },
  { iconoId: 'dientes', titulo: 'Cepillarme los dientes', tipoMeta: 'check', meta: 1, palabrasClave: ['higiene', 'salud dental'] },
  { iconoId: 'dormir', titulo: 'Dormir temprano', tipoMeta: 'check', meta: 1, palabrasClave: ['sueño', 'descanso'] },
  { iconoId: 'energia', titulo: 'Estirar el cuerpo', tipoMeta: 'duracion', meta: 10, palabrasClave: ['estiramiento', 'energía'] },
  { iconoId: 'engranaje', titulo: 'Organizar mis tareas', tipoMeta: 'check', meta: 1, palabrasClave: ['organización', 'productividad'] },
  { iconoId: 'equipo', titulo: 'Conectar con mi equipo', tipoMeta: 'check', meta: 1, palabrasClave: ['social', 'trabajo', 'colaborar'] },
  { iconoId: 'estadistica', titulo: 'Revisar mis finanzas', tipoMeta: 'check', meta: 1, palabrasClave: ['dinero', 'finanzas', 'presupuesto'] },
  { iconoId: 'estudiar', titulo: 'Estudiar', tipoMeta: 'duracion', meta: 30, palabrasClave: ['aprender', 'leer', 'escuela'] },
  { iconoId: 'feliz', titulo: 'Practicar buen humor', tipoMeta: 'check', meta: 1, palabrasClave: ['felicidad', 'ánimo', 'gratitud'] },
  { iconoId: 'flor', titulo: 'Cuidar mis plantas', tipoMeta: 'check', meta: 1, palabrasClave: ['jardín', 'plantas', 'regar'] },
  { iconoId: 'frasco', titulo: 'Ahorrar un poco de dinero', tipoMeta: 'check', meta: 1, palabrasClave: ['ahorro', 'dinero', 'finanzas'] },
  { iconoId: 'hacer-ejercicio', titulo: 'Hacer ejercicio', tipoMeta: 'duracion', meta: 30, palabrasClave: ['pesas', 'gimnasio', 'entrenar', 'fuerza'] },
  { iconoId: 'hoja', titulo: 'Vivir de forma sustentable', tipoMeta: 'check', meta: 1, palabrasClave: ['ecología', 'planeta', 'verde'] },
  { iconoId: 'hoja2', titulo: 'Reducir el desperdicio', tipoMeta: 'check', meta: 1, palabrasClave: ['reciclar', 'ecología'] },
  { iconoId: 'hoja3', titulo: 'Cuidar el medio ambiente', tipoMeta: 'check', meta: 1, palabrasClave: ['ecología', 'naturaleza'] },
  { iconoId: 'idea', titulo: 'Aprender algo nuevo', tipoMeta: 'duracion', meta: 15, palabrasClave: ['aprender', 'curiosidad', 'creatividad'] },
  { iconoId: 'lavadora', titulo: 'Hacer las tareas del hogar', tipoMeta: 'check', meta: 1, palabrasClave: ['limpieza', 'hogar', 'quehaceres'] },
  { iconoId: 'maceta', titulo: 'Regar mis plantas', tipoMeta: 'check', meta: 1, palabrasClave: ['jardín', 'plantas'] },
  { iconoId: 'manos', titulo: 'Ayudar a alguien hoy', tipoMeta: 'check', meta: 1, palabrasClave: ['bondad', 'voluntariado', 'amabilidad'] },
  { iconoId: 'manzana', titulo: 'Comer fruta', tipoMeta: 'cantidad', meta: 2, unidad: 'porciones', palabrasClave: ['fruta', 'nutrición'] },
  { iconoId: 'mascota', titulo: 'Pasear a mi mascota', tipoMeta: 'duracion', meta: 20, palabrasClave: ['perro', 'gato', 'mascota'] },
  { iconoId: 'meditar', titulo: 'Meditar', tipoMeta: 'duracion', meta: 10, palabrasClave: ['mindfulness', 'relajación', 'respirar'] },
  { iconoId: 'metas', titulo: 'Revisar mis metas', tipoMeta: 'check', meta: 1, palabrasClave: ['objetivos', 'planificar'] },
  { iconoId: 'montana', titulo: 'Hacer senderismo', tipoMeta: 'duracion', meta: 30, palabrasClave: ['hiking', 'aire libre', 'naturaleza'] },
  { iconoId: 'montana2', titulo: 'Explorar al aire libre', tipoMeta: 'duracion', meta: 30, palabrasClave: ['aventura', 'naturaleza'] },
  { iconoId: 'musica', titulo: 'Practicar un instrumento', tipoMeta: 'duracion', meta: 20, palabrasClave: ['música', 'instrumento', 'tocar'] },
  { iconoId: 'ojo', titulo: 'Descansar la vista', tipoMeta: 'check', meta: 1, palabrasClave: ['pantallas', 'vista', 'descanso'] },
  { iconoId: 'pastillas', titulo: 'Tomar mis vitaminas', tipoMeta: 'check', meta: 1, palabrasClave: ['salud', 'medicamento', 'vitaminas'] },
  { iconoId: 'pescado', titulo: 'Comer pescado', tipoMeta: 'check', meta: 1, palabrasClave: ['nutrición', 'omega 3'] },
  { iconoId: 'pin', titulo: 'Explorar un lugar nuevo', tipoMeta: 'check', meta: 1, palabrasClave: ['aventura', 'viajar'] },
  { iconoId: 'planta', titulo: 'Regar mis plantas', tipoMeta: 'check', meta: 1, palabrasClave: ['jardín', 'plantas'] },
  { iconoId: 'plato', titulo: 'Cocinar mi propia comida', tipoMeta: 'check', meta: 1, palabrasClave: ['cocina', 'comida saludable'] },
  { iconoId: 'progreso', titulo: 'Registrar mi progreso', tipoMeta: 'check', meta: 1, palabrasClave: ['seguimiento', 'avance'] },
  { iconoId: 'rayo', titulo: 'Rutina rápida de energía', tipoMeta: 'duracion', meta: 10, palabrasClave: ['energía', 'activación'] },
  { iconoId: 'reciclar', titulo: 'Reciclar', tipoMeta: 'check', meta: 1, palabrasClave: ['ecología', 'basura', 'planeta'] },
  { iconoId: 'reloj', titulo: 'Cuidar mi tiempo', tipoMeta: 'check', meta: 1, palabrasClave: ['puntualidad', 'organización'] },
  { iconoId: 'rollo-camara', titulo: 'Practicar fotografía', tipoMeta: 'duracion', meta: 15, palabrasClave: ['fotos', 'arte'] },
  { iconoId: 'sol', titulo: 'Levantarme temprano', tipoMeta: 'check', meta: 1, palabrasClave: ['madrugar', 'mañana'] },
  { iconoId: 'tapete', titulo: 'Hacer yoga', tipoMeta: 'duracion', meta: 15, palabrasClave: ['yoga', 'estiramiento', 'flexibilidad'] },
  { iconoId: 'tareas', titulo: 'Completar mis pendientes', tipoMeta: 'check', meta: 1, palabrasClave: ['productividad', 'organización'] },
  { iconoId: 'tomar-agua', titulo: 'Tomar agua', tipoMeta: 'cantidad', meta: 8, unidad: 'vasos', palabrasClave: ['hidratación', 'agua'] },
  { iconoId: 'trofeo', titulo: 'Cumplir un reto personal', tipoMeta: 'check', meta: 1, palabrasClave: ['logro', 'meta', 'desafío'] },
  { iconoId: 'zanahoria', titulo: 'Comer verduras', tipoMeta: 'cantidad', meta: 3, unidad: 'porciones', palabrasClave: ['nutrición', 'vegetales'] },
];

function clavePlantilla(id: string): string {
  return id.replace(/-([a-z])/g, (_, letra: string) => letra.toUpperCase());
}

/**
 * Los valores base mantienen la compatibilidad con hábitos ya creados, pero
 * la lista que se presenta en el wizard siempre se resuelve en el idioma
 * activo. También localizamos las unidades, que pasan a ser el valor inicial
 * editable al elegir una plantilla.
 */
export function obtenerPlantillasHabitos(): PlantillaHabito[] {
  return PLANTILLAS_HABITOS.map((plantilla) => {
    const clave = clavePlantilla(plantilla.iconoId);
    return {
      ...plantilla,
      titulo: i18n.t(`habitos.crearWizard.templateTitles.${clave}`),
      unidad: plantilla.unidad ? i18n.t(`habitos.crearWizard.templateUnits.${plantilla.unidad.normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`) : undefined,
    };
  });
}

export function buscarPlantillasHabitos(consulta: string): PlantillaHabito[] {
  const q = consulta.trim().toLowerCase();
  const plantillas = obtenerPlantillasHabitos();
  if (!q) return plantillas;
  return plantillas.filter((plantilla) =>
    plantilla.titulo.toLowerCase().includes(q) ||
    plantilla.iconoId.toLowerCase().includes(q) ||
    plantilla.palabrasClave?.some((clave) => clave.toLowerCase().includes(q)),
  );
}
