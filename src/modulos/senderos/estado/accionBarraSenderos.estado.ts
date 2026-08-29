import { create } from 'zustand';

type AccionBarraSenderos = {
  color: string;
  ejecutar: () => void;
};

type EstadoAccionBarraSenderos = {
  accion: AccionBarraSenderos | null;
  definirAccion: (accion: AccionBarraSenderos) => void;
  limpiarAccion: () => void;
};

export const usarAccionBarraSenderos = create<EstadoAccionBarraSenderos>((set) => ({
  accion: null,
  definirAccion: (accion) => set({ accion }),
  limpiarAccion: () => set({ accion: null }),
}));
