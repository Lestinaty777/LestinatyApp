import { create } from 'zustand';

import type { CategoriaAbyId } from '../datos/categoriasAby';

type EstadoVisualAby = {
  categoriaActiva: CategoriaAbyId | null;
  definirCategoria: (categoria: CategoriaAbyId | null) => void;
};

export const usarEstadoVisualAby = create<EstadoVisualAby>((set) => ({
  categoriaActiva: null,
  definirCategoria: (categoriaActiva) => set({ categoriaActiva }),
}));
