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

export function notificacionesListas(): boolean {
  return false;
}

export function etiquetarUsuarioNotificaciones(_etiquetas: Record<string, string>): void {}

export function registrarResultadoNotificaciones(_nombre: string, _valor?: number): void {}
