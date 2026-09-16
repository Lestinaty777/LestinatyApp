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

export const PAQUETES_ARBOL: Record<string, PaqueteAssetsArbol> = {
  // albedo,
};

export function obtenerAssetsPaquete(paqueteId: string): PaqueteAssetsArbol | undefined {
  return PAQUETES_ARBOL[paqueteId];
}
