import type { EstadoHorizon } from './horizon';
import { capacidades } from '../../plataforma/capacidades';

export function rutaParaHorizon(estado: EstadoHorizon) {
  if (estado !== 'activo') return '/horizon';
  return capacidades.widgets ? '/habitos/widgets' : '/(principal)/hoy';
}
