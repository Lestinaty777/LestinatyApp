/// <reference types="node" />
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Regla del sistema de color: TODO verde de la UI pertenece a Esmeralda. Un
// verde se escribe con `esm('#HEX')` (useTintarHex) — en Esmeralda devuelve
// ese mismo color, exacto, y en los demás paquetes lo rota — o sale de los
// tokens de MasterColor (paleta, degradados). Un literal verde crudo queda
// fuera del sistema: no cambiaría al cambiar de tema.
//
// Trinquete: PENDIENTES son los archivos que todavía tienen verdes crudos.
// Ningún archivo nuevo puede sumarse, y cuando uno se migra el test obliga a
// sacarlo de la lista — la lista solo puede achicarse.

const PENDIENTES: string[] = [];

// Archivos que conservan hex verdes exactos A PROPÓSITO: la vista previa del widget
// de Android debe mostrar los mismos colores que el widget real (que no puede leer el
// tema ni la escala), así que se mantienen literales.
const EXENTOS_POR_DISENO: Record<string, string> = {
  'src/modulos/habitos/widgets/VistaPreviaWidgetHabito.tsx': 'vista previa que imita el widget de Android: hex exactos del widget',
  'src/modulos/habitos/nacarMandala.ts': 'master_pack_color reales de arboles_paquetes (datos del paquete, no UI): identifican el paquete por color',
  'src/modulos/habitos/cofreVideoPaquete.ios.ts': 'color exacto sobre el que se aplanó cada MP4 de cofre (los píxeles del vídeo no cambian con el tema): el fondo del VideoView tiene que coincidir byte a byte',
};

// app/ también: ahí vive la barra de navegación (_layout), que se escapó cuando solo se miraba src/.
const RAICES = ['src', 'app'].map((carpeta) => join(process.cwd(), carpeta));
// Aquí viven los verdes de Esmeralda: la escala y los tokens que apuntan a ella.
const DEFINICIONES = ['src/diseno/tema/masterColor.ts', 'src/diseno/tema/escalaEsmeralda.ts'];

function esVerde(r: number, g: number, b: number) {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn), l = (max + min) / 2;
  if (max === min) return false;
  const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = 60 * (max === rn ? (gn - bn) / d + (gn < bn ? 6 : 0) : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4);
  return h >= 70 && h <= 175 && s > 0.08 && l > 0.05 && l < 0.985;
}

function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) return archivos(ruta);
    return /\.tsx?$/.test(nombre) && !nombre.includes('.test.') ? [ruta] : [];
  });
}

const todosLosArchivos = () => RAICES.flatMap(archivos);

function sinComentarios(codigo: string) {
  return codigo.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').map((linea) => linea.replace(/(^|[^:'"`])\/\/.*$/, '$1')).join('\n');
}

// Colores con nombre de CSS que caen en la familia verde.
const NOMBRES_VERDES = ['green', 'lime', 'limegreen', 'forestgreen', 'seagreen', 'springgreen', 'mediumseagreen', 'darkgreen', 'lightgreen', 'palegreen', 'olive', 'teal', 'mediumspringgreen', 'chartreuse', 'greenyellow', 'yellowgreen', 'darkseagreen', 'aquamarine'];

function hslAVerde(h: number, s: number, l: number) {
  return h >= 70 && h <= 175 && s > 0.08 && l > 0.05 && l < 0.985;
}

