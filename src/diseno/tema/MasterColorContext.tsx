import { createContext, useContext, type PropsWithChildren } from 'react';

import { TONO_ESMERALDA, type TonoMaster } from './masterColor';

// null = no hay Provider: los componentes Master se ven como siempre (verde
// Esmeralda). Solo las pantallas que lo pidan (p. ej. el wizard de hábitos al
// elegir una semilla) envuelven su árbol con un tono distinto.
const ContextoTonoMaster = createContext<TonoMaster | null>(null);

export function MasterColorProvider({ children, tono }: PropsWithChildren<{ tono: TonoMaster }>) {
  return <ContextoTonoMaster.Provider value={tono}>{children}</ContextoTonoMaster.Provider>;
}

/** Tono activo, o Esmeralda si no hay Provider. */
export function useTonoMaster(): TonoMaster {
  return useContext(ContextoTonoMaster) ?? TONO_ESMERALDA;
}
