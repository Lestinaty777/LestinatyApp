import { useMemo, type PropsWithChildren } from 'react';

import { MasterColorProvider } from '../../../diseno';
import { tonoDelPaquete } from '../tonoPaquete';

// Envuelve lo que pertenece a UN hábito (su card, su sendero) con el tono de su
// paquete. Se anida sobre el tema global: el resto de la app sigue el tema que
// eligió el usuario, y cada hábito conserva el color de su paquete.
export function TonoDelHabito({ children, colorPaquete, paqueteId }: PropsWithChildren<{ colorPaquete?: string | null; paqueteId?: string | null }>) {
  const tono = useMemo(() => tonoDelPaquete(paqueteId, colorPaquete), [paqueteId, colorPaquete]);
  return <MasterColorProvider tono={tono}>{children}</MasterColorProvider>;
}
