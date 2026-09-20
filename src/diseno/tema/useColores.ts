import { useMemo } from 'react';

import { colores, coloresDeMarca } from '../fundamentos/colores';
import { useEscala } from './MasterColorContext';

/** `colores` con los tokens de marca (primario*) del tono activo. En Esmeralda es idéntico al objeto estático. */
export function useColores() {
  const esc = useEscala();
  return useMemo(() => ({ ...colores, ...coloresDeMarca(esc) }), [esc]);
}
