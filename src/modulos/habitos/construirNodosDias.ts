import { Check, Lock, Play } from 'lucide-react-native';
import type { EstadoNodoMapa, InfoCofre, NodoMapaSendero, TipoNodoMapa } from '../senderos/datos/mapaEjercicio.mock';
import { diasAcumuladosAntesDeNivel } from './diasNivel';
import { RECOMPENSA_COFRE_FINAL } from './senderoNiveles';
import type { InfoMandalaNodo } from './mandalaNodo.tipos';

// Cada nodo de acción ES un día real hacia el próximo nivel — no una lección falsa ni
// un nivel completo. "Acumulado, no se resetea" (migración 21): un día
// perdido no vuelve a bloquear los nodos ya cumplidos.
// La numeración del título es continua entre niveles (Día 1..3 en nivel 1,
// Día 4..10 en nivel 2, ...) — diaInicial trae el total ya acumulado en
// niveles previos, así el primer nodo del nivel nuevo sigue el conteo.
//
// Los cofres son nodos de recompensa independientes del flujo de acción de los días:
// aparecen intercalados cada 3 días (intermedios: 8-15 gemas) y al final del nivel
// (final: recompensa del wizard, ver RECOMPENSA_COFRE_FINAL).
//
// Nivel 7 es maestría infinita: `ciclo` distingue una vuelta de otra sobre el
// mismo recorrido de 42 días. `soloLectura` es un nivel pasado o un ciclo
// histórico — se puede consultar pero no avanzar, así que ningún nodo llega a
// 'activo'. `puedeAvanzarHoy` gatilla el único nodo 'activo' real: el día
// siguiente al último completado, solo cuando hoy es día programado y el
// nivel/ciclo mostrado es el vigente.
type OpcionesNodos = { ciclo?: number; puedeAvanzarHoy?: boolean; soloLectura?: boolean };

export function construirNodosDias(
  diasCompletados: number,
  diasRequeridos: number,
  nivel: number,
  cofresReclamados: Map<number, number> = new Map(),
  opciones: OpcionesNodos = {},
  // Mandalas ya existentes de ESTE hábito, indexadas por día-en-nivel del
  // ciclo que se está construyendo — el caller filtra por nivel/ciclo antes
  // de pasar el mapa (ver useSenderoHabito.ts).
  mandalasPorDia: Map<number, InfoMandalaNodo> = new Map(),
): NodoMapaSendero[] {
  const { ciclo = 1, puedeAvanzarHoy = true, soloLectura = false } = opciones;
  const diaInicial = diasAcumuladosAntesDeNivel(nivel, ciclo);
  const gemasFinal = RECOMPENSA_COFRE_FINAL[nivel as keyof typeof RECOMPENSA_COFRE_FINAL] ?? 5 * (nivel + 1);

  const nodos: NodoMapaSendero[] = [];

  for (let diaEnNivel = 1; diaEnNivel <= diasRequeridos; diaEnNivel++) {
    const diaGlobal = diaInicial + diaEnNivel;
    const completado = diaEnNivel <= diasCompletados;
    const esProximoDia = diaEnNivel === diasCompletados + 1;
    const esActivo = !soloLectura && puedeAvanzarHoy && esProximoDia;

    let tipoNodo: TipoNodoMapa = 'dia';
    let mandala: InfoMandalaNodo | undefined;

    if (completado && mandalasPorDia.has(diaEnNivel)) {
      tipoNodo = 'orbe_mandala';
      mandala = mandalasPorDia.get(diaEnNivel);
    }

    nodos.push({
      estado: completado ? 'completado' : esActivo ? 'activo' : (esProximoDia && !soloLectura) ? 'esperando' : 'bloqueado',
      icono: completado ? Check : esActivo ? Play : Lock,
      id: `dia-${diaGlobal}`,
      mandala,
      subtitulo: `Nivel ${nivel} · día ${diaEnNivel} de ${diasRequeridos}`,
      tipoNodo,
      titulo: `Día ${diaGlobal}`,
    });

    // Cofre intermedio cada 3 días (siempre que no sea el último día del nivel)
    if (diaEnNivel % 3 === 0 && diaEnNivel < diasRequeridos) {
      const cofreCompletado = diasCompletados >= diaEnNivel;
      const yaReclamado = cofresReclamados.has(diaEnNivel);
      const estadoCofre = yaReclamado ? 'reclamado' : cofreCompletado ? 'disponible' : 'bloqueado';
      const estadoNodoCofre: EstadoNodoMapa = !cofreCompletado
        ? 'bloqueado'
        : yaReclamado || diasCompletados > diaEnNivel || soloLectura
          ? 'completado'
          : 'activo';

      nodos.push({
        cofre: {
          ciclo,
          estadoCofre,
          gemasMax: 15,
          gemasMin: 8,
          gemasReclamadas: cofresReclamados.get(diaEnNivel),
          nodoDia: diaEnNivel,
          tipo: 'intermedio',
        },
        estado: estadoNodoCofre,
        icono: yaReclamado ? Check : cofreCompletado ? Play : Lock,
        id: `cofre-intermedio-${diaGlobal}`,
        subtitulo: `Cofre Día ${diaGlobal}`,
        tipoNodo: 'cofre_intermedio',
        titulo: `Cofre Día ${diaGlobal}`,
      });
    }
  }

  // Cofre final al terminar todos los días del nivel. A diferencia del
  // intermedio, este NUNCA se "abre" con un toque: registrar_progreso_habito
  // ya lo acredita solo, en la misma transacción que cierra el último día
  // (ver migración 46 — el RPC reclamar_cofre_sendero rechaza a propósito
  // cualquier tipo != 'intermedio'). Marcarlo 'disponible' mientras la
  // consulta de cofres reclamados no había refrescado dejaba un botón que,
  // al tocarlo, disparaba esa llamada rechazada ("Could not open the
  // chest") — por eso acá solo hay bloqueado o ya acreditado, nunca un
  // estado intermedio que invite a tocarlo.
  const cofreFinalCompletado = diasCompletados >= diasRequeridos;
  const estadoCofreFinal = cofreFinalCompletado ? 'reclamado' : 'bloqueado';
  const estadoNodoFinal: EstadoNodoMapa = cofreFinalCompletado ? 'completado' : 'bloqueado';

  nodos.push({
    cofre: {
      ciclo,
      estadoCofre: estadoCofreFinal,
      gemasMax: gemasFinal,
      gemasMin: gemasFinal,
      gemasReclamadas: cofresReclamados.get(diasRequeridos) ?? (cofreFinalCompletado ? gemasFinal : undefined),
      nodoDia: diasRequeridos,
      tipo: 'final',
    },
    estado: estadoNodoFinal,
    icono: cofreFinalCompletado ? Check : Lock,
    id: `cofre-final-nivel-${nivel}-ciclo-${ciclo}`,
    subtitulo: `Cofre Nivel ${nivel}`,
    tipoNodo: 'cofre_final',
    titulo: 'Cofre Final',
  });

  return nodos;
}

