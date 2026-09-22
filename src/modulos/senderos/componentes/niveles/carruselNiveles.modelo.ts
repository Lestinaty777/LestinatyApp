import type { EstadoSeccionSendero } from '../../../habitos/senderoHabito.tipos';

export function esSeccionSeleccionable({ estado }: { estado: EstadoSeccionSendero }): boolean {
  return estado !== 'bloqueado';
}

export function indiceScrollParaNivel(nivel: number, totalSecciones: number): number {
  return Math.min(Math.max(nivel - 1, 0), totalSecciones - 1);
}
