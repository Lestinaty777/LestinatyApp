/// <reference types="node" />
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { esHueVerde } from '../tema/matrizColor';

// Lee el registro como texto: importarlo cargaría los PNG con require().
const RAIZ = process.cwd();
const REGISTRO = readFileSync(join(RAIZ, 'src/diseno/iconos/registroIconos.ts'), 'utf8');
const [bloqueContenido, bloqueInterfaz] = REGISTRO.split('const ICONOS_INTERFAZ');
const ENTRADA = /^\s+'?([\w/-]+)'?: icono\(require\('(?:\.\.\/)+assets\/icons\/([^']+)'\), (\d+)\),$/gm;

const leer = (texto: string) => [...texto.matchAll(ENTRADA)].map(([, id, archivo, hue]) => ({ id, archivo, hue: Number(hue) }));
const contenido = leer(bloqueContenido);
const interfaz = leer(bloqueInterfaz);
const todos = [...contenido, ...interfaz];

function pngs(dir: string, prefijo = ''): string[] {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    return statSync(ruta).isDirectory() ? pngs(ruta, `${prefijo}${nombre}/`) : nombre.endsWith('.png') ? [`${prefijo}${nombre}`] : [];
  });
}

describe('registro de iconos', () => {
  it('cada PNG de assets/icons está registrado, una sola vez', () => {
    const enDisco = pngs(join(RAIZ, 'assets/icons')).sort();
    const registrados = todos.map((entrada) => entrada.archivo).sort();
    expect(registrados).toEqual(enDisco);
  });

  it('los iconos de interfaz llevan prefijo de carpeta y los de contenido no: no se cuelan en el selector de hábitos', () => {
    expect(contenido.length).toBeGreaterThan(0);
    expect(interfaz.length).toBeGreaterThan(0);
    for (const { id } of contenido) expect(id, id).not.toContain('/');
    for (const { id } of interfaz) expect(id, id).toContain('/');
  });

  it('los ids no se repiten y cada hue es un ángulo válido', () => {
    const ids = todos.map((entrada) => entrada.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const { hue, id } of todos) { expect(hue, id).toBeGreaterThanOrEqual(0); expect(hue, id).toBeLessThan(360); }
  });

  it('la barra de navegación y hoy/habitos son verdes (siguen el tema); gemas, racha y niveles no', () => {
    const hueDe = (id: string) => todos.find((entrada) => entrada.id === id)?.hue ?? -1;
    for (const id of ['navegacion/hoy', 'navegacion/perfil', 'navegacion/insights', 'navegacion/explorar', 'navegacion/tienda', 'hoy/habitos', 'raiz/habitos']) expect(esHueVerde(hueDe(id)), id).toBe(true);
    for (const id of ['hoy/gemas', 'racha', 'nivel1', 'nivel7', 'hoy/notificaciones']) expect(esHueVerde(hueDe(id)), id).toBe(false);
  });
});

// Un icono verde pintado con `<Image source={require(...)}>` no cambia con el tema:
// tiene que pasar por <MasterIcon name="..."> (que sí lo tiñe). Los iconos que no
// son verdes pueden seguir con require directo — el tema no los toca.
// Los widgets de Android renderizan sin React (no hay hooks ni contexto).
function fuentes(dir: string): string[] {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) return nombre === 'node_modules' ? [] : fuentes(ruta);
    return /\.tsx?$/.test(nombre) && !nombre.includes('.test.') ? [ruta] : [];
  });
}

describe('iconos verdes fuera de MasterIcon', () => {
  const verdes = new Set(todos.filter((entrada) => esHueVerde(entrada.hue)).map((entrada) => entrada.archivo));
  const archivos = [...fuentes(join(RAIZ, 'src')), ...fuentes(join(RAIZ, 'app'))]
    .map((ruta) => ruta.slice(RAIZ.length + 1).split('\\').join('/'))
    .filter((ruta) => !ruta.startsWith('src/diseno/iconos/registro') && !ruta.includes('habitos/widgets/'));

  it('ningún archivo pinta un icono verde con require directo', () => {
    const infractores = archivos.flatMap((ruta) => {
      const texto = readFileSync(join(RAIZ, ruta), 'utf8');
      return [...texto.matchAll(/require\('(?:\.\.\/)+assets\/icons\/([^']+)'\)/g)].filter(([, archivo]) => verdes.has(archivo)).map(([, archivo]) => `${ruta} -> ${archivo}`);
    });
    expect(infractores).toEqual([]);
  });
});
