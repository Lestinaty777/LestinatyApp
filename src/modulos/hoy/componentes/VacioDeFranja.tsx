import { useTranslation } from 'react-i18next';

import { horarioDeFranja, type FranjaConcreta } from '../../../compartido/utilidades/franjas';
import { EstadoVacioFranja, useTonoMaster } from '../../../diseno';
import { usePerfilBasico } from '../../configuracion/usePerfilBasico';
import { tonoDeFranja } from '../tonosFranjas';

/**
 * Estado vacío de una franja, listo para usar: pone los textos, el horario
 * según las horas que la persona tenga en Ajustes, y un color vecino del tema activo. Lo usan Hoy, Hábitos,
 * Tareas y Rutinas cuando se elige mañana, tarde o noche y no hay nada.
 */
export function VacioDeFranja({ franja, onVerTodo }: { franja: FranjaConcreta; onVerTodo: () => void }) {
  const { t } = useTranslation();
  const { limitesFranja } = usePerfilBasico();
  // El color sale del tema activo: en Hoy, el que la persona eligió; en Hábitos, Tareas y Rutinas, el de ese módulo.
  const { acento } = useTonoMaster();
  return (
    <EstadoVacioFranja
      accion={t('franjas.verTodo')}
      color={tonoDeFranja(acento, franja)}
      franja={franja}
      horario={horarioDeFranja(franja, limitesFranja)}
      onAccion={onVerTodo}
      texto={t(`franjas.vacio.${franja}.texto`)}
      titulo={t(`franjas.vacio.${franja}.titulo`)}
    />
  );
}
