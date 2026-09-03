import { colorEnvioCategoriaAby, type CategoriaAbyId } from '../datos/categoriasAby';

function conAlpha(hex: string, alpha: number) {
  const valor = hex.replace('#', '');
  const rojo = Number.parseInt(valor.slice(0, 2), 16);
  const verde = Number.parseInt(valor.slice(2, 4), 16);
  const azul = Number.parseInt(valor.slice(4, 6), 16);
  return `rgba(${rojo}, ${verde}, ${azul}, ${alpha})`;
}

export function obtenerEstiloTurnoAby(categoria: CategoriaAbyId | null) {
  const acento = colorEnvioCategoriaAby(categoria);
  return { acento, borde: conAlpha(acento, 0.3), pastel: conAlpha(acento, 0.14) };
}
