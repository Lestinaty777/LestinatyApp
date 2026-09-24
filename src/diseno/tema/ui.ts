import { create } from 'zustand';

import { colores } from '../fundamentos/colores';
import { ESCALA_ESMERALDA } from './escalaEsmeralda';

export type ModoUI = 'light' | 'dark';

export type ColoresUI = {
  fondo: string;
  fondoSuave: string;
  superficie: string;
  superficieElevada: string;
  texto: string;
  textoSecundario: string;
  textoTenue: string;
  borde: string;
  bordeSuave: string;
  sombra: string;
  inputFondo: string;
};

type TemaUIState = {
  modo: ModoUI;
  colores: ColoresUI;
  establecerModo: (modo: ModoUI) => void;
};

function crearColoresUI(modo: ModoUI): ColoresUI {
  if (modo === 'dark') {
    return {
      fondo: '#111315',
      fondoSuave: '#171A1D',
      superficie: '#1A1E22',
      superficieElevada: '#23282D',
      texto: '#F2F4F6',
      textoSecundario: '#B5BDC6',
      textoTenue: '#7C8793',
      borde: '#2A3036',
      bordeSuave: '#20262B',
      sombra: '#000000',
      inputFondo: '#20262B',
    };
  }

  return {
    fondo: colores.fondo,
    fondoSuave: colores.fondoCalido,
    superficie: colores.superficie,
    superficieElevada: '#FFF8F4',
    texto: colores.texto,
    textoSecundario: colores.textoSecundario,
    textoTenue: colores.tintaTenue,
    borde: colores.borde,
    bordeSuave: '#EFECE6',
    sombra: ESCALA_ESMERALDA.musgo.l21,
    inputFondo: colores.superficie,
  };
}

const MODO_UI_FIJO: ModoUI = 'light';

export const usarTemaUI = create<TemaUIState>((set) => ({
  modo: MODO_UI_FIJO,
  colores: crearColoresUI(MODO_UI_FIJO),
  establecerModo: () => set({ modo: MODO_UI_FIJO, colores: crearColoresUI(MODO_UI_FIJO) }),
}));

export function obtenerColoresUI() {
  return usarTemaUI.getState().colores;
}
