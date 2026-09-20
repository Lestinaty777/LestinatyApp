import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { MasterColorProvider } from '../../diseno/tema/MasterColorContext';
import { crearTonoMaster, TONO_ESMERALDA } from '../../diseno/tema/masterColor';
import { CLAVE_TEMA_MASTER, leerPreferenciaTema, type PreferenciaTemaMaster } from './temaMaster';

type ContextoTemaGlobal = {
  preferencia: PreferenciaTemaMaster | null;
  /** `null` vuelve a Esmeralda. */
  elegir: (preferencia: PreferenciaTemaMaster | null) => void;
};

const ContextoTema = createContext<ContextoTemaGlobal>({ preferencia: null, elegir: () => {} });

// Tema de color global: envuelve la app con el tono del paquete elegido. Sin
// preferencia (o mientras carga) es Esmeralda, el verde de siempre. Los
// Provider anidados (como el del wizard de hábitos) siguen mandando en su árbol.
export function ProveedorTemaMaster({ children }: PropsWithChildren) {
  const [preferencia, setPreferencia] = useState<PreferenciaTemaMaster | null>(null);

  useEffect(() => {
    let vigente = true;
    AsyncStorage.getItem(CLAVE_TEMA_MASTER)
      .then((crudo) => { if (vigente) setPreferencia(leerPreferenciaTema(crudo)); })
      .catch(() => {});
    return () => { vigente = false; };
  }, []);

  const elegir = useCallback((nueva: PreferenciaTemaMaster | null) => {
    setPreferencia(nueva);
    (nueva ? AsyncStorage.setItem(CLAVE_TEMA_MASTER, JSON.stringify(nueva)) : AsyncStorage.removeItem(CLAVE_TEMA_MASTER)).catch(() => {});
  }, []);

  const tono = useMemo(() => (preferencia ? crearTonoMaster(preferencia.id, preferencia.masterPackColor) : TONO_ESMERALDA), [preferencia]);
  const valor = useMemo(() => ({ preferencia, elegir }), [preferencia, elegir]);

  return (
    <ContextoTema.Provider value={valor}>
      <MasterColorProvider tono={tono}>{children}</MasterColorProvider>
    </ContextoTema.Provider>
  );
}

export function useTemaMasterGlobal() {
  return useContext(ContextoTema);
}
