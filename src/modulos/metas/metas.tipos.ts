import type { AreaVidaResumen } from '../areas/areas.tipos';

// Metas reales (tabla public.metas ampliada en la migración 87). `tipos.ts` y
// `metas.estado.ts` de esta carpeta son de la maqueta anterior y no se usan aquí.
//
//   ÁREA → META → hábitos, tareas, rutinas y planes
// Un elemento pertenece como mucho a una meta; su área es la de esa meta.

export type EstadoMeta = 'activa' | 'pausada' | 'lograda' | 'archivada';
export type TipoElementoMeta = 'habito' | 'tarea' | 'rutina' | 'plan';

export type ConteosMeta = { habitos: number; tareas: number; rutinas: number; planes: number };

export type MetaVida = {
  id: string;
  titulo: string;
  descripcion: string | null;
  estado: EstadoMeta;
  iconoLucide: string | null;
  /** Ya resuelto por el servidor: el de la meta o, si no tiene, el de su área. null si no hay ninguno. */
  color: string | null;
  fechaInicio: string;
  /** Plan fijo de días; null = meta sin plazo. */
  duracionDias: number | null;
  /** Con plazo: día en curso (1..duracionDias). Sin plazo: días transcurridos. 0 si aún no empieza. */
  diaActual: number;
  /** null cuando la meta no tiene plazo. */
  diasRestantes: number | null;
  logradaEn: string | null;
  orden: number;
  /** null en metas sin área (las crea un flujo antiguo de Aby). */
  area: AreaVidaResumen | null;
  conteos: ConteosMeta;
};

export type CrearMetaInput = {
  titulo: string;
  descripcion?: string | null;
  areaId: string;
  iconoLucide?: string | null;
  color?: string | null;
  duracionDias?: number | null;
};

export type EditarMetaInput = Partial<CrearMetaInput>;

export const DURACION_META_MAXIMA_DIAS = 3650;
