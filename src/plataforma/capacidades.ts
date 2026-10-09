import { Platform } from 'react-native';

export type PlataformaSoportada = 'android' | 'ios' | 'web';

export type CapacidadesPlataforma = {
  comprasNativas: boolean;
  googleSignIn: boolean;
  notificacionesPush: boolean;
  widgets: boolean;
  // Horizon hoy desbloquea dos beneficios reales: el sistema de widgets
  // (Android) y la generación de Planes con Aby (ver
  // _shared/accesoAbyPlanes.ts, sin dependencia de plataforma). Con Planes ya
  // gateado por Horizon, no hace falta que haya widgets en una plataforma
  // para venderlo ahí (decisión 2026-10-05 — reemplaza la de 2026-09-25, que
  // solo contaba con widgets como beneficio).
  horizon: boolean;
};

export function resolverCapacidades(plataforma: PlataformaSoportada): CapacidadesPlataforma {
  return {
    comprasNativas: plataforma === 'android' || plataforma === 'ios',
    googleSignIn: plataforma === 'android',
    notificacionesPush: plataforma === 'android' || plataforma === 'ios',
    widgets: plataforma === 'android',
    horizon: plataforma === 'android' || plataforma === 'ios',
  };
}

export const capacidades = resolverCapacidades(Platform.OS as PlataformaSoportada);
