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
