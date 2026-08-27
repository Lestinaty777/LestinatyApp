import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { Compass, Flame, Leaf, PiggyBank, Target, Users, BookOpen, Zap, Star, Trophy, Activity, Flag } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import React, { useMemo, useEffect, useRef } from 'react';
import { Animated, Dimensions, FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import AnimatedReanimated, { useSharedValue, useAnimatedProps, withRepeat, withTiming } from 'react-native-reanimated';


import { Nodo } from '../../../diseno/componentes';
import { RecuadroGlass, Texto, colores } from '../../../diseno';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Configuracion del mapa
const ALTURA_PISO = 85;
const ANCHO_CARRIL = 100;
const CENTER_X = SCREEN_WIDTH / 2;
const MAPA_PADDING_TOP = 260;
const MAPA_PADDING_BOTTOM = 150;

type TipoNodoMapa = 'normal' | 'tablero' | 'meta';

interface NodoDef {
  id: string;
  nivel: number;
  tipo: TipoNodoMapa;
  offsetX: number; // Pixeles de desviacion del centro
  conexiones: string[]; 
  titulo: string;
  subtitulo: string;
  icono_lucide: LucideIcon;
}

// Generador de layout estilo Serpiente (Duolingo)
const TOTAL_NODOS = 12;
const AMPLITUD = 55; // Cuanto se desvia a los lados
const FRECUENCIA = 0.9; // Que tan rapido oscila

const LAYOUT_MAPA: NodoDef[] = Array.from({ length: TOTAL_NODOS }).map((_, i) => {
  const isTablero = i === 6; // El tablero es un punto medio
  const isMeta = i === TOTAL_NODOS - 1;
  const tipo = isMeta ? 'meta' : isTablero ? 'tablero' : 'normal';
  
  // Nodos especiales (tablero o meta) van al centro. Nodos normales serpentean.
  const offsetX = (tipo === 'tablero' || tipo === 'meta') 
    ? 0 
    : Math.sin(i * FRECUENCIA) * AMPLITUD;

  const titulos = ['Conceptos Básicos', 'Primera Práctica', 'Desafío Corto', 'Repaso', 'Avanzado', 'Prueba', 'Punto de Reunión', 'Concepto Medio', 'Práctica Media', 'Lectura', 'Desafío Largo', 'Meta Final'];
  const subtitulos = [
    'Estudia la teoría inicial.', 'Pon a prueba tus dedos.', 'Ejercicios rápidos de reflejos.',
    'Revisa lo aprendido ayer.', 'Nuevas técnicas complejas.', 'Simulador de velocidad.',
    'Únete a la escuadra aquí.', 'Teoría de nivel medio.', 'Práctica de ritmo.',
    'Lee sobre el flujo.', 'Un maratón de 10 minutos.', '¡Reclama tu trofeo!'
  ];
  
  const iconosNodos = [
    BookOpen, Target, Zap, 
    Activity, Star, Compass, 
    Users, PiggyBank, Leaf, 
    Flag, Flame, Trophy
  ];

  return {
    id: `nodo-${i}`,
    nivel: i,
    tipo,
    offsetX,
    conexiones: i < TOTAL_NODOS - 1 ? [`nodo-${i + 1}`] : [],
    titulo: titulos[i],
    subtitulo: subtitulos[i],
    icono_lucide: iconosNodos[i],
  };
});

const AnimatedPath = AnimatedReanimated.createAnimatedComponent(Path);

export function MapaCompartido({ masterColor = '#1463FF' }: { masterColor?: string }) {
  const [nodoSeleccionado, setNodoSeleccionado] = React.useState<string | null>(null);
  const scrollViewRef = useRef<FlatList>(null);
  const { height: windowHeight } = Dimensions.get('window');

  const handleNodoPress = (nodoId: string, yPos: number) => {
    if (nodoSeleccionado === nodoId) {
      setNodoSeleccionado(null);
    } else {
      setNodoSeleccionado(nodoId);
      // Auto Scroll to center the node
      const targetY = yPos - (windowHeight / 2) + 120; // 120 extra offset so tooltip fits well
      scrollViewRef.current?.scrollToOffset({ offset: Math.max(0, targetY), animated: true });
    }
  };
  
  // Animacion de pulso para el camino activo
  const pulseAnim = useSharedValue(0.15);
  useEffect(() => {
    pulseAnim.value = withRepeat(
      withTiming(0.65, { duration: 1200 }),
      -1,
      true
    );
  }, [pulseAnim]);
  
  const animatedProps = useAnimatedProps(() => ({
    strokeOpacity: pulseAnim.value
  }));

  // Calculamos la altura total basada en el nivel mas alto
  const niveles = LAYOUT_MAPA.map(n => n.nivel);
  const maxNivel = Math.max(...niveles);
  const totalHeight = (maxNivel * ALTURA_PISO) + MAPA_PADDING_TOP + MAPA_PADDING_BOTTOM;

  // Calculadora de Coordenadas
  const obtenerCoordenadas = (nodo: NodoDef) => {
    const x = CENTER_X + nodo.offsetX;
    // Y va de abajo hacia arriba (nivel 0 es abajo)
    const y = MAPA_PADDING_TOP + (nodo.nivel * ALTURA_PISO);
    return { x, y };
  };

  // Diccionario para buscar coordenadas rapido al dibujar lineas
  const coordsDict = useMemo(() => {
    const dict: Record<string, {x: number, y: number}> = {};
    LAYOUT_MAPA.forEach(nodo => {
      dict[nodo.id] = obtenerCoordenadas(nodo);
    });
    return dict;
  }, [totalHeight]);

  // Construir Caminos SVG
  const CaminosSVG = null;

  return (
    <View style={styles.raiz}>
      <FlatList
        ref={scrollViewRef as any}
        data={LAYOUT_MAPA}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: MAPA_PADDING_TOP, paddingBottom: MAPA_PADDING_BOTTOM }}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews={true}
        renderItem={({ item: nodo, index: i }: { item: any; index: number }) => {
          const { x, y } = coordsDict[nodo.id];
          const variacion = 0;

          if (nodo.tipo === 'tablero') {
            return (
              <View 
                style={[
                  
                  {
                    height: ALTURA_PISO,
                    width: '100%',
                    position: 'relative',
                  }
                ]}
              >
                <View style={{ position: 'absolute', left: CENTER_X + nodo.offsetX - 45, top: -45 }}>
                  {/* Mock de tablero */}
                  <View style={{ width: 90, height: 90, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }}>
                    <Users color={masterColor} size={24} />
                  </View>
                </View>
              </View>
            );
          }

          // Calcular si el tooltip se sale de la pantalla
          const TOOLTIP_WIDTH = 280;
          const MARGIN_EDGE = 16;
          const leftEdge = x - (TOOLTIP_WIDTH / 2);
          const rightEdge = x + (TOOLTIP_WIDTH / 2);
          
          let tooltipOffset = 0;
          if (leftEdge < MARGIN_EDGE) {
            tooltipOffset = MARGIN_EDGE - leftEdge;
          } else if (rightEdge > SCREEN_WIDTH - MARGIN_EDGE) {
            tooltipOffset = (SCREEN_WIDTH - MARGIN_EDGE) - rightEdge;
          }

          return (
            <View 
              style={[
                
                {
                  height: ALTURA_PISO,
                  width: '100%',
                  position: 'relative',
                }
              ]}
            >
              <View style={{ position: 'absolute', left: CENTER_X + nodo.offsetX - 45, top: -45 }}>
                <Nodo 
                  Icono={nodo.icono_lucide}
                  masterColor={masterColor}
                  variacion={variacion}
                  size={90}
                  isSelected={nodoSeleccionado === nodo.id}
                  tituloTooltip={nodo.titulo}
                  descripcionTooltip={nodo.subtitulo}
                  estado={nodo.nivel < 2 ? 'completado' : nodo.nivel === 2 ? 'activo' : 'desactivado'}
                  progresoTooltip={nodo.nivel === 2 ? 65 : nodo.nivel < 2 ? 100 : 0}
                  tooltipOffset={tooltipOffset}
                  onPress={() => handleNodoPress(nodo.id, y)}
                />
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  nodoAbsoluto: {
    position: 'absolute',
  },
  tableroWrapper: {
    position: 'absolute',
    transform: [{ translateX: -70 }, { translateY: -70 }], // Centrar el tablero (ancho 140)
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableroCristal: {
    padding: 10,
    borderRadius: 16,
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1.5,
    transform: [{ rotateX: '30deg' }, { rotateZ: '-10deg' }], // Isometric touch
  },
  tableroFila: {
    flexDirection: 'row',
    gap: 6,
  },
  tableroCasilla: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  tableroEtiqueta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: -10, // compensar la rotacion
  },
  tableroTexto: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'MontserratAlternates-Bold',
  },
  fichaAvatar: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    zIndex: 10,
  },

  fichaTexto: {
    color: '#FFFFFF',
    fontSize: 8,
    fontFamily: 'MontserratAlternates-Bold',
  },
  tooltipWrapper: {
    position: 'absolute',
    width: 200,
    alignItems: 'center',
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
  },
  tooltipCaja: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  tooltipTitulo: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 14,
    color: colores.texto,
    marginBottom: 4,
  },
  tooltipDesc: {
    fontFamily: 'MontserratAlternates-SemiBold',
    fontSize: 10,
    color: colores.textoSecundario,
    textAlign: 'center',
    marginBottom: 12,
  },
  tooltipBoton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 999,
  },
  tooltipBotonTexto: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 11,
    color: '#FFFFFF',
  },
  tooltipFlecha: {
    width: 16,
    height: 16,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }, { translateY: -8 }],
    marginTop: -8, // Mover hacia arriba para superponerse
    borderBottomRightRadius: 3, // Ligeramente redondeado en la punta
  }
});

