export type PaqueteCompra = {
  id: string;
  productId: string;
  precioTexto: string;
  tipo: 'mensual' | 'consumible' | 'otro';
};

export type ResultadoCompra =
  | { estado: 'completada' }
  | { estado: 'cancelada' }
  | { estado: 'pendiente' }
  | { estado: 'error'; mensajeSeguro: string };

export type EstadoCatalogoCompras =
  | { estado: 'lista'; paquetes: PaqueteCompra[] }
  | { estado: 'no_disponible'; motivo: 'plataforma' }
  | { estado: 'no_configurada'; motivo: string }
  | { estado: 'error'; mensajeSeguro: string };

export type ResultadoRestauracion =
  | { estado: 'restaurada'; horizonActivo: boolean }
  | { estado: 'sin_compras' }
  | { estado: 'no_disponible'; motivo: 'plataforma' }
  | { estado: 'no_configurada'; motivo: string }
  | { estado: 'error'; mensajeSeguro: string };
