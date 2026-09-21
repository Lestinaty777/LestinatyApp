/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ID_TEMA_GRATUITO, opcionesDeTema, temaSigueVigente } from './temasDesbloqueados';

const CATALOGO = [
  { id: 'sakura', masterPackColor: '#FC70AF', nombre: 'Sakura' },
  { id: 'mathist', masterPackColor: '#B25FFB', nombre: 'Mathist' },
  { id: 'eclipse', masterPackColor: '#6A3FA0', nombre: 'Eclipse' },
];

describe('opcionesDeTema', () => {
  it('Esmeralda siempre está, primera y libre, aunque el usuario no tenga nada', () => {
    const [primera, ...resto] = opcionesDeTema(CATALOGO, []);
    expect(primera).toMatchObject({ bloqueado: false, id: ID_TEMA_GRATUITO });
    expect(resto.every((opcion) => opcion.bloqueado)).toBe(true);
  });

  it('un paquete desbloqueado queda libre aunque su semilla ya se haya gastado (no depende de las semillas)', () => {
    // Solo se pasa la lista de paquetes desbloqueados: no hay ninguna semilla disponible en juego.
    const opciones = opcionesDeTema(CATALOGO, ['mathist']);
    expect(opciones.find((opcion) => opcion.id === 'mathist')?.bloqueado).toBe(false);
    expect(opciones.find((opcion) => opcion.id === 'sakura')?.bloqueado).toBe(true);
  });

  it('los desbloqueados van antes que los bloqueados y cada grupo por nombre', () => {
    expect(opcionesDeTema(CATALOGO, ['mathist']).map((opcion) => opcion.id)).toEqual(['esmeralda', 'mathist', 'eclipse', 'sakura']);
  });

  it('cada tema lleva su rareza: Esmeralda gratis, el resto la del catálogo', () => {
    const opciones = opcionesDeTema([{ id: 'moon', masterPackColor: '#2F5FE0', nombre: 'Moon', rareza: 'unico' }, ...CATALOGO], []);
    expect(opciones.find((opcion) => opcion.id === 'esmeralda')?.rareza).toBe('gratis');
    expect(opciones.find((opcion) => opcion.id === 'moon')?.rareza).toBe('unico');
    expect(opciones.find((opcion) => opcion.id === 'sakura')?.rareza).toBe('legendario');
  });

  it('no duplica Esmeralda si el catálogo la trajera', () => {
    const opciones = opcionesDeTema([...CATALOGO, { id: 'esmeralda', masterPackColor: '#029060', nombre: 'Esmeralda' }], []);
    expect(opciones.filter((opcion) => opcion.id === 'esmeralda')).toHaveLength(1);
  });
});

describe('temaSigueVigente', () => {
  it('sin preferencia o con Esmeralda siempre es válido', () => {
    expect(temaSigueVigente(null, [])).toBe(true);
    expect(temaSigueVigente(undefined, [])).toBe(true);
    expect(temaSigueVigente('esmeralda', [])).toBe(true);
  });

  it('un paquete desbloqueado sigue vigente', () => {
    expect(temaSigueVigente('mathist', ['mathist', 'aurelia'])).toBe(true);
  });

  it('un paquete que el usuario no tiene se revoca (otra cuenta en el mismo teléfono, o una preferencia manipulada)', () => {
    expect(temaSigueVigente('sakura', ['mathist'])).toBe(false);
    expect(temaSigueVigente('sakura', [])).toBe(false);
  });
});

// El requisito: gastar la semilla no quita el tema. Se asegura en el código: nada de la personalización puede leer
// las semillas DISPONIBLES (las que aún no se plantaron), solo el registro durable de paquetes desbloqueados.
describe('la personalización no depende de las semillas disponibles', () => {
  const RAIZ = process.cwd();
  const archivos = [
    'src/modulos/tienda/temasDesbloqueados.ts',
    'src/modulos/tienda/usePaquetesDesbloqueados.ts',
    'src/modulos/direccion/componentes/SeccionTemaColor.tsx',
    'src/nucleo/proveedor/ProveedorTemaMaster.tsx',
  ];

  it.each(archivos)('%s no usa obtenerSemillasDisponibles ni CLAVE_SEMILLAS_DISPONIBLES', (ruta) => {
    const texto = readFileSync(join(RAIZ, ruta), 'utf8').replace(/\/\/.*$/gm, '');
    expect(texto).not.toMatch(/obtenerSemillasDisponibles|CLAVE_SEMILLAS_DISPONIBLES/);
  });
});
