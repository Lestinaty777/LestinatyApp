import { obtenerTonoPaquete, type TonoMaster } from '../../diseno/tema/masterColor';
import { resolverPaqueteHabito } from './paqueteHabito';

/**
 * Tono de color del paquete de un hábito: cada hábito conserva el de SU paquete
 * sin importar el tema global de la app. Si el paquete no trae master_pack_color
 * (legado, o un paquete sin fila en arboles_paquetes) cae a Esmeralda — no se
 * usa el `color` guardado del hábito porque puede seguir siendo el verde por
 * defecto si la semilla se asignó después de crearlo.
 */
export function tonoDelPaquete(paqueteId?: string | null, colorPaquete?: string | null): TonoMaster {
  return obtenerTonoPaquete(resolverPaqueteHabito(paqueteId), colorPaquete ?? '');
}
