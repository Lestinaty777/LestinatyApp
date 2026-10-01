import type { TipoTarea } from './tareas.tipos';

export type PlantillaTarea = {
  iconoId: string;
  titulo: string;
  tipo: TipoTarea;
  /** Solo aplica a 'contador'/'cronometro'. */
  objetivoValor?: number;
  unidad?: string;
  /** Solo aplica a 'checklist'. */
  pasos?: string[];
  palabrasClave?: string[];
};

// Catálogo curado (no uno por ícono, a diferencia de hábitos) — cubre los 4
// tipos reales de tarea con ejemplos cotidianos. Sin capa de i18n por
// plantilla (a diferencia de PLANTILLAS_HABITOS): son pocas y en español,
// igual que el resto del copy nuevo de Tareas en esta fase.
export const PLANTILLAS_TAREAS: PlantillaTarea[] = [
  { iconoId: 'calendario', titulo: 'Organizar mi semana', tipo: 'simple', palabrasClave: ['planificar', 'agenda', 'organización'] },
  { iconoId: 'botella', titulo: 'Tomar agua', tipo: 'contador', objetivoValor: 8, unidad: 'vasos', palabrasClave: ['agua', 'hidratación'] },
  { iconoId: 'correr', titulo: 'Salir a correr', tipo: 'cronometro', objetivoValor: 20, unidad: 'min', palabrasClave: ['running', 'ejercicio', 'cardio'] },
  { iconoId: 'computadora', titulo: 'Enfocarme en el trabajo', tipo: 'cronometro', objetivoValor: 30, unidad: 'min', palabrasClave: ['trabajo', 'productividad', 'foco'] },
  { iconoId: 'estudiar', titulo: 'Leer', tipo: 'cronometro', objetivoValor: 15, unidad: 'min', palabrasClave: ['lectura', 'libro'] },
  { iconoId: 'montana', titulo: 'Preparar el viaje', tipo: 'checklist', pasos: ['Hacer la valija', 'Revisar documentos', 'Confirmar reservas'], palabrasClave: ['viaje', 'vacaciones', 'equipaje'] },
  { iconoId: 'zanahoria', titulo: 'Hacer las compras', tipo: 'checklist', pasos: ['Hacer la lista', 'Ir al supermercado', 'Guardar todo'], palabrasClave: ['compras', 'supermercado'] },
  { iconoId: 'tapete', titulo: 'Limpiar la casa', tipo: 'checklist', pasos: ['Ordenar', 'Barrer', 'Sacar la basura'], palabrasClave: ['limpieza', 'casa', 'orden'] },
  { iconoId: 'dientes', titulo: 'Rutina de cuidado personal', tipo: 'simple', palabrasClave: ['cuidado', 'rutina', 'piel'] },
  { iconoId: 'tarjeta', titulo: 'Revisar mis gastos', tipo: 'contador', objetivoValor: 1, unidad: 'veces', palabrasClave: ['dinero', 'finanzas', 'presupuesto'] },
  { iconoId: 'metas', titulo: 'Responder correos pendientes', tipo: 'simple', palabrasClave: ['correo', 'email', 'trabajo'] },
  { iconoId: 'feliz', titulo: 'Organizar un evento', tipo: 'checklist', pasos: ['Elegir fecha', 'Invitar gente', 'Conseguir lo necesario'], palabrasClave: ['evento', 'fiesta', 'organización'] },
];

export function buscarPlantillasTareas(consulta: string): PlantillaTarea[] {
  const q = consulta.trim().toLowerCase();
  if (!q) return PLANTILLAS_TAREAS;
  return PLANTILLAS_TAREAS.filter((plantilla) =>
    plantilla.titulo.toLowerCase().includes(q) ||
    plantilla.iconoId.toLowerCase().includes(q) ||
    plantilla.palabrasClave?.some((clave) => clave.toLowerCase().includes(q)),
  );
}
