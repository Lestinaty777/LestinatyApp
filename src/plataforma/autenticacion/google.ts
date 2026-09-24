import type { UsuarioSesion } from '../../modulos/acceso/tipos';

export type ResultadoAccesoGoogle =
  | { estado: 'autenticado'; usuario: UsuarioSesion }
  | { estado: 'cancelado' }
  | { estado: 'no_disponible'; motivo: 'plataforma' };

export function inicializarGoogle(): void {}

export async function iniciarSesionConGoogle(_codigoReferido?: string): Promise<ResultadoAccesoGoogle> {
  return { estado: 'no_disponible', motivo: 'plataforma' };
}
