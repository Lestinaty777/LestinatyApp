// Áreas de vida (migración 87). Las del sistema no tienen dueño y se
// reconocen por su `codigo`; las propias las crea cada persona.

export const CODIGOS_AREA_SISTEMA = ['cuerpo', 'mente', 'espiritual', 'estudios', 'trabajo', 'negocios_proyectos', 'finanzas'] as const;
export type CodigoAreaSistema = (typeof CODIGOS_AREA_SISTEMA)[number];

export type AreaVida = {
  id: string;
  /** Solo en áreas del sistema: clave estable para traducir el nombre. */
  codigo: string | null;
  /** Nombre guardado. En áreas del sistema es el nombre en español; para mostrar, usar nombreArea(). */
  nombre: string;
  color: string;
  iconoLucide: string;
  orden: number;
  esDelSistema: boolean;
};

/** Lo mínimo de un área que viaja dentro de una meta. */
export type AreaVidaResumen = Pick<AreaVida, 'id' | 'codigo' | 'nombre' | 'color' | 'iconoLucide'>;

export type CrearAreaInput = { nombre: string; color: string; iconoLucide: string };

/**
 * Paleta fija para áreas propias, distinta de los siete colores del sistema.
 * Sin verdes a propósito: en esta app todo verde de la interfaz pertenece al
 * tema (regla de verdesEsmeralda.test.ts); el verde de "Espiritual" llega como
 * dato desde la base, no como literal del código.
 */
export const COLORES_AREA_PROPIA = ['#06B6D4', '#0891B2', '#0EA5E9', '#6366F1', '#A855F7', '#F43F5E', '#E11D48', '#D97706', '#B45309', '#64748B'] as const;
export const MAX_AREAS_PROPIAS = 20;
