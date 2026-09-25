import type { EstadoHorizon } from './horizon';
import { capacidades } from '../../plataforma/capacidades';

export function rutaParaHorizon(estado: EstadoHorizon) {
  // Horizon hoy solo desbloquea widgets — no se ofrece donde no hay widgets,
  // para no vender una suscripción sin ningún beneficio real detrás.
  if (!capacidades.horizon) return '/(principal)/hoy';
  if (estado !== 'activo') return '/horizon';
  return capacidades.widgets ? '/habitos/widgets' : '/(principal)/hoy';
}
