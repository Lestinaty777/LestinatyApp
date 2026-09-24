// Cámara isométrica del mapa de senderos: la usan el viewport del mapa y la
// capa del ritual (CompositorOverlay), que debe proyectar la mandala con la
// misma matriz para aterrizar píxel a píxel sobre su pedestal. Ajustar la
// inclinación aquí la cambia en ambos lados a la vez.
export const CAMARA_MAPA = {
  perspectiva: 1200,
  inclinacionGrados: 7,
  escalaY: 0.98,
  origen: 'center bottom',
} as const;
