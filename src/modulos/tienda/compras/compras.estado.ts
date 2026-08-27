import { create } from 'zustand';

type EstadoCompras = {
  productoSeleccionadoId: string | null;
  seleccionarProducto: (productoId: string | null) => void;
};

export const usarEstadoCompras = create<EstadoCompras>((set) => ({
  productoSeleccionadoId: null,
  seleccionarProducto: (productoSeleccionadoId) => set({ productoSeleccionadoId }),
}));
