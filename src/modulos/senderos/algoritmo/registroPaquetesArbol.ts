import type { ImageSourcePropType } from 'react-native';

// Registro de assets por paquete de árbol (Albedo, Strelizia, Morax...) — la
// mitad "código" de cargar un paquete nuevo. La otra mitad es la fila en
// arboles_paquetes (nombre, master_pack_color, rareza, precio_gemas,
// cantidad_por_compra), que se carga por SQL directo, no desde acá.
//
// React Native/Metro exige que cada `require(...)` tenga una ruta literal —
// no se puede armar dinámicamente a partir de un id ni leer una carpeta en
// tiempo de ejecución. Por eso cada paquete nuevo necesita SU PROPIO bloque
// acá, no hay forma de evitarlo del todo, pero es copiar-pegar-cambiar-id.
//
// Para cargar un paquete nuevo:
// 1. Poné las 10 imágenes en
//    assets/ilustraciones/senderos/biomas/paquetes/<id>/
//    (etapa1.png .. etapa7.png, arbusto.png, flor.png, semilla.png).
// 2. Copiá el bloque de ejemplo de abajo, cambiá el id y agregalo a
//    PAQUETES_ARBOL.
// 3. Pedime que inserte la fila en arboles_paquetes con esos mismos datos
//    (nombre, master_pack_color, rareza, precio_gemas, cantidad_por_compra).
//
// El algoritmo de mezcla de etapas (Fase 4 del plan) todavía no lee este
// registro — hoy solo existen los 7 paquetes "verde-N" gratuitos, que siguen
// usando el sistema viejo (iconosHabitos.ts) hasta que ese paquete también se
// migre a este formato de 7 etapas reales.

export type EtapasArbol = [
  ImageSourcePropType, ImageSourcePropType, ImageSourcePropType, ImageSourcePropType,
  ImageSourcePropType, ImageSourcePropType, ImageSourcePropType,
];

export type PaqueteAssetsArbol = {
  etapas: EtapasArbol;
  arbusto: ImageSourcePropType;
  flor: ImageSourcePropType;
  semilla: ImageSourcePropType;
};

// Ejemplo — descomentar y ajustar cuando exista el paquete "albedo" de verdad:
//
// const albedo: PaqueteAssetsArbol = {
//   etapas: [
//     require('../../../../assets/ilustraciones/senderos/biomas/paquetes/albedo/etapa1.png'),
//     require('../../../../assets/ilustraciones/senderos/biomas/paquetes/albedo/etapa2.png'),
//     require('../../../../assets/ilustraciones/senderos/biomas/paquetes/albedo/etapa3.png'),
//     require('../../../../assets/ilustraciones/senderos/biomas/paquetes/albedo/etapa4.png'),
//     require('../../../../assets/ilustraciones/senderos/biomas/paquetes/albedo/etapa5.png'),
//     require('../../../../assets/ilustraciones/senderos/biomas/paquetes/albedo/etapa6.png'),
//     require('../../../../assets/ilustraciones/senderos/biomas/paquetes/albedo/etapa7.png'),
//   ],
//   arbusto: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/albedo/arbusto.png'),
//   flor: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/albedo/flor.png'),
//   semilla: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/albedo/semilla.png'),
// };

const aurelia: PaqueteAssetsArbol = {
  etapas: [
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/aurelia/etapa1.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/aurelia/etapa2.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/aurelia/etapa3.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/aurelia/etapa4.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/aurelia/etapa5.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/aurelia/etapa6.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/aurelia/etapa7.png'),
  ],
  arbusto: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/aurelia/arbusto.png'),
  flor: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/aurelia/flor.png'),
  semilla: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/aurelia/semilla.png'),
};

const diamante: PaqueteAssetsArbol = {
  etapas: [
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/diamante/etapa1.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/diamante/etapa2.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/diamante/etapa3.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/diamante/etapa4.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/diamante/etapa5.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/diamante/etapa6.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/diamante/etapa7.png'),
  ],
  arbusto: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/diamante/arbusto.png'),
  flor: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/diamante/flor.png'),
  semilla: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/diamante/semilla.png'),
};

