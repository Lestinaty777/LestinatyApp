/// <reference types="node" />
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { recursosI18n } from '../../servicios/i18n/recursos';

type Arbol = { [clave: string]: string | Arbol };

function rutas(arbol: Arbol, prefijo = ''): string[] {
  return Object.entries(arbol).flatMap(([clave, valor]) => (typeof valor === 'string' ? [`${prefijo}${clave}`] : rutas(valor, `${prefijo}${clave}.`)));
}

function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) return archivos(ruta);
    return /\.tsx?$/.test(nombre) && !/\.test\.tsx?$/.test(nombre) ? [ruta] : [];
  });
}

const es = recursosI18n.es.translation as unknown as Record<string, Arbol>;
const en = recursosI18n.en.translation as unknown as Record<string, Arbol>;

describe('i18n de Metas y Áreas', () => {
  it.each(['metas', 'areas'])('es y en declaran las mismas claves en "%s"', (bloque) => {
    expect(rutas(es[bloque]).sort()).toEqual(rutas(en[bloque]).sort());
  });

  it('toda clave literal metas.* o areas.* usada en los módulos existe (con o sin plural)', () => {
    const existentes = new Set(['metas', 'areas'].flatMap((bloque) => rutas(es[bloque]).map((ruta) => `${bloque}.${ruta}`.replace(/_(one|other)$/, ''))));
    const usadas = new Set<string>();
    for (const carpeta of ['src/modulos/metas', 'src/modulos/areas']) {
      for (const archivo of archivos(join(process.cwd(), carpeta))) {
        for (const [, clave] of readFileSync(archivo, 'utf8').matchAll(/\bt\(\s*'((?:metas|areas)\.[\w.]+)'/g)) usadas.add(clave);
      }
    }
    expect(usadas.size).toBeGreaterThan(30);
    expect([...usadas].filter((clave) => !existentes.has(clave))).toEqual([]);
  });

  it('declara las claves dinámicas: vistas, accesos, acciones, tipos y errores del formulario', () => {
    const existentes = new Set(rutas(es.metas));
    for (const vista of ['activas', 'mis', 'logradas', 'areas']) expect(existentes).toContain(`pantalla.vista.${vista}`);
    for (const acceso of ['mis', 'creacion', 'logradas', 'areas']) {
      expect(existentes).toContain(`pantalla.access.${acceso}.label`);
      expect(existentes).toContain(`pantalla.access.${acceso}.description`);
    }
    for (const accion of ['lograr', 'pausar', 'reanudar', 'reabrir', 'editar', 'archivar', 'contenido']) expect(existentes).toContain(`acciones.${accion}`);
    for (const tipo of ['habito', 'tarea', 'rutina', 'plan']) expect(existentes).toContain(`elementos.tipo.${tipo}`);
    for (const error of ['titulo', 'area', 'duracion', 'guardar']) expect(existentes).toContain(`formulario.error.${error}`);
  });
});
