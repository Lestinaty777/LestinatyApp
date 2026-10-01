import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { type SharedValue, useDerivedValue } from 'react-native-reanimated';
import { Canvas, Path, Shader, Skia, type SkPath } from '@shopify/react-native-skia';

import { construirContornosMandala, PLIEGUES_MANDALA } from '../mandalaGeometria';
import { prepararPoligonos, proyectarExtrusion, TONOS_PARED } from '../mandalaExtrusion';
import { tonosNacarMandala } from '../nacarMandala';
import type { TrazoMandala } from '../mandalaNodo.tipos';

// Mismo espacio de coordenadas que el lienzo donde se traza (radio ~150,
// centrado en 0,0) y el mismo ancho de cinta: así la mandala trazada y la
// extruida tienen la misma silueta en el instante del relevo.
export const LADO_LIENZO_MANDALA = 320;
export const RADIO_TRAZO_MANDALA = 150;
export const ANCHO_CINTA_MANDALA = LADO_LIENZO_MANDALA * 0.06;
// Pose de reposo: casi de frente a la cámara (antes -26°, un tres cuartos que
// se sentía "de costado"). Se deja un resto mínimo para que el canto todavía
// insinúe el grosor, sin dar la impresión de estar girada.
export const ANGULO_REPOSO_MANDALA = -6;
// Cuánto se recuesta la mandala (rotateX), sólo ella, no el mapa: 0 = de
// pie mirando a la cámara.
export const INCLINACION_MANDALA = -30;
// Proporción de blanco en la cara: 0.7 = pastel claro del color del paquete.
export const BLANCO_PASTEL_MANDALA = 0.7;
// Grosor de la extrusión, relativo al tamaño de la mandala.
export const GROSOR_MANDALA = 0.08;
// Cuánto del nácar se mezcla con el pastel (0 = pastel liso).
export const INTENSIDAD_NACAR = 0.5;
// Hacia qué tonos vecinos abre el nácar de cada paquete: nacarMandala.ts.
// Blanco de los tonos del nácar: algo menos que la cara, para que se noten.
const BLANCO_NACAR = 0.5;
// Brillo de la franja de luz que cruza la cara al girar (0 = sin destello).
export const INTENSIDAD_DESTELLO = 0.3;
// Filo blanco de la cara, en unidades del lienzo.
const FILO_MANDALA = 4;
// Distancia de cámara relativa al tamaño: más baja = el borde que se acerca
// crece más, y el sentido del giro se lee sin ambigüedad.
const PERSPECTIVA_RELATIVA = 2.6;
// El dibujo proyectado puede salirse de su caja (perspectiva, canto): el
// Canvas se agranda este margen por lado, sin mover la caja que se mide.
const MARGEN_LIENZO = 0.3;
// Tono de cada pared según cuánta luz recibe, del más oscuro al más claro.
const BRILLO_PAREDES = [0.58, 0.72, 0.86, 1];

// Nácar: el pastel con reflejos que van y vienen entre dos tonos vecinos del
// paquete (como el interior de una concha, que siempre tira a un color),
// desplazándose con la posición y el giro; un leve resplandor central y una
// franja especular que cruza la cara mientras gira. `luz` apaga la cara
// cuando se aleja de la luz; `cara` es el pastel del frente o del reverso.
const NACAR = Skia.RuntimeEffect.Make(`
uniform float2 centro;
uniform float radio;
uniform float giro;
uniform float luz;
uniform float nacar;
uniform float destello;
uniform float3 cara;
uniform float3 tonoA;
uniform float3 tonoB;

half4 main(float2 p) {
  float2 q = (p - centro) / radio;
  // El giro entra como fase con periodo exacto de una vuelta (2π): la pose
  // de reposo y reposo+360° deben dar el mismo tono, porque las animaciones
  // reinician el ángulo al terminar cada vuelta.
  float t = q.x * 1.4 + q.y * 0.9;
  float onda = 0.5 + 0.5 * cos(6.2831 * t * 0.5 + giro);
  float3 reflejo = mix(tonoA, tonoB, onda);
  float3 c = mix(cara, reflejo, nacar);
  c += 0.06 * (1.0 - clamp(length(q), 0.0, 1.0));
  float franja = abs(q.x * 0.8 - q.y * 0.6 - sin(giro) * 1.3);
  c += destello * (1.0 - smoothstep(0.0, 0.28, franja));
  c *= luz;
  return half4(half3(clamp(c, 0.0, 1.0)), 1.0);
}
`);

