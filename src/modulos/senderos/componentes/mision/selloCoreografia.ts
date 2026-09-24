// Coreografía del "Sello": el check de 7 segundos manteniendo presionado.
// Todo depende de un solo progreso 0→1 que avanza lineal mientras el dedo
// está apoyado (1 = 7 s). Cada acto ocupa una ventana de ese progreso, así
// la animación es reversible: al soltar, el progreso retrocede y todo se
// "desdibuja" en orden inverso, sin saltos.

export const DURACION_SELLO_MS = 7000;
/** Al soltar, retrocede a esta fracción de la velocidad de carga (0.5 = el doble de rápido). */
export const FACTOR_RETROCESO = 0.5;
/** Vueltas que dan las figuras entre la resonancia y el sello (entero: terminan alineadas). */
export const VUELTAS_SELLO = 3;

/** Segundos → fracción del progreso. */
export const seg = (segundos: number) => segundos / (DURACION_SELLO_MS / 1000);

export const ACTOS_SELLO = {
  encendido: [0, seg(1)],
  trazado: [seg(1), seg(3)],
  resonancia: [seg(3), seg(5)],
  convergencia: [seg(5), seg(6.6)],
  silencio: [seg(6.6), 1],
} as const;

export type FormaSello = 'poligono' | 'estrella' | 'circulo' | 'roseta';

export type CapaSello = {
  forma: FormaSello;
  /** Polígono y estrella: puntas. Roseta: pétalos. Círculo: 0. */
  lados: number;
  /** Estrella {lados/salto}: de cuántos en cuántos vértices salta el trazo. 1 en el resto. */
  salto: number;
  /** Radio relativo al radio base. */
  radio: number;
  rotInicial: number;
  /** Entero: con VUELTAS_SELLO entero, todas vuelven a su pose inicial en el sello. */
  velocidad: number;
};

export type OrbitasSello = { r1: number; r2: number; v1: number; v2: number; guion1: number; guion2: number };

