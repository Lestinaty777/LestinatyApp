import { Check, Lock, Play } from 'lucide-react-native';

import type { NodoMapaSendero } from '../senderos/datos/mapaEjercicio.mock';
import type { PlanDia } from './planes.tipos';

function diaCompleto(dia: PlanDia): boolean {
  const items = dia.bloques.flatMap((bloque) => bloque.items);
  return items.length > 0 && items.every((item) => item.hecho);
}

// Un nodo por DÍA (no por bloque ni por ítem): una sección puede tener
// varios bloques con varios ítems cada uno — mapear cada ítem a un nodo
// dejaría senderos de decenas de paradas. El día ya es una unidad visual
// razonable, mismo criterio de bloqueo secuencial que construirNodosPasos.ts
// (el primer día sin terminar es el único 'activo', el resto 'bloqueado').
export function construirNodosPlan(dias: PlanDia[]): NodoMapaSendero[] {
  const ordenados = [...dias].sort((a, b) => a.orden - b.orden);
  const indiceActivo = ordenados.findIndex((dia) => !diaCompleto(dia));

  return ordenados.map((dia, indice) => {
    const completado = diaCompleto(dia);
    const esActivo = !completado && indice === indiceActivo;
    const totalItems = dia.bloques.reduce((total, bloque) => total + bloque.items.length, 0);
    return {
      estado: completado ? 'completado' : esActivo ? 'activo' : 'bloqueado',
      icono: completado ? Check : esActivo ? Play : Lock,
      id: `dia-${dia.id}`,
      subtitulo: `${totalItems} ${totalItems === 1 ? 'ítem' : 'ítems'}`,
      titulo: dia.titulo ?? `Día ${indice + 1}`,
    };
  });
}
