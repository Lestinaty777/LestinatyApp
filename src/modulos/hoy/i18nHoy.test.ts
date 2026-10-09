/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { recursosI18n } from '../../servicios/i18n/recursos';

type Arbol = { [clave: string]: string | Arbol };

function rutas(arbol: Arbol, prefijo = ''): string[] {
  return Object.entries(arbol).flatMap(([clave, valor]) => (typeof valor === 'string' ? [`${prefijo}${clave}`] : rutas(valor, `${prefijo}${clave}.`)));
}

const es = recursosI18n.es.translation as unknown as Record<string, Arbol>;
const en = recursosI18n.en.translation as unknown as Record<string, Arbol>;

describe('i18n de Hoy y franjas', () => {
  it.each(['hoy', 'franjas'])('es y en declaran las mismas claves en "%s"', (bloque) => {
    expect(rutas(es[bloque]).sort()).toEqual(rutas(en[bloque]).sort());
  });

  it('toda clave literal hoy.* o franjas.* usada en HoyPantalla existe', () => {
    const existentes = new Set(['hoy', 'franjas'].flatMap((bloque) => rutas(es[bloque]).map((ruta) => `${bloque}.${ruta}`.replace(/_(one|other)$/, ''))));
    const fuente = readFileSync(join(process.cwd(), 'src/modulos/hoy/pantallas/HoyPantalla.tsx'), 'utf8');
    const usadas = [...fuente.matchAll(/\bt\(\s*'((?:hoy|franjas)\.[\w.]+)'/g)].map(([, clave]) => clave);
    expect(usadas.length).toBeGreaterThan(10);
    expect(usadas.filter((clave) => !existentes.has(clave))).toEqual([]);
  });

  it('declara las claves dinámicas de saludo y tipo', () => {
    const existentes = new Set(rutas(es.hoy));
    for (const franja of ['manana', 'tarde', 'noche']) expect(existentes).toContain(`saludo.${franja}`);
    for (const tipo of ['habito', 'tarea', 'rutina']) expect(existentes).toContain(`tipo.${tipo}`);
  });
});
