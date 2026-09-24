import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { BlurMask, Canvas, Circle, Group, Path, Shadow, Skia } from '@shopify/react-native-skia';
import { Easing, useDerivedValue, useSharedValue, withRepeat, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';

import { normalizarPorcentaje } from './progreso';

type FormaMasterSand = 'anillo' | 'circulo';

type MasterSandProps = {
  /** Sólo 'anillo': burbujas blancas flotando en el tramo lleno. */
  burbujas?: boolean;
  children?: ReactNode;
  /** Color real del hábito/paquete — nunca un tono ya mezclado, MasterSand hace su propia mezcla. */
  color: string;
  forma?: FormaMasterSand;
  /** Sólo 'anillo'. */
  grosor?: number;
  porcentaje: number;
  tamano?: number;
};

function mezclarColor(hex: string, cantidad: number, haciaBlanco: boolean) {
  const limpio = hex.replace('#', '');
  const r = parseInt(limpio.slice(0, 2), 16);
  const g = parseInt(limpio.slice(2, 4), 16);
  const b = parseInt(limpio.slice(4, 6), 16);
  const t = haciaBlanco ? 255 : 0;
  const nr = Math.round(r + (t - r) * cantidad).toString(16).padStart(2, '0');
  const ng = Math.round(g + (t - g) * cantidad).toString(16).padStart(2, '0');
  const nb = Math.round(b + (t - b) * cantidad).toString(16).padStart(2, '0');
  return `#${nr}${ng}${nb}`;
}

// La superficie "arena" que comparten las dos formas: lo incompleto es un
// hueco en el mismo color pero deslavado (doble sombra interior — oscura
// abajo, clara arriba, así se ve hundido); lo completo es el color saturado
// real con una sombra exterior sutil (se ve lleno/levantado). Formalizado
// una sola vez acá — antes vivía sólo dentro del anillo del compositor de
// misión, ahora cualquier forma (anillo de progreso, badge circular, lo que
// sea) puede pedirlo con `<MasterSand forma="..." porcentaje={...} />`.
export function MasterSand({ burbujas = true, children, color, forma = 'anillo', grosor = 22, porcentaje, tamano = 120 }: MasterSandProps) {
  const porcentajeSeguro = normalizarPorcentaje(porcentaje);
  const colorSurco = mezclarColor(color, 0.62, true);

  if (forma === 'circulo') {
    return (
      <SandCirculo color={color} colorSurco={colorSurco} porcentajeSeguro={porcentajeSeguro} tamano={tamano}>
        {children}
      </SandCirculo>
    );
  }

  return (
    <SandAnillo burbujas={burbujas} color={color} colorSurco={colorSurco} grosor={grosor} porcentajeSeguro={porcentajeSeguro} tamano={tamano}>
      {children}
    </SandAnillo>
  );
}

function SandCirculo({ children, color, colorSurco, porcentajeSeguro, tamano }: { children?: ReactNode; color: string; colorSurco: string; porcentajeSeguro: number; tamano: number }) {
  const progreso = useSharedValue(porcentajeSeguro / 100);

  useEffect(() => {
    progreso.value = withSpring(porcentajeSeguro / 100, { damping: 16, stiffness: 110 });
  }, [porcentajeSeguro, progreso]);

  const opacidadLleno = useDerivedValue(() => progreso.value);
  const opacidadHundido = useDerivedValue(() => 1 - progreso.value);
  const centro = tamano / 2;
  const radio = tamano / 2 - Math.max(2, tamano * 0.04);

  return (
    <View style={{ height: tamano, width: tamano }}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Circle color={colorSurco} cx={centro} cy={centro} opacity={opacidadHundido} r={radio}>
          <Shadow blur={tamano * 0.05} color="rgba(0,0,0,0.28)" dx={0} dy={tamano * 0.03} inner />
          <Shadow blur={tamano * 0.025} color="rgba(255,255,255,0.55)" dx={0} dy={-tamano * 0.016} inner />
        </Circle>
        <Circle color={color} cx={centro} cy={centro} opacity={opacidadLleno} r={radio}>
          <Shadow blur={tamano * 0.035} color="rgba(0,0,0,0.2)" dx={0} dy={tamano * 0.02} />
        </Circle>
      </Canvas>
      {children ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.centro]}>{children}</View> : null}
    </View>
  );
}

