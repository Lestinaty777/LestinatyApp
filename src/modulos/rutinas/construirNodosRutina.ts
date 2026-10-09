import type { PasoRutina } from './rutinas.tipos';

// La rutina como camino: un nodo por paso y un destino al final. Espejo de
// construirNodosPasos (Tareas), con las reglas de Rutinas: los pasos que no
// aplican hoy no aparecen y el destino se alcanza con los esenciales.

export type EstadoNodoRutina = 'completado' | 'activo' | 'bloqueado';

export type NodoRutina = {
  id: string;
  titulo: string;
  estado: EstadoNodoRutina;
  esencial: boolean;
  /** true solo en el último nodo: la meta de la sesión, no un paso. */
  esDestino: boolean;
  /** Posición 1..n entre los pasos (0 en el destino). */
  numero: number;
};

export const ID_DESTINO_RUTINA = 'destino';

export function construirNodosRutina(pasos: readonly PasoRutina[], tituloDestino: string): NodoRutina[] {
  const aplican = [...pasos].filter((paso) => paso.aplica).sort((a, b) => a.orden - b.orden);
  if (aplican.length === 0) return [];
  const indiceActivo = aplican.findIndex((paso) => !paso.completo);

  const nodos: NodoRutina[] = aplican.map((paso, indice) => ({
    id: paso.id,
    titulo: paso.titulo,
    estado: paso.completo ? 'completado' : indice === indiceActivo ? 'activo' : 'bloqueado',
    esencial: paso.esencial,
    esDestino: false,
    numero: indice + 1,
  }));

  // Misma regla que cerrar_rutina_dia: cuentan los esenciales; si ninguno aplica hoy, todos los que aplican.
  const esenciales = aplican.filter((paso) => paso.esencial);
  const requeridos = esenciales.length > 0 ? esenciales : aplican;
  nodos.push({
    id: ID_DESTINO_RUTINA,
    titulo: tituloDestino,
    estado: requeridos.every((paso) => paso.completo) ? 'completado' : 'bloqueado',
    esencial: true,
    esDestino: true,
    numero: 0,
  });
  return nodos;
}
