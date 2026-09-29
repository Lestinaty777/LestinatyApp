import { describe, expect, it } from 'vitest';
import { hsvARgb, rgbAHsv, tintarPixelHsv } from '../iconos/tinteHsv';
import { aplicarOscurecido, componerMatrices, calcularMatrizHue, matrizSaturacion, matrizSoloClaros } from './matrizColor';
import { contraste, crearTonoMaster, HUE_REFERENCIA_VERDE, PALETA_ESMERALDA, TONO_ESMERALDA, tintarHex } from './masterColor';
import { esHueVerde } from './matrizColor';

// master_pack_color reales de public.arboles_paquetes (consultados en Supabase).
const REALES = {
  abyss: '#21232F', celesthia: '#01B0CF', mathist: '#B25FFB', nevalhi: '#C0DFFC', sakura: '#FC70AF', valvery: '#02A0B0',
};

describe('crearTonoMaster', () => {
  it('Esmeralda devuelve las constantes exactas (los verdes que estaban hardcodeados)', () => {
    expect(crearTonoMaster('esmeralda', '#029060')).toBe(TONO_ESMERALDA);
    expect(TONO_ESMERALDA.hue).toBeUndefined();
  });

  it('un color inválido cae al tono Esmeralda en vez de propagar basura', () => {
    expect(crearTonoMaster('mathist', 'morado')).toBe(TONO_ESMERALDA);
  });

  // Rangos en matiz Oklch (no HSL): motor de la paleta migrado a Oklch — ver
  // el comentario de "Oklch" en masterColor.ts. El mismo color tiene un
  // matiz distinto medido en cada espacio, por eso los rangos ya no son los
  // mismos números que antes.
  it('Mathist queda en la familia morada y Sakura en la rosa', () => {
    expect(crearTonoMaster('mathist', REALES.mathist).hue).toBeGreaterThan(295);
    expect(crearTonoMaster('mathist', REALES.mathist).hue).toBeLessThan(315);
    expect(crearTonoMaster('sakura', REALES.sakura).hue).toBeGreaterThan(344);
    expect(crearTonoMaster('sakura', REALES.sakura).hue).toBeLessThan(360);
  });

  it('Abyss (casi gris y muy oscuro) baja la saturación de la paleta y apaga y oscurece los iconos', () => {
    const abyss = crearTonoMaster('abyss', REALES.abyss);
    expect(abyss.saturacion).toBeLessThan(0.35);
    expect(abyss.icono.saturacion).toBeLessThan(0.6);
    expect(abyss.icono.valor).toBeLessThan(0.7);
  });

  it('un paquete muy saturado no baja la saturación de la paleta', () => {
    expect(crearTonoMaster('mathist', REALES.mathist).saturacion).toBe(1);
  });

  it('el acento clampea Abyss y Nevalhi a una luminosidad legible', () => {
    const luminosidad = (hex: string) => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
      return (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
    };
    expect(luminosidad(crearTonoMaster('abyss', REALES.abyss).acento)).toBeGreaterThanOrEqual(0.34);
    expect(luminosidad(crearTonoMaster('nevalhi', REALES.nevalhi).acento)).toBeLessThanOrEqual(0.66);
  });

  it('Celesthia y Valvery comparten familia de hue pero no acento idéntico', () => {
    const celesthia = crearTonoMaster('celesthia', REALES.celesthia);
    const valvery = crearTonoMaster('valvery', REALES.valvery);
    // Bajo Oklch la diferencia entre estos dos es un poco mayor que los <6°
    // que daba HSL para el mismo par de colores — siguen siendo la misma
    // familia (azul/verdeazulado), no es un caso de deriva sin límite.
    expect(Math.abs((celesthia.hue ?? 0) - (valvery.hue ?? 0))).toBeLessThan(11);
    expect(celesthia.acento).not.toBe(valvery.acento);
  });
});

const TODOS = Object.entries(REALES_TODOS()).map(([id, hex]) => crearTonoMaster(id, hex));
function REALES_TODOS() {
  return { ...REALES, amber: '#F04D01', aurelia: '#FFD000', diamante: '#80B0E0', golden: '#FCB103', ignate: '#C10208', lightmoon: '#0045D0', crimsonmoon: '#C81E4B', eclipse: '#6A3FA0', moon: '#2F5FE0', vida: '#7CC72B' };
}

