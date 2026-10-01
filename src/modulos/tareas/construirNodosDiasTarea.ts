import { Check, Lock, Play } from 'lucide-react-native';
import type { EstadoNodoMapa, NodoMapaSendero, TipoNodoMapa } from '../senderos/datos/mapaEjercicio.mock';
import { RECOMPENSA_COFRE_FINAL } from '../habitos/senderoNiveles';
import type { FiguraTareaNodo } from './tareas.tipos';

// Espejo simplificado de construirNodosDias.ts (hábitos) para el sendero de
// días de una tarea recurrente (Fase 8). Simplificaciones deliberadas, mismo
// criterio que ya se aceptó para tareas check-only en la Fase 1 (sin tabla de
// planes versionada): no hay cofre intermedio cada 3 días (solo el final, que
// registrar_progreso_tarea ya acredita solo) ni "nivel histórico de solo
// lectura" — el sendero de una tarea siempre muestra su nivel ACTUAL.
type OpcionesNodosTarea = {
  /** Ciclo de maestría del nivel 7 (siempre 1 en niveles 1-6). */
  ciclo?: number;
  /** Hoy es día programado y el día siguiente aún no está completado. */
  puedeAvanzarHoy?: boolean;
};

export function construirNodosDiasTarea(
  diasCompletados: number,
  diasRequeridos: number,
  nivel: number,
  opciones: OpcionesNodosTarea = {},
  // Figuras ya creadas de ESTA tarea, indexadas por día-en-nivel del ciclo
  // vigente — el caller (useSenderoDiaTarea) filtra por nivel/ciclo antes de
  // pasar el mapa, igual que mapaMandalasPorDia en useSenderoHabito.
  figurasPorDia: Map<number, FiguraTareaNodo> = new Map(),
): NodoMapaSendero[] {
  const { ciclo = 1, puedeAvanzarHoy = true } = opciones;
  const gemasFinal = RECOMPENSA_COFRE_FINAL[nivel as keyof typeof RECOMPENSA_COFRE_FINAL] ?? 5 * (nivel + 1);

  const nodos: NodoMapaSendero[] = [];

  for (let diaEnNivel = 1; diaEnNivel <= diasRequeridos; diaEnNivel++) {
    const completado = diaEnNivel <= diasCompletados;
    const esProximoDia = diaEnNivel === diasCompletados + 1;
    const esActivo = puedeAvanzarHoy && esProximoDia;

    let tipoNodo: TipoNodoMapa = 'dia';
    let figura: FiguraTareaNodo | undefined;

    if (completado && figurasPorDia.has(diaEnNivel)) {
      tipoNodo = 'orbe_figura';
      figura = figurasPorDia.get(diaEnNivel);
    }

    nodos.push({
      estado: completado ? 'completado' : esActivo ? 'activo' : esProximoDia ? 'esperando' : 'bloqueado',
      figura,
      icono: completado ? Check : esActivo ? Play : Lock,
      id: `dia-tarea-${diaEnNivel}`,
      subtitulo: `Nivel ${nivel} · día ${diaEnNivel} de ${diasRequeridos}`,
      tipoNodo,
      titulo: `Día ${diaEnNivel}`,
    });
  }

  // Cofre final al terminar el nivel — nunca "disponible": registrar_progreso_tarea
  // ya lo acredita solo en la misma transacción que cierra el último día
  // (mismo criterio que el cofre final de hábitos, ver construirNodosDias.ts).
  const cofreFinalCompletado = diasCompletados >= diasRequeridos;
  const estadoCofreFinal = cofreFinalCompletado ? 'reclamado' : 'bloqueado';
  const estadoNodoFinal: EstadoNodoMapa = cofreFinalCompletado ? 'completado' : 'bloqueado';

  nodos.push({
    cofre: {
      ciclo,
      estadoCofre: estadoCofreFinal,
      gemasMax: gemasFinal,
      gemasMin: gemasFinal,
      gemasReclamadas: cofreFinalCompletado ? gemasFinal : undefined,
      nodoDia: diasRequeridos,
      tipo: 'final',
    },
    estado: estadoNodoFinal,
    icono: cofreFinalCompletado ? Check : Lock,
    id: `cofre-final-tarea-nivel-${nivel}-ciclo-${ciclo}`,
    subtitulo: `Cofre Nivel ${nivel}`,
    tipoNodo: 'cofre_final',
    titulo: 'Cofre Final',
  });

  return nodos;
}
