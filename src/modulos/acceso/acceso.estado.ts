import { create } from 'zustand';

import { UsuarioSesion } from './tipos';

type EstadoAcceso = {
  cargandoSesion: boolean;
  usuario: UsuarioSesion | null;
  definirCargandoSesion: (cargandoSesion: boolean) => void;
  definirUsuario: (usuario: UsuarioSesion | null) => void;
};

export const usarEstadoAcceso = create<EstadoAcceso>((set) => ({
  cargandoSesion: true,
  usuario: null,
  definirCargandoSesion: (cargandoSesion) => set({ cargandoSesion }),
  definirUsuario: (usuario) => set({ usuario }),
}));
