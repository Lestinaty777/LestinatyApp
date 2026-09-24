import { ajustarHueSaturacionHex, colorSeguroUi } from '../senderos/algoritmo/colorHsl';

// Nácar de la mandala por paquete: los reflejos van y vienen entre dos tonos
// vecinos del color del paquete. Un ±40° parejo no sirve para los 17: los
// dorados se irían al verde, Esmeralda no llegaría al amarillo y Abyss (casi
// gris) no tendría reflejos. Cada paquete elige hacia dónde abre su matiz
// (`haciaA`/`haciaB`, en grados) y, si su color es apagado, una saturación
// mínima para los reflejos.

type NacarPaquete = {
  /** master_pack_color del paquete (arboles_paquetes). */
  color: string;
  haciaA: number;
  haciaB: number;
  saturacionMinima?: number;
};

export const NACAR_POR_PAQUETE: Record<string, NacarPaquete> = {
  // Verdes: hacia el amarillo por un lado, el agua por el otro.
  esmeralda: { color: '#029060', haciaA: -90, haciaB: 25 },
  vida: { color: '#7CC72B', haciaA: -40, haciaB: 50 },
  // Morados: del azul al magenta.
  mathist: { color: '#B25FFB', haciaA: -40, haciaB: 40 },
  eclipse: { color: '#6A3FA0', haciaA: -45, haciaB: 35 },
  // Rosas y rojos: hacia el lila de un lado, el coral o el fuego del otro.
  sakura: { color: '#FC70AF', haciaA: -40, haciaB: 25 },
  crimsonmoon: { color: '#C81E4B', haciaA: -50, haciaB: 20 },
  ignate: { color: '#C10208', haciaA: -15, haciaB: 35 },
  // Naranjas y dorados: se quedan entre el ámbar y el limón, nunca el verde.
  amber: { color: '#F04D01', haciaA: -15, haciaB: 30 },
  golden: { color: '#FCB103', haciaA: -25, haciaB: 15 },
  aurelia: { color: '#FFD000', haciaA: -20, haciaB: 12 },
  // Aguas: del verde agua al azul.
  celesthia: { color: '#01B0CF', haciaA: -25, haciaB: 35 },
  valvery: { color: '#02A0B0', haciaA: -35, haciaB: 25 },
  // Azules: del cian al violeta.
  moon: { color: '#2F5FE0', haciaA: -30, haciaB: 45 },
  lightmoon: { color: '#0045D0', haciaA: -25, haciaB: 50 },
  diamante: { color: '#80B0E0', haciaA: -30, haciaB: 40 },
  nevalhi: { color: '#C0DFFC', haciaA: -25, haciaB: 45, saturacionMinima: 0.7 },
  // Abyss casi no tiene color: nácar de acero, entre petróleo y violeta.
  abyss: { color: '#21232F', haciaA: -40, haciaB: 50, saturacionMinima: 0.45 },
};

const NACAR_GENERICO = { haciaA: -40, haciaB: 40 };

function mismoColor(a: string, b: string) {
  return a.replace('#', '').toLowerCase() === b.replace('#', '').toLowerCase();
}

// La mandala guarda un snapshot del paquete (id y color). Los paquetes
// gratuitos "verde-N" son de la familia Esmeralda; sin id conocido se busca
// por color, y un paquete nuevo que todavía no está en la tabla usa ±40°.
function configuracionNacar(paqueteId: string | null | undefined, color: string): NacarPaquete {
  const id = paqueteId?.trim().toLowerCase();
  if (id && NACAR_POR_PAQUETE[id]) return NACAR_POR_PAQUETE[id];
  if (id?.startsWith('verde-')) return NACAR_POR_PAQUETE.esmeralda;
  const porColor = Object.values(NACAR_POR_PAQUETE).find((nacar) => mismoColor(nacar.color, color));
  return porColor ?? { color, ...NACAR_GENERICO };
}

/**
 * Tonos base (sin aclarar a pastel) del nácar de una mandala, más el color
 * del canto: la luminosidad del paquete acotada, para que los paquetes muy
 * claros (Nevalhi) no pierdan el canto contra el fondo claro del mapa.
 */
export function tonosNacarMandala(paqueteId: string | null | undefined, color: string) {
  const nacar = configuracionNacar(paqueteId, color);
  return {
    canto: colorSeguroUi(color, 0.22, 0.58),
    tonoA: ajustarHueSaturacionHex(color, nacar.haciaA, nacar.saturacionMinima),
    tonoB: ajustarHueSaturacionHex(color, nacar.haciaB, nacar.saturacionMinima),
  };
}
