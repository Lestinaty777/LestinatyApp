export function normalizarPorcentaje(porcentaje: number) {
  return Math.min(100, Math.max(0, porcentaje));
}
