import Purchases, { PACKAGE_TYPE, type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';

import { comprasInicializadas } from './revenueCat';

export const ENTITLEMENT_HORIZON = 'horizon';

export type EstadoHorizon = 'activo' | 'inactivo' | 'noDisponible';
export type ResultadoCompraHorizon = { cancelado: boolean; exito: boolean };

export function resolverEstadoHorizon(info: CustomerInfo): EstadoHorizon {
  return info.entitlements.active[ENTITLEMENT_HORIZON] ? 'activo' : 'inactivo';
}

export async function obtenerEstadoHorizon(): Promise<EstadoHorizon> {
  if (!comprasInicializadas()) return 'noDisponible';

  try {
    return resolverEstadoHorizon(await Purchases.getCustomerInfo());
  } catch {
    return 'noDisponible';
  }
}

export async function obtenerPaquetesHorizon(): Promise<PurchasesPackage[]> {
  if (!comprasInicializadas()) return [];

  try {
    const paquetes = (await Purchases.getOfferings()).current?.availablePackages ?? [];
    return paquetes.filter((paquete) => (
      paquete.packageType === PACKAGE_TYPE.MONTHLY
      || paquete.identifier.toLowerCase().includes(ENTITLEMENT_HORIZON)
      || paquete.product.identifier.toLowerCase().includes(ENTITLEMENT_HORIZON)
    ));
  } catch {
    return [];
  }
}

export async function comprarHorizon(paquete: PurchasesPackage): Promise<ResultadoCompraHorizon> {
  try {
    await Purchases.purchasePackage(paquete);
    return { cancelado: false, exito: true };
  } catch (error) {
    if (error && typeof error === 'object' && 'userCancelled' in error && error.userCancelled) {
      return { cancelado: true, exito: false };
    }
    throw error;
  }
}

export async function restaurarHorizon(): Promise<EstadoHorizon> {
  if (!comprasInicializadas()) return 'noDisponible';

  try {
    return resolverEstadoHorizon(await Purchases.restorePurchases());
  } catch {
    return 'noDisponible';
  }
}
