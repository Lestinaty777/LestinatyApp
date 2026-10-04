import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { BlurMask, Canvas, Circle, Group, Path, Shadow, Skia } from '@shopify/react-native-skia';
import { Easing, useDerivedValue, useSharedValue, withRepeat, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';

import { normalizarPorcentaje } from './progreso';

type MasterRingBarProps = {
  /** Burbujas blancas flotando en el tramo lleno. */
  burbujas?: boolean;
  children?: ReactNode;
  /** Color real (nunca un tono ya mezclado) — por defecto el anillo es un surco suave de este color, y solo se rellena con el saturado conforme avanza el porcentaje. */
  color: string;
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

const NUM_BURBUJAS = 6;

type BurbujaFlotanteProps = { avance: SharedValue<number>; centro: number; fraccion: number; radio: number; tamano: number; tiempo: SharedValue<number> };

// Una burbuja blanca que viaja dentro del tramo ya lleno (fracción fija del
// avance actual) con un bamboleo radial + parpadeo de opacidad independientes
// por burbuja — idéntico al de MasterSand (misma sensación "arena/joya").
function BurbujaFlotante({ avance, centro, fraccion, radio, tamano, tiempo }: BurbujaFlotanteProps) {
  const fase = fraccion * 11;
  const bamboleoRadio = tamano * 0.012;
  const cx = useDerivedValue(() => {
    const angulo = (-90 + 360 * avance.value * fraccion) * (Math.PI / 180);
    const bamboleo = Math.sin(tiempo.value * Math.PI * 2 + fase) * bamboleoRadio;
    return centro + Math.cos(angulo) * (radio + bamboleo);
  });
  const cy = useDerivedValue(() => {
    const angulo = (-90 + 360 * avance.value * fraccion) * (Math.PI / 180);
    const bamboleo = Math.sin(tiempo.value * Math.PI * 2 + fase) * bamboleoRadio;
    return centro + Math.sin(angulo) * (radio + bamboleo);
  });
  const opacidad = useDerivedValue(() => {
    if (avance.value < fraccion + 0.015) return 0;
    return 0.35 + 0.5 * Math.abs(Math.sin(tiempo.value * Math.PI * 2 * 1.6 + fase));
  });
  const radioBurbuja = useDerivedValue(() => (tamano * 0.013) * (1.15 + Math.abs(Math.sin(tiempo.value * Math.PI * 2 + fase)) * 0.9));

  return (
    <Circle color="#FFFFFF" cx={cx} cy={cy} opacity={opacidad} r={radioBurbuja}>
      <BlurMask blur={Math.max(0.4, tamano * 0.005)} style="normal" />
    </Circle>
  );
}

/**
 * Barra de progreso en anillo — la misma de la pantalla de espera del wizard
 * de Hábitos (PreparandoHabito + MasterSand forma="anillo"), formalizada acá
 * como componente propio para poder reusarla fuera de ese flujo. Mismo trazo,
 * mismo surco suave/relleno saturado, mismas burbujas — pero con las sombras
 * proporcionales a `tamano` (en MasterSand son píxeles fijos, pensados para
 * los ~300-460px donde ya se usa; acá se necesita que también se vea bien
 * mucho más chico, dentro de una fila compacta).
 */
export function MasterRingBar({ burbujas = true, children, color, grosor = 22, porcentaje, tamano = 120 }: MasterRingBarProps) {
  const porcentajeSeguro = normalizarPorcentaje(porcentaje);
  const colorSurco = mezclarColor(color, 0.62, true);
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

  const blurExterior = Math.max(1, tamano * 0.013);
  const blurInterior = Math.max(0.5, tamano * 0.0065);
  const desplazo = Math.max(0.5, tamano * 0.01);

  return (
    <View style={{ height: tamano, width: tamano }}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Group>
          <Path color={colorSurco} path={trazo} strokeCap="round" strokeWidth={grosor} style="stroke">
            <Shadow blur={blurExterior} color="rgba(0,0,0,0.3)" dx={0} dy={desplazo} inner />
            <Shadow blur={blurInterior} color="rgba(255,255,255,0.55)" dx={0} dy={-desplazo * 0.5} inner />
          </Path>
        </Group>
        <Group>
          <Path color={color} end={avance} path={trazo} start={0} strokeCap="round" strokeWidth={grosor} style="stroke">
            <Shadow blur={blurInterior} color="rgba(0,0,0,0.2)" dx={0} dy={desplazo * 0.5} />
          </Path>
        </Group>
        {burbujas ? (
          <Group>
            {Array.from({ length: NUM_BURBUJAS }, (_, indice) => (
              <BurbujaFlotante avance={avance} centro={centro} fraccion={(indice + 1) / (NUM_BURBUJAS + 1)} key={indice} radio={radio} tamano={tamano} tiempo={tiempo} />
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
