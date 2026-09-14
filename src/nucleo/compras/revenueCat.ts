import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, type PurchasesPackage } from 'react-native-purchases';

import { entorno } from '../configuracion/entorno';

// Mismo patrón que src/nucleo/notificaciones/oneSignal.ts: se inicializa una
// vez al arrancar la app, y ProveedorAcceso llama iniciarSesionCompras/
// cerrarSesionCompras cuando cambia la sesión de Supabase. Sin API key
// configurada (todavía no hay cuenta de tienda real) simplemente no hace
// nada — no rompe la app en desarrollo.
let inicializado = false;
let usuarioPendiente: string | null = null;

export function comprasInicializadas() {
  return inicializado;
}

function apiKeyPlataforma(): string {
  return Platform.OS === 'ios' ? entorno.revenueCatAppleKey : entorno.revenueCatGoogleKey;
}

export function inicializarCompras() {
  if (inicializado) return;
  const apiKey = apiKeyPlataforma();
  if (!apiKey) return;

  inicializado = true;
  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN);
  Purchases.configure({ apiKey });
  if (usuarioPendiente) void Purchases.logIn(usuarioPendiente).catch(() => undefined);
}

// app_user_id de RevenueCat = auth.uid() de Supabase — la Edge Function del
// webhook (recibir-webhook-revenuecat) usa ese mismo id para acreditar gemas.
export function iniciarSesionCompras(usuarioId: string) {
  usuarioPendiente = usuarioId;
  if (!inicializado) return;
  void Purchases.logIn(usuarioId).catch(() => undefined);
}

export function cerrarSesionCompras() {
  usuarioPendiente = null;
  if (!inicializado) return;
  void Purchases.logOut().catch(() => undefined);
}

export async function obtenerPaquetesGemas(): Promise<PurchasesPackage[]> {
  if (!inicializado) return [];
  try {
    const ofertas = await Purchases.getOfferings();
    return ofertas.current?.availablePackages ?? [];
  } catch {
    return [];
  }
}

export type ResultadoCompraPaquete = { cancelado: boolean; exito: boolean };

export async function comprarPaqueteGemas(paquete: PurchasesPackage): Promise<ResultadoCompraPaquete> {
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
