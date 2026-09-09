export function resolverIndiceTab({ value, defaultValue = 0, interno, cantidad }: { value?: number; defaultValue?: number; interno: number; cantidad: number }) {
  const candidato = value ?? interno ?? defaultValue;
  return Math.min(Math.max(candidato, 0), Math.max(cantidad - 1, 0));
}
