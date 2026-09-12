export type EstadoPreparacionHabito = {
  arbustos: 1 | 2 | 3;
  arboles: 1 | 2 | 3;
  mensaje: 'Preparando tu hábito…' | 'Creando tu espacio…' | 'Ya casi listo…' | 'Todo está listo.';
};

export function estadoPreparacionHabito(progreso: number): EstadoPreparacionHabito {
  if (progreso >= 100) return { arbustos: 3, arboles: 3, mensaje: 'Todo está listo.' };
  if (progreso >= 65) return { arbustos: 3, arboles: 3, mensaje: 'Ya casi listo…' };
  if (progreso >= 40) return { arbustos: 2, arboles: 2, mensaje: 'Creando tu espacio…' };
  return { arbustos: 1, arboles: 1, mensaje: 'Preparando tu hábito…' };
}
