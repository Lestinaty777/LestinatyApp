import type { AreaVida, AreaVidaResumen } from './areas.tipos';

// Validación defensiva de las filas de areas_vida y del área embebida en
// obtener_metas. Mismo criterio que rutinas.mapper.ts.

const COLOR_HEX = /^#[0-9A-Fa-f]{6}$/;

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function texto(valor: unknown, campo: string): string {
  if (typeof valor !== 'string' || valor.length === 0) throw new Error(`Áreas: "${campo}" inválido.`);
  return valor;
}

function color(valor: unknown): string {
  if (typeof valor !== 'string' || !COLOR_HEX.test(valor)) throw new Error('Áreas: "color" inválido.');
  return valor;
}

export function mapearAreaResumen(crudo: unknown): AreaVidaResumen {
  if (!esObjeto(crudo)) throw new Error('Áreas: área inválida.');
  return {
    id: texto(crudo.id, 'id'),
    codigo: typeof crudo.codigo === 'string' && crudo.codigo.length > 0 ? crudo.codigo : null,
    nombre: texto(crudo.nombre, 'nombre'),
    color: color(crudo.color),
    iconoLucide: texto(crudo.icono_lucide, 'icono_lucide'),
  };
}

export function mapearArea(crudo: unknown): AreaVida {
  const resumen = mapearAreaResumen(crudo);
  const fila = crudo as Record<string, unknown>;
  const orden = Number(fila.orden);
  return { ...resumen, orden: Number.isFinite(orden) ? orden : 100, esDelSistema: fila.usuario_id === null || fila.usuario_id === undefined };
}

export function mapearAreas(crudo: unknown): AreaVida[] {
  if (!Array.isArray(crudo)) throw new Error('Áreas: se esperaba una lista.');
  return crudo.map(mapearArea);
}

/** Nombre para mostrar: el de las áreas del sistema se traduce por su código; el de las propias es el que escribió la persona. */
export function nombreArea(area: Pick<AreaVida, 'codigo' | 'nombre'>, t: (clave: string) => string): string {
  return area.codigo ? t(`areas.sistema.${area.codigo}`) : area.nombre;
}
