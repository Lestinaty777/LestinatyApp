import type { EstadoCatalogoCompras, ResultadoCompra, ResultadoRestauracion } from './contrato';

// Nunca importa react-native-purchases — web declara toda compra nativa no
// disponible sin intentar cargar el SDK.
export function inicializarCompras(): void {}

export function iniciarSesionCompras(_usuarioId: string): void {}

export function cerrarSesionCompras(): void {}

export async function obtenerCatalogoGemas(): Promise<EstadoCatalogoCompras> {
  return { estado: 'no_disponible', motivo: 'plataforma' };
}

export async function obtenerCatalogoHorizon(): Promise<EstadoCatalogoCompras> {
  return { estado: 'no_disponible', motivo: 'plataforma' };
}

export async function comprarPaquete(_paqueteId: string): Promise<ResultadoCompra> {
  return { estado: 'error', mensajeSeguro: 'Las compras no están disponibles en esta plataforma.' };
}

export async function restaurarCompras(): Promise<ResultadoRestauracion> {
  return { estado: 'no_disponible', motivo: 'plataforma' };
}

export type EstadoHorizon = 'activo' | 'inactivo' | 'noDisponible';

export async function obtenerEstadoHorizon(): Promise<EstadoHorizon> {
  return 'noDisponible';
}
