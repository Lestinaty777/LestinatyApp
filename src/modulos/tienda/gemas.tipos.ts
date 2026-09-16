export type ArticuloTienda = {
  id: string;
  tipo: 'paquete_tema';
  nombre: string;
  descripcion: string;
  precioGemas: number;
};

export type CompraTienda = {
  articuloId: string;
  compradoEn: string;
};

export type ResultadoCompraArticulo = {
  articuloId: string;
  yaPoseido: boolean;
  saldoRestante: number;
};

export type PaqueteGemasIap = {
  id: string;
  productIdRevenueCat: string;
  cantidadGemas: number;
  precioReferenciaUsd: number | null;
};

export type ArbolPaquete = {
  id: string;
  nombre: string;
  masterPackColor: string;
  rareza: 'legendario' | 'unico';
  precioGemas: number;
  cantidadPorCompra: number;
};

export type ResultadoCompraSemillas = {
  paqueteId: string;
  semillasCompradas: number;
  saldoRestante: number;
};

export type SemillaArbol = {
  id: string;
  paqueteId: string;
  adquiridaEn: string;
};
