import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// No se importa cofreVideoPaquete.ts como módulo: sus 17 require() a .webm
// hacen que esbuild intente parsear el binario como JS y explota (mismo
// límite por el que registroIconos.ts tampoco se importa en tests — ningún
// require() de asset binario es cargable bajo vitest en este proyecto). Se
// valida en cambio el código fuente: que exista un require() estático por
// cada id y que el fallback caiga en Esmeralda.
const IDS_PAQUETE = [
  'abyss', 'amber', 'aurelia', 'celesthia', 'crimsonmoon', 'diamante',
  'eclipse', 'esmeralda', 'golden', 'ignate', 'lightmoon', 'mathist',
  'moon', 'nevalhi', 'sakura', 'valvery', 'vida',
];

const codigoFuente = readFileSync(join(process.cwd(), 'src/modulos/habitos/cofreVideoPaquete.ts'), 'utf8');

describe('cofreVideoPaquete.ts', () => {
  it.each(IDS_PAQUETE)('tiene un require() estático para %s', (id) => {
    expect(codigoFuente).toMatch(new RegExp(`${id}: require\\('[^']+abrir-cofre-${id}\\.webm'\\)`));
  });

  it('cae a resolverPaqueteHabito (fallback Esmeralda) para ids desconocidos', () => {
    expect(codigoFuente).toContain('resolverPaqueteHabito(paqueteId)');
  });
});

// iOS no reproduce WebM: cofreVideoPaquete.ios.ts (Metro lo elige solo en
// iPhone) apunta a MP4s de cofres/ios/. Sin este archivo o sin alguno de los
// MP4, el cofre vuelve a abrirse sin vídeo en iOS y nadie se entera en tests.
const codigoIos = readFileSync(join(process.cwd(), 'src/modulos/habitos/cofreVideoPaquete.ios.ts'), 'utf8');

describe('cofreVideoPaquete.ios.ts', () => {
  it.each(IDS_PAQUETE)('%s: require() a un MP4 que existe en disco', (id) => {
    expect(codigoIos).toMatch(new RegExp(`${id}: require\\('[^']+/cofres/ios/abrir-cofre-${id}\\.mp4'\\)`));
    expect(existsSync(join(process.cwd(), `assets/ilustraciones/senderos/biomas/cofres/ios/abrir-cofre-${id}.mp4`))).toBe(true);
  });

  it.each(IDS_PAQUETE)('%s: tiene color de fondo hexadecimal', (id) => {
    expect(codigoIos).toMatch(new RegExp(`${id}: '#[0-9a-f]{6}'`));
  });

  it('no usa WebM (iOS no lo reproduce)', () => {
    expect(codigoIos).not.toMatch(/require\('[^']*\.webm'\)/);
  });
});