describe('paleta derivada', () => {
  it('Esmeralda conserva los 12 tonos congelados y no rota nada', () => {
    expect(TONO_ESMERALDA.paleta).toBe(PALETA_ESMERALDA);
    expect(Object.keys(PALETA_ESMERALDA)).toHaveLength(12);
    expect(TONO_ESMERALDA.deltaHue).toBeUndefined();
    expect(tintarHex(TONO_ESMERALDA, '#21A844')).toBe('#21A844');
  });

  it('el delta es el hue del paquete menos la referencia verde', () => {
    const sakura = crearTonoMaster('sakura', REALES.sakura);
    expect(sakura.deltaHue).toBeCloseTo((sakura.hue ?? 0) - HUE_REFERENCIA_VERDE, 5);
  });

  it('rotar un verde legado lo lleva a la familia del paquete y conserva su luminosidad', () => {
    const sakura = crearTonoMaster('sakura', REALES.sakura);
    const rotado = tintarHex(sakura, '#21A844');
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(rotado.slice(i, i + 2), 16));
    expect(r).toBeGreaterThan(g); // rosa: rojo domina sobre verde
    expect(esHueVerde(0)).toBe(false);
  });

  it.each(TODOS.map((tono) => [tono.id, tono] as const))('%s: botón (blanco sobre vivo) legible y texto legible sobre fondo', (_id, tono) => {
    expect(contraste('#FFFFFF', tono.paleta.vivo)).toBeGreaterThanOrEqual(3);
    expect(contraste(tono.paleta.texto, tono.paleta.fondo)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(tono.paleta.titulo, tono.paleta.fondo)).toBeGreaterThanOrEqual(4.5);
  });

  it('todos los tonos derivados tienen los 12 colores como hex válido', () => {
    for (const tono of TODOS) for (const hex of Object.values(tono.paleta)) expect(hex).toMatch(/^#[0-9A-F]{6}$/);
  });
});

