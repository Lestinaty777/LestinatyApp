import type { ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { MasterGlass } from './MasterGlass';

type MasterIconBgProps = {
  children?: ReactNode;
  colorBordeFin?: string;
  colorBordeInicio?: string;
  degradadoFin?: string;
  degradadoInicio?: string;
  fuente?: ImageSourcePropType;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

// Fondo de icono glass con anillo degradado verde — extraído tal cual de la
// tarjeta de hábito de "Hoy" (TarjetaSenderoHabito) para reusarse en
// cualquier lugar del diseño que necesite ese mismo marco. Acepta una imagen
// (fuente) o cualquier otro contenido (children, p. ej. un icono de lucide).
export function MasterIconBg({
  children, colorBordeFin = '#539C68', colorBordeInicio = '#C5F7B6',
  degradadoFin = '#B8EDB0', degradadoInicio = '#F4FFF1',
  fuente, size = 68, style,
}: MasterIconBgProps) {
  const radioExterior = Math.round(size * (18 / 68));
  const radioInterior = Math.round(size * (16 / 68));
  const tamanoIcono = Math.round(size * (48 / 68) * 1.2);

  return (
    <View style={[mib.marco, { borderRadius: radioExterior, height: size, width: size }, style]}>
      <Svg height={size} pointerEvents="none" style={mib.borde} width={size}>
        <Defs>
          <LinearGradient id="masterIconBgBorde" x1="0%" x2="100%" y1="0%" y2="100%">
            <Stop offset="0" stopColor={colorBordeInicio} />
            <Stop offset="1" stopColor={colorBordeFin} />
          </LinearGradient>
        </Defs>
        <Rect fill="url(#masterIconBgBorde)" height={size} rx={radioExterior} ry={radioExterior} width={size} />
      </Svg>
      <MasterGlass blur compacto style={[mib.glass, { borderRadius: radioInterior }]}>
        {fuente ? <Image resizeMode="contain" source={fuente} style={{ height: tamanoIcono, width: tamanoIcono }} /> : children}
      </MasterGlass>
    </View>
  );
}

const mib = StyleSheet.create({
  marco: { alignSelf: 'flex-start', elevation: 3, padding: 2, position: 'relative', shadowColor: '#176836', shadowOffset: { height: 4, width: 3 }, shadowOpacity: 0.16, shadowRadius: 7 },
  borde: { left: 0, position: 'absolute', top: 0 },
  glass: { alignItems: 'center', flex: 1, justifyContent: 'center' },
});
