import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { type SharedValue, useDerivedValue } from 'react-native-reanimated';
import { Canvas, Path, Shader, Skia } from '@shopify/react-native-skia';

import {
  ANGULO_REPOSO_MANDALA,
  armarCuadrilateros,
  armarPath,
  coloresMandala,
  INCLINACION_MANDALA,
  INTENSIDAD_DESTELLO,
  INTENSIDAD_NACAR,
  LADO_LIENZO_MANDALA,
  NACAR,
} from '../../habitos/componentes/MandalaExtruido';
import { prepararPoligonos, proyectarExtrusion, TONOS_PARED } from '../../habitos/mandalaExtrusion';
import type { TrazoMandala } from '../../habitos/mandalaNodo.tipos';
import { construirContornoEspejo, RADIO_FIGURA_SELLO } from '../figuraSello';

// Extrusión del sello de Tareas: reusa el mismo motor 3D de MandalaExtruido
// (proyección, paredes, shader de nácar) — lo único distinto es la
// geometría de base: construirContornoEspejo da UN solo contorno cerrado
// (espejo de un trazo recto), no N pétalos curvos rotados. Por eso no hay
// prop `pliegues` acá: siempre es un único sólido.
export const LADO_LIENZO_SELLO = LADO_LIENZO_MANDALA;
export const ANGULO_REPOSO_SELLO = ANGULO_REPOSO_MANDALA;
export const INCLINACION_SELLO = INCLINACION_MANDALA;
const GROSOR_SELLO = 0.1;
const PERSPECTIVA_RELATIVA = 2.6;
const MARGEN_LIENZO = 0.3;
const FILO_SELLO = 4;

type SelloExtruidoProps = {
  color: string;
  paqueteId?: string | null;
  /** El trazo crudo del usuario (solo la mitad de abajo) — el espejo se arma acá. */
  trazos: TrazoMandala[];
  tamano: number;
  giro: SharedValue<number>;
  relieve?: SharedValue<number>;
  inclinacion?: SharedValue<number>;
};

export function SelloExtruido({ color, giro, inclinacion, paqueteId, relieve, tamano, trazos }: SelloExtruidoProps) {
  const poligonos = useMemo(() => prepararPoligonos([construirContornoEspejo(trazos, RADIO_FIGURA_SELLO)]), [trazos]);
  const paleta = useMemo(() => coloresMandala(color, paqueteId), [color, paqueteId]);
  const margen = tamano * MARGEN_LIENZO;
  const lado = tamano + margen * 2;
  const centro = lado / 2;
  const escala = tamano / LADO_LIENZO_SELLO;

  const geometria = useDerivedValue(() => {
    const proyeccion = proyectarExtrusion(poligonos, {
      centro,
      distancia: tamano * PERSPECTIVA_RELATIVA,
      escala,
      giroGrados: giro.value,
      grosor: tamano * GROSOR_SELLO * (relieve ? relieve.value : 1),
      inclinacionGrados: INCLINACION_SELLO * (inclinacion ? inclinacion.value : 1),
    });
    const paredes = [];
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
        <Path color={paleta.filo} opacity={opacidadFilo} path={pathCara} strokeJoin="round" strokeWidth={FILO_SELLO * 1.5 * escala} style="stroke" />
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
