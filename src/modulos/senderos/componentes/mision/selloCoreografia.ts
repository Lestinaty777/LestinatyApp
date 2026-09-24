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

export type CapaSello = {
  /** 0 = círculo. */
  lados: number;
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

// Geometría sagrada procedural, estable por hábito (la semilla es su
// título): mismas tres familias que la versión anterior, con velocidades
// enteras para que el sello final alinee todas las figuras a la vez.
export function generarGeometriaSello(semilla: string): { capas: CapaSello[]; orbitas: OrbitasSello } {
  const s = hashTexto(semilla || 'merkaba');
  const estilo = s % 3;
  const cantidad = 2 + (s % 3);
  const capas: CapaSello[] = [];

  if (estilo === 0) {
    // Entrelazados (merkaba, estrellas).
    const lados = 3 + ((s >> 1) % 2);
    for (let i = 0; i < cantidad; i += 1) {
      capas.push({ lados, radio: 1, rotInicial: ((Math.PI * 2) / cantidad / lados) * i, velocidad: i % 2 === 0 ? 1 : -1 });
    }
  } else if (estilo === 1) {
    // Portales concéntricos.
    const lados = 3 + ((s >> 2) % 4);
    for (let i = 0; i < cantidad; i += 1) {
      capas.push({ lados, radio: 1 - i * 0.22, rotInicial: (s >> i) % 2 === 0 ? Math.PI / lados : 0, velocidad: (i % 2 === 0 ? 1 : -1) * (1 + Math.floor(i / 2)) });
    }
  } else {
    // Sello alquímico: formas mixtas concéntricas.
    capas.push({ lados: 4 + ((s >> 3) % 3), radio: 1, rotInicial: 0, velocidad: 1 });
    capas.push({ lados: 0, radio: 0.78, rotInicial: 0, velocidad: -1 });
    capas.push({ lados: 3, radio: 0.55, rotInicial: Math.PI, velocidad: 2 });
  }

  return {
    capas,
    orbitas: {
      guion1: 30 + (s % 20),
      guion2: 40 + ((s >> 1) % 20),
      r1: 1.2 + (s % 10) * 0.02,
      r2: 1.4 + ((s >> 1) % 10) * 0.025,
      v1: s % 2 === 0 ? 2 : -2,
      v2: (s >> 1) % 2 === 0 ? -1 : 1,
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
