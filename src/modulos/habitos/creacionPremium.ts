export type EstadoPreparacionHabito = {
  arbustos: 1 | 2 | 3;
  arboles: 1 | 2 | 3;
  mensajeClave:
    | 'habitos.crearWizard.preparation.preparing'
    | 'habitos.crearWizard.preparation.creating'
    | 'habitos.crearWizard.preparation.almost'
    | 'habitos.crearWizard.preparation.complete';
};

export function estadoPreparacionHabito(progreso: number): EstadoPreparacionHabito {
  if (progreso >= 100) return { arbustos: 3, arboles: 3, mensajeClave: 'habitos.crearWizard.preparation.complete' };
  if (progreso >= 65) return { arbustos: 3, arboles: 3, mensajeClave: 'habitos.crearWizard.preparation.almost' };
  if (progreso >= 40) return { arbustos: 2, arboles: 2, mensajeClave: 'habitos.crearWizard.preparation.creating' };
  return { arbustos: 1, arboles: 1, mensajeClave: 'habitos.crearWizard.preparation.preparing' };
}
