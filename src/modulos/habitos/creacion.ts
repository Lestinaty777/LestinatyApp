export function validarNuevoHabito({ titulo, meta, unidad }: { titulo: string; meta: string; unidad: string }) {
  if (!titulo.trim()) return 'Escribe el nombre del hábito.';
  if (!Number.isFinite(Number(meta)) || Number(meta) <= 0) return 'La meta debe ser mayor que cero.';
  if (!unidad.trim()) return 'Indica una unidad, por ejemplo vasos o minutos.';
  return null;
}