const NUM_BURBUJAS = 6;

type BurbujaFlotanteProps = {
  avance: SharedValue<number>;
  centro: number;
  fraccion: number;
  radio: number;
  tiempo: SharedValue<number>;
};

// Una burbuja blanca que viaja dentro del tramo ya lleno (fracción fija del
// avance actual, así que redistribuyen su posición mientras el anillo crece)
// con un bamboleo radial + parpadeo de opacidad independientes por burbuja.
function BurbujaFlotante({ avance, centro, fraccion, radio, tiempo }: BurbujaFlotanteProps) {
  const fase = fraccion * 11;
  const cx = useDerivedValue(() => {
    const angulo = (-90 + 360 * avance.value * fraccion) * (Math.PI / 180);
    const bamboleo = Math.sin(tiempo.value * Math.PI * 2 + fase) * (radio * 0.05);
    return centro + Math.cos(angulo) * (radio + bamboleo);
  });
  const cy = useDerivedValue(() => {
    const angulo = (-90 + 360 * avance.value * fraccion) * (Math.PI / 180);
    const bamboleo = Math.sin(tiempo.value * Math.PI * 2 + fase) * (radio * 0.05);
    return centro + Math.sin(angulo) * (radio + bamboleo);
  });
  const opacidad = useDerivedValue(() => {
    if (avance.value < fraccion + 0.015) return 0;
    return 0.35 + 0.5 * Math.abs(Math.sin(tiempo.value * Math.PI * 2 * 1.6 + fase));
  });
  const radioBurbuja = useDerivedValue(() => 1.6 + Math.abs(Math.sin(tiempo.value * Math.PI * 2 + fase)) * 1.4);

  return (
    <Circle color="#FFFFFF" cx={cx} cy={cy} opacity={opacidad} r={radioBurbuja}>
      <BlurMask blur={0.6} style="normal" />
    </Circle>
  );
}

function SandAnillo({ burbujas, children, color, colorSurco, grosor, porcentajeSeguro, tamano }: {
  burbujas: boolean; children?: ReactNode; color: string; colorSurco: string; grosor: number; porcentajeSeguro: number; tamano: number;
}) {
  const avance = useSharedValue(porcentajeSeguro / 100);
  const tiempo = useSharedValue(0);

  useEffect(() => {
    avance.value = withSpring(porcentajeSeguro / 100, { damping: 16, stiffness: 110 });
  }, [porcentajeSeguro, avance]);

  useEffect(() => {
    if (!burbujas) return;
    tiempo.value = withRepeat(withTiming(1, { duration: 3200, easing: Easing.linear }), -1, false);
  }, [burbujas, tiempo]);

  const radio = (tamano - grosor) / 2;
  const centro = tamano / 2;
  const oval = Skia.XYWHRect(grosor / 2, grosor / 2, tamano - grosor, tamano - grosor);
  const trazo = Skia.Path.Make();
  trazo.addArc(oval, -90, 360);

  return (
    <View style={{ height: tamano, width: tamano }}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Group>
          <Path color={colorSurco} path={trazo} strokeCap="round" strokeWidth={grosor} style="stroke">
            <Shadow blur={4} color="rgba(0,0,0,0.3)" dx={0} dy={3} inner />
            <Shadow blur={2} color="rgba(255,255,255,0.55)" dx={0} dy={-1.5} inner />
          </Path>
        </Group>
        <Group>
          <Path color={color} end={avance} path={trazo} start={0} strokeCap="round" strokeWidth={grosor} style="stroke">
            <Shadow blur={2.5} color="rgba(0,0,0,0.2)" dx={0} dy={1.5} />
          </Path>
        </Group>
        {burbujas ? (
          <Group>
            {Array.from({ length: NUM_BURBUJAS }, (_, indice) => (
              <BurbujaFlotante
                avance={avance}
                centro={centro}
                fraccion={(indice + 1) / (NUM_BURBUJAS + 1)}
                key={indice}
                radio={radio}
                tiempo={tiempo}
              />
            ))}
          </Group>
        ) : null}
      </Canvas>
      {children ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.centro, { padding: radio * 0.18 }]}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  centro: { alignItems: 'center', justifyContent: 'center' },
});
