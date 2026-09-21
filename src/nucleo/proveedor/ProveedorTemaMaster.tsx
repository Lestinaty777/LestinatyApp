import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { MasterColorProvider } from '../../diseno/tema/MasterColorContext';
import { crearTonoMaster, TONO_ESMERALDA } from '../../diseno/tema/masterColor';
import { temaSigueVigente } from '../../modulos/tienda/temasDesbloqueados';
import { usePaquetesDesbloqueados } from '../../modulos/tienda/usePaquetesDesbloqueados';
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

  // Un tema de paquete solo vale si el usuario lo tiene. Se revoca ÚNICAMENTE con datos confirmados: sin sesión,
  // sin red o mientras carga no hay lista (error o cargando) y el tema guardado se respeta tal cual.
  const desbloqueados = usePaquetesDesbloqueados();
  useEffect(() => {
    if (!preferencia || !desbloqueados.isSuccess || desbloqueados.isFetching) return;
    if (!temaSigueVigente(preferencia.id, desbloqueados.data)) elegir(null);
  }, [preferencia, desbloqueados.isSuccess, desbloqueados.isFetching, desbloqueados.data, elegir]);

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
