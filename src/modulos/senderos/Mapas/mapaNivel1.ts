import { DIAS_REQUERIDOS_POR_NIVEL } from '../../habitos/iconosHabitos';
import type { DefinicionMapaNivel } from './tipos';

export const mapaNivel1: DefinicionMapaNivel = {
  nivel: 1,
  cantidadNodos: DIAS_REQUERIDOS_POR_NIVEL[2],
  titulo: 'Primer impulso',
  lema: 'Todo hábito grande empieza con un primer paso.',
};
