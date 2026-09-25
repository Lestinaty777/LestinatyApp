import { PropsWithChildren, useState } from 'react';
import { BlurView, BlurViewProps } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { LayoutChangeEvent, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient as GradienteSvg, Polygon, Stop } from 'react-native-svg';

import { useTonoMaster } from '../tema/MasterColorContext';

type MasterGlassProps = PropsWithChildren<{
  blur?: boolean;
  intensity?: number;
  /** Aumenta el menta desde la parte superior para elementos pequeños, como iconos. */
  compacto?: boolean;
  /** Variante especial verde semi-oscuro (en vez de blanco/menta arriba) — pensada para MasterChip. */
  mastery?: boolean;
  /** Variante poligonal para un control destacado, como el acceso central de tienda. */
  forma?: 'rectangulo' | 'heptagono';
  style?: StyleProp<ViewStyle>;
  tint?: BlurViewProps['tint'];
  /** Color base opcional para teñir el cristal de un color específico en lugar de verde/menta. */
  colorBase?: string;
}>;

const RADIO_MASTER_GLASS = 12;

function mezclarHex(origen: string, destino: string, proporcion: number) {
  const mezclarCanal = (indice: number) => {
    const inicio = parseInt(origen.slice(indice, indice + 2), 16);
    const fin = parseInt(destino.slice(indice, indice + 2), 16);
    return Math.round(inicio + (fin - inicio) * proporcion).toString(16).padStart(2, '0');
  };
  return `#${mezclarCanal(1)}${mezclarCanal(3)}${mezclarCanal(5)}`;
}

