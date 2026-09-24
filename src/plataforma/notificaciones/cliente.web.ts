import type { EstadoIntegracion, ResultadoPermisoNotificaciones } from './contrato';

// Nunca importa react-native-onesignal — web declara la integración no
// disponible sin intentar cargar el SDK nativo.
export function inicializarNotificaciones(): EstadoIntegracion {
  return { estado: 'no_disponible', motivo: 'plataforma' };
}

export function identificarUsuarioNotificaciones(_usuarioId: string): void {}

export function cerrarSesionNotificaciones(): void {}

export async function solicitarPermisoYRegistrar(): Promise<ResultadoPermisoNotificaciones> {
  return { estado: 'no_disponible', motivo: 'plataforma' };
}