describe('degradados', () => {
  const lum = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    return (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
  };
  const paradas = (tono: ReturnType<typeof crearTonoMaster>) => [tono.degradados.progreso, tono.degradados.progresoFondo, tono.degradados.texto, [tono.degradados.mastery.suave, tono.degradados.mastery.profunda], [tono.degradados.menta.suave, tono.degradados.menta.profunda, tono.degradados.menta.pie]];

  it('Esmeralda conserva las bases exactas de los degradados que estaban hardcodeados', () => {
    const g = TONO_ESMERALDA.degradados;
    expect(g.menta).toEqual({ suave: '#F3FCF3', profunda: '#E5F5E6', pie: '#8CCF92' });
    expect(g.mastery).toEqual({ suave: '#2F7D52', profunda: '#148549' });
    expect(g.progreso).toEqual(['#1F7C3E', '#58BE68', '#9AE59C']);
    expect(g.texto).toEqual(['#4AE67D', '#1B9A4B', '#116C33']);
  });

  // Orden de las paradas, no su valor exacto: con Oklch (y el piso de
  // claridad/croma que evita el café en la franja amarilla — ver
  // masterColor.ts) la claridad numérica de una parada SÍ puede moverse un
  // poco al rotar. Lo que de verdad importa para que el degradado se vea
  // "igual de degradado" es que la parada claramente más clara siga siendo
  // la más clara. Un umbral (no comparar como estricta desigualdad) porque
  // algunas paradas de Esmeralda ya casi empatan en luminosidad HSL (p. ej.
  // progresoFondo: 0.955 vs 0.959) — ahí HSL y Oklch pueden no concordar en
  // cuál es "un poquito" más clara, una diferencia invisible al ojo que no
  // debería contar como "cambió de forma".
  const UMBRAL_DIFERENCIA_PERCEPTIBLE = 0.05;

  it.each(TODOS.map((tono) => [tono.id, tono] as const))('%s: cada degradado conserva el orden de las paradas que sí se distinguen entre sí', (_id, tono) => {
    const originales = paradas(TONO_ESMERALDA);
    paradas(tono).forEach((derivado, i) => {
      expect(derivado).toHaveLength(originales[i].length);
      derivado.forEach((hex) => expect(hex).toMatch(/^#[0-9A-F]{6}$/));
      for (let a = 0; a < originales[i].length; a++) {
        for (let b = a + 1; b < originales[i].length; b++) {
          const diferenciaOriginal = lum(originales[i][a]) - lum(originales[i][b]);
          if (Math.abs(diferenciaOriginal) < UMBRAL_DIFERENCIA_PERCEPTIBLE) continue; // casi empatadas: cualquier orden vale
          const diferenciaDerivada = lum(derivado[a]) - lum(derivado[b]);
          expect(Math.sign(diferenciaDerivada)).toBe(Math.sign(diferenciaOriginal));
        }
      }
    });
  });

  it('los degradados de un paquete no son los de Esmeralda', () => {
    const sakura = crearTonoMaster('sakura', REALES.sakura);
    expect(sakura.degradados.progreso).not.toEqual(TONO_ESMERALDA.degradados.progreso);
    expect(sakura.degradados.menta.suave).not.toBe(TONO_ESMERALDA.degradados.menta.suave);
  });
});

describe('familia verde de iconos', () => {
  it('incluye los verdes medidos en assets (99°-155°) y excluye gemas, racha y niveles', () => {
    for (const hue of [99, 135, 148, 155]) expect(esHueVerde(hue)).toBe(true);
    for (const hue of [26, 47, 214, 266, 359]) expect(esHueVerde(hue)).toBe(false);
  });
});

describe('matrizColor', () => {
  const identidad = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];
  const cercano = (a: number[], b: number[]) => a.every((valor, i) => Math.abs(valor - b[i]) < 1e-9);

  it('saturación 1 es la identidad', () => {
    expect(cercano(matrizSaturacion(1), identidad)).toBe(true);
  });

  it('saturación 0 deja los tres canales iguales (gris)', () => {
    const m = matrizSaturacion(0);
    expect(cercano(m.slice(0, 5), m.slice(5, 10))).toBe(true);
    expect(cercano(m.slice(5, 10), m.slice(10, 15))).toBe(true);
  });

  it('componer con la identidad no cambia la matriz', () => {
    const hue = calcularMatrizHue(75);
    expect(cercano(componerMatrices(hue, identidad), hue)).toBe(true);
    expect(cercano(componerMatrices(identidad, hue), hue)).toBe(true);
  });

  it('rotar 90° dos veces equivale a rotar 180° una vez', () => {
    // Tolerancia laxa: los coeficientes de la matriz de hue (0.143, 0.140,
    // 0.283) son aproximaciones de la especificación SVG, no exactos.
    const dosVeces = componerMatrices(calcularMatrizHue(90), calcularMatrizHue(90));
    const directa = calcularMatrizHue(180);
    expect(dosVeces.every((valor, i) => Math.abs(valor - directa[i]) < 0.02)).toBe(true);
  });
});

describe('oscurecer solo lo que tiene color (Abyss)', () => {
  // Aplica una matriz 4x5 a un pixel sin premultiplicar (0..1) y recorta como el filtro de Skia.
  const aplicar = (m: number[], [r, g, b, a]: number[]) => [0, 1, 2, 3].map((fila) => Math.min(1, Math.max(0, m[fila * 5] * r + m[fila * 5 + 1] * g + m[fila * 5 + 2] * b + m[fila * 5 + 3] * a + m[fila * 5 + 4])));
  // Composición de la capa de arriba (claros) sobre la de abajo (color), ambas opacas debajo.
  const componerCapas = (abajo: number[], arriba: number[]) => { const alfa = arriba[3]; return [0, 1, 2].map((i) => arriba[i] * alfa + abajo[i] * (1 - alfa)); };

  const abyss = crearTonoMaster('abyss', '#21232F');
  const rotada = componerMatrices(calcularMatrizHue(abyss.deltaHue ?? 0), matrizSaturacion(abyss.icono.saturacion));
  const capaColor = aplicarOscurecido(rotada, Math.min(1, abyss.icono.valor));
  const capaClaros = matrizSoloClaros(rotada);
  const pixel = (p: number[]) => componerCapas(aplicar(capaColor, p), aplicar(capaClaros, p));

  it('Abyss sí oscurece (su tono lo pide) y por eso hay que proteger los blancos', () => {
    expect(abyss.icono.valor).toBeLessThan(0.8);
  });

  it('el blanco sigue siendo blanco, aunque el tono oscurezca', () => {
    const [r, g, b] = pixel([1, 1, 1, 1]);
    for (const canal of [r, g, b]) expect(canal).toBeGreaterThan(0.98);
    // sin la capa de claros el blanco se habría vuelto gris
    expect(aplicar(capaColor, [1, 1, 1, 1])[0]).toBeLessThan(0.8);
  });

  it('un verde saturado sí queda oscurecido (la capa de claros no lo toca)', () => {
    const verde = [34 / 255, 197 / 255, 94 / 255, 1];
    expect(aplicar(capaClaros, verde)[3]).toBe(0);
    const [r, g, b] = pixel(verde);
    const [or, og, ob] = aplicar(rotada, verde);
    expect(Math.max(r, g, b)).toBeLessThan(Math.max(or, og, ob) * 0.85);
  });

  it('un brillo claro (verde muy pálido) conserva su claridad', () => {
    const palido = [0.86, 0.96, 0.88, 1];
    expect(aplicar(capaClaros, palido)[3]).toBeGreaterThan(0.9);
  });

  it('un pixel transparente sigue transparente', () => {
    expect(aplicar(capaClaros, [0, 0, 0, 0])[3]).toBe(0);
  });

  it('un paquete claro (Sakura) no oscurece: aclara, y la matriz de respaldo no necesita segunda capa', () => {
    expect(crearTonoMaster('sakura', '#FC70AF').icono.valor).toBeGreaterThan(1);
  });
});

describe('iconos: el icono típico cae en el color del paquete (no pastel)', () => {
  // El icono verde "típico" de assets/icons (medido): saturación 0.67, valor 0.77, matiz verde.
  const TIPICO = hsvARgb({ h: 135 / 360, s: 0.67, v: 0.77 });
  const tintar = (tono: ReturnType<typeof crearTonoMaster>, rgb = TIPICO) =>
    rgbAHsv(tintarPixelHsv(rgb, { delta: tono.deltaHue ?? 0, oscuroGlobal: 1, saturacion: tono.icono.saturacion, valorTema: tono.icono.valor }));
  // El color REAL del paquete, no tono.acento: crearTonoMaster ajusta los
  // íconos contra masterPackColor a propósito (ver el comentario en
  // masterColor.ts) — acento existe para que el texto sea legible, no como
  // referencia de brillo de ícono.
  const hsvDelPaquete = (hex: string) => rgbAHsv([1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255));

  it('Eclipse (#6A3FA0): el icono queda en su morado profundo (S 0.61, V 0.63), no en un morado claro y desvaído', () => {
    const eclipse = crearTonoMaster('eclipse', '#6A3FA0');
    const resultado = tintar(eclipse);
    const objetivo = hsvDelPaquete('#6A3FA0');
    expect(resultado.s).toBeCloseTo(objetivo.s, 1);
    expect(resultado.v).toBeCloseTo(objetivo.v, 1);
    // antes: saturación 0.5× y sin oscurecer -> S 0.34, V 0.77 (pastel). Ahora es más oscuro y más saturado que eso.
    expect(resultado.v).toBeLessThan(0.7);
    expect(resultado.s).toBeGreaterThan(0.5);
  });

  it('Abyss: el icono queda en su gris azulado oscuro, no negro ni brillante', () => {
    const abyss = crearTonoMaster('abyss', '#21232F');
    const resultado = tintar(abyss);
    expect(resultado.v).toBeCloseTo(hsvDelPaquete('#21232F').v, 1);
    // Objetivo ahora es el color REAL de Abyss (muy oscuro, v=0.18), no el
    // acento ya aclarado para legibilidad — el ícono golpea el piso de
    // icono.valor (0.3) y queda en 0.77×0.3≈0.23. Sigue siendo gris oscuro,
    // no negro puro (v=0): antes daba más claro (~0.41) solo porque tomaba
    // prestado el clamp de legibilidad de `acento`, no porque hiciera falta
    // para el ícono.
    expect(resultado.v).toBeGreaterThan(0.2);
  });

  it('Ignate (rojo saturado): el icono queda igual de vivo que el paquete', () => {
    expect(tintar(crearTonoMaster('ignate', '#C10208')).s).toBeGreaterThan(0.85);
  });

  it('Nevalhi (azul claro): el icono se aclara respecto al verde original', () => {
    expect(tintar(crearTonoMaster('nevalhi', '#C0DFFC')).v).toBeGreaterThan(0.85);
  });

  it('un icono pálido sigue siendo más pálido que uno vivo bajo cualquier paquete (conserva su carácter)', () => {
    const eclipse = crearTonoMaster('eclipse', '#6A3FA0');
    const palido = hsvARgb({ h: 135 / 360, s: 0.24, v: 0.92 });
    expect(tintar(eclipse, palido).s).toBeLessThan(tintar(eclipse).s);
  });

  it('Esmeralda no cambia nada: factores 1', () => {
    expect(TONO_ESMERALDA.icono).toEqual({ saturacion: 1, valor: 1 });
  });
});
