/** "L M X" a partir de isodow (1=lunes..7=domingo); null o los 7 días = todos. */
export function diasAbreviados(dias: readonly number[] | null, etiqueta: (dia: number) => string): string | null {
  if (!dias || dias.length === 0 || dias.length === 7) return null;
  return [...dias].sort((a, b) => a - b).map(etiqueta).join(' ');
}

/** Tope de entradas numéricas del wizard: acepta "10", "10,5" y "10.5"; null si no es un número > 0. */
export function leerObjetivo(texto: string): number | null {
  const numero = Number(texto.trim().replace(',', '.'));
  return Number.isFinite(numero) && numero > 0 && numero <= 9999 ? numero : null;
}
