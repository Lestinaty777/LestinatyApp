import { useTranslation } from 'react-i18next';

import { horarioDeFranja, type FranjaConcreta } from '../../../compartido/utilidades/franjas';
import { EstadoVacioFranja } from '../../../diseno';
import { usePerfilBasico } from '../../configuracion/usePerfilBasico';

/**
 * Estado vacío de una franja, listo para usar: pone los textos y el horario
 * según las horas que la persona tenga en Ajustes. Lo usan Hoy, Hábitos,
 * Tareas y Rutinas cuando se elige mañana, tarde o noche y no hay nada.
 */
export function VacioDeFranja({ franja, onVerTodo }: { franja: FranjaConcreta; onVerTodo: () => void }) {
  const { t } = useTranslation();
  const { limitesFranja } = usePerfilBasico();
  return (
    <EstadoVacioFranja
      accion={t('franjas.verTodo')}
      franja={franja}
      horario={horarioDeFranja(franja, limitesFranja)}
      onAccion={onVerTodo}
      texto={t(`franjas.vacio.${franja}.texto`)}
      titulo={t(`franjas.vacio.${franja}.titulo`)}
    />
  );
}
