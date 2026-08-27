import type { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { hapticSeguro } from '../../nucleo/dispositivo/haptics';

export function ajustarColor(hex: string, porcentaje: number) {
  // porcentaje: -100 (negro) a 100 (blanco)
  let r = parseInt(hex.substring(1, 3), 16);
  let g = parseInt(hex.substring(3, 5), 16);
  let b = parseInt(hex.substring(5, 7), 16);

  if (porcentaje > 0) {
    r = Math.round(r + (255 - r) * (porcentaje / 100));
    g = Math.round(g + (255 - g) * (porcentaje / 100));
    b = Math.round(b + (255 - b) * (porcentaje / 100));
  } else if (porcentaje < 0) {
    const p = Math.abs(porcentaje) / 100;
    r = Math.round(r * (1 - p));
    g = Math.round(g * (1 - p));
    b = Math.round(b * (1 - p));
  }

  const toHex = (c: number) => {
    const hexC = c.toString(16);
    return hexC.length === 1 ? '0' + hexC : hexC;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export type EstadoNodo = 'activo' | 'completado' | 'desactivado';

interface NodoProps {
  Icono: any;
  masterColor: string;
  onPress?: () => void;
  size?: number;
  variacion?: number;
  isSelected?: boolean;
  tituloTooltip?: string;
  descripcionTooltip?: string;
  progresoTooltip?: number;
  estado?: EstadoNodo;
  tooltipOffset?: number;
}

// Los paths extraidos de IconoBaseColor
const PATH_BASE = "M10.2267 2.29713C11.0492 1.90101 12.0074 1.90101 12.83 2.29713L17.2632 4.43204C18.0857 4.82816 18.6831 5.5773 18.8863 6.46738L19.9812 11.2645C20.1843 12.1546 19.9711 13.0887 19.4019 13.8025L16.334 17.6495C15.7648 18.3633 14.9015 18.779 13.9886 18.779H9.06809C8.15512 18.779 7.29183 18.3633 6.7226 17.6495L3.65474 13.8025C3.08551 13.0887 2.87229 12.1546 3.07545 11.2645L4.17036 6.46738C4.37351 5.5773 4.97093 4.82816 5.79349 4.43204L10.2267 2.29713Z";
const PATH_BRILLO = "M14.944 3.315L17.2632 4.43204C18.0857 4.82816 18.6831 5.5773 18.8863 6.46738L19.618 9.672C18.521 8.984 17.422 8.154 16.334 7.174C15.442 6.371 14.978 5.166 14.944 3.315Z";

import { Texto } from './Texto';
import { RecuadroGlass } from './RecuadroGlass';
import { BarraProgresoLiquida } from './BarraProgresoLiquida';
import { colores } from '../fundamentos/colores'; // Needed for Text in tooltip

export function Nodo({
  Icono,
  masterColor,
  onPress,
  size = 60,
  variacion = 0,
  isSelected = false,
  tituloTooltip = 'Misión',
  descripcionTooltip = 'Haz clic aquí para comenzar esta etapa del recorrido.',
  progresoTooltip,
  estado = 'activo',
  tooltipOffset = 0,
}: NodoProps) {
  let colorBase = masterColor;
  if (estado === 'desactivado') {
    colorBase = '#A0A0A5'; // Grisaceo
  } else if (estado === 'completado') {
    colorBase = ajustarColor(masterColor, 15); // Mas saturado/luminoso
  }
  
  const colorFinal = ajustarColor(colorBase, variacion);
  const colorSombra = ajustarColor(colorFinal, -40); // La base 3D inferior
  
  const isPressed = useSharedValue(0);
  const desplazamientoY = 4; // Cuantos pixeles bajara la cara superior al presionar

  const caraSuperiorStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: withSpring(isPressed.value * desplazamientoY, { damping: 12, stiffness: 200 }) }
      ]
    };
  });

  return (
    <View style={[styles.wrapperGlobal, { zIndex: isSelected ? 100 : 1, width: size, height: size + desplazamientoY }]}>
      
      {isSelected && (
        <View style={styles.tooltipPosicionador}>
          <View style={[styles.tooltipCaja, { transform: [{ translateX: tooltipOffset }] }]}>
            
            <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center', marginBottom: 6 }}>
              <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Svg width={44} height={(44 * 23) / 24} viewBox="-0.47 -1.16 24 23" fill="none" style={{ position: 'absolute' }}>
                  <Path d={PATH_BASE} fill={colorFinal} />
                  <Path d={PATH_BRILLO} fill="#FFFFFF" fillOpacity="0.4" />
                </Svg>
                <View style={{position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center"}}><Icono color="#FFFFFF" size={16} strokeWidth={2.5} /></View>
              </View>
              <View style={{ flex: 1 }}>
                <Texto style={[styles.tooltipTitulo, { marginBottom: 2 }]}>{tituloTooltip}</Texto>
                <Texto style={[styles.tooltipDesc, { marginBottom: 0 }]} numberOfLines={2}>{descripcionTooltip}</Texto>
              </View>
            </View>
            
            {estado === 'activo' && (progresoTooltip ?? 0) > 0 ? (
               <View style={{ width: '100%', marginBottom: 4, marginTop: 4 }}>
                 <BarraProgresoLiquida porcentaje={progresoTooltip} color={masterColor} />
               </View>
            ) : (
               <Pressable 
                 style={({ pressed }) => [
                   styles.tooltipBoton, 
                   { 
                     backgroundColor: colorBase, 
                     opacity: pressed ? 0.9 : 1,
                     transform: [{ scale: pressed ? 0.97 : 1 }]
                   }
                 ]} 
                 onPress={() => hapticSeguro()}
               >
                 <Texto style={styles.tooltipBotonTexto}>
                   {estado === 'completado' ? 'REVISAR' : estado === 'desactivado' ? 'BLOQUEADO' : 'EMPEZAR'}
                 </Texto>
               </Pressable>
            )}
          </View>
        </View>
      )}

      <Pressable
        onPressIn={() => {
          isPressed.value = 1;
          hapticSeguro();
        }}
        onPressOut={() => {
          isPressed.value = 0;
        }}
        onPress={onPress}
        style={styles.contenedorAbsoluto}
      >
        {/* SOMBRA / BASE 3D (Estatica en el fondo, desplazada hacia abajo) */}
        <View style={[styles.capaAbsoluta, { top: desplazamientoY }]}>
          <Svg width={size} height={(size * 23) / 24} viewBox="-0.47 -1.16 24 23" fill="none">
            <Path d={PATH_BASE} fill={colorSombra} />
          </Svg>
        </View>

        {/* CARA SUPERIOR ANIMADA */}
        <Animated.View style={[styles.capaAbsoluta, caraSuperiorStyle]}>
          <View style={{ width: size, height: (size * 23) / 24 }}>
            <Svg width="100%" height="100%" viewBox="-0.47 -1.16 24 23" fill="none" style={{ position: 'absolute' }}>
              {/* Fondo de la cara */}
              <Path d={PATH_BASE} fill={colorFinal} />
              {/* Brillo de cristal */}
              <Path d={PATH_BRILLO} fill="#FFFFFF" fillOpacity="0.4" />
            </Svg>
            
            {/* Icono centrado absoluto */}
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
              <Icono color="#FFFFFF" size={size * 0.4} strokeWidth={2.5} />
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  
  wrapperGlobal: {
    position: 'relative',
    alignItems: 'center',
  },
  contenedorAbsoluto: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  tooltipPosicionador: {
    position: 'absolute',
    left: '50%',
    transform: [{ translateX: '-50%' }],
    alignItems: 'center',
    width: 280,
    zIndex: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  tooltipCaja: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    width: '100%',
    zIndex: 2,
  },
  tooltipFlechaWrapper: {
  },
  tooltipFlecha: {
    width: 20,
    height: 20,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
    marginTop: -10,
    zIndex: 1,
  },
  tooltipTitulo: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 16,
    color: colores.texto,
    marginBottom: 2,
    alignSelf: 'flex-start',
    textAlign: 'left',
  },
  tooltipDesc: {
    fontFamily: 'MontserratAlternates-SemiBold',
    fontSize: 11,
    lineHeight: 14,
    color: colores.textoSecundario,
    textAlign: 'left',
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  tooltipBoton: {
    paddingHorizontal: 26,
    paddingVertical: 10,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tooltipBotonTexto: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  contenedor: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  capaAbsoluta: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconoCentrado: {
    position: 'absolute',
    top: '45%', // Ligeramente compensado por la forma
    left: '50%',
    transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
    alignItems: 'center',
    justifyContent: 'center',
  }
});
