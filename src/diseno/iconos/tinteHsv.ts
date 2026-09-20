// Teñido de iconos por píxel en HSV.
//
// La rotación de matiz con ColorMatrix (la de los filtros hueRotate de SVG/CSS)
// CONSERVA LA LUMINANCIA, y eso apaga los colores: un verde vivo (#22C55E,
// saturación 0.83) tiene mucha luminancia porque el canal verde pesa 0.72; para
// que un rojo tenga esa misma luminancia haría falta un rojo muy por encima de
// 255, así que se recorta y los otros canales suben: sale #FF7680 (saturación
// 0.54), un rojo pastel. Rotar en HSV cambia SOLO el matiz y deja la saturación y
// el valor como estaban, así que el rojo sale igual de vivo.
//
// `tintarPixelHsv` es la referencia en TypeScript (se prueba con vitest) y
// SKSL_TINTE_HSV es la MISMA cuenta como shader de Skia, que es lo que corre en
// el teléfono. Si se cambia una, hay que cambiar la otra.

export type ParametrosTinteHsv = {
  /** Grados que se suman al matiz de cada píxel (relativo: cada icono conserva su variedad de tonos). */
  delta: number;
  /** Factor de saturación (1 = igual; 0.25 en paquetes casi grises como Abyss). */
  saturacion: number;
  /** Factor de oscurecido que solo afecta a lo que tiene color (blancos y grises no se tocan). */
  oscuroTema: number;
  /** Factor de oscurecido que afecta a todo el icono, blanco incluido. */
  oscuroGlobal: number;
};

/** Saturación a partir de la cual un píxel cuenta como "con color" al 100% para el oscurecido del tono. */
const SATURACION_COLOR_PLENO = 0.6;

const limitar = (valor: number) => Math.min(1, Math.max(0, valor));

export function rgbAHsv([r, g, b]: number[]) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d > 0) h = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: h / 6, s: max > 0 ? d / max : 0, v: max };
}

export function hsvARgb({ h, s, v }: { h: number; s: number; v: number }): number[] {
  const canal = (n: number) => {
    const k = (n + h * 6) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return [canal(5), canal(3), canal(1)];
}

/** Referencia del shader: `rgb` sin premultiplicar, 0..1. */
export function tintarPixelHsv(rgb: number[], { delta, oscuroGlobal, oscuroTema, saturacion }: ParametrosTinteHsv): number[] {
  const { h, s, v } = rgbAHsv(rgb.map(limitar));
  const peso = limitar(s / SATURACION_COLOR_PLENO);
  const hue = (((h + delta / 360) % 1) + 1) % 1;
  const oscurecido = v * (1 + (oscuroTema - 1) * peso);
  return hsvARgb({ h: hue, s: limitar(s * saturacion), v: oscurecido }).map((canal) => canal * oscuroGlobal);
}

export const SKSL_TINTE_HSV = `
uniform shader imagen;
uniform float delta;
uniform float saturacion;
uniform float oscuroTema;
uniform float oscuroGlobal;

float3 rgb2hsv(float3 c) {
  float4 K = float4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  float4 p = mix(float4(c.bg, K.wz), float4(c.gb, K.xy), step(c.b, c.g));
  float4 q = mix(float4(p.xyw, c.r), float4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return float3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

float3 hsv2rgb(float3 c) {
  float4 K = float4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  float3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

half4 main(float2 xy) {
  half4 px = imagen.eval(xy);
  if (px.a <= 0.0) return px;
  float3 rgb = clamp(float3(px.rgb) / float(px.a), 0.0, 1.0);
  float3 hsv = rgb2hsv(rgb);
  float peso = clamp(hsv.y / ${SATURACION_COLOR_PLENO.toFixed(1)}, 0.0, 1.0);
  hsv.x = fract(hsv.x + delta / 360.0);
  hsv.y = clamp(hsv.y * saturacion, 0.0, 1.0);
  hsv.z = hsv.z * mix(1.0, oscuroTema, peso);
  float3 salida = hsv2rgb(hsv) * oscuroGlobal;
  return half4(half3(salida * float(px.a)), px.a);
}
`;
