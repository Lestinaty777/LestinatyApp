import { DURACION_META_MAXIMA_DIAS, type CrearMetaInput, type MetaVida, type TipoElementoMeta } from './metas.tipos';

// Lógica pura de la pantalla de Metas: sin React ni red, para poder probarla.

/** Filtro de área de la pantalla: un id de área, 'sin_area', o null = todas. */
export const SIN_AREA_META = 'sin_area' as const;
export type FiltroAreaMeta = string | typeof SIN_AREA_META | null;

export function filtrarMetasPorArea<T extends Pick<MetaVida, 'area'>>(metas: readonly T[], filtro: FiltroAreaMeta): T[] {
  if (filtro === null) return [...metas];
  if (filtro === SIN_AREA_META) return metas.filter((meta) => meta.area === null);
  return metas.filter((meta) => meta.area?.id === filtro);
}

/** Cuántas metas no archivadas hay en cada área (clave null = sin área). */
export function contarMetasPorArea(metas: readonly Pick<MetaVida, 'area'>[]): Map<string | null, number> {
  const conteo = new Map<string | null, number>();
  for (const meta of metas) {
    const clave = meta.area?.id ?? null;
    conteo.set(clave, (conteo.get(clave) ?? 0) + 1);
  }
  return conteo;
}

export type ResumenMetas = {
  activas: number;
  pausadas: number;
  logradas: number;
  /** Logradas sobre (activas + pausadas + logradas), 0–100. */
  porcentajeLogradas: number;
  /** La meta activa con plazo a la que menos días le quedan; null si ninguna tiene plazo. */
  proximaAVencer: MetaVida | null;
};

export function resumirMetas(metas: readonly MetaVida[]): ResumenMetas {
  const activas = metas.filter((meta) => meta.estado === 'activa');
  const pausadas = metas.filter((meta) => meta.estado === 'pausada').length;
  const logradas = metas.filter((meta) => meta.estado === 'lograda').length;
  const total = activas.length + pausadas + logradas;
  const conPlazo = activas.filter((meta) => meta.diasRestantes !== null);
  const proximaAVencer = conPlazo.reduce<MetaVida | null>(
    (mejor, meta) => (mejor === null || (meta.diasRestantes ?? 0) < (mejor.diasRestantes ?? 0) ? meta : mejor),
    null,
  );
  return { activas: activas.length, pausadas, logradas, porcentajeLogradas: total > 0 ? Math.round((logradas * 100) / total) : 0, proximaAVencer };
}

export type BorradorMeta = { titulo: string; descripcion: string; areaId: string | null; conPlazo: boolean; duracionDias: string };

export const BORRADOR_META_VACIO: BorradorMeta = { titulo: '', descripcion: '', areaId: null, conPlazo: false, duracionDias: '30' };

export type ErrorBorradorMeta = 'titulo' | 'area' | 'duracion';

/** Entero de 1 a 3650, o null si el texto no lo es. */
export function leerDuracionDias(texto: string): number | null {
  if (!/^\d{1,4}$/.test(texto.trim())) return null;
  const dias = Number(texto.trim());
  return dias >= 1 && dias <= DURACION_META_MAXIMA_DIAS ? dias : null;
}

export function validarBorradorMeta(borrador: BorradorMeta): ErrorBorradorMeta | null {
  const titulo = borrador.titulo.trim();
  if (titulo.length < 1 || titulo.length > 120) return 'titulo';
  if (!borrador.areaId) return 'area';
  if (borrador.conPlazo && leerDuracionDias(borrador.duracionDias) === null) return 'duracion';
  return null;
}

/** Solo llamar con un borrador válido (validarBorradorMeta === null). */
export function borradorAInput(borrador: BorradorMeta): CrearMetaInput {
  return {
    titulo: borrador.titulo.trim(),
    descripcion: borrador.descripcion.trim() || null,
    areaId: borrador.areaId ?? '',
    duracionDias: borrador.conPlazo ? leerDuracionDias(borrador.duracionDias) : null,
  };
}

export function borradorDesdeMeta(meta: Pick<MetaVida, 'titulo' | 'descripcion' | 'area' | 'duracionDias'>): BorradorMeta {
  return {
    titulo: meta.titulo,
    descripcion: meta.descripcion ?? '',
    areaId: meta.area?.id ?? null,
    conPlazo: meta.duracionDias !== null,
    duracionDias: String(meta.duracionDias ?? 30),
  };
}

/** Un hábito, tarea, rutina o plan de la persona, con la meta a la que pertenece (si tiene). */
export type ElementoDeMeta = { tipo: TipoElementoMeta; id: string; titulo: string; metaId: string | null };

export const ORDEN_TIPOS_ELEMENTO: readonly TipoElementoMeta[] = ['habito', 'tarea', 'rutina', 'plan'];

export function elementosDeLaMeta(elementos: readonly ElementoDeMeta[], metaId: string): ElementoDeMeta[] {
  return elementos.filter((elemento) => elemento.metaId === metaId);
}

/** Agrupa por tipo en el orden hábito, tarea, rutina, plan; omite los tipos vacíos. */
export function agruparElementosPorTipo(elementos: readonly ElementoDeMeta[]): { tipo: TipoElementoMeta; elementos: ElementoDeMeta[] }[] {
  return ORDEN_TIPOS_ELEMENTO
    .map((tipo) => ({ tipo, elementos: elementos.filter((elemento) => elemento.tipo === tipo) }))
    .filter((grupo) => grupo.elementos.length > 0);
}

export type PuntoBalanceArea = { id: string; color: string; activa: boolean };

/**
 * Un punto por cada área de la persona, encendido si tiene al menos una meta
 * activa. Para ver de un vistazo qué parte de su vida no tiene ninguna meta.
 * Conserva el orden de `areas`.
 */
export function balanceDeAreas(
  areas: readonly { id: string; color: string }[],
  metas: readonly Pick<MetaVida, 'area' | 'estado'>[],
): PuntoBalanceArea[] {
  const conMetaActiva = new Set(metas.filter((meta) => meta.estado === 'activa' && meta.area).map((meta) => meta.area!.id));
  return areas.map((area) => ({ id: area.id, color: area.color, activa: conMetaActiva.has(area.id) }));
}
