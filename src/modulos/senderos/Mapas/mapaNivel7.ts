import type { DefinicionMapaNivel } from './tipos';

// A diferencia de mapaNivel1..6, este cantidadNodos NO viene de
// DIAS_REQUERIDOS_POR_NIVEL: el nivel 7 es el máximo real (confirmado), no
// hay un "nivel 8" que pida 42 días. Este mapa es solo la vista visual de
// quien ya llegó al tope — un valor decorativo fijo, no una regla de progreso.
export const mapaNivel7: DefinicionMapaNivel = {
  nivel: 7,
  cantidadNodos: 42,
  titulo: 'Hábito dominado',
  lema: 'Lo dominaste — ahora es parte de vos.',
};
