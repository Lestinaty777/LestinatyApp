import { create } from 'zustand';

import { Meta } from './tipos';

type EstadoMetas = {
  metas: Meta[];
  definirMetas: (metas: Meta[]) => void;
};

export const usarEstadoMetas = create<EstadoMetas>((set) => ({
  metas: [],
  definirMetas: (metas) => set({ metas }),
}));
