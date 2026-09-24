import type { TrazoMandala } from './mandalaNodo.tipos';

// Extrusión real de la mandala: cada contorno (polígono plano en unidades
// del lienzo, centrado en 0,0) se vuelve un prisma de grosor `grosor`. La
// cara frontal está en z = +grosor/2 y el reverso en z = −grosor/2; de cada
// lado del contorno sale una pared (un cuadrilátero entre ambas caras).
// Todo se proyecta aquí con la misma matriz que usaban las transformaciones
// de React Native (rotateY, luego rotateX, luego perspectiva), así la pose
// no cambia respecto de la versión por láminas.
//
// Las funciones llevan 'worklet': se ejecutan en el hilo de UI a cada cuadro
// del giro, dentro de un useDerivedValue.

/** Contorno plano como [x0, y0, x1, y1, …], siempre en sentido antihorario. */
export type PoligonoPlano = number[];

export type CamaraMandala = {
  /** Giro sobre el eje vertical, en grados. */
  giroGrados: number;
  /** Recostado sobre el eje horizontal, en grados. */
  inclinacionGrados: number;
  /** Distancia de cámara en px (el `perspective` de React Native). */
  distancia: number;
  /** px por unidad del lienzo. */
  escala: number;
  /** Centro del dibujo en el Canvas, en px. */
  centro: number;
  /** Grosor total en px. */
  grosor: number;
};

export type ExtrusionProyectada = {
  /** Polígonos proyectados de la cara visible (frente o reverso). */
  cara: number[][];
  /** true si la cara visible es la frontal. */
  frenteVisible: boolean;
  /** 0–1: cuánto recibe la luz la cara visible. */
  luzCara: number;
  /** Paredes visibles como cuadriláteros [x0,y0,…,x3,y3], agrupadas por tono (0 = más oscuro). */
  paredesPorTono: number[][];
};

export const TONOS_PARED = 4;

// Luz fija arriba a la izquierda y hacia la cámara, normalizada.
const LUZ_X = -0.45;
const LUZ_Y = -0.55;
const LUZ_Z = 0.7;
const LUZ_LARGO = Math.hypot(LUZ_X, LUZ_Y, LUZ_Z);
const LX = LUZ_X / LUZ_LARGO;
const LY = LUZ_Y / LUZ_LARGO;
const LZ = LUZ_Z / LUZ_LARGO;

function areaConSigno(puntos: TrazoMandala[]) {
  let area = 0;
  for (let i = 0; i < puntos.length; i += 1) {
    const a = puntos[i];
    const b = puntos[(i + 1) % puntos.length];
    area += a.x * b.y - b.x * a.y;
  }
  return area / 2;
}

// Aplana y orienta todos los contornos igual: con la misma orientación, la
// regla de relleno "nonzero" une las cintas superpuestas en vez de calarlas,
// y la normal exterior de cada lado sale siempre del mismo lado.
export function prepararPoligonos(contornos: TrazoMandala[][]): PoligonoPlano[] {
  return contornos
    .filter((contorno) => contorno.length >= 3)
    .map((contorno) => {
      const orientado = areaConSigno(contorno) < 0 ? [...contorno].reverse() : contorno;
      const plano: number[] = [];
      for (const punto of orientado) plano.push(punto.x, punto.y);
      return plano;
    });
}

/** Rota un vector (rotateY y luego rotateX) sin proyectarlo. */
export function rotarVector(x: number, y: number, z: number, senoGiro: number, cosenoGiro: number, senoInclinacion: number, cosenoInclinacion: number): [number, number, number] {
  'worklet';
  const x1 = x * cosenoGiro + z * senoGiro;
  const z1 = -x * senoGiro + z * cosenoGiro;
  const y2 = y * cosenoInclinacion - z1 * senoInclinacion;
  const z2 = y * senoInclinacion + z1 * cosenoInclinacion;
  return [x1, y2, z2];
}

function luzDe(nx: number, ny: number, nz: number) {
  'worklet';
  return Math.min(1, Math.max(0, nx * LX + ny * LY + nz * LZ));
}

export function proyectarExtrusion(poligonos: PoligonoPlano[], camara: CamaraMandala): ExtrusionProyectada {
  'worklet';
  const giro = (camara.giroGrados * Math.PI) / 180;
  const inclinacion = (camara.inclinacionGrados * Math.PI) / 180;
  const sg = Math.sin(giro);
  const cg = Math.cos(giro);
  const si = Math.sin(inclinacion);
  const ci = Math.cos(inclinacion);
  const medio = camara.grosor / 2;
  const { centro, distancia, escala } = camara;

  // Normal de la cara frontal (0,0,1) ya rotada: su z dice si mira a cámara.
  const normalFrente = rotarVector(0, 0, 1, sg, cg, si, ci);
  const frenteVisible = normalFrente[2] >= 0;
  const signoCara = frenteVisible ? 1 : -1;
  const luzCara = luzDe(normalFrente[0] * signoCara, normalFrente[1] * signoCara, normalFrente[2] * signoCara);

  const cara: number[][] = [];
  const paredesPorTono: number[][] = [];
  for (let t = 0; t < TONOS_PARED; t += 1) paredesPorTono.push([]);

  for (let p = 0; p < poligonos.length; p += 1) {
    const plano = poligonos[p];
    const cantidad = plano.length / 2;
    const frente: number[] = [];
    const reverso: number[] = [];
    for (let i = 0; i < cantidad; i += 1) {
      const x = plano[i * 2] * escala;
      const y = plano[i * 2 + 1] * escala;
      const a = rotarVector(x, y, medio, sg, cg, si, ci);
      const ka = distancia / Math.max(1, distancia - a[2]);
      frente.push(centro + a[0] * ka, centro + a[1] * ka);
      const b = rotarVector(x, y, -medio, sg, cg, si, ci);
      const kb = distancia / Math.max(1, distancia - b[2]);
      reverso.push(centro + b[0] * kb, centro + b[1] * kb);
    }
    cara.push(frenteVisible ? frente : reverso);

    if (medio <= 0.01) continue;
    for (let i = 0; i < cantidad; i += 1) {
      const j = (i + 1) % cantidad;
      const dx = plano[j * 2] - plano[i * 2];
      const dy = plano[j * 2 + 1] - plano[i * 2 + 1];
      const largo = Math.hypot(dx, dy);
      if (largo < 1e-6) continue;
      // Antihorario ⇒ la normal exterior de cada lado es (dy, −dx).
      const normal = rotarVector(dy / largo, -dx / largo, 0, sg, cg, si, ci);
      // Sólo las paredes que miran a cámara: las demás quedan detrás.
      if (normal[2] <= 0) continue;
      const tono = Math.min(TONOS_PARED - 1, Math.floor(luzDe(normal[0], normal[1], normal[2]) * TONOS_PARED));
      paredesPorTono[tono].push(
        frente[i * 2], frente[i * 2 + 1],
        frente[j * 2], frente[j * 2 + 1],
        reverso[j * 2], reverso[j * 2 + 1],
        reverso[i * 2], reverso[i * 2 + 1],
      );
    }
  }

  return { cara, frenteVisible, luzCara, paredesPorTono };
}
