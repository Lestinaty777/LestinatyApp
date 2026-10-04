import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { type SharedValue, useDerivedValue } from 'react-native-reanimated';
import { BlurMask, Canvas, Circle, Group, Line, Path, Skia, type SkPath, vec } from '@shopify/react-native-skia';

import { LADO_LIENZO_MANDALA } from '../../../habitos/componentes/MandalaExtruido';
import { prepararPoligonos } from '../../../habitos/mandalaExtrusion';
import type { TrazoMandala } from '../../../habitos/mandalaNodo.tipos';
import { anclaDerechaSello, anclaIzquierdaSello, construirContornoEspejo, RADIO_FIGURA_SELLO } from '../../../tareas/figuraSello';
import { AnilloTinta } from './EscenarioTrazo';

/**
 * Fork de EscenarioTrazo.tsx para el sello de Tareas: mismo lenguaje visual
 * (anillo de tinta, silueta blanca con halo, punta de luz), pero sin
 * `pliegues` — acá no hay copias rotadas, hay UN solo contorno de espejo
 * (figuraSello.ts), y la guía no es un abanico de rayos sino la única línea
 * fija entre las dos anclas. AnilloTinta se reusa tal cual (es genérico).
 *
 * Se deja fuera, a propósito, la "mano fantasma" (tutorial animado de
 * ManoFantasma): coreografiarla para este mecanismo nuevo es una pieza
 * aparte, no bloquea que el ritual funcione.
 */
const LADO = LADO_LIENZO_MANDALA;
const C = LADO / 2;
const RADIO_ANCLA = 7;
const LARGO_ESTELA = 7;

function pathDeContornoEspejo(trazoInferior: TrazoMandala[]): SkPath | null {
  if (trazoInferior.length < 2) return null;
  const [poligono] = prepararPoligonos([construirContornoEspejo(trazoInferior, RADIO_FIGURA_SELLO)]);
  if (!poligono || poligono.length < 6) return null;
  const path = Skia.Path.Make();
  path.moveTo(poligono[0] + C, poligono[1] + C);
  for (let i = 2; i < poligono.length; i += 2) path.lineTo(poligono[i] + C, poligono[i + 1] + C);
  path.close();
  return path;
}

/** El sello tal como se traza: silueta blanca con halo. La usan el lienzo en vivo y el sello que levita. */
export const SiluetaSello = memo(function SiluetaSello({ aura, trazoInferior }: { aura: string; trazoInferior: TrazoMandala[] }) {
  const path = useMemo(() => pathDeContornoEspejo(trazoInferior), [trazoInferior]);
  if (!path) return null;
  return (
    <Canvas pointerEvents="none" style={styles.lienzo}>
      <Path color={aura} opacity={0.7} path={path}>
        <BlurMask blur={14} style="normal" />
      </Path>
      <Path color="#FFFFFF" opacity={0.45} path={path}>
        <BlurMask blur={9} style="normal" />
      </Path>
      <Path color="#FFFFFF" opacity={0.96} path={path} />
    </Canvas>
  );
});

// Línea guía única entre las dos anclas (equivalente a RayosGuia, pero sin
// abanico: acá solo hay una dirección que seguir, no `pliegues` de ellas).
const LineaGuiaSello = memo(function LineaGuiaSello({ brillo }: { brillo: SharedValue<number> }) {
  const izquierda = anclaIzquierdaSello(RADIO_FIGURA_SELLO);
  const derecha = anclaDerechaSello(RADIO_FIGURA_SELLO);
  const opacidad = useDerivedValue(() => 0.14 + brillo.value * 0.4);
  return (
    <Group opacity={opacidad}>
      <Line color="#FFFFFF" p1={vec(C + izquierda.x, C + izquierda.y)} p2={vec(C + derecha.x, C + derecha.y)} strokeCap="round" strokeWidth={1.5} />
    </Group>
  );
});

// Las dos anclas fijas — siempre visibles, no dependen del trazo: son el
// punto de partida y de llegada de cualquier sello de Tareas.
const AnclasSello = memo(function AnclasSello() {
  const izquierda = anclaIzquierdaSello(RADIO_FIGURA_SELLO);
  const derecha = anclaDerechaSello(RADIO_FIGURA_SELLO);
  return (
    <>
      <Circle color="#FFFFFF" cx={C + izquierda.x} cy={C + izquierda.y} opacity={0.9} r={RADIO_ANCLA}>
        <BlurMask blur={3} style="solid" />
      </Circle>
      <Circle color="#FFFFFF" cx={C + derecha.x} cy={C + derecha.y} opacity={0.9} r={RADIO_ANCLA}>
        <BlurMask blur={3} style="solid" />
      </Circle>
    </>
  );
});

// Punta de luz: la cabeza del trazo del usuario, con una estela corta que se
// apaga detrás — sin copias rotadas (acá no hay pliegues).
function PuntaDeLuzSello({ puntos }: { puntos: TrazoMandala[] }) {
  const estela = puntos.slice(-LARGO_ESTELA);
  if (estela.length === 0) return null;
  return (
    <>
      {estela.map((p, i) => {
        const cabeza = i === estela.length - 1;
        const vida = (i + 1) / estela.length;
        return cabeza ? (
          <Circle color="#FFFFFF" cx={p.x + C} cy={p.y + C} key={i} r={5}>
            <BlurMask blur={4} style="solid" />
          </Circle>
        ) : (
          <Circle color="#FFFFFF" cx={p.x + C} cy={p.y + C} key={i} opacity={vida * 0.55} r={1.2 + vida * 2} />
        );
      })}
    </>
  );
}

type EscenarioTrazoSelloProps = {
  brilloLineaGuia: SharedValue<number>;
  colorTinta: string;
  /** 0–1: tinta gastada. */
  tinta: SharedValue<number>;
  /** El trazo del usuario, solo la mitad de abajo. */
  puntos: TrazoMandala[];
};

export function EscenarioTrazoSello({ brilloLineaGuia, colorTinta, puntos, tinta }: EscenarioTrazoSelloProps) {
  return (
    <View pointerEvents="none" style={styles.lienzo}>
      <Canvas pointerEvents="none" style={styles.lienzo}>
        <LineaGuiaSello brillo={brilloLineaGuia} />
        <AnclasSello />
        <AnilloTinta color={colorTinta} tinta={tinta} />
      </Canvas>
      {puntos.length > 1 && <SiluetaSello aura={colorTinta} trazoInferior={puntos} />}
      {puntos.length > 0 && (
        <Canvas pointerEvents="none" style={styles.lienzo}>
          <PuntaDeLuzSello puntos={puntos} />
        </Canvas>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  lienzo: { height: LADO, left: 0, position: 'absolute', top: 0, width: LADO },
});
