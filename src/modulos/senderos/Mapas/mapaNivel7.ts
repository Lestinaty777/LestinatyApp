import { DIAS_POR_MAPA } from '../../habitos/senderoNiveles';
import type { DefinicionMapaNivel } from './tipos';

// Nivel 7 no es un tope decorativo: es maestría infinita en ciclos de
// DIAS_POR_MAPA[7] días (migración 20260922_46_progresion_senderos_infinita.sql).
// Cada ciclo completado reinicia el recorrido y paga un cofre final nuevo —
// no hay un "nivel 8".
export const mapaNivel7: DefinicionMapaNivel = {
  nivel: 7,
  cantidadNodos: DIAS_POR_MAPA[7],
  titulo: 'Hábito dominado',
  lema: 'Lo dominaste — ahora es parte de vos.',
};
