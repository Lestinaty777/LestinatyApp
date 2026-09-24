import { hueYSaturacionDeHex } from '../../../../diseno/componentes/MasterChanger';

// Hue real medido del verde de cada PNG (muestreo de píxeles) — el
// candado/las bisagras son doradas (~45°) y si se deja que MasterChanger
// detecte el hue dominante automáticamente, promedia verde+dorado y sale un
// hue contaminado (~117°) que tiñe todo mal. Con el hue real fijo +
// soloPixelesVerdes, el dorado queda intacto y solo el cuerpo verde rota.
export const HUE_ORIGEN_CERRADO = 150;
export const HUE_ORIGEN_ABIERTO = 155;

// Saturación real medida del mismo verde (0-1) — sin esto, un color de
// paquete más saturado que el material de origen (la mayoría lo son) sale
// apagado: rotar el matiz solo, sin escalar la saturación, conserva la
// saturación del ORIGEN, no la del destino.
const SATURACION_ORIGEN_CERRADO = 0.856;
const SATURACION_ORIGEN_ABIERTO = 0.922;

export function calcularTinteCofre(colorPaquete: string, abierto: boolean) {
  const { hue } = hueYSaturacionDeHex(colorPaquete);
  
  // Siempre mantenemos la saturación original del asset en 1.
  // Evita que los cofres se vean grises o muertos si el paquete tiene un color pastel.
  return {
    hueDestino: hue,
    hueOrigen: abierto ? HUE_ORIGEN_ABIERTO : HUE_ORIGEN_CERRADO,
    saturacion: 1,
  };
}