export function MasterGlass({ blur = false, children, colorBase, compacto = false, forma = 'rectangulo', intensity = 24, mastery = false, style, tint = 'light' }: MasterGlassProps) {
  const [tamano, setTamano] = useState({ alto: 0, ancho: 0 });
  // Las bases del degradado salen del tono activo (Esmeralda = el menta de siempre).
  // Un colorBase explícito (p. ej. el color de un paquete concreto) las reemplaza
  // por una receta de mezcla con blanco/negro.
  const { degradados: g } = useTonoMaster();
  const intensidadMenta = Math.min(1, Math.max(0, (tamano.alto - 52) / 348));

  const mentaSuave = colorBase ? mezclarHex(colorBase, '#FFFFFF', 0.95) : g.menta.suave;
  const mentaProfunda = colorBase ? mezclarHex(colorBase, '#FFFFFF', 0.85) : g.menta.profunda;
  const masterySuave = colorBase ? mezclarHex(colorBase, '#000000', 0.1) : g.mastery.suave;
  const masteryProfunda = colorBase ? mezclarHex(colorBase, '#000000', 0.3) : g.mastery.profunda;

  const colorSuave = mastery ? masterySuave : compacto ? mezclarHex(mentaSuave, mentaProfunda, 0.4) : mentaSuave;
  const colorProfundo = mastery ? masteryProfunda : compacto ? mezclarHex(mentaProfunda, '#000000', 0.1) : mentaProfunda;
  const colorCuerpo = mezclarHex(colorSuave, colorProfundo, 0.35 + intensidadMenta * 0.65);
  const colorPie = mastery ? mezclarHex(colorCuerpo, '#000000', 0.3) : mezclarHex(colorCuerpo, colorBase ? colorBase : g.menta.pie, 0.2);
  
  const colorTope = mastery ? colorSuave : compacto ? mezclarHex(colorSuave, '#FFFFFF', 0.6) : mezclarHex(colorSuave, '#FFFFFF', 0.8);
  const coloresExteriores: [string, string, string] = mastery
    ? [colorSuave, mezclarHex(colorSuave, colorProfundo, 0.45), colorProfundo]
    : ['#FFFFFF', mezclarHex('#FFFFFF', colorProfundo, 0.3), colorProfundo];
  const finBorde = mastery ? { x: 1.2, y: 1 } : { x: 1, y: 1 };
  const ubicacionesBorde: [number, number, number] = mastery ? [0, 0.54, 1] : [0, 0.48, 1];
  const medirContenedor = ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    const w = Math.round(layout.width);
    const h = Math.round(layout.height);
    if (Math.abs(w - tamano.ancho) > 2 || Math.abs(h - tamano.alto) > 2) {
      setTamano({ alto: h, ancho: w });
    }
  };
  const alto = Math.max(1, tamano.alto);
  const franjaSuperior = Math.min(14, alto * 0.14);
  const finTransicionSuperior = Math.max(franjaSuperior, alto * 0.58);
  const inicioTransicionInferior = Math.max(finTransicionSuperior, alto * 0.66);
  const grosorBorde = Math.min(2.4, Math.max(1.35, Math.min(tamano.ancho, tamano.alto) * 0.018));
  const ubicacion = (valor: number) => Math.min(1, Math.max(0, valor / alto));
  // Si `style` trae su propio borderRadius (ej. tarjetas grandes que piden un
  // radio distinto al default), el contenido interior (blur/gradiente) tiene
  // que seguirlo — si no, queda con esquinas más rectas que el borde exterior.
  const flatStyle = (StyleSheet.flatten(style) ?? {}) as ViewStyle;
  const radioEfectivo = flatStyle.borderRadius;
  const radioExterior = typeof radioEfectivo === 'number' ? radioEfectivo : RADIO_MASTER_GLASS;
  const interior = [styles.interior, { borderRadius: Math.max(0, radioExterior - grosorBorde), margin: grosorBorde }];

  // El boxShadow no sigue de forma confiable el borderRadius cuando se aplica
  // directo sobre este LinearGradient en iOS (se ve como una sombra cuadrada
  // detrás de la tarjeta redondeada) — se mueve a un envoltorio View plano,
  // que sí la redondea bien. Las propiedades que definen cómo ESTE elemento
  // se relaciona con su propio padre/hermanos (margin, flex, alignSelf,
  // posición absoluta) se extraen al envoltorio para que no queden "atrapadas"
  // un nivel más adentro; todo lo demás (padding, overflow, etc.) se queda
  // igual que antes en el LinearGradient interior.
  const {
    margin, marginTop, marginBottom, marginLeft, marginRight, marginHorizontal, marginVertical, marginStart, marginEnd,
    flex, flexGrow, flexShrink, flexBasis, alignSelf,
    position, top, right, bottom, left, zIndex,
    ...estiloInterior
  } = flatStyle;
  // Ancho/alto NO se mueven (se necesitan en el LinearGradient para medir
  // bien con onLayout) — se COPIAN también al envoltorio, porque si no,
  // un caller que pide p. ej. width:'100%' queda resolviendo ese porcentaje
  // contra un envoltorio sin tamaño propio (encogido a su contenido), en vez
  // de contra el padre real — el botón/tarjeta terminaba angosto y corrido
  // hacia un lado en vez de ocupar todo el ancho. A diferencia de margin,
  // duplicar ancho/alto es seguro (no se acumula).
  const { width, height, minWidth, maxWidth, minHeight, maxHeight } = estiloInterior;
  const estiloEnvoltorio = {
    margin, marginTop, marginBottom, marginLeft, marginRight, marginHorizontal, marginVertical, marginStart, marginEnd,
    flex, flexGrow, flexShrink, flexBasis, alignSelf,
    position, top, right, bottom, left, zIndex,
    width, height, minWidth, maxWidth, minHeight, maxHeight,
  };

  if (forma === 'heptagono') {
    const borde = mastery ? g.heptagono.bordeMastery : g.heptagono.borde;
    const centro = mastery ? g.heptagono.centroMastery : colorCuerpo;
    const pie = mastery ? g.heptagono.pieMastery : colorPie;
    return (
      <View onLayout={medirContenedor} style={[styles.heptagonoRaiz, style]}>
        <Svg height="100%" preserveAspectRatio="xMidYMid meet" style={StyleSheet.absoluteFill} viewBox="0 0 72 72" width="100%">
          <Defs>
            <GradienteSvg id="masterGlassHeptagonoBorde" x1="0%" x2="100%" y1="0%" y2="100%"><Stop offset="0" stopColor={borde}/><Stop offset="1" stopColor={pie}/></GradienteSvg>
            <GradienteSvg id="masterGlassHeptagonoCentro" x1="0%" x2="0%" y1="0%" y2="100%"><Stop offset="0" stopColor={centro}/><Stop offset="1" stopColor={pie}/></GradienteSvg>
          </Defs>
          <Polygon fill="url(#masterGlassHeptagonoBorde)" points="36,1 61,13 71,40 52,67 20,67 1,40 11,13" />
          <Polygon fill="url(#masterGlassHeptagonoCentro)" points="36,4 58,15 67,40 50,63 22,63 5,40 14,15" />
        </Svg>
        <View style={styles.contenidoHeptagono}>{children}</View>
      </View>
    );
  }

  return (
    <View style={[estiloEnvoltorio, { borderRadius: radioExterior, boxShadow: `1px 3px 7px ${g.sombra}26` }]}>
      {/* El envoltorio se queda con flex/alignSelf/position (cómo ESTE
          elemento se relaciona con su padre) — el LinearGradient interior
          necesita `flex: 1` propio para llenar ese envoltorio completo, si
          no, un caller que dependía de `flex: 1` para estirarse (p. ej.
          MasterIconBg) queda con el interior encogido a su contenido
          mientras el envoltorio sí toma el tamaño correcto. */}
      <LinearGradient colors={coloresExteriores} end={finBorde} locations={ubicacionesBorde} onLayout={medirContenedor} start={{ x: 0, y: 0 }} style={[styles.raiz, { flex: 1 }, estiloInterior]}>
        {blur ? <BlurView intensity={intensity} pointerEvents="none" tint={tint} style={interior} /> : <View pointerEvents="none" style={interior} />}
        <LinearGradient colors={[colorTope, colorTope, colorCuerpo, colorCuerpo, colorPie]} end={{ x: 0, y: 1 }} locations={[0, ubicacion(franjaSuperior), ubicacion(finTransicionSuperior), ubicacion(inicioTransicionInferior), 1]} pointerEvents="none" start={{ x: 0, y: 0 }} style={interior} />
        {children}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: {
    borderRadius: RADIO_MASTER_GLASS,
    // boxShadow (a diferencia del shadow* clásico de RN) no necesita
    // overflow:'visible' para pintarse fuera de la caja — con 'visible' aquí,
    // cualquier contenido absoluto que le pasemos como children (como el
    // relleno del swipe) no se recorta a la forma redonda y se ve cuadrado.
    overflow: 'hidden',
  },
  contenidoHeptagono: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  heptagonoRaiz: { borderRadius: 0, overflow: 'visible', position: 'relative' },
  interior: { bottom: 0, left: 0, overflow: 'hidden', position: 'absolute', right: 0, top: 0 },
});
