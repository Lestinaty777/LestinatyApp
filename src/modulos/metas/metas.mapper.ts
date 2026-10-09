import { mapearAreaResumen } from '../areas/areas.mapper';
import type { ConteosMeta, EstadoMeta, MetaVida } from './metas.tipos';

// Valida defensivamente lo que devuelve public.obtener_metas (jsonb, migración 87).

const ESTADOS: readonly EstadoMeta[] = ['activa', 'pausada', 'lograda', 'archivada'];

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function texto(valor: unknown, campo: string): string {
  if (typeof valor !== 'string' || valor.length === 0) throw new Error(`Metas: "${campo}" inválido.`);
  return valor;
}

function textoOpcional(valor: unknown): string | null {
  return typeof valor === 'string' && valor.length > 0 ? valor : null;
}

function entero(valor: unknown, porDefecto = 0): number {
  const numero = Number(valor);
  return Number.isFinite(numero) ? Math.trunc(numero) : porDefecto;
}

function enteroOpcional(valor: unknown): number | null {
  if (valor === null || valor === undefined) return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? Math.trunc(numero) : null;
}

function mapearConteos(crudo: unknown): ConteosMeta {
  const fila = esObjeto(crudo) ? crudo : {};
  return { habitos: entero(fila.habitos), tareas: entero(fila.tareas), rutinas: entero(fila.rutinas), planes: entero(fila.planes) };
}

export function mapearMeta(crudo: unknown): MetaVida {
  if (!esObjeto(crudo)) throw new Error('Metas: meta inválida.');
  const estado = crudo.estado;
  if (typeof estado !== 'string' || !(ESTADOS as readonly string[]).includes(estado)) throw new Error('Metas: "estado" inválido.');
  return {
    id: texto(crudo.id, 'id'),
    titulo: texto(crudo.titulo, 'titulo'),
    descripcion: textoOpcional(crudo.descripcion),
    estado: estado as EstadoMeta,
    iconoLucide: textoOpcional(crudo.icono_lucide),
    color: textoOpcional(crudo.color),
    fechaInicio: texto(crudo.fecha_inicio, 'fecha_inicio'),
    duracionDias: enteroOpcional(crudo.duracion_dias),
    diaActual: Math.max(0, entero(crudo.dia_actual)),
    diasRestantes: enteroOpcional(crudo.dias_restantes),
    logradaEn: textoOpcional(crudo.lograda_en),
    orden: entero(crudo.orden),
    area: crudo.area === null || crudo.area === undefined ? null : mapearAreaResumen(crudo.area),
    conteos: mapearConteos(crudo.conteos),
  };
}

export function mapearMetas(crudo: unknown): MetaVida[] {
  if (!Array.isArray(crudo)) throw new Error('Metas: se esperaba una lista.');
  return crudo.map(mapearMeta);
}

export type ProgresoPlazo = { dia: number; total: number; porcentaje: number };

/** Avance del plazo de una meta; null si no tiene plan fijo de días. */
export function progresoPlazoMeta(meta: Pick<MetaVida, 'duracionDias' | 'diaActual'>): ProgresoPlazo | null {
  if (!meta.duracionDias || meta.duracionDias <= 0) return null;
  const dia = Math.min(Math.max(meta.diaActual, 0), meta.duracionDias);
  return { dia, total: meta.duracionDias, porcentaje: Math.round((dia * 100) / meta.duracionDias) };
}

/** meta → área, para resolver el área de un hábito, tarea, rutina o plan a partir de su meta. */
export function areaPorMeta(metas: readonly Pick<MetaVida, 'id' | 'area'>[]): Map<string, string | null> {
  return new Map(metas.map((meta) => [meta.id, meta.area?.id ?? null] as const));
}

/** Área de un elemento: la de su meta. Sin meta, o con una meta sin área (o desconocida), no tiene. */
export function areaDeElemento(metaId: string | null | undefined, areas: ReadonlyMap<string, string | null>): string | null {
  return metaId ? areas.get(metaId) ?? null : null;
}
