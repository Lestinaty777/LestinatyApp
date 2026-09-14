import type { EstadoHorizon } from './horizon';

export function rutaParaHorizon(estado: EstadoHorizon) {
  return estado === 'activo' ? '/habitos/widgets' : '/horizon';
}
