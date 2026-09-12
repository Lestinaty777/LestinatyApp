import { describe, expect, it } from 'vitest';

import { estadoPreparacionHabito } from './creacionPremium';

describe('estadoPreparacionHabito', () => {
  it('muestra una vegetación creciente antes de terminar el guardado', () => {
    expect(estadoPreparacionHabito(18)).toEqual({ arbustos: 1, arboles: 1, mensaje: 'Preparando tu hábito…' });
    expect(estadoPreparacionHabito(57)).toEqual({ arbustos: 2, arboles: 2, mensaje: 'Creando tu espacio…' });
  });

  it('reserva el mensaje final para el progreso confirmado', () => {
    expect(estadoPreparacionHabito(100)).toEqual({ arbustos: 3, arboles: 3, mensaje: 'Todo está listo.' });
  });
});
