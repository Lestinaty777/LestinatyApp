import { rotarHueHex } from '../senderos/algoritmo/colorHsl';

export type CategoriaHoy = 'habitos' | 'tareas' | 'rutinas' | 'metas';

/**
 * Cuánto se gira el color del tema para cada tarjeta de categoría de Hoy, en
 * grados de tono. Hábitos usa el color del tema tal cual; las otras tres son
 * vecinas suyas en la rueda de color (paleta análoga): se ven distintas entre
 * sí pero siguen siendo "de la misma familia" que el tema elegido. Con un tema
 * rojo salen rojo, naranja, rosa y ámbar; con uno azul, azul, añil, turquesa y violeta.
 */
export const GIRO_CATEGORIA: Record<CategoriaHoy, number> = { habitos: 0, tareas: 30, rutinas: -30, metas: 60 };

/** Color base de cada tarjeta a partir del acento del tema elegido en Ajustes. */
export function tonosCategorias(acentoTema: string): Record<CategoriaHoy, string> {
  return {
    habitos: acentoTema,
    tareas: rotarHueHex(acentoTema, GIRO_CATEGORIA.tareas),
    rutinas: rotarHueHex(acentoTema, GIRO_CATEGORIA.rutinas),
    metas: rotarHueHex(acentoTema, GIRO_CATEGORIA.metas),
  };
}