function tieneVerdeCrudo(codigo: string) {
  const sinEsm = sinComentarios(codigo).replace(/esm\(\s*['"]#[0-9A-Fa-f]{6}['"]\s*\)/g, '');
  // hex de 3, 4, 6 y 8 dígitos (los cortos se expanden: #0f0 = #00ff00)
  for (const [, crudo] of sinEsm.matchAll(/#([0-9A-Fa-f]{8}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{3})\b/g)) {
    const hex = crudo.length <= 4 ? crudo.slice(0, 3).split('').map((c) => c + c).join('') : crudo;
    if (esVerde(parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16))) return true;
  }
  for (const [, r, g, b] of sinEsm.matchAll(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/g)) {
    if (esVerde(Number(r), Number(g), Number(b))) return true;
  }
  for (const [, h, s, l] of sinEsm.matchAll(/hsla?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)%?\s*,\s*(\d+(?:\.\d+)?)%/g)) {
    if (hslAVerde(Number(h), Number(s) / 100, Number(l) / 100)) return true;
  }
  return NOMBRES_VERDES.some((nombre) => new RegExp(`['"]${nombre}['"]`).test(sinEsm));
}

const conVerdeCrudo = todosLosArchivos()
  .map((ruta) => ruta.slice(process.cwd().length + 1).split('\\').join('/'))
  .filter((ruta) => !DEFINICIONES.includes(ruta))
  .filter((ruta) => tieneVerdeCrudo(readFileSync(join(process.cwd(), ruta), 'utf8')))
  .sort();

describe('verdes de la UI pertenecen a Esmeralda', () => {
  it('ningún archivo nuevo escribe verdes crudos (usa esm(\'#HEX\') o un token de MasterColor)', () => {
    expect(conVerdeCrudo.filter((ruta) => !PENDIENTES.includes(ruta) && !(ruta in EXENTOS_POR_DISENO))).toEqual([]);
  });

  it('los exentos por diseño siguen teniendo verdes literales (si no, ya no hace falta la excepción)', () => {
    expect(Object.keys(EXENTOS_POR_DISENO).filter((ruta) => !conVerdeCrudo.includes(ruta))).toEqual([]);
  });

  it('los archivos ya migrados salen de PENDIENTES', () => {
    expect(PENDIENTES.filter((ruta) => !conVerdeCrudo.includes(ruta))).toEqual([]);
  });
});

// Segundo trinquete: verdes escritos con la escala ESTÁTICA (ESCALA_ESMERALDA).
// Ya son parte del sistema (salen de la escala), pero no reaccionan al tema.
// Cada archivo lleva su razón: unos son estáticos POR DISEÑO (colores de
// identidad como categorías o paquetes, datos que otro cálculo rota, widgets de
// Android sin hooks, splash de marca) y otros están PENDIENTES de hacerse
// reactivos (convertir la constante en función del tono, ver useEscala) — esos
// salen de la lista al migrarse. Un archivo nuevo no puede sumarse sin decidirlo.
const ESTATICOS: Record<string, string> = {
  'src/diseno/fundamentos/colores.ts': 'PENDIENTE: constante de módulo o helper compartido, hacerlo reactivo',
  'src/diseno/fundamentos/sombras.ts': 'PENDIENTE: constante de módulo o helper compartido, hacerlo reactivo',
  'src/diseno/tema/ui.ts': 'PENDIENTE: constante de módulo o helper compartido, hacerlo reactivo',
  'src/diseno/ui/MasterText.tsx': 'PENDIENTE: constante de módulo o helper compartido, hacerlo reactivo',
  'src/modulos/aby/componentes/decoracionBiomaAby.config.ts': 'PENDIENTE: constante de módulo o helper compartido, hacerlo reactivo',
  'src/modulos/aby/datos/categoriasAby.ts': 'PENDIENTE: constante de módulo o helper compartido, hacerlo reactivo',
  'src/modulos/aby/datos/intencionesEstudioAby.ts': 'PENDIENTE: constante de módulo o helper compartido, hacerlo reactivo',
  'src/modulos/acceso/componentes/CampoOtp.tsx': 'colores de identidad o datos de cálculo (categorías, paquetes, especies, paleta que se rota)',
  'src/modulos/acceso/componentes/PantallaAcceso.tsx': 'PENDIENTE: constante de módulo o helper compartido, hacerlo reactivo',
  'src/modulos/habitos/componentes/ChasisTelefonoAndroid.tsx': 'colores de identidad o datos de cálculo (categorías, paquetes, especies, paleta que se rota)',
  'src/modulos/habitos/habitos.servicio.ts': 'PENDIENTE: constante de módulo o helper compartido, hacerlo reactivo',
  'src/modulos/habitos/iconosHabitos.ts': 'PENDIENTE: constante de módulo o helper compartido, hacerlo reactivo',
  'src/modulos/habitos/pantallas/CategoriaHabitosPantalla.tsx': 'PENDIENTE: constante de módulo o helper compartido, hacerlo reactivo',
  'src/modulos/habitos/pantallas/HabitosPantalla.tsx': 'PENDIENTE: constante de módulo o helper compartido, hacerlo reactivo',
  'src/modulos/habitos/widgets/HabitoFocoWidget.tsx': 'widget de Android o splash: sin hooks, o color de marca',
  'src/modulos/habitos/widgets/VistaPreviaWidgetCalendario.tsx': 'widget de Android o splash: sin hooks, o color de marca',
  'src/modulos/habitos/widgets/mapearHabitoWidget.ts': 'widget de Android o splash: sin hooks, o color de marca',
  'src/modulos/hoy/pantallas/HoyPantalla.tsx': 'colores de identidad o datos de cálculo (categorías, paquetes, especies, paleta que se rota)',
  'src/modulos/insights/componentes/GaleriaWidgetsModal.tsx': 'PENDIENTE: constante de módulo o helper compartido, hacerlo reactivo',
  'src/modulos/insights/componentes/SeccionProgresoDatos.tsx': 'PENDIENTE: constante de módulo o helper compartido, hacerlo reactivo',
  'src/modulos/insights/pantallas/InsightsPantalla.tsx': 'PENDIENTE: constante de módulo o helper compartido, hacerlo reactivo',
  'src/modulos/metas/pantallas/PanelMetasPantalla.tsx': 'PENDIENTE: constante de módulo o helper compartido, hacerlo reactivo',
  'src/modulos/miEspacio/pantallas/MiEspacioPantalla.tsx': 'colores de identidad o datos de cálculo (categorías, paquetes, especies, paleta que se rota)',
  'src/modulos/onboarding/componentes/CarruselArbolRegalo.tsx': 'colores de identidad o datos de cálculo (categorías, paquetes, especies, paleta que se rota)',
  'src/modulos/onboarding/componentes/FormularioAccesoOnboarding.tsx': 'PENDIENTE: constante de módulo o helper compartido, hacerlo reactivo',
  'src/modulos/onboarding/componentes/SelectorArbolRegalo.tsx': 'PENDIENTE: constante de módulo o helper compartido, hacerlo reactivo',
  'src/modulos/onboarding/pantallas/AccesoOnboardingPantalla.tsx': 'PENDIENTE: constante de módulo o helper compartido, hacerlo reactivo',
  'src/modulos/onboarding/pantallas/IntroduccionAppPantalla.tsx': 'colores de identidad o datos de cálculo (categorías, paquetes, especies, paleta que se rota)',
  'src/modulos/onboarding/pantallas/RegaloBienvenidaPantalla.tsx': 'PENDIENTE: constante de módulo o helper compartido, hacerlo reactivo',
  'src/modulos/onboarding/pantallas/RegaloTrialHorizonPantalla.tsx': 'PENDIENTE: constante de módulo o helper compartido, hacerlo reactivo',
  'src/modulos/senderos/componentes/EstadoVacioSenderos.tsx': 'PENDIENTE: constante de módulo o helper compartido, hacerlo reactivo',
  'src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx': 'colores de identidad o datos de cálculo (categorías, paquetes, especies, paleta que se rota)',
  'src/modulos/senderos/componentes/mapa/PedestalNodo.tsx': 'colores de identidad o datos de cálculo (categorías, paquetes, especies, paleta que se rota)',
  'src/modulos/senderos/datos/modulosCategorias.ts': 'PENDIENTE: constante de módulo o helper compartido, hacerlo reactivo',
  'src/modulos/senderos/paginas/AnalisisSenderos.tsx': 'colores de identidad o datos de cálculo (categorías, paquetes, especies, paleta que se rota)',
  'src/modulos/senderos/paginas/analisis/salud/SaludAnalisis.tsx': 'colores de identidad o datos de cálculo (categorías, paquetes, especies, paleta que se rota)',
  'src/modulos/senderos/paginas/compartidos.ts': 'PENDIENTE: constante de módulo o helper compartido, hacerlo reactivo',
  'src/modulos/senderos/pantallas/BibliotecaSenderosPantalla.tsx': 'colores de identidad o datos de cálculo (categorías, paquetes, especies, paleta que se rota)',
  'src/modulos/senderos/pantallas/SenderosPantalla.tsx': 'colores de identidad o datos de cálculo (categorías, paquetes, especies, paleta que se rota)',
  'src/modulos/senderos/pantallas/SesionMisionPantalla.tsx': 'PENDIENTE: constante de módulo o helper compartido, hacerlo reactivo',
  'src/modulos/tienda/pantallas/TiendaArbolesPantalla.tsx': 'colores de identidad o datos de cálculo (categorías, paquetes, especies, paleta que se rota)',
  'src/nucleo/arranque/AnimacionApertura.tsx': 'widget de Android o splash: sin hooks, o color de marca',
};

const conEscalaEstatica = todosLosArchivos()
  .map((ruta) => ruta.slice(process.cwd().length + 1).split('\\').join('/'))
  .filter((ruta) => !DEFINICIONES.includes(ruta) && ruta !== 'src/diseno/index.ts')
  .filter((ruta) => sinComentarios(readFileSync(join(process.cwd(), ruta), 'utf8')).includes('ESCALA_ESMERALDA'))
  .sort();

describe('verdes estáticos (no reaccionan al tema)', () => {
  it('ningún archivo nuevo usa la escala estática: en componentes se usa useEscala()', () => {
    expect(conEscalaEstatica.filter((ruta) => !(ruta in ESTATICOS))).toEqual([]);
  });

  it('los archivos que ya son reactivos salen de ESTATICOS', () => {
    expect(Object.keys(ESTATICOS).filter((ruta) => !conEscalaEstatica.includes(ruta))).toEqual([]);
  });
});

// Tercer trinquete: los tokens de MARCA (colores.primario*) son verdes con otro
// nombre. Un componente que los use directo no sigue el tema: debe leerlos de
// useColores(). (Los semánticos —exito, error, acento— no se tiñen a propósito.)
const USA_TOKEN_MARCA = /\bcolores\.(primario|primarioOscuro|primarioTexto|primarioSuave)\b/;
const TOKENS_MARCA_POR_DISENO: Record<string, string> = {
  'src/diseno/tema/biomas.ts': 'dato de un bioma (color de árbol), no cromo de la UI',
};

describe('tokens de marca (colores.primario*)', () => {
  const usan = todosLosArchivos()
    .map((ruta) => ruta.slice(process.cwd().length + 1).split('\\').join('/'))
    .filter((ruta) => ruta !== 'src/diseno/fundamentos/colores.ts')
    .filter((ruta) => USA_TOKEN_MARCA.test(sinComentarios(readFileSync(join(process.cwd(), ruta), 'utf8'))))
    .sort();

  it('nadie los usa directo salvo por diseño: en componentes se lee useColores()', () => {
    expect(usan.filter((ruta) => !(ruta in TOKENS_MARCA_POR_DISENO))).toEqual([]);
  });

  it('las excepciones por diseño siguen usándolos', () => {
    expect(Object.keys(TOKENS_MARCA_POR_DISENO).filter((ruta) => !usan.includes(ruta))).toEqual([]);
  });
});
