import type { TrazoMandala } from './mandalaNodo.tipos';

// Simetría radial de la mandala — 7 pétalos, un solo trazo repetido.
export const PLIEGUES_MANDALA = 7;

// mandala_semilla es un md5 (hex); se reduce a un número estable para
// alimentar la misma función de hash pseudoaleatoria que ya usa MandalaAby
// en la app (Math.sin de gran magnitud, parte fraccional).
function numeroDesdeSemilla(semilla: string): number {
  let h = 0;
  for (let i = 0; i < semilla.length; i += 1) {
    h = (h * 31 + semilla.charCodeAt(i)) % 1000000007;
  }
  return h / 1000000007;
}

function hash(seed: number, i: number): number {
  const v = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

// Espiral de ejemplo determinista — el fallback reproducible cuando la app
// se cierra antes de terminar el compositor (spec: "el mapa muestra una
// mandala generada con mandala_semilla; al tocar el orbe pendiente se
// reabre el compositor").
export function trazoDesdeSemilla(semillaTexto: string, radioMaximo = 118): TrazoMandala[] {
  const seed = numeroDesdeSemilla(semillaTexto) * 1000;
  const pasos = 46;
  const vueltas = 1.3 + hash(seed, 91) * 1.2;
  const radioMax = radioMaximo * (0.7 + hash(seed, 92) * 0.25);
  const amplitudTemblor = radioMaximo * (0.08 + hash(seed, 93) * 0.11);
  const frecuenciaTemblor = 3 + Math.floor(hash(seed, 94) * 3);
  const anguloInicial = hash(seed, 95) * Math.PI * 2;
  const fase = hash(seed, 96) * 6;
  const puntos: TrazoMandala[] = [];
  for (let i = 0; i <= pasos; i += 1) {
    const t = i / pasos;
    const suavizado = 1 - (1 - t) ** 2;
    const r = radioMaximo * 0.1 + suavizado * radioMax;
    const angulo = anguloInicial + t * vueltas * Math.PI * 2;
    const temblor = Math.sin(t * frecuenciaTemblor * Math.PI * 2 + fase) * amplitudTemblor * t;
    puntos.push({ x: Math.cos(angulo) * (r + temblor), y: Math.sin(angulo) * (r + temblor) });
  }
  return puntos;
}

function puntoCatmullRom(p0: TrazoMandala, p1: TrazoMandala, p2: TrazoMandala, p3: TrazoMandala, t: number): TrazoMandala {
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
  };
}

// Convierte los puntos crudos del gesto en una spline con continuidad real
// (equivalente a una Bézier cúbica por tramo, Catmull-Rom con otra forma de
// fijar las tangentes) — nunca un segmento recto entre punto y punto, sin
// importar qué tan irregular sea el trazo original.
export function suavizarTrazo(puntos: TrazoMandala[]): TrazoMandala[] {
  if (puntos.length < 3) return puntos;
  const muestrasPorTramo = 4;
  const salida: TrazoMandala[] = [];
  const n = puntos.length;
  for (let i = 0; i < n - 1; i += 1) {
    const p0 = puntos[Math.max(0, i - 1)];
    const p1 = puntos[i];
    const p2 = puntos[i + 1];
    const p3 = puntos[Math.min(n - 1, i + 2)];
    for (let s = 0; s < muestrasPorTramo; s += 1) salida.push(puntoCatmullRom(p0, p1, p2, p3, s / muestrasPorTramo));
  }
  salida.push(puntos[n - 1]);
  return salida;
}

export function rotarPuntos(puntos: TrazoMandala[], angulo: number): TrazoMandala[] {
  const c = Math.cos(angulo);
  const s = Math.sin(angulo);
  return puntos.map((p) => ({ x: p.x * c - p.y * s, y: p.x * s + p.y * c }));
}

function rotarVector(vx: number, vy: number, theta: number): TrazoMandala {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  return { x: vx * c - vy * s, y: vx * s + vy * c };
}

