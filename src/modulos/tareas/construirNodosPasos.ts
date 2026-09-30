import { Check, Lock, Play } from 'lucide-react-native';

import type { NodoMapaSendero } from '../senderos/datos/mapaEjercicio.mock';
import type { SubitemTarea } from './tareas.tipos';

// Espejo de construirNodosDias.ts, pero cada nodo es un PASO (subitem) en vez
// de un DÍA: sin mandala, sin cofre real, sin nivel — solo camino + nodos
// (ver Fase 7 del plan). Secuencial, como el sendero de hábitos: el primer
// paso sin hacer es 'activo' (el único que se puede tocar), los que vienen
// después quedan 'bloqueado' — no por una restricción real del checklist
// (cualquier fila se puede marcar sola), sino para que el sendero se lea como
// un camino que se recorre en orden, no una lista suelta.
export function construirNodosPasos(subitems: SubitemTarea[]): NodoMapaSendero[] {
  const ordenados = [...subitems].sort((a, b) => a.orden - b.orden);
  const indiceActivo = ordenados.findIndex((subitem) => !subitem.hecho);

  return ordenados.map((subitem, indice) => {
    const completado = subitem.hecho;
    const esActivo = !completado && indice === indiceActivo;
    return {
      estado: completado ? 'completado' : esActivo ? 'activo' : 'bloqueado',
      icono: completado ? Check : esActivo ? Play : Lock,
      id: `paso-${subitem.id}`,
      subtitulo: `Paso ${indice + 1} de ${ordenados.length}`,
      titulo: subitem.titulo,
    };
  });
}
