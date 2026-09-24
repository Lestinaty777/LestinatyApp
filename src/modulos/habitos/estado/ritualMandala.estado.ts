import { create } from 'zustand';

import type { InfoMandalaPendiente } from '../mandalaNodo.tipos';

// Un encargo más viejo que esto ya no se abre solo: si el nodo no apareció
// a tiempo (p. ej. el registro pasó de nivel y ese mapa ya no está a la
// vista), el ritual queda esperando en su pedestal vacío, a mano.
export const VIGENCIA_ENCARGO_MS = 15000;

type EncargoRitual = { mandala: InfoMandalaPendiente; creadoEn: number };

type EstadoRitualMandala = {
  encargo: EncargoRitual | null;
  encargar: (mandala: InfoMandalaPendiente) => void;
  limpiar: () => void;
};

// Puente entre la pantalla de misión y el mapa: la misión deja el encargo
// y vuelve atrás; el mapa, ya en foco, lo toma y abre el ritual de la
// mandala sobre sí mismo (CompositorOverlay), sin cambiar de ruta.
export const usarRitualMandala = create<EstadoRitualMandala>((set) => ({
  encargo: null,
  encargar: (mandala) => set({ encargo: { creadoEn: Date.now(), mandala } }),
  limpiar: () => set({ encargo: null }),
}));
