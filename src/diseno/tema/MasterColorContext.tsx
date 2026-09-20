import { createContext, useCallback, useContext, type PropsWithChildren } from 'react';

import { TONO_ESMERALDA, tintarHex, type TonoMaster } from './masterColor';

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

/**
 * Lleva un color (o cada parada de un degradado) al tono activo con la misma
 * rotación que usa la paleta: para migrar verdes hardcodeados que no tienen
 * token propio. En Esmeralda devuelve el mismo color.
 */
export function useTintarHex() {
  const tono = useTonoMaster();
  return useCallback((hex: string) => tintarHex(tono, hex), [tono]);
}

/** La escala de verdes del tono activo (Esmeralda = los verdes de siempre; otros paquetes = la misma escala rotada). */
export function useEscala() {
  return useTonoMaster().escala;
}
