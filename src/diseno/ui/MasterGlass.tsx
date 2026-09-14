import { PropsWithChildren, useState } from 'react';
import { BlurView, BlurViewProps } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { LayoutChangeEvent, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

type MasterGlassProps = PropsWithChildren<{
  blur?: boolean;
  intensity?: number;
  /** Variante especial verde semi-oscuro (en vez de blanco/menta arriba) — pensada para MasterChip. */
  mastery?: boolean;
  style?: StyleProp<ViewStyle>;
  tint?: BlurViewProps['tint'];
}>;

const MENTA_SUAVE = '#EAF8EB';
const MENTA_PROFUNDA = '#e5f5e6';
const MASTERY_SUAVE = '#2F7D52';
const MASTERY_PROFUNDA = '#148549';

function mezclarHex(origen: string, destino: string, proporcion: number) {
  const mezclarCanal = (indice: number) => {
    const inicio = parseInt(origen.slice(indice, indice + 2), 16);
    const fin = parseInt(destino.slice(indice, indice + 2), 16);
    return Math.round(inicio + (fin - inicio) * proporcion).toString(16).padStart(2, '0');
  };
  return `#${mezclarCanal(1)}${mezclarCanal(3)}${mezclarCanal(5)}`;
}

export function MasterGlass({ blur = false, children, intensity = 24, mastery = false, style, tint = 'light' }: MasterGlassProps) {
  const [tamano, setTamano] = useState({ alto: 0, ancho: 0 });
  const intensidadMenta = Math.min(1, Math.max(0, (tamano.alto - 52) / 348));
  const colorSuave = mastery ? MASTERY_SUAVE : MENTA_SUAVE;
  const colorProfundo = mastery ? MASTERY_PROFUNDA : MENTA_PROFUNDA;
  const colorCuerpo = mezclarHex(colorSuave, colorProfundo, 0.35 + intensidadMenta * 0.65);
  const colorPie = mastery ? mezclarHex(colorCuerpo, '#0B2417', 0.3) : mezclarHex(colorCuerpo, '#8CCF92', 0.2);
  // Mastery: arriba también es verde (nunca blanco) — colorSuave en vez de casi-blanco.
  const colorTope = mastery ? colorSuave : '#F7FDF7';
  const coloresExteriores: [string, string, string] = mastery
    ? [colorSuave, mezclarHex(colorSuave, colorProfundo, 0.45), colorProfundo]
    : ['#FFFFFF', '#CDEFCF', '#B7E6BD'];
  const finBorde = mastery ? { x: 1.2, y: -0.9 } : { x: 1, y: 1 };
  const ubicacionesBorde: [number, number, number] = mastery ? [0, 0.54, 1] : [0, 0.48, 1];
  const medirContenedor = ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    if (layout.width !== tamano.ancho || layout.height !== tamano.alto) setTamano({ alto: layout.height, ancho: layout.width });
  };
  const alto = Math.max(1, tamano.alto);
  const franjaSuperior = Math.min(14, alto * 0.14);
  const finTransicionSuperior = Math.max(franjaSuperior, alto * 0.58);
  const inicioTransicionInferior = Math.max(finTransicionSuperior, alto * 0.66);
  const grosorBorde = Math.min(2.4, Math.max(1.35, Math.min(tamano.ancho, tamano.alto) * 0.018));
  const ubicacion = (valor: number) => Math.min(1, Math.max(0, valor / alto));
  const interior = [styles.interior, { borderRadius: 20 - grosorBorde, margin: grosorBorde }];

  return (
    <LinearGradient colors={coloresExteriores} end={finBorde} locations={ubicacionesBorde} onLayout={medirContenedor} start={{ x: 0, y: 0 }} style={[styles.raiz, style]}>
      {blur ? <BlurView intensity={intensity} pointerEvents="none" tint={tint} style={interior} /> : <View pointerEvents="none" style={interior} />}
      <LinearGradient colors={[colorTope, colorTope, colorCuerpo, colorCuerpo, colorPie]} end={{ x: 0, y: 1 }} locations={[0, ubicacion(franjaSuperior), ubicacion(finTransicionSuperior), ubicacion(inicioTransicionInferior), 1]} pointerEvents="none" start={{ x: 0, y: 0 }} style={interior} />
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  raiz: {
    borderRadius: 20,
    boxShadow: '0px 7px 12px rgba(11, 116, 50, 0.32)',
    overflow: 'visible',
  },
  interior: { bottom: 0, left: 0, overflow: 'hidden', position: 'absolute', right: 0, top: 0 },
});