function canales(color: string) {
  const hex = color.replace('#', '');
  if (hex.length < 6) return null;
  return [0, 2, 4].map((inicio) => parseInt(hex.slice(inicio, inicio + 2), 16));
}

function aHex(valores: number[]) {
  return `#${valores.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')}`;
}

// Cara pastel (el color del paquete mezclado con blanco) y canto en el color
// pleno, como una joya: suave de frente, intensa de costado — el canto es lo
// que la despega de un mapa que ya es una versión clara del mismo color.
export function coloresMandala(color: string, paqueteId?: string | null) {
  const rgb = canales(color) ?? [178, 95, 251];
  const nacar = tonosNacarMandala(paqueteId, aHex(rgb));
  const rgbCanto = canales(nacar.canto) ?? rgb;
  const mezclar = (blanco: number, base = rgb) => base.map((v) => v + (255 - v) * blanco);
  const reflejo = (tono: string) => mezclar(BLANCO_NACAR, canales(tono) ?? rgb).map((v) => v / 255);
  return {
    canto: aHex(rgbCanto),
    cara: aHex(mezclar(BLANCO_PASTEL_MANDALA)),
    // El reverso, un pastel más profundo y sin filo: se distingue del frente.
    reverso: aHex(mezclar(BLANCO_PASTEL_MANDALA - 0.18)),
    filo: '#FFFFFF',
    caraRgb: mezclar(BLANCO_PASTEL_MANDALA).map((v) => v / 255),
    reversoRgb: mezclar(BLANCO_PASTEL_MANDALA - 0.18).map((v) => v / 255),
    paredes: BRILLO_PAREDES.map((k) => aHex(rgbCanto.map((v) => v * k))),
    tonoA: reflejo(nacar.tonoA),
    tonoB: reflejo(nacar.tonoB),
  };
}

type MandalaExtruidoProps = {
  /** Color pleno del paquete; la cara pastel y el canto se derivan de él. */
  color: string;
  /** Paquete de la mandala: elige hacia qué tonos abre su nácar. */
  paqueteId?: string | null;
  trazos: TrazoMandala[];
  tamano: number;
  /** Giro sobre el eje vertical, en grados. */
  giro: SharedValue<number>;
  /** 0 = lámina plana, 1 = grosor completo. Sin él, siempre grosor completo. */
  relieve?: SharedValue<number>;
  /** 0 = de pie, 1 = recostada INCLINACION_MANDALA grados. Sin él, recostada. */
  inclinacion?: SharedValue<number>;
  /** Simetría radial del contorno. Sin él, PLIEGUES_MANDALA (7, el de Hábitos) — ver PLIEGUES_SELLO en tareas/figuraSello.ts para el sendero de días de Tareas. */
  pliegues?: number;
};

function armarPath(poligonos: number[][]): SkPath {
  'worklet';
  const path = Skia.Path.Make();
  for (let p = 0; p < poligonos.length; p += 1) {
    const puntos = poligonos[p];
    if (puntos.length < 6) continue;
    path.moveTo(puntos[0], puntos[1]);
    for (let i = 2; i < puntos.length; i += 2) path.lineTo(puntos[i], puntos[i + 1]);
    path.close();
  }
  return path;
}

function armarCuadrilateros(cuadrilateros: number[]): SkPath {
  'worklet';
  const path = Skia.Path.Make();
  for (let i = 0; i + 7 < cuadrilateros.length; i += 8) {
    path.moveTo(cuadrilateros[i], cuadrilateros[i + 1]);
    path.lineTo(cuadrilateros[i + 2], cuadrilateros[i + 3]);
    path.lineTo(cuadrilateros[i + 4], cuadrilateros[i + 5]);
    path.lineTo(cuadrilateros[i + 6], cuadrilateros[i + 7]);
    path.close();
  }
  return path;
}

