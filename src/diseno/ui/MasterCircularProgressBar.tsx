import { useEffect, useId, type ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as GradienteSvg, Stop } from 'react-native-svg';
import Animated, { useAnimatedProps, useSharedValue, withSpring } from 'react-native-reanimated';

import { normalizarPorcentaje } from './progreso';
import { useTonoMaster } from '../tema/MasterColorContext';

const CirculoAnimado = Animated.createAnimatedComponent(Circle);

type MasterCircularProgressBarProps = {
  children?: ReactNode;
  /** Color base opcional — igual criterio que MasterProgressbar/MasterGlass: sin esto, usa los degradados del tono activo (Esmeralda por defecto, o el paquete del hábito si está dentro de un TonoDelHabito). */
  colorBase?: string;
  grosor?: number;
  porcentaje: number;
  style?: StyleProp<ViewStyle>;
  tamano?: number;
};

function mezclarColor(hex: string, porcentaje: number, haciaBlanco: boolean) {
  const limpio = hex.replace('#', '');
  const r = parseInt(limpio.slice(0, 2), 16);
  const g = parseInt(limpio.slice(2, 4), 16);
  const b = parseInt(limpio.slice(4, 6), 16);
  const t = haciaBlanco ? 255 : 0;
  const nr = Math.round(r + (t - r) * porcentaje).toString(16).padStart(2, '0');
  const ng = Math.round(g + (t - g) * porcentaje).toString(16).padStart(2, '0');
  const nb = Math.round(b + (t - b) * porcentaje).toString(16).padStart(2, '0');
  return `#${nr}${ng}${nb}`;
}

// El anillo homólogo de MasterProgressbar: misma fuente de color (tono
// activo vía MasterColorContext, o `colorBase` como receta de mezcla), mismo
// spring de avance — sólo cambia la forma, barra vs. anillo. Dentro de un
// <TonoDelHabito paqueteId={...}> se tiñe solo del color del paquete del
// hábito, sin pasar `colorBase`.
export function MasterCircularProgressBar({ children, colorBase, grosor = 12, porcentaje, style, tamano = 180 }: MasterCircularProgressBarProps) {
  const idInstancia = useId().replace(/[^a-zA-Z0-9]/g, '');
  const { degradados: g } = useTonoMaster();
  const porcentajeSeguro = normalizarPorcentaje(porcentaje);
  const avance = useSharedValue(porcentajeSeguro);

  useEffect(() => {
    avance.value = withSpring(porcentajeSeguro, { damping: 16, stiffness: 125 });
  }, [porcentajeSeguro, avance]);

  const radio = (tamano - grosor) / 2;
  const circunferencia = 2 * Math.PI * radio;
  const centro = tamano / 2;

  // Mezcla más ceñida al color real que MasterProgressbar (0.2/0.4): un
  // anillo circular grande deja ver mucho más superficie del color que una
  // barra delgada, así que ir hasta 40% hacia blanco se leía pastel. Aquí el
  // tramo lleno se queda cerca del color saturado del paquete de principio a
  // fin; sólo la pista vacía se aclara para dar contraste.
  const coloresGradiente: [string, string, ...string[]] = colorBase
    ? [mezclarColor(colorBase, 0.1, false), colorBase, mezclarColor(colorBase, 0.12, true)]
    : g.progreso;
  const coloresFondo: [string, string, ...string[]] = colorBase
    ? [mezclarColor(colorBase, 0.85, true), mezclarColor(colorBase, 0.92, true)]
    : g.progresoFondo;

  const idGradiente = `masterAnillo-${idInstancia}`;
  const idFondo = `masterAnilloFondo-${idInstancia}`;

  const propsAnimadas = useAnimatedProps(() => ({
    strokeDashoffset: circunferencia * (1 - avance.value / 100),
  }));

  return (
    <View style={[styles.raiz, { height: tamano, width: tamano }, style]}>
      <Svg height={tamano} width={tamano}>
        <Defs>
          <GradienteSvg id={idFondo} x1="0%" x2="100%" y1="0%" y2="0%">
            {coloresFondo.map((cor, indice) => <Stop key={cor} offset={`${(indice / (coloresFondo.length - 1)) * 100}%`} stopColor={cor} />)}
          </GradienteSvg>
          <GradienteSvg id={idGradiente} x1="0%" x2="100%" y1="0%" y2="0%">
            {coloresGradiente.map((cor, indice) => <Stop key={cor} offset={`${(indice / (coloresGradiente.length - 1)) * 100}%`} stopColor={cor} />)}
          </GradienteSvg>
        </Defs>
        <Circle cx={centro} cy={centro} fill="none" r={radio} stroke={`url(#${idFondo})`} strokeWidth={grosor} />
        <CirculoAnimado
          animatedProps={propsAnimadas}
          cx={centro}
          cy={centro}
          fill="none"
          origin={`${centro}, ${centro}`}
          r={radio}
          rotation={-90}
          stroke={`url(#${idGradiente})`}
          strokeDasharray={`${circunferencia} ${circunferencia}`}
          strokeLinecap="round"
          strokeWidth={grosor}
        />
      </Svg>
      {children ? <View pointerEvents="none" style={styles.centro}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  centro: { alignItems: 'center', justifyContent: 'center', position: 'absolute' },
  raiz: { alignItems: 'center', justifyContent: 'center' },
});
