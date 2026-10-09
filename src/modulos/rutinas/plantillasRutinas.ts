import { FRANJAS_ORDEN, type FranjaDia } from '../../compartido/utilidades/franjas';
import type { ModoPasoPropio } from './rutinas.tipos';

export type PlantillaPasoRutina = {
  titulo: string;
  modo: ModoPasoPropio;
  /** Minutos (cronómetro) o cantidad (contador); ausente en pasos simples. */
  objetivoValor?: number;
  unidad?: string;
  /** Opcional si el servidor lo marca false; ausente = esencial. */
  esencial?: boolean;
};

export type PlantillaRutina = {
  /** Estable: identifica la plantilla en el catálogo del servidor. */
  id: string;
  titulo: string;
  descripcion: string;
  franja: FranjaDia;
  /** Id del registro de íconos (src/diseno/iconos/registroIconos.ts). */
  iconoId: string;
  autor: string;
  /** 0 = gratis. */
  precioGemas: number;
  numPasos: number;
  duracionMin: number;
  /** Gratis o ya comprada. */
  desbloqueada: boolean;
  /** Solo llegan del servidor cuando está desbloqueada. */
  pasos: PlantillaPasoRutina[] | null;
};

// El catálogo vive en el servidor (migración 80): las plantillas de pago solo
// entregan sus pasos a quien las compró, y se pueden añadir o cambiar de precio
// sin publicar una versión de la app. Se valida defensivamente igual que
// rutinas.mapper.ts.

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function texto(valor: unknown, campo: string): string {
  if (typeof valor !== 'string' || valor.length === 0) throw new Error(`Plantillas: "${campo}" inválido.`);
  return valor;
}

function numero(valor: unknown, campo: string): number {
  const n = Number(valor);
  if (!Number.isFinite(n)) throw new Error(`Plantillas: "${campo}" inválido.`);
  return n;
}

export function mapearPasoPlantilla(crudo: unknown): PlantillaPasoRutina {
  if (!esObjeto(crudo)) throw new Error('Plantillas: paso inválido.');
  const modo = crudo.modo;
  if (modo !== 'simple' && modo !== 'cronometro' && modo !== 'contador') throw new Error('Plantillas: "modo" inválido.');
  const paso: PlantillaPasoRutina = { titulo: texto(crudo.titulo, 'paso.titulo'), modo };
  if (modo !== 'simple') paso.objetivoValor = numero(crudo.objetivo_valor, 'paso.objetivo_valor');
  if (typeof crudo.unidad === 'string' && crudo.unidad.length > 0) paso.unidad = crudo.unidad;
  if (crudo.esencial === false) paso.esencial = false;
  return paso;
}

export function mapearPlantillaRutina(crudo: unknown): PlantillaRutina {
  if (!esObjeto(crudo)) throw new Error('Plantillas: plantilla inválida.');
  const franja = crudo.franja;
  if (typeof franja !== 'string' || !(FRANJAS_ORDEN as readonly string[]).includes(franja)) throw new Error('Plantillas: "franja" inválida.');
  const desbloqueada = crudo.desbloqueada === true;
  // Una plantilla desbloqueada sin pasos no se puede usar: mejor fallar claro.
  if (desbloqueada && !Array.isArray(crudo.pasos)) throw new Error('Plantillas: falta el contenido de una plantilla desbloqueada.');
  return {
    id: texto(crudo.id, 'id'),
    titulo: texto(crudo.titulo, 'titulo'),
    descripcion: texto(crudo.descripcion, 'descripcion'),
    franja: franja as FranjaDia,
    iconoId: texto(crudo.icono_id, 'icono_id'),
    autor: texto(crudo.autor, 'autor'),
    precioGemas: numero(crudo.precio_gemas, 'precio_gemas'),
    numPasos: numero(crudo.num_pasos, 'num_pasos'),
    duracionMin: numero(crudo.duracion_min, 'duracion_min'),
    desbloqueada,
    pasos: desbloqueada && Array.isArray(crudo.pasos) ? crudo.pasos.map(mapearPasoPlantilla) : null,
  };
}

export function mapearPlantillasRutinas(crudo: unknown): PlantillaRutina[] {
  if (!Array.isArray(crudo)) throw new Error('Plantillas: respuesta inválida.');
  return crudo.map(mapearPlantillaRutina);
}

export type ResultadoCompraPlantilla = { plantillaId: string; yaDesbloqueada: boolean; saldoRestante: number };

export function mapearResultadoCompraPlantilla(crudo: unknown): ResultadoCompraPlantilla {
  if (!esObjeto(crudo)) throw new Error('Plantillas: resultado inválido.');
  return {
    plantillaId: texto(crudo.plantilla_id, 'plantilla_id'),
    yaDesbloqueada: crudo.ya_desbloqueada === true,
    saldoRestante: numero(crudo.saldo_restante, 'saldo_restante'),
  };
}

/** check_violation del RPC: "No tienes gemas suficientes." (mismo código que la compra de semillas). */
export function esErrorGemasInsuficientes(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: unknown }).code === '23514';
}