const abyss: PaqueteAssetsArbol = {
  etapas: [
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Abyss/etapa1.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Abyss/etapa2.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Abyss/etapa3.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Abyss/etapa4.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Abyss/etapa5.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Abyss/etapa6.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Abyss/etapa7.png'),
  ],
  arbusto: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Abyss/arbusto.png'),
  flor: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Abyss/flor.png'),
  semilla: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Abyss/semilla.png'),
};

const amber: PaqueteAssetsArbol = {
  etapas: [
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Amber/etapa1.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Amber/etapa2.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Amber/etapa3.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Amber/etapa4.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Amber/etapa5.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Amber/etapa6.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Amber/etapa7.png'),
  ],
  arbusto: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Amber/arbusto.png'),
  flor: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Amber/flor.png'),
  semilla: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Amber/semilla.png'),
};

const celesthia: PaqueteAssetsArbol = {
  etapas: [
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Celesthia/etapa1.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Celesthia/etapa2.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Celesthia/etapa3.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Celesthia/etapa4.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Celesthia/etapa5.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Celesthia/etapa6.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Celesthia/etapa7.png'),
  ],
  arbusto: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Celesthia/arbusto.png'),
  flor: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Celesthia/flor.png'),
  semilla: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Celesthia/semilla.png'),
};

const esmeralda: PaqueteAssetsArbol = {
  etapas: [
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Esmeralda/etapa1.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Esmeralda/etapa2.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Esmeralda/etapa3.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Esmeralda/etapa4.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Esmeralda/etapa5.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Esmeralda/etapa6.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Esmeralda/etapa7.png'),
  ],
  arbusto: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Esmeralda/arbusto.png'),
  flor: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Esmeralda/flor.png'),
  semilla: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Esmeralda/semilla.png'),
};

const golden: PaqueteAssetsArbol = {
  etapas: [
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Golden/etapa1.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Golden/etapa2.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Golden/etapa3.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Golden/etapa4.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Golden/etapa5.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Golden/etapa6.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Golden/etapa7.png'),
  ],
  arbusto: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Golden/arbusto.png'),
  flor: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Golden/flor.png'),
  semilla: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Golden/semilla.png'),
};

const ignate: PaqueteAssetsArbol = {
  etapas: [
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Ignate/etapa1.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Ignate/etapa2.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Ignate/etapa3.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Ignate/etapa4.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Ignate/etapa5.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Ignate/etapa6.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Ignate/etapa7.png'),
  ],
  arbusto: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Ignate/arbusto.png'),
  flor: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Ignate/flor.png'),
  semilla: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Ignate/semilla.png'),
};

const lightmoon: PaqueteAssetsArbol = {
  etapas: [
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/LightMoon/etapa1.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/LightMoon/etapa2.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/LightMoon/etapa3.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/LightMoon/etapa4.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/LightMoon/etapa5.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/LightMoon/etapa6.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/LightMoon/etapa7.png'),
  ],
  arbusto: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/LightMoon/arbusto.png'),
  flor: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/LightMoon/flor.png'),
  semilla: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/LightMoon/semilla.png'),
};

const mathist: PaqueteAssetsArbol = {
  etapas: [
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Mathist/etapa1.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Mathist/etapa2.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Mathist/etapa3.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Mathist/etapa4.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Mathist/etapa5.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Mathist/etapa6.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Mathist/etapa7.png'),
  ],
  arbusto: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Mathist/arbusto.png'),
  flor: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Mathist/flor.png'),
  semilla: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Mathist/semilla.png'),
};

const nevalhi: PaqueteAssetsArbol = {
  etapas: [
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Nevalhi/etapa1.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Nevalhi/etapa2.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Nevalhi/etapa3.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Nevalhi/etapa4.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Nevalhi/etapa5.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Nevalhi/etapa6.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Nevalhi/etapa7.png'),
  ],
  arbusto: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Nevalhi/arbusto.png'),
  flor: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Nevalhi/flor.png'),
  semilla: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Nevalhi/semilla.png'),
};