function hashTexto(texto: string) {
  let hash = 0;
  for (let i = 0; i < texto.length; i += 1) {
    hash = (hash << 5) - hash + texto.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// mulberry32: pseudoaleatorio chico y determinista a partir de la semilla.
function crearAzar(semilla: string) {
  let estado = hashTexto(semilla) || 1;
  return () => {
    estado = (estado + 0x6d2b79f5) | 0;
    let t = Math.imul(estado ^ (estado >>> 15), 1 | estado);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function mcd(a: number, b: number): number {
  return b === 0 ? a : mcd(b, a % b);
}

export const FAMILIAS_SELLO = ['entrelazados', 'portales', 'alquimico', 'estrella', 'roseta'] as const;

// Geometría sagrada procedural. La semilla es hábito + día, así cada check
// dibuja un sello distinto y reabrir el mismo día muestra el mismo. Cinco
// familias con proporciones, lados, rotaciones y sentidos de giro variables;
// las velocidades son siempre enteras para que el sello final alinee todas
// las figuras a la vez.
export function generarGeometriaSello(semilla: string): { capas: CapaSello[]; familia: typeof FAMILIAS_SELLO[number]; orbitas: OrbitasSello } {
  const azar = crearAzar(semilla || 'merkaba');
  const entero = (min: number, max: number) => min + Math.floor(azar() * (max - min + 1));
  const signo = () => (azar() < 0.5 ? -1 : 1);
  const velocidad = (magnitudMaxima = 2) => signo() * entero(1, magnitudMaxima);
  const giroLibre = () => azar() * Math.PI * 2;
  const familia = FAMILIAS_SELLO[entero(0, FAMILIAS_SELLO.length - 1)];
  const capas: CapaSello[] = [];
  const poligono = (lados: number, radio: number, rotInicial: number, vel: number): CapaSello => ({ forma: 'poligono', lados, radio, rotInicial, salto: 1, velocidad: vel });
  const circulo = (radio: number, vel: number): CapaSello => ({ forma: 'circulo', lados: 0, radio, rotInicial: 0, salto: 1, velocidad: vel });

  if (familia === 'entrelazados') {
    // Merkaba, estrella de David, octogramas: copias giradas de un polígono.
    const lados = entero(3, 6);
    const copias = entero(2, 4);
    const base = giroLibre();
    const magnitud = entero(1, 2);
    for (let i = 0; i < copias; i += 1) capas.push(poligono(lados, 1, base + ((Math.PI * 2) / lados / copias) * i, (i % 2 === 0 ? 1 : -1) * magnitud));
    if (azar() < 0.5) capas.push(circulo(entero(40, 60) / 100, velocidad()));
  } else if (familia === 'portales') {
    // Polígonos concéntricos, cada uno con sus propios lados.
    const cantidad = entero(3, 5);
    for (let i = 0; i < cantidad; i += 1) {
      const radio = 1 - (i * 0.62) / (cantidad - 1);
      capas.push(poligono(entero(3, 8), radio, giroLibre(), (i % 2 === 0 ? 1 : -1) * entero(1, 3)));
    }
  } else if (familia === 'alquimico') {
    // Sello alquímico: polígono, círculo inscrito y figura interior.
    capas.push(poligono(entero(4, 8), 1, giroLibre(), velocidad()));
    capas.push(circulo(entero(70, 80) / 100, velocidad()));
    capas.push(azar() < 0.5 ? poligono(3, entero(45, 58) / 100, azar() < 0.5 ? Math.PI : 0, velocidad(3)) : { forma: 'estrella', lados: 5, radio: entero(45, 58) / 100, rotInicial: 0, salto: 2, velocidad: velocidad(3) });
    if (azar() < 0.4) capas.push(circulo(entero(18, 26) / 100, velocidad()));
  } else if (familia === 'estrella') {
    // Estrellas {n/k}: heptagramas, eneagramas, dodecagramas…
    const lados = [5, 7, 8, 9, 10, 11, 12][entero(0, 6)];
    const saltos = Array.from({ length: Math.floor((lados - 1) / 2) - 1 }, (_, i) => i + 2).filter((k) => mcd(lados, k) === 1);
    const salto = saltos[entero(0, saltos.length - 1)];
    capas.push(circulo(1.06, velocidad()));
    capas.push({ forma: 'estrella', lados, radio: 1, rotInicial: giroLibre(), salto, velocidad: velocidad() });
    capas.push(poligono(lados, entero(38, 50) / 100, giroLibre(), velocidad(3)));
  } else {
    // Roseta: pétalos circulares que pasan por el centro (flor de la vida).
    const petalos = entero(5, 9);
    capas.push(circulo(1, velocidad()));
    capas.push({ forma: 'roseta', lados: petalos, radio: entero(88, 96) / 100, rotInicial: giroLibre(), salto: 1, velocidad: velocidad() });
    if (azar() < 0.6) capas.push(poligono(petalos, entero(36, 46) / 100, giroLibre(), velocidad(3)));
  }

  return {
    capas,
    familia,
    orbitas: {
      guion1: entero(30, 49),
      guion2: entero(40, 59),
      r1: 1.2 + azar() * 0.18,
      r2: 1.42 + azar() * 0.22,
      v1: signo() * 2,
      v2: signo(),
    },
  };
}

/** Ventana del progreso en que se dibuja la figura `indice`: una tras otra, con un leve solape. */
export function ventanaCapa(indice: number, total: number): [number, number] {
  const [desde, hasta] = ACTOS_SELLO.trazado;
  const tramo = (hasta - desde) / Math.max(1, total);
  const inicio = desde + indice * tramo;
  return [inicio, Math.min(hasta, inicio + tramo * 1.25)];
}

/**
 * Giro acumulado (radianes, multiplicado luego por la velocidad de cada
 * figura): quieto hasta la resonancia, y desde ahí acelera (u³) hasta el
 * sello, donde frena de golpe exactamente en VUELTAS_SELLO vueltas — las
 * figuras quedan alineadas en su pose inicial, el "clac" del sello.
 */
export function giroSello(progreso: number): number {
  'worklet';
  const desde = ACTOS_SELLO.resonancia[0];
  const u = Math.min(1, Math.max(0, (progreso - desde) / (1 - desde)));
  return VUELTAS_SELLO * Math.PI * 2 * u * u * u;
}

export type TipoPulso = 'seleccion' | 'accion';
export type PulsoSello = { en: number; tipo: TipoPulso };

// Calendario háptico: un toque al encender, un clic al cerrarse cada figura,
// un latido que acelera en la resonancia, pulsos rápidos en la convergencia
// y silencio en el último medio segundo (el golpe profundo es el sello).
export function pulsosSello(totalCapas: number): PulsoSello[] {
  const pulsos: PulsoSello[] = [{ en: seg(0.05), tipo: 'seleccion' }];
  for (let i = 0; i < totalCapas; i += 1) pulsos.push({ en: ventanaCapa(i, totalCapas)[1], tipo: 'seleccion' });
  for (const s of [3.0, 3.55, 4.05, 4.5, 4.85]) pulsos.push({ en: seg(s), tipo: 'accion' });
  for (const s of [5.15, 5.45, 5.7, 5.92, 6.1, 6.26, 6.4, 6.52]) pulsos.push({ en: seg(s), tipo: 'seleccion' });
  return pulsos.sort((a, b) => a.en - b.en);
}
