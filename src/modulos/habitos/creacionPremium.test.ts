import { describe, expect, it } from 'vitest';

import { estadoPreparacionHabito } from './creacionPremium';

describe('estadoPreparacionHabito', () => {
  it('muestra una vegetación creciente antes de terminar el guardado', () => {
    expect(estadoPreparacionHabito(18)).toEqual({ arbustos: 1, arboles: 1, mensajeClave: 'habitos.crearWizard.preparation.preparing' });
    expect(estadoPreparacionHabito(57)).toEqual({ arbustos: 2, arboles: 2, mensajeClave: 'habitos.crearWizard.preparation.creating' });
  });

  it('reserva el mensaje final para el progreso confirmado', () => {
    expect(estadoPreparacionHabito(100)).toEqual({ arbustos: 3, arboles: 3, mensajeClave: 'habitos.crearWizard.preparation.complete' });
  });
});
