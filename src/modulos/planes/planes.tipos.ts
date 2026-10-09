// Fase 11 — Planes es su propio módulo (par de Tareas/Hábitos en la
// navegación, no una sub-sección), con su propia jerarquía de contenido:
// Plan → Secciones → Días → Bloques (mañana/tarde/noche) → Ítems.
export type EstadoPlan = 'activo' | 'archivado' | 'completado';
// "simple" es un check (la mayoría). "contador"/"cronometro" reusan el mismo
// mecanismo numérico (metaValor/valorActual) y el widget WidgetProgresoTarea
// de Tareas tal cual — "cronometro" ahí ya es un contador con unidad fija en
// minutos, no un timer en el fondo, así que no hace falta un tipo aparte.
export type TipoItemPlan = 'contador' | 'cronometro' | 'simple';
export type ModoPlan = 'ia' | 'manual';
export type EstadoSeccionPlan = 'completada' | 'detallada' | 'solo_titulo';
export type MomentoBloque = 'manana' | 'noche' | 'tarde';
export type NivelDisponibilidad = 'moderado' | 'poco';
// "poco"/"moderado" son franjas fijas (15-30 min / 30 min-1h). Un number es
// "bastante" con minutos elegidos por el usuario (siempre > 1h) — más
// preciso que forzar todo "más de una hora" a una sola etiqueta.
export type ValorDisponibilidad = NivelDisponibilidad | number;
// Qué momentos del día tiene el usuario y cuánto tiempo en cada uno — se le
// pregunta en el wizard con IA y se persiste en el plan para que
// detallar-seccion-plan respete lo mismo en las secciones siguientes, no
// solo en la primera. null en planes manuales (no aplica).
export type Disponibilidad = Partial<Record<MomentoBloque, ValorDisponibilidad>>;

export type Plan = {
  completadoEn: string | null;
  // Quién lo creó — ahora que un plan compartido también aparece en la lista
  // de quien se sumó (Fase 12), ya no alcanza con "si lo veo, es mío".
  creadorId: string;
  creadoEn: string;
  descripcion: string | null;
  disponibilidad: Disponibilidad | null;
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
  // null = plan sin ramas (modo de siempre). Si tiene valor, esta sección
  // pertenece al arco propio de esa rama, no al del plan entero.
  ramaId: string | null;
  resumen: string | null;
  titulo: string;
};

// Una "rama" es una parte paralela de un plan dividido (Fase 12.2) — p. ej.
// "Distribución"/"Creación" de un plan de marketing. Sin reclamar
// (instanciaId null) no tiene ningún día/bloque/ítem todavía: eso se genera
// recién cuando alguien la reclama, con SU disponibilidad real.
export type PlanRama = {
  disponibilidad: Disponibilidad | null;
  id: string;
  instanciaId: string | null;
  nombre: string;
  orden: number;
  planId: string;
  resumen: string | null;
};

export type PlanBloqueItem = {
  bloqueId: string;
  hecho: boolean;
  id: string;
  // Meta y unidad solo tienen sentido para "contador"/"cronometro" — null en
  // ítems "simple".
  metaValor: number | null;
  // Nota opcional capturada al completar la sección — se adjunta al ítem
  // que la completó (sea de IA o manual, no requiere un "ítem de reflexión"
  // especial) y se usa para precargar el contexto al detallar la siguiente.
  nota: string | null;
  orden: number;
  tipo: TipoItemPlan;
  titulo: string;
  unidad: string | null;
  // Cuánto se registró hasta ahora — null en ítems "simple", 0+ en
  // "contador"/"cronometro".
  valorActual: number | null;
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

// Una fila por RAMA que la persona tiene, no una fila por persona — desde
// que una misma persona puede reclamar varias ramas (migración 75),
// instanciaId ya no es único en esta lista: usar ramaId (o el índice) como
// key en listas de React.
export type ParticipantePlan = {
  completadas: number;
  esCreador: boolean;
  instanciaId: string;
  nombre: string;
  // Solo si el plan tiene ramas — la que esta persona reclamó en esta fila.
  ramaId: string | null;
  ramaNombre: string | null;
  total: number;
  usuarioId: string;
};

export type CrearPlanManualInput = {
  descripcion?: string;
  fechaObjetivo?: string | null;
  titulo: string;
};

export type ResultadoMarcarItemPlan = {
  seccionCompletada: boolean;
  seccionId: string;
};

export type PropuestaItem = {
  metaValor?: number;
  tipo: TipoItemPlan;
  titulo: string;
  unidad?: string;
};

export type PropuestaBloque = {
  items: PropuestaItem[];
  mensajeContexto: string;
  momento: MomentoBloque;
};

export type PropuestaDia = {
  bloques: PropuestaBloque[];
  titulo?: string;
};

// Exactamente una de las dos: "ramas" (recién se pidió dividir el plan,
// todavía sin detalle) o secciones+primeraSeccionDias (modo de siempre, o
// el detalle real de UNA rama ya reclamada).
export type PropuestaPlanInicial = {
  descripcionPlan: string;
  primeraSeccionDias?: PropuestaDia[];
  ramas?: { nombre: string; resumen: string }[];
  secciones?: { resumen: string; titulo: string }[];
  tituloPlan: string;
};

export type PropuestaSeccionDetalle = { dias: PropuestaDia[] };

export type ResultadoGenerarPlanInicial = { propuesta: PropuestaPlanInicial; propuestaId: string };
export type ResultadoDetallarSeccionPlan = { propuesta: PropuestaSeccionDetalle; propuestaId: string };
export type ResultadoAceptarPropuestaPlan = { planId: string } | { seccionId: string } | { ramaId: string };
