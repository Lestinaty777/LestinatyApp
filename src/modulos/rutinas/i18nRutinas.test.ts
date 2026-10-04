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

const es = recursosI18n.es.translation.rutinas as unknown as Arbol;
const en = recursosI18n.en.translation.rutinas as unknown as Arbol;

describe('i18n de Rutinas', () => {
  it('es y en declaran exactamente las mismas claves', () => {
    expect(rutas(es).sort()).toEqual(rutas(en).sort());
  });

  it('toda clave literal usada en el módulo existe (con o sin plural)', () => {
    const existentes = new Set(rutas(es).map((ruta) => `rutinas.${ruta}`.replace(/_(one|other)$/, '')));
    const usadas = new Set<string>();
    for (const archivo of archivos(join(process.cwd(), 'src/modulos/rutinas'))) {
      for (const [, clave] of readFileSync(archivo, 'utf8').matchAll(/\bt\(\s*'(rutinas\.[\w.]+)'/g)) usadas.add(clave);
    }
    expect(usadas.size).toBeGreaterThan(20);
    expect([...usadas].filter((clave) => !existentes.has(clave))).toEqual([]);
  });

  it('declara las claves dinámicas: franjas, días y accesos', () => {
    const existentes = new Set(rutas(es).map((ruta) => `rutinas.${ruta}`));
    for (const franja of ['manana', 'tarde', 'noche', 'todo', 'cualquier_momento']) expect(existentes).toContain(`rutinas.franjas.${franja}`);
    for (const dia of [1, 2, 3, 4, 5, 6, 7]) expect(existentes).toContain(`rutinas.crear.d${dia}`);
    for (const acceso of ['progresion', 'creacion', 'recordatorios', 'plantillas']) {
      expect(existentes).toContain(`rutinas.pantalla.access.${acceso}.label`);
      expect(existentes).toContain(`rutinas.pantalla.access.${acceso}.description`);
    }
  });
});
