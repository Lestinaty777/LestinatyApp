import { ImageSourcePropType } from 'react-native';
import { registroIconos, buscarIcono } from '../../diseno/iconos/registroIconos';

// Los íconos de hábito viven en el registro global (src/diseno/iconos) — se
// reexportan aquí con su nombre histórico para no tener que tocar cada
// pantalla que ya los importa desde este archivo.
export { registroIconos as iconosHabitos, buscarIcono as buscarIconoHabito };
export type { IconoRegistrado as IconoHabito } from '../../diseno/iconos/registroIconos';

export type ColorHabito = {
  id: 'azul' | 'verde' | 'amarillo' | 'naranja' | 'rojo' | 'rosa' | 'morado';
  etiqueta: string;
  valor: string;
  bioma: string;
  arbol: ImageSourcePropType;
  arbusto: ImageSourcePropType;
  decoracion: ImageSourcePropType;
};

export const coloresHabitos: ColorHabito[] = [
  { id: 'azul', etiqueta: 'Azul', valor: '#3B82F6', bioma: 'Pinos nevados', arbol: require('../../../assets/ilustraciones/senderos/biomas/arboles/pino-nevado-01.png'), arbusto: require('../../../assets/ilustraciones/senderos/biomas/arboles/pino-nevado-04.png'), decoracion: require('../../../assets/ilustraciones/senderos/biomas/arboles/pino-nevado-03.png') },
  { id: 'verde', etiqueta: 'Verde', valor: '#22C55E', bioma: 'Selva viva', arbol: require('../../../assets/ilustraciones/senderos/biomas/arboles/selva-01.png'), arbusto: require('../../../assets/ilustraciones/senderos/biomas/arboles/selva-04.png'), decoracion: require('../../../assets/ilustraciones/senderos/biomas/arboles/selva-03.png') },
  { id: 'amarillo', etiqueta: 'Amarillo', valor: '#EAB308', bioma: 'Bosque dorado', arbol: require('../../../assets/ilustraciones/senderos/biomas/arboles/bosque-dorado-01.png'), arbusto: require('../../../assets/ilustraciones/senderos/biomas/arboles/bosque-dorado-04.png'), decoracion: require('../../../assets/ilustraciones/senderos/biomas/arboles/bosque-dorado-03.png') },
  { id: 'naranja', etiqueta: 'Naranja', valor: '#F97316', bioma: 'Bosque cálido', arbol: require('../../../assets/ilustraciones/senderos/biomas/arboles/bosque-calido-01.png'), arbusto: require('../../../assets/ilustraciones/senderos/biomas/arboles/bosque-calido-04.png'), decoracion: require('../../../assets/ilustraciones/senderos/biomas/arboles/bosque-calido-03.png') },
  { id: 'rojo', etiqueta: 'Rojo', valor: '#EF4444', bioma: 'Arces', arbol: require('../../../assets/ilustraciones/senderos/biomas/arboles/arce-01.png'), arbusto: require('../../../assets/ilustraciones/senderos/biomas/arboles/arce-04.png'), decoracion: require('../../../assets/ilustraciones/senderos/biomas/arboles/arce-03.png') },
  { id: 'rosa', etiqueta: 'Rosa', valor: '#EC4899', bioma: 'Cerezos', arbol: require('../../../assets/ilustraciones/senderos/biomas/arboles/cerezo-01.png'), arbusto: require('../../../assets/ilustraciones/senderos/biomas/arboles/cerezo-04.png'), decoracion: require('../../../assets/ilustraciones/senderos/biomas/arboles/cerezo-03.png') },
  { id: 'morado', etiqueta: 'Morado', valor: '#8B5CF6', bioma: 'Sauces antiguos', arbol: require('../../../assets/ilustraciones/senderos/biomas/arboles/sauce-ruinas-01.png'), arbusto: require('../../../assets/ilustraciones/senderos/biomas/arboles/sauce-ruinas-04.png'), decoracion: require('../../../assets/ilustraciones/senderos/biomas/arboles/sauce-ruinas-03.png') },
];

// Hábitos ya no elige color libre: todos son verde, y el tono se oscurece
// conforme subes de nivel (1 = más claro, 7 = más oscuro) — el color visualiza
// el progreso en vez de ser una decisión al crear el hábito. Los 6 biomas no
// verdes que existían antes (Cerezos, Arces, Sauces...) quedan como candidatos
// a skins desbloqueables más adelante, no se borran.
const BASE_VERDE_HABITOS = '#22C55E';
// 7 tonos: 1 = saturado actual, 2..7 = -5%,-10%,-15%,-20%,-25%,-30%.
export const FACTORES_TONO = [1, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7];
export const NIVEL_MAXIMO_TONO = FACTORES_TONO.length;

function acotarTono(tono: number) {
  return Math.min(NIVEL_MAXIMO_TONO, Math.max(1, Math.round(tono)));
}

export function factorTono(tono: number): number {
  return FACTORES_TONO[acotarTono(tono) - 1];
}

export function tonoVerdeNivel(nivel: number): string {
  const factor = factorTono(nivel);
  const hex = BASE_VERDE_HABITOS.replace('#', '');
  const canal = (inicio: number) => Math.round(parseInt(hex.slice(inicio, inicio + 2), 16) * factor).toString(16).padStart(2, '0');
  return `#${canal(0)}${canal(2)}${canal(4)}`;
}

