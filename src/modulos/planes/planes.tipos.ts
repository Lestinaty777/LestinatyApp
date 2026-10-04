// Fase 11 — Planes es su propio módulo (par de Tareas/Hábitos en la
// navegación, no una sub-sección), con su propia jerarquía de contenido:
// Plan → Secciones → Días → Bloques (mañana/tarde/noche) → Ítems. A
// diferencia de una tarea, un ítem de plan no tiene tipo/frecuencia/
// recordatorio propio — es contenido simple (texto + progreso), mismo
// espíritu que un subitem de checklist de Tareas.
export type EstadoPlan = 'activo' | 'archivado' | 'completado';
export type ModoPlan = 'ia' | 'manual';
export type EstadoSeccionPlan = 'completada' | 'detallada' | 'solo_titulo';
export type MomentoBloque = 'manana' | 'noche' | 'tarde';

export type Plan = {
  bloquesPorDia: number;
  completadoEn: string | null;
  creadoEn: string;
  descripcion: string | null;
  estado: EstadoPlan;
  fechaObjetivo: string | null;
  id: string;
  modo: ModoPlan;
  objetivoOriginal: string | null;
  orden: number;
  paqueteId: string | null;
  titulo: string;
};

// completadas/total vienen de obtener_resumen_planes() — el nivel visual
// (1-7, mapeado al mismo catálogo de árboles que ya usa todo lo demás) se
// deriva en el cliente con calcularNivelPlan(), sin columna propia en la base.
export type ResumenPlan = Plan & {
  completadas: number;
  total: number;
};

export type PlanSeccion = {
  contextoUsuario: string | null;
  detalladaEn: string | null;
  estado: EstadoSeccionPlan;
  id: string;
  orden: number;
  planId: string;
  resumen: string | null;
  titulo: string;
};

export type PlanBloqueItem = {
  bloqueId: string;
  hecho: boolean;
  id: string;
  orden: number;
  titulo: string;
};

export type PlanBloque = {
  diaId: string;
  id: string;
  items: PlanBloqueItem[];
  mensajeContexto: string | null;
  momento: MomentoBloque;
};

export type PlanDia = {
  bloques: PlanBloque[];
  id: string;
  orden: number;
  seccionId: string;
  titulo: string | null;
};

export type PlanSeccionDetalle = PlanSeccion & { dias: PlanDia[] };

export type PlanInstancia = {
  esCreador: boolean;
  id: string;
  planId: string;
  usuarioId: string;
};

export type CrearPlanManualInput = {
  bloquesPorDia?: number;
  descripcion?: string;
  fechaObjetivo?: string | null;
  titulo: string;
};

export type ResultadoMarcarItemPlan = {
  seccionCompletada: boolean;
  seccionId: string;
};

export type PropuestaBloque = {
  items: string[];
  mensajeContexto: string;
  momento: MomentoBloque;
};

export type PropuestaDia = {
  bloques: PropuestaBloque[];
  titulo?: string;
};

export type PropuestaPlanInicial = {
  descripcionPlan: string;
  primeraSeccionDias: PropuestaDia[];
  secciones: { resumen: string; titulo: string }[];
  tituloPlan: string;
};

export type PropuestaSeccionDetalle = { dias: PropuestaDia[] };

export type ResultadoGenerarPlanInicial = { propuesta: PropuestaPlanInicial; propuestaId: string };
export type ResultadoDetallarSeccionPlan = { propuesta: PropuestaSeccionDetalle; propuestaId: string };
export type ResultadoAceptarPropuestaPlan = { planId: string } | { seccionId: string };
