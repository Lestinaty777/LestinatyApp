import { EventEmitter, NativeModule, requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

export type DatosHabitoWidget = {
  habitoId: string;
  titulo: string;
  color?: string;
  actual: number;
  meta: number;
  unidad?: string;
  completado: boolean;
  racha?: number;
  tipoMeta?: 'check' | 'cantidad' | 'duracion';
  esPro: boolean;
  /** Nivel actual del hábito (1-7), define qué etapaN.png se ve en el widget rediseñado. */
  nivel?: number;
  /** Nombre del recurso drawable ya flatteneado por Metro (sin extensión) de la
   * ilustración etapaN.png correspondiente — resuelto en JS vía
   * Image.resolveAssetSource(...).uri para no tener que replicar en Kotlin las
   * rutas/carpetas irregulares de cada paquete (p. ej. los 4 "unicos" viven
   * bajo paquetes/unicos/<Nombre>/ en vez de paquetes/<Nombre>/). */
  imagenEtapaRecurso?: string;
  /** Días de ESTA semana calendario (lunes=1..domingo=7) en los que el hábito está programado. */
  diasProgramados?: number[];
  /** Subconjunto de diasProgramados ya cumplidos esta semana. */
  diasCompletadosSemana?: number[];
};

export type DatosCalendarioWidget = {
  anio: number;
  /** 1-12 */
  mes: number;
  /** Días del mes (1..31) con al menos un hábito completado, combinando todos los hábitos. */
  diasCompletados: number[];
};

export type IncrementoPendiente = {
  habitoId: string;
  valor: number;
  fechaLocal: string;
  timestamp: number;
};

/** Sesión de cronómetro finalizada desde la notificación (sin pantalla abierta confirmando) — misma forma que IncrementoPendiente, valor en minutos. */
export type SesionCronometroPendiente = IncrementoPendiente;

export type DatosIniciarCronometro = {
  habitoId: string;
  titulo: string;
  color?: string;
  /** Segundos ya acumulados con los que arrancar (ej. al reanudar desde la UI tras haber cerrado la pantalla). */
  segundosIniciales?: number;
};

export type EstadoCronometro = {
  activo: boolean;
  habitoId: string | null;
  corriendo: boolean;
  segundos: number;
};

/** 'pausado'/'reanudado': solo feedback de UI. 'finalizado': la sesión ya quedó en la cola de pendientes — hay que drenarla. */
export type EventoCronometro = { tipo: 'pausado' | 'reanudado' | 'finalizado'; habitoId: string; segundos: number };

type EventosHabitoWidget = {
  onIncrementoWidget: (evento: { habitoId: string; nuevoValor: number }) => void;
  onCronometroEvento: (evento: EventoCronometro) => void;
};

interface HabitoWidgetNativeModule extends NativeModule {
  sincronizarHabito(datos: DatosHabitoWidget): Promise<boolean>;
  sincronizarCalendario(datos: DatosCalendarioWidget): Promise<boolean>;
  solicitarFijarWidget(): Promise<boolean>;
  solicitarFijarWidgetCalendario(): Promise<boolean>;
  obtenerIncrementosPendientes(): Promise<IncrementoPendiente[]>;
  limpiarIncrementosPendientes(): Promise<boolean>;
  iniciarCronometro(datos: DatosIniciarCronometro): Promise<boolean>;
  pausarCronometro(): Promise<boolean>;
  reanudarCronometro(): Promise<boolean>;
  detenerCronometro(): Promise<boolean>;
  obtenerEstadoCronometro(): Promise<EstadoCronometro>;
  obtenerSesionesPendientesCronometro(): Promise<SesionCronometroPendiente[]>;
  limpiarSesionesPendientesCronometro(): Promise<boolean>;
}

// El tipo genérico EventEmitter<T> que reexporta expo-modules-core no
// termina de resolver bien sus métodos de instancia (addListener, etc.) para
// consumidores externos al paquete — en vez de pelear con esa reexportación,
// se declara acá solo la forma que realmente usamos.
interface EmisorEventosHabitoWidget {
  addListener<K extends keyof EventosHabitoWidget>(
    eventName: K,
    listener: EventosHabitoWidget[K],
  ): { remove(): void };
}

let moduloNativo: HabitoWidgetNativeModule | null = null;
let emisor: EmisorEventosHabitoWidget | null = null;

if (Platform.OS === 'android') {
  try {
    moduloNativo = requireNativeModule<HabitoWidgetNativeModule>('HabitoWidget');
    emisor = new EventEmitter(moduloNativo as any) as unknown as EmisorEventosHabitoWidget;
  } catch {
    // Si aún no se ha compilado el módulo nativo en la build actual
  }
}

export async function sincronizarHabitoNativo(datos: DatosHabitoWidget): Promise<boolean> {
  if (!moduloNativo) return false;
  try {
    return await moduloNativo.sincronizarHabito(datos);
  } catch {
    return false;
  }
}

export async function sincronizarCalendarioNativo(datos: DatosCalendarioWidget): Promise<boolean> {
  if (!moduloNativo) return false;
  try {
    return await moduloNativo.sincronizarCalendario(datos);
  } catch {
    return false;
  }
}

export async function solicitarFijarWidgetNativo(): Promise<boolean> {
  if (!moduloNativo) return false;
  try {
    return await moduloNativo.solicitarFijarWidget();
  } catch {
    return false;
  }
}

export async function solicitarFijarWidgetCalendarioNativo(): Promise<boolean> {
  if (!moduloNativo) return false;
  try {
    return await moduloNativo.solicitarFijarWidgetCalendario();
  } catch {
    return false;
  }
}

export async function obtenerIncrementosPendientesNativos(): Promise<IncrementoPendiente[]> {
  if (!moduloNativo) return [];
  try {
    return await moduloNativo.obtenerIncrementosPendientes();
  } catch {
    return [];
  }
}

export async function limpiarIncrementosPendientesNativos(): Promise<boolean> {
  if (!moduloNativo) return false;
  try {
    return await moduloNativo.limpiarIncrementosPendientes();
  } catch {
    return false;
  }
}

export function suscribirIncrementoWidget(
  callback: (evento: { habitoId: string; nuevoValor: number }) => void
): () => void {
  if (!emisor) return () => {};
  const suscripcion = emisor.addListener('onIncrementoWidget', callback);
  return () => suscripcion.remove();
}

export async function iniciarCronometroNativo(datos: DatosIniciarCronometro): Promise<boolean> {
  if (!moduloNativo) return false;
  try {
    return await moduloNativo.iniciarCronometro(datos);
  } catch {
    return false;
  }
}

export async function pausarCronometroNativo(): Promise<boolean> {
  if (!moduloNativo) return false;
  try {
    return await moduloNativo.pausarCronometro();
  } catch {
    return false;
  }
}

export async function reanudarCronometroNativo(): Promise<boolean> {
  if (!moduloNativo) return false;
  try {
    return await moduloNativo.reanudarCronometro();
  } catch {
    return false;
  }
}

export async function detenerCronometroNativo(): Promise<boolean> {
  if (!moduloNativo) return false;
  try {
    return await moduloNativo.detenerCronometro();
  } catch {
    return false;
  }
}

const ESTADO_CRONOMETRO_VACIO: EstadoCronometro = { activo: false, habitoId: null, corriendo: false, segundos: 0 };

export async function obtenerEstadoCronometroNativo(): Promise<EstadoCronometro> {
  if (!moduloNativo) return ESTADO_CRONOMETRO_VACIO;
  try {
    return await moduloNativo.obtenerEstadoCronometro();
  } catch {
    return ESTADO_CRONOMETRO_VACIO;
  }
}

export async function obtenerSesionesPendientesCronometroNativas(): Promise<SesionCronometroPendiente[]> {
  if (!moduloNativo) return [];
  try {
    return await moduloNativo.obtenerSesionesPendientesCronometro();
  } catch {
    return [];
  }
}

export async function limpiarSesionesPendientesCronometroNativas(): Promise<boolean> {
  if (!moduloNativo) return false;
  try {
    return await moduloNativo.limpiarSesionesPendientesCronometro();
  } catch {
    return false;
  }
}

export function suscribirEventoCronometro(callback: (evento: EventoCronometro) => void): () => void {
  if (!emisor) return () => {};
  const suscripcion = emisor.addListener('onCronometroEvento', callback);
  return () => suscripcion.remove();
}
