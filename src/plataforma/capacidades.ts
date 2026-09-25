import { Platform } from 'react-native';

export type PlataformaSoportada = 'android' | 'ios' | 'web';

export type CapacidadesPlataforma = {
  comprasNativas: boolean;
  googleSignIn: boolean;
  notificacionesPush: boolean;
  widgets: boolean;
  // El único beneficio real de Horizon hoy es el sistema de widgets — no hay
  // ninguna otra función gateada en el código. Mientras eso siga así, Horizon
  // no debe venderse donde no haya widgets (ver decisión 2026-09-25).
  horizon: boolean;
};

export function resolverCapacidades(plataforma: PlataformaSoportada): CapacidadesPlataforma {
  return {
    comprasNativas: plataforma === 'android' || plataforma === 'ios',
    googleSignIn: plataforma === 'android',
    notificacionesPush: plataforma === 'android' || plataforma === 'ios',
    widgets: plataforma === 'android',
    horizon: plataforma === 'android',
  };
}

export const capacidades = resolverCapacidades(Platform.OS as PlataformaSoportada);