// Bioma Selva por tono: para árbol principal, árbol secundario, base y flor ya
// existe arte real por tono (carpeta assets/.../arboles/selva/, nombrado
// "rol.tipo" — el tipo ES el tono). El tono 1 de los árboles reusa el asset
// plano viejo (selva-01/02.png), porque ese ya era el diseño "base saturado" y
// nunca se generó un "1.01"/"1.02" para ese rol. Arbustos no tienen arte por
// tono todavía — se oscurecen en vivo con MasterChanger (ver ARBUSTO_SELVA_BASE).
const ARBOL_PRINCIPAL_POR_TONO: Record<number, ImageSourcePropType> = {
  1: require('../../../assets/ilustraciones/senderos/biomas/arboles/selva-01.png'),
  2: require('../../../assets/ilustraciones/senderos/biomas/arboles/selva/selva-1.02.png'),
  3: require('../../../assets/ilustraciones/senderos/biomas/arboles/selva/selva-1.03.png'),
  4: require('../../../assets/ilustraciones/senderos/biomas/arboles/selva/selva-1.04.png'),
  5: require('../../../assets/ilustraciones/senderos/biomas/arboles/selva/selva-1.05.png'),
  6: require('../../../assets/ilustraciones/senderos/biomas/arboles/selva/selva-1.06.png'),
  7: require('../../../assets/ilustraciones/senderos/biomas/arboles/selva/selva-1.07.png'),
};

const ARBOL_SECUNDARIO_POR_TONO: Record<number, ImageSourcePropType> = {
  1: require('../../../assets/ilustraciones/senderos/biomas/arboles/selva-02.png'),
  2: require('../../../assets/ilustraciones/senderos/biomas/arboles/selva/selva-2.02.png'),
  3: require('../../../assets/ilustraciones/senderos/biomas/arboles/selva/selva-2.03.png'),
  4: require('../../../assets/ilustraciones/senderos/biomas/arboles/selva/selva-2.04.png'),
  5: require('../../../assets/ilustraciones/senderos/biomas/arboles/selva/selva-2.05.png'),
  6: require('../../../assets/ilustraciones/senderos/biomas/arboles/selva/selva-2.06.png'),
  7: require('../../../assets/ilustraciones/senderos/biomas/arboles/selva/selva-2.07.png'),
};

const BASE_POR_TONO: Record<number, ImageSourcePropType> = {
  1: require('../../../assets/ilustraciones/senderos/biomas/arboles/selva/selva-3.01.png'),
  2: require('../../../assets/ilustraciones/senderos/biomas/arboles/selva/selva-3.02.png'),
  3: require('../../../assets/ilustraciones/senderos/biomas/arboles/selva/selva-3.03.png'),
  4: require('../../../assets/ilustraciones/senderos/biomas/arboles/selva/selva-3.04.png'),
  5: require('../../../assets/ilustraciones/senderos/biomas/arboles/selva/selva-3.05.png'),
  6: require('../../../assets/ilustraciones/senderos/biomas/arboles/selva/selva-3.06.png'),
  7: require('../../../assets/ilustraciones/senderos/biomas/arboles/selva/selva-3.07.png'),
};

const FLOR_POR_TONO: Record<number, ImageSourcePropType> = {
  1: require('../../../assets/ilustraciones/senderos/biomas/arboles/selva/selva-7.01.png'),
  2: require('../../../assets/ilustraciones/senderos/biomas/arboles/selva/selva-7.02.png'),
  3: require('../../../assets/ilustraciones/senderos/biomas/arboles/selva/selva-7.03.png'),
  4: require('../../../assets/ilustraciones/senderos/biomas/arboles/selva/selva-7.04.png'),
  5: require('../../../assets/ilustraciones/senderos/biomas/arboles/selva/selva-7.05.png'),
  6: require('../../../assets/ilustraciones/senderos/biomas/arboles/selva/selva-7.06.png'),
  7: require('../../../assets/ilustraciones/senderos/biomas/arboles/selva/selva-7.07.png'),
};

// Arbustos: un solo asset, sin variantes por tono todavía — se oscurece en
// vivo con <MasterChanger fuente={ARBUSTO_SELVA_BASE} colorDestino={2} oscurecido={factorTono(tono)} />.
export const ARBUSTO_SELVA_BASE: ImageSourcePropType = require('../../../assets/ilustraciones/senderos/biomas/arboles/selva-04.png');

export type AssetsSelvaTono = {
  arbolPrincipal: ImageSourcePropType;
  arbolSecundario: ImageSourcePropType;
  base: ImageSourcePropType;
  flor: ImageSourcePropType;
};

export function obtenerAssetsSelvaPorTono(tono: number): AssetsSelvaTono {
  const t = acotarTono(tono);
  return {
    arbolPrincipal: ARBOL_PRINCIPAL_POR_TONO[t],
    arbolSecundario: ARBOL_SECUNDARIO_POR_TONO[t],
    base: BASE_POR_TONO[t],
    flor: FLOR_POR_TONO[t],
  };
}
