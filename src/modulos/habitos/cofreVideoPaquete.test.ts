import { readFileSync } from 'node:fs';
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
