// Cada nivel de un hábito tiene su propio "mapa": una cantidad fija de nodos,
// donde cada nodo representa un día de constancia que el usuario debe
// completar para avanzar al siguiente nivel. Esta definición es la fuente de
// verdad del DISEÑO del mapa (cuántos nodos dibujar, cómo se llama el nivel);
// la cantidad de días que el backend realmente exige para subir de nivel vive
// aparte (ver DIAS_REQUERIDOS_POR_NIVEL en iconosHabitos.ts) y debe mantenerse
// alineada con `cantidadNodos` para que el mapa no muestre más o menos días de
// los que el progreso real puede completar.
export type DefinicionMapaNivel = {
  /** Nivel del hábito al que pertenece este mapa (1-7). */
  nivel: number;
  /** Cantidad de nodos del mapa — un nodo por cada día de constancia requerido. */
  cantidadNodos: number;
  /** Nombre corto del nivel, mostrado en la UI (insignias, encabezados). */
  titulo: string;
  /** Frase breve y motivadora asociada a este tramo del progreso. */
  lema: string;
};
