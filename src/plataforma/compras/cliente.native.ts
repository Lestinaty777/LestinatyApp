import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, PACKAGE_TYPE, PURCHASES_ERROR_CODE, type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';

import { entorno } from '../../nucleo/configuracion/entorno';
import type { EstadoCatalogoCompras, PaqueteCompra, ResultadoCompra, ResultadoRestauracion } from './contrato';

export const ENTITLEMENT_HORIZON = 'horizon';
export type EstadoHorizon = 'activo' | 'inactivo' | 'noDisponible';

let inicializado = false;
let motivoNoConfigurada: string | null = null;
let usuarioPendiente: string | null = null;
const mapaPaquetesPorId = new Map<string, PurchasesPackage>();

function esPlataformaSoportada(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

function apiKeyPlataforma(): string {
  return Platform.OS === 'ios' ? entorno.revenueCatAppleKey : entorno.revenueCatGoogleKey;
}

export function comprasInicializadas(): boolean {
  return inicializado;
}

// Sin API key configurada (todavía no hay cuenta de tienda real, o falta la
// clave de esta plataforma) no rompe la app — solo queda 'no_configurada'.
export function inicializarCompras(): void {
  if (!esPlataformaSoportada() || inicializado) return;

  const apiKey = apiKeyPlataforma();
  if (!apiKey) {
    motivoNoConfigurada = Platform.OS === 'ios' ? 'Falta EXPO_PUBLIC_REVENUECAT_APPLE_KEY.' : 'Falta EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY.';
    return;
  }

  inicializado = true;
  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN);
  Purchases.configure({ apiKey });
  if (usuarioPendiente) void Purchases.logIn(usuarioPendiente).catch(() => undefined);
}

// app_user_id de RevenueCat = auth.uid() de Supabase — la Edge Function del
// webhook (recibir-webhook-revenuecat) usa ese mismo id para acreditar gemas.
export function iniciarSesionCompras(usuarioId: string): void {
  usuarioPendiente = usuarioId;
  if (!inicializado) return;
  void Purchases.logIn(usuarioId).catch(() => undefined);
}

export function cerrarSesionCompras(): void {
  usuarioPendiente = null;
  if (!inicializado) return;
  void Purchases.logOut().catch(() => undefined);
}

function mensajeSeguroDesdeError(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error && typeof (error as { message: unknown }).message === 'string') {
    return (error as { message: string }).message;
  }
  return 'No pudimos completar la operación. Intentá de nuevo.';
}

function tipoDePaquete(paquete: PurchasesPackage): PaqueteCompra['tipo'] {
  if (paquete.packageType === PACKAGE_TYPE.MONTHLY) return 'mensual';
  if (paquete.packageType === PACKAGE_TYPE.CUSTOM) return 'consumible';
  return 'otro';
}

function registrarYMapear(paquetes: PurchasesPackage[]): PaqueteCompra[] {
  return paquetes.map((paquete) => {
    mapaPaquetesPorId.set(paquete.identifier, paquete);
    return {
      id: paquete.identifier,
      productId: paquete.product.identifier,
      precioTexto: paquete.product.priceString,
      tipo: tipoDePaquete(paquete),
    };
  });
}

async function obtenerCatalogoBase(): Promise<EstadoCatalogoCompras> {
  if (!esPlataformaSoportada()) return { estado: 'no_disponible', motivo: 'plataforma' };
  if (!inicializado) return { estado: 'no_configurada', motivo: motivoNoConfigurada ?? 'RevenueCat no está inicializado.' };

  try {
    const ofertas = await Purchases.getOfferings();
    return { estado: 'lista', paquetes: registrarYMapear(ofertas.current?.availablePackages ?? []) };
  } catch (error) {
    return { estado: 'error', mensajeSeguro: mensajeSeguroDesdeError(error) };
  }
}

export async function obtenerCatalogoGemas(): Promise<EstadoCatalogoCompras> {
  return obtenerCatalogoBase();
}

export async function obtenerCatalogoHorizon(): Promise<EstadoCatalogoCompras> {
  const catalogo = await obtenerCatalogoBase();
  if (catalogo.estado !== 'lista') return catalogo;

  return {
    estado: 'lista',
    paquetes: catalogo.paquetes.filter((paquete) => (
      paquete.tipo === 'mensual'
      || paquete.id.toLowerCase().includes(ENTITLEMENT_HORIZON)
      || paquete.productId.toLowerCase().includes(ENTITLEMENT_HORIZON)
    )),
  };
}

export async function comprarPaquete(paqueteId: string): Promise<ResultadoCompra> {
  const paqueteNativo = mapaPaquetesPorId.get(paqueteId);
  if (!paqueteNativo) {
    return { estado: 'error', mensajeSeguro: 'Ese paquete ya no está disponible. Volvé a intentarlo.' };
  }

  try {
    await Purchases.purchasePackage(paqueteNativo);
    return { estado: 'completada' };
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) {
      const codigo = (error as { code: unknown }).code;
      if (codigo === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) return { estado: 'cancelada' };
      if (codigo === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) return { estado: 'pendiente' };
    }
    if (error && typeof error === 'object' && 'userCancelled' in error && (error as { userCancelled: boolean }).userCancelled) {
      return { estado: 'cancelada' };
    }
    return { estado: 'error', mensajeSeguro: mensajeSeguroDesdeError(error) };
  }
}

export function resolverEstadoHorizon(info: CustomerInfo): EstadoHorizon {
  return info.entitlements.active[ENTITLEMENT_HORIZON] ? 'activo' : 'inactivo';
}

export async function obtenerEstadoHorizon(): Promise<EstadoHorizon> {
  // ⚠️ BYPASS TEMPORAL — Android todavía no tiene un producto Horizon real en
  // Play Store/RevenueCat (el setup actual es solo para iOS), así que se
  // reporta siempre activo para no bloquear Planes con Aby ni Widgets
  // mientras se termina de armar esa tienda (decisión 2026-10-05). El
  // chequeo real server-side en accesoAbyPlanes.ts tiene el mismo bypass,
  // scoped a Android — iOS siempre usa el chequeo real. Sacar ambos en
  // cuanto el producto de Android exista.
  if (Platform.OS === 'android') return 'activo';
  if (!inicializado) return 'noDisponible';
  try {
    return resolverEstadoHorizon(await Purchases.getCustomerInfo());
  } catch {
    return 'noDisponible';
  }
}

export async function restaurarCompras(): Promise<ResultadoRestauracion> {
  if (!esPlataformaSoportada()) return { estado: 'no_disponible', motivo: 'plataforma' };
  if (!inicializado) return { estado: 'no_configurada', motivo: motivoNoConfigurada ?? 'RevenueCat no está inicializado.' };

  try {
    const info = await Purchases.restorePurchases();
    const tieneAlgoActivo = Object.keys(info.entitlements.active).length > 0;
    if (!tieneAlgoActivo) return { estado: 'sin_compras' };
    return { estado: 'restaurada', horizonActivo: resolverEstadoHorizon(info) === 'activo' };
  } catch (error) {
    return { estado: 'error', mensajeSeguro: mensajeSeguroDesdeError(error) };
  }
}