// Semicírculo de `radio` centrado en `centro`, que abulta hacia (tx,ty) —
// el primer punto coincide con el borde "izquierdo" de la cinta en ese
// extremo, el último con el borde "derecho". Verificable a mano: theta=90°
// da el vector perpendicular izquierdo, theta=-90° el derecho, theta=0° la
// tangente misma.
function puntosCasquete(centro: TrazoMandala, tx: number, ty: number, radio: number, pasos: number): TrazoMandala[] {
  const puntos: TrazoMandala[] = [];
  for (let i = 0; i <= pasos; i += 1) {
    const theta = Math.PI / 2 - (i / pasos) * Math.PI;
    const v = rotarVector(tx, ty, theta);
    puntos.push({ x: centro.x + v.x * radio, y: centro.y + v.y * radio });
  }
  return puntos;
}

// Cinta rellena de ancho casi constante (95%→100%→95% del ancho base) con
// casquetes redondos reales en las puntas — nunca una punta cuadrada, nunca
// el efecto de pincel dramático de una primera versión descartada. Mismo
// algoritmo validado en el prototipo interactivo (artifact "Mandala de
// Sendero"). Devuelve un `d` de SVG centrado en (0,0).
export function trazarCintaSvg(puntos: TrazoMandala[], anchoBase: number): string {
  if (puntos.length < 2) return '';
  const n = puntos.length;
  const izquierda: TrazoMandala[] = [];
  const derecha: TrazoMandala[] = [];
  const anchos: number[] = [];
  let tangenteInicial: TrazoMandala = { x: 1, y: 0 };
  let tangenteFinal: TrazoMandala = { x: 1, y: 0 };

  for (let i = 0; i < n; i += 1) {
    const t = n > 1 ? i / (n - 1) : 0;
    const ahusado = Math.sin(Math.min(1, Math.max(0, t)) * Math.PI);
    const ancho = anchoBase * (0.95 + 0.05 * ahusado);
    anchos.push(ancho);
    const prev = puntos[Math.max(0, i - 1)];
    const next = puntos[Math.min(n - 1, i + 1)];
    let tx = next.x - prev.x;
    let ty = next.y - prev.y;
    const largo = Math.hypot(tx, ty) || 1;
    tx /= largo;
    ty /= largo;
    if (i === 0) tangenteInicial = { x: tx, y: ty };
    if (i === n - 1) tangenteFinal = { x: tx, y: ty };
    const nx = -ty;
    const ny = tx;
    izquierda.push({ x: puntos[i].x + (nx * ancho) / 2, y: puntos[i].y + (ny * ancho) / 2 });
    derecha.push({ x: puntos[i].x - (nx * ancho) / 2, y: puntos[i].y - (ny * ancho) / 2 });
  }

  const f = (p: TrazoMandala) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  let d = `M ${f(izquierda[0])}`;
  for (let a = 1; a < izquierda.length; a += 1) d += ` L ${f(izquierda[a])}`;

  const casqueteFinal = puntosCasquete(puntos[n - 1], tangenteFinal.x, tangenteFinal.y, anchos[n - 1] / 2, 8);
  for (let e = 1; e < casqueteFinal.length; e += 1) d += ` L ${f(casqueteFinal[e])}`;

  for (let b = derecha.length - 2; b >= 0; b -= 1) d += ` L ${f(derecha[b])}`;

  const casqueteInicial = puntosCasquete(puntos[0], -tangenteInicial.x, -tangenteInicial.y, anchos[0] / 2, 8);
  for (let s = 1; s < casqueteInicial.length; s += 1) d += ` L ${f(casqueteInicial[s])}`;

  d += ' Z';
  return d;
}

// Pipeline completo: suaviza una sola vez y rota+traza 7 veces — listo para
// pasar cada `d` a un <Path>.
export function construirCaminosMandala(puntosCrudos: TrazoMandala[], anchoBase: number): string[] {
  const suave = suavizarTrazo(puntosCrudos);
  const caminos: string[] = [];
  for (let k = 0; k < PLIEGUES_MANDALA; k += 1) {
    caminos.push(trazarCintaSvg(rotarPuntos(suave, (k / PLIEGUES_MANDALA) * Math.PI * 2), anchoBase));
  }
  return caminos;
}
