import { Check, Lock, Play } from 'lucide-react-native';
import type { InfoCofre, NodoMapaSendero, TipoNodoMapa } from '../senderos/datos/mapaEjercicio.mock';
import { diasAcumuladosAntesDeNivel } from './diasNivel';
import { RECOMPENSA_COFRE_FINAL } from './senderoNiveles';

// Cada nodo ES un día real hacia el próximo nivel — no una lección falsa ni
// un nivel completo. "Acumulado, no se resetea" (migración 21): un día
// perdido no vuelve a bloquear los nodos ya cumplidos.
// La numeración del título es continua entre niveles (Día 1..3 en nivel 1,
// Día 4..10 en nivel 2, ...) — diaInicial trae el total ya acumulado en
// niveles previos, así el primer nodo del nivel nuevo sigue el conteo.
//
// Los cofres aparecen cada 3 días (intermedios: 8-15 gemas) y al final del nivel
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
): NodoMapaSendero[] {
  const { ciclo = 1, puedeAvanzarHoy = true, soloLectura = false } = opciones;
  const diaInicial = diasAcumuladosAntesDeNivel(nivel, ciclo);
  const gemasFinal = RECOMPENSA_COFRE_FINAL[nivel as keyof typeof RECOMPENSA_COFRE_FINAL] ?? 5 * (nivel + 1);

  return Array.from({ length: diasRequeridos }, (_, indice) => {
    const diaEnNivel = indice + 1;
    const diaGlobal = diaInicial + diaEnNivel;
    const esFinal = diaEnNivel === diasRequeridos;
    const esCofreIntermedio = !esFinal && diaEnNivel % 3 === 0;
    const completado = diaEnNivel <= diasCompletados;
    const esProximoDia = diaEnNivel === diasCompletados + 1;
    const esActivo = !soloLectura && puedeAvanzarHoy && esProximoDia;

    let tipoNodo: TipoNodoMapa = 'dia';
    let cofre: InfoCofre | undefined;

    if (esFinal) {
      tipoNodo = 'cofre_final';
      const yaReclamado = cofresReclamados.has(diaEnNivel);
      cofre = {
        ciclo,
        estadoCofre: yaReclamado ? 'reclamado' : completado ? 'disponible' : 'bloqueado',
        gemasMax: gemasFinal,
        gemasMin: gemasFinal,
        gemasReclamadas: cofresReclamados.get(diaEnNivel),
        nodoDia: diaEnNivel,
        tipo: 'final',
      };
    } else if (esCofreIntermedio) {
      tipoNodo = 'cofre_intermedio';
      const yaReclamado = cofresReclamados.has(diaEnNivel);
      cofre = {
        ciclo,
        estadoCofre: yaReclamado ? 'reclamado' : completado ? 'disponible' : 'bloqueado',
        gemasMax: 15,
        gemasMin: 8,
        gemasReclamadas: cofresReclamados.get(diaEnNivel),
        nodoDia: diaEnNivel,
        tipo: 'intermedio',
      };
    }

    return {
      cofre,
      estado: completado ? 'completado' : esActivo ? 'activo' : 'bloqueado',
      icono: completado ? Check : esActivo ? Play : Lock,
      id: `dia-${diaGlobal}`,
      subtitulo: tipoNodo !== 'dia' ? (esFinal ? `Cofre Nivel ${nivel}` : `Cofre Día ${diaGlobal}`) : `Nivel ${nivel} · día ${diaEnNivel} de ${diasRequeridos}`,
      tipoNodo,
      titulo: tipoNodo !== 'dia' ? (esFinal ? 'Cofre Final' : `Cofre Día ${diaGlobal}`) : `Día ${diaGlobal}`,
    };
  });
}
