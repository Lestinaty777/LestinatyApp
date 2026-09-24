import { Platform } from 'react-native';

export type PlataformaSoportada = 'android' | 'ios' | 'web';

export type CapacidadesPlataforma = {
  comprasNativas: boolean;
  googleSignIn: boolean;
  notificacionesPush: boolean;
  widgets: boolean;
};

export function resolverCapacidades(plataforma: PlataformaSoportada): CapacidadesPlataforma {
  return {
    comprasNativas: plataforma === 'android' || plataforma === 'ios',
    googleSignIn: plataforma === 'android',
    notificacionesPush: plataforma === 'android' || plataforma === 'ios',
    widgets: plataforma === 'android',
  };
}

export const capacidades = resolverCapacidades(Platform.OS as PlataformaSoportada);
