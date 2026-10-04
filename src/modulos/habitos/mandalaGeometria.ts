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

// Cuántos puntos de control sobreviven antes de suavizar — con tan pocos,
// un temblor de cursor o un cambio brusco de dirección deja de poder
// representarse: el trazo sale redondeado siempre, no sólo al final.
// Validado en el prototipo interactivo (artifact "Mandala de Sendero" v8).
export const PUNTOS_CURVA_IDEAL = 9;

function longitudAcumulada(puntos: TrazoMandala[]): number[] {
  const acumulado = [0];
  for (let i = 1; i < puntos.length; i += 1) {
    acumulado.push(acumulado[i - 1] + Math.hypot(puntos[i].x - puntos[i - 1].x, puntos[i].y - puntos[i - 1].y));
  }
  return acumulado;
}

// Re-muestrea el trazo crudo a `n` puntos equidistantes por longitud de
// arco — el "espacio que respeta las leyes" que limita las formas
// representables, en vez de suavizar libremente sobre el trazo original.
export function resamplearTrazo(puntos: TrazoMandala[], n = PUNTOS_CURVA_IDEAL): TrazoMandala[] {
  if (puntos.length < 2) return puntos;
  const acumulado = longitudAcumulada(puntos);
  const total = acumulado[acumulado.length - 1];
  if (total <= 0) return puntos;
  const salida: TrazoMandala[] = [];
  for (let i = 0; i < n; i += 1) {
    const objetivo = (i / (n - 1)) * total;
    let j = 0;
    while (j < acumulado.length - 2 && acumulado[j + 1] < objetivo) j += 1;
    const p0 = puntos[j];
    const p1 = puntos[Math.min(j + 1, puntos.length - 1)];
    const largoSegmento = acumulado[j + 1] - acumulado[j] || 1;
    const t = (objetivo - acumulado[j]) / largoSegmento;
    salida.push({ x: p0.x + (p1.x - p0.x) * t, y: p0.y + (p1.y - p0.y) * t });
  }
  return salida;
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

// Contorno de una cinta rellena de ancho casi constante (95%→100%→95% del
// ancho base) con casquetes redondos reales en las puntas — nunca una punta
// cuadrada, nunca el efecto de pincel dramático de una primera versión
// descartada. Mismo algoritmo validado en el prototipo interactivo (artifact
// "Mandala de Sendero"). Devuelve el polígono cerrado, centrado en (0,0):
// borde izquierdo, casquete final, borde derecho de vuelta, casquete inicial.
export function contornoCinta(puntos: TrazoMandala[], anchoBase: number): TrazoMandala[] {
  if (puntos.length < 2) return [];
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

  const contorno: TrazoMandala[] = [...izquierda];
  const casqueteFinal = puntosCasquete(puntos[n - 1], tangenteFinal.x, tangenteFinal.y, anchos[n - 1] / 2, 8);
  for (let e = 1; e < casqueteFinal.length; e += 1) contorno.push(casqueteFinal[e]);
  for (let b = derecha.length - 2; b >= 0; b -= 1) contorno.push(derecha[b]);
  const casqueteInicial = puntosCasquete(puntos[0], -tangenteInicial.x, -tangenteInicial.y, anchos[0] / 2, 8);
  for (let s = 1; s < casqueteInicial.length; s += 1) contorno.push(casqueteInicial[s]);
  return contorno;
}

// El mismo contorno como `d` de SVG.
export function trazarCintaSvg(puntos: TrazoMandala[], anchoBase: number): string {
  const contorno = contornoCinta(puntos, anchoBase);
  if (contorno.length === 0) return '';
  const f = (p: TrazoMandala) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  let d = `M ${f(contorno[0])}`;
  for (let i = 1; i < contorno.length; i += 1) d += ` L ${f(contorno[i])}`;
  return `${d} Z`;
}

// Los 7 contornos de la mandala como polígonos — la base de la extrusión
// real (MandalaExtruido): de cada lado del polígono sale una pared.
// `pliegues` es opcional (default = PLIEGUES_MANDALA, el de Hábitos) por si
// otro dominio con simetría radial quisiera otro valor — el sello del
// sendero de días de Tareas ya NO es radial y no usa este pipeline, ver
// figuraSello.ts y SelloExtruido.tsx.
export function construirContornosMandala(puntosCrudos: TrazoMandala[], anchoBase: number, pliegues: number = PLIEGUES_MANDALA): TrazoMandala[][] {
  const suave = suavizarTrazo(resamplearTrazo(puntosCrudos));
  const contornos: TrazoMandala[][] = [];
  for (let k = 0; k < pliegues; k += 1) {
    contornos.push(contornoCinta(rotarPuntos(suave, (k / pliegues) * Math.PI * 2), anchoBase));
  }
  return contornos;
}

// Pipeline completo: re-muestrea a 9 puntos (siempre — en vivo y al fijar,
// nunca sólo al soltar), suaviza una sola vez y rota+traza `pliegues` veces
// (7 por default, el de Hábitos) — listo para pasar cada `d` a un <Path>.
export function construirCaminosMandala(puntosCrudos: TrazoMandala[], anchoBase: number, pliegues: number = PLIEGUES_MANDALA): string[] {
  const suave = suavizarTrazo(resamplearTrazo(puntosCrudos));
  const caminos: string[] = [];
  for (let k = 0; k < pliegues; k += 1) {
    caminos.push(trazarCintaSvg(rotarPuntos(suave, (k / pliegues) * Math.PI * 2), anchoBase));
  }
  return caminos;
}