// Extrusión geométrica real: del contorno de cada cinta salen sus paredes
// (mandalaExtrusion.ts), proyectadas a cada cuadro del giro en el hilo de UI
// y dibujadas en un solo Canvas de Skia — sin láminas apiladas, así el canto
// se ve macizo. Sólo se dibujan la cara que mira a cámara y las paredes
// visibles; como la cara es siempre lo más cercano, va encima de todo.
export function MandalaExtruido({ color, giro, inclinacion, paqueteId, pliegues = PLIEGUES_MANDALA, relieve, tamano, trazos }: MandalaExtruidoProps) {
  const poligonos = useMemo(() => prepararPoligonos(construirContornosMandala(trazos, ANCHO_CINTA_MANDALA, pliegues)), [trazos, pliegues]);
  const paleta = useMemo(() => coloresMandala(color, paqueteId), [color, paqueteId]);
  const margen = tamano * MARGEN_LIENZO;
  const lado = tamano + margen * 2;
  const centro = lado / 2;
  const escala = tamano / LADO_LIENZO_MANDALA;

  const geometria = useDerivedValue(() => {
    const proyeccion = proyectarExtrusion(poligonos, {
      centro,
      distancia: tamano * PERSPECTIVA_RELATIVA,
      escala,
      giroGrados: giro.value,
      grosor: tamano * GROSOR_MANDALA * (relieve ? relieve.value : 1),
      inclinacionGrados: INCLINACION_MANDALA * (inclinacion ? inclinacion.value : 1),
    });
    const paredes: SkPath[] = [];
    for (let t = 0; t < TONOS_PARED; t += 1) paredes.push(armarCuadrilateros(proyeccion.paredesPorTono[t]));
    return { cara: armarPath(proyeccion.cara), frenteVisible: proyeccion.frenteVisible, luzCara: proyeccion.luzCara, paredes };
  });

  const pathCara = useDerivedValue(() => geometria.value.cara);
  const pared0 = useDerivedValue(() => geometria.value.paredes[0]);
  const pared1 = useDerivedValue(() => geometria.value.paredes[1]);
  const pared2 = useDerivedValue(() => geometria.value.paredes[2]);
  const pared3 = useDerivedValue(() => geometria.value.paredes[3]);
  const opacidadFilo = useDerivedValue(() => (geometria.value.frenteVisible ? 0.75 : 0));
  const uniformes = useDerivedValue(() => ({
    cara: geometria.value.frenteVisible ? paleta.caraRgb : paleta.reversoRgb,
    centro: [centro, centro],
    destello: INTENSIDAD_DESTELLO,
    giro: (giro.value * Math.PI) / 180,
    luz: 0.62 + 0.38 * geometria.value.luzCara,
    nacar: INTENSIDAD_NACAR,
    radio: tamano / 2,
    tonoA: paleta.tonoA,
    tonoB: paleta.tonoB,
  }));

  return (
    <View pointerEvents="none" style={{ height: tamano, width: tamano }}>
      <Canvas pointerEvents="none" style={[styles.lienzo, { height: lado, left: -margen, top: -margen, width: lado }]}>
        <Path color={paleta.paredes[0]} path={pared0} />
        <Path color={paleta.paredes[1]} path={pared1} />
        <Path color={paleta.paredes[2]} path={pared2} />
        <Path color={paleta.paredes[3]} path={pared3} />
        {/* El filo va DEBAJO de la cara, no encima: son 7 cintas superpuestas y
            cada una tiene su propio contorno — trazado encima, las cintas se
            cruzaban con líneas blancas por dentro de la mandala y, con muchas
            intersecciones, la cara quedaba casi blanca y sin nácar. Debajo, la
            cara (opaca) tapa todo contorno interior y solo asoma la mitad
            exterior del trazo: un borde limpio alrededor de la silueta. */}
        <Path color={paleta.filo} opacity={opacidadFilo} path={pathCara} strokeJoin="round" strokeWidth={FILO_MANDALA * 1.5 * escala} style="stroke" />
        <Path path={pathCara}>
          {NACAR ? <Shader source={NACAR} uniforms={uniformes} /> : null}
        </Path>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  lienzo: { position: 'absolute' },
});