const sakura: PaqueteAssetsArbol = {
  etapas: [
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Sakura/etapa1.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Sakura/etapa2.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Sakura/etapa3.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Sakura/etapa4.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Sakura/etapa5.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Sakura/etapa6.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Sakura/etapa7.png'),
  ],
  arbusto: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Sakura/arbusto.png'),
  flor: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Sakura/flor.png'),
  semilla: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Sakura/semilla.png'),
};

const valvery: PaqueteAssetsArbol = {
  etapas: [
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Valvery/etapa1.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Valvery/etapa2.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Valvery/etapa3.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Valvery/etapa4.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Valvery/etapa5.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Valvery/etapa6.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Valvery/etapa7.png'),
  ],
  arbusto: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Valvery/arbusto.png'),
  flor: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Valvery/flor.png'),
  semilla: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Valvery/semilla.png'),
};

const crimsonmoon: PaqueteAssetsArbol = {
  etapas: [
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/unicos/CrimsonMoon/etapa1.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/unicos/CrimsonMoon/etapa2.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/unicos/CrimsonMoon/etapa3.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/unicos/CrimsonMoon/etapa4.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/unicos/CrimsonMoon/etapa5.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/unicos/CrimsonMoon/etapa6.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/unicos/CrimsonMoon/etapa7.png'),
  ],
  arbusto: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/unicos/CrimsonMoon/arbusto.png'),
  flor: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/unicos/CrimsonMoon/flor.png'),
  semilla: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/unicos/CrimsonMoon/semilla.png'),
};

const eclipse: PaqueteAssetsArbol = {
  etapas: [
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/unicos/Eclipse/etapa1.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/unicos/Eclipse/etapa2.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/unicos/Eclipse/etapa3.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/unicos/Eclipse/etapa4.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/unicos/Eclipse/etapa5.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/unicos/Eclipse/etapa6.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/unicos/Eclipse/etapa7.png'),
  ],
  arbusto: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/unicos/Eclipse/arbusto.png'),
  flor: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/unicos/Eclipse/flor.png'),
  semilla: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/unicos/Eclipse/semilla.png'),
};

const moon: PaqueteAssetsArbol = {
  etapas: [
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/unicos/Moon/etapa1.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/unicos/Moon/etapa2.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/unicos/Moon/etapa3.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/unicos/Moon/etapa4.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/unicos/Moon/etapa5.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/unicos/Moon/etapa6.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/unicos/Moon/etapa7.png'),
  ],
  arbusto: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/unicos/Moon/arbusto.png'),
  flor: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/unicos/Moon/flor.png'),
  semilla: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/unicos/Moon/semilla.png'),
};

const vida: PaqueteAssetsArbol = {
  etapas: [
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/unicos/Vida/etapa1.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/unicos/Vida/etapa2.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/unicos/Vida/etapa3.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/unicos/Vida/etapa4.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/unicos/Vida/etapa5.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/unicos/Vida/etapa6.png'),
    require('../../../../assets/ilustraciones/senderos/biomas/paquetes/unicos/Vida/etapa7.png'),
  ],
  arbusto: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/unicos/Vida/arbusto.png'),
  flor: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/unicos/Vida/flor.png'),
  semilla: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/unicos/Vida/semilla.png'),
};

export const PAQUETES_ARBOL: Record<string, PaqueteAssetsArbol> = {
  aurelia,
  diamante,
  abyss,
  amber,
  celesthia,
  esmeralda,
  golden,
  ignate,
  lightmoon,
  mathist,
  nevalhi,
  sakura,
  valvery,
  crimsonmoon,
  eclipse,
  moon,
  vida,
};

export function obtenerAssetsPaquete(paqueteId: string): PaqueteAssetsArbol | undefined {
  return PAQUETES_ARBOL[paqueteId];
}
