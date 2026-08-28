import type { LucideIcon } from 'lucide-react-native';
import {
  Check,
  ChevronRight,
  Clock,
  Compass,
  Flame,
  GraduationCap,
  Handshake,
  Leaf,
  ListChecks,
  MapPin,
  PiggyBank,
  Repeat2,
  Sparkles,
  TreePine,
  UserPlus,
  Users,
  Zap,
  Target,
  Play,
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated as RNAnimated,
  Pressable,
  ScrollView,
  Modal,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, RadialGradient, Path, Rect, Stop } from 'react-native-svg';

import { RecuadroGlass, Texto, biomas, colores, espaciado } from '../../../diseno';
import { BarraProgresoLiquida } from '../../../diseno/componentes';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import {
  CategoriaSenderoCompartidoId,
  MiembroSendero,
  SenderoCompartido,
  senderosCompartidosMock,
} from './compartidos';
import { MapaCompartido } from './MapaCompartido';

const Bioma = biomas.inicio;

const iconosCategoria: Record<CategoriaSenderoCompartidoId, LucideIcon> = {
  estudio: GraduationCap,
  finanzas: PiggyBank,
  habitos: Flame,
  relaciones: Handshake,
  rutinas: Repeat2,
  salud: Leaf,
  tareas: ListChecks,
};

function LibreroSVG() {
  return (
    <View style={styles.libreroSvgContenedor} pointerEvents="none">
      <Svg height="100" width="100%" viewBox="0 0 400 100" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.15" />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0.0" />
          </LinearGradient>
          <LinearGradient id="shelfBase" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#E8DCC8" stopOpacity="0.9" />
            <Stop offset="1" stopColor="#D4C4A9" stopOpacity="0.95" />
          </LinearGradient>
          <LinearGradient id="yellowLip" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#F0D49C" stopOpacity="1" />
            <Stop offset="1" stopColor="#D4B67A" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        {/* Glow de fondo */}
        <Rect x="0" y="0" width="400" height="70" fill="url(#glow)" />
        {/* Base principal oscura */}
        <Path d="M10 70 L390 70 L400 85 L0 85 Z" fill="url(#shelfBase)" />
        {/* Labio de cristal frontal */}
        <Path d="M0 85 L400 85 L400 95 L0 95 Z" fill="url(#yellowLip)" />
        <Path d="M0 85 L400 85 L400 95 L0 95 Z" fill="transparent" stroke="#FFFFFF" strokeOpacity="0.2" strokeWidth="1" />
        {/* Sombra debajo del labio */}
        <Rect x="0" y="95" width="400" height="5" fill="#000000" fillOpacity="0.4" />
      </Svg>
    </View>
  );
}

function Libro({
  sendero,
  isActive,
  isDimmed,
  onPress,
  index,
}: {
  index: number;
  isActive: boolean;
  isDimmed: boolean;
  onPress: () => void;
  sendero: SenderoCompartido;
}) {
  const Icono = iconosCategoria[sendero.categoriaId] || Compass;
  
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotateZ = useSharedValue(0);
  const opacity = useSharedValue(1);

  const inclinaciones = [-4, 2, -1, 3, 0, -3, 2];
  const inclinacionBase = inclinaciones[index % inclinaciones.length];

  useEffect(() => {
    if (isActive) {
      translateY.value = withSpring(-30, { damping: 14, stiffness: 120 });
      scale.value = withSpring(1.05);
      rotateZ.value = withSpring(0);
      opacity.value = withTiming(1);
    } else {
      translateY.value = withSpring(0, { damping: 14, stiffness: 120 });
      scale.value = withSpring(1);
      rotateZ.value = withSpring(inclinacionBase);
      opacity.value = withTiming(1, { duration: 300 });
    }
  }, [isActive, isDimmed, inclinacionBase]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
        { rotateZ: `${rotateZ.value}deg` },
      ],
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isActive ? 0.3 : 0, { duration: 300 }),
    };
  });

  return (
    <Pressable onPress={onPress} style={styles.libroHitbox}>
      <Animated.View style={[styles.libroGlow, glowStyle, { backgroundColor: sendero.acento }]} pointerEvents="none" />
      <Animated.View
        style={[
          styles.libroCuerpo,
          animatedStyle,
          { backgroundColor: sendero.acento },
        ]}>
        <View style={styles.libroBiselInterior}>
          <View style={styles.libroIconoContenedor}>
            <Icono color="#FFFFFF" size={14} strokeWidth={2.5} />
          </View>
          <View style={styles.libroTituloContenedor}>
            <Texto numberOfLines={1} style={styles.libroTituloVertical}>
              {sendero.etiquetaEstandarte}
            </Texto>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export function CompartidosSenderos({ onHeroDataChange }: { onHeroDataChange?: (data: any) => void }) {
  const [indiceActivo, setIndiceActivo] = useState(0);
  const [mostrarMapa, setMostrarMapa] = useState(false);
  const [itemsCargados, setItemsCargados] = useState(0);

  useEffect(() => {
    let timeout: any;
    if (itemsCargados < senderosCompartidosMock.length) {
      timeout = setTimeout(() => {
        setItemsCargados(prev => prev + 1);
      }, 75);
    }
    return () => clearTimeout(timeout);
  }, [itemsCargados]);
  const senderoActivo = senderosCompartidosMock[indiceActivo];
  useEffect(() => {
    if (onHeroDataChange) onHeroDataChange(senderoActivo);
  }, [senderoActivo]);
  
  const opacidadBitacora = useRef(new RNAnimated.Value(1)).current;
  const slideBitacora = useRef(new RNAnimated.Value(0)).current;

  const handleSeleccionarLibro = (index: number) => {
    if (index === indiceActivo) return;
    hapticSeguro();
    
    RNAnimated.parallel([
      RNAnimated.timing(opacidadBitacora, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      RNAnimated.timing(slideBitacora, {
        toValue: 10,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIndiceActivo(index);
      slideBitacora.setValue(-10);
      RNAnimated.parallel([
        RNAnimated.timing(opacidadBitacora, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        RNAnimated.spring(slideBitacora, {
          toValue: 0,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        })
      ]).start();
    });
  };

  return (
    <>
      <ScrollView
      contentContainerStyle={[styles.raiz, { paddingBottom: espaciado.xl + 40 }]}
      showsVerticalScrollIndicator={false}>
      
            {/* ENCABEZADO COMPACTO DE BIBLIOTECA */}
      <View style={{ paddingHorizontal: 24, marginTop: 10, marginBottom: -10, zIndex: 10 }}>
         <Texto style={{ fontFamily: 'MontserratAlternates-Bold', fontSize: 10, color: 'rgba(0,0,0,0.3)', letterSpacing: 1.5 }}>
           BIBLIOTECA COMPARTIDA
         </Texto>
         <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)', width: '100%', marginTop: 8 }} />
      </View>

      {/* LIBRERO PREMIUM Y LIBROS */}
      <View style={styles.libreroContenedorPrincipal}>
        <LibreroSVG />
        <View style={styles.librosFila}>
          {senderosCompartidosMock.map((sendero, index) => {
            if (index >= itemsCargados) {
              return <View key={`skeleton-${sendero.id}`} style={{ width: 44, height: 60, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, marginHorizontal: 8 }} />;
            }
            const isActive = index === indiceActivo;
            const isDimmed = !isActive && indiceActivo !== -1;
            return (
              <Libro
                index={index}
                isActive={isActive}
                isDimmed={isDimmed}
                key={sendero.id}
                onPress={() => handleSeleccionarLibro(index)}
                sendero={sendero}
              />
            );
          })}
        </View>
      </View>

      {/* BITACORA DEL EQUIPO (SQUAD CODEX) */}
      {senderoActivo && (
        <RNAnimated.View style={{
          opacity: opacidadBitacora,
          transform: [{ translateY: slideBitacora }]
        }}>
          <View style={styles.bitacoraWrapper}>
            <View style={[styles.cintaLateralBitacora, { backgroundColor: senderoActivo.acento }]} />
            <RecuadroGlass style={styles.progresoCaja}>
              
              <View style={styles.seccionCabeceraFila}>
                <View style={styles.iconoBaseColor}>
                  <View style={[styles.iconoBaseColorCentro, { opacity: 0.2, backgroundColor: senderoActivo.acento, borderRadius: 12, width: 24, height: 24 }]} />
                  <Users color={senderoActivo.acento} size={14} strokeWidth={2.5} />
                </View>
                <View style={styles.bitacoraTitulos}>
                  <Texto numberOfLines={1} style={styles.bitacoraTitulo}>
                    {senderoActivo.titulo}
                  </Texto>
                  <Texto numberOfLines={1} style={styles.progresoNodos}>
                    {senderoActivo.etapaActual}
                  </Texto>
                </View>
              </View>

              {/* Miembros / Exploradores */}
              <View style={styles.seccionExploradores}>
                <View style={styles.grillaExploradores}>
                  {senderoActivo.miembros.map((miembro) => (
                    <View key={miembro.id} style={styles.fichaExploradorGlass}>
                      <View style={[styles.avatarCirculo, { backgroundColor: miembro.colorAvatar }]}>
                        <Texto style={styles.avatarTexto}>{miembro.iniciales}</Texto>
                        {miembro.completadoHoy && (
                          <View style={styles.avatarCheck}>
                            <Check color="#FFF" size={8} strokeWidth={3} />
                          </View>
                        )}
                      </View>
                      <View style={styles.exploradorInfo}>
                        <Texto numberOfLines={1} style={styles.exploradorNombre}>
                          {miembro.nombre}
                        </Texto>
                        {miembro.ramaElegida && (
                          <View style={styles.ramaPildora}>
                            <MapPin color={colores.textoSecundario} size={8} />
                            <Texto style={styles.ramaPildoraTexto}>{miembro.ramaElegida}</Texto>
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* Accion Dar Empujon */}
              {senderoActivo.estadoSincronia !== 'perfecta' && (
                <Pressable
                  onPress={() => hapticSeguro()}
                  style={({ pressed }) => [
                    styles.botonEmpujon,
                    { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                    pressed && styles.botonPresionado,
                  ]}>
                  <Zap color={colores.texto} size={14} />
                  <Texto style={styles.botonEmpujonTexto}>Dar un toque al equipo</Texto>
                </Pressable>
              )}

            </RecuadroGlass>
          </View>

          {/* TARJETA DE PROXIMA ACCION (PORTAL AL MAPA) */}
          <Pressable 
            onPress={() => { hapticSeguro(); setMostrarMapa(true); }}
            style={({ pressed }) => [
              styles.accionWrapper,
              pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 }
            ]}>
            <View style={[styles.accionGlow, { backgroundColor: senderoActivo.acento }]} />
            <RecuadroGlass style={styles.accionCaja}>
              <View style={[styles.accionIconoContenedor, { backgroundColor: senderoActivo.acento + '20' }]}>
                <Target color={senderoActivo.acento} size={20} strokeWidth={2.5} />
              </View>
              <View style={styles.accionTextos}>
                <Texto style={styles.accionEtiqueta}>TU PRÓXIMO PASO</Texto>
                <Texto style={styles.accionTitulo}>{senderoActivo.proximaAccion}</Texto>
              </View>
              <View style={styles.accionFlecha}>
                <View style={[styles.accionBotonIr, { backgroundColor: senderoActivo.acento }]}>
                  <Play color="#FFFFFF" size={14} fill="#FFFFFF" style={{ marginLeft: 2 }} />
                </View>
              </View>
            </RecuadroGlass>
          </Pressable>

        </RNAnimated.View>
      )}
    </ScrollView>


    
      {/* OVERLAY DEL MAPA COMPARTIDO */}
      {mostrarMapa && senderoActivo && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 1000, backgroundColor: '#EFEFF4' }]}>
          {/* ENCABEZADO FLOTANTE DEL MAPA */}
          <View style={{ position: 'absolute', top: 20, left: 20, right: 20, zIndex: 100 }}>
            <View style={[styles.mapaHeaderWrapper, { backgroundColor: senderoActivo.acento, borderColor: senderoActivo.acento, shadowOpacity: 0.25 }]}>
              <View style={[styles.miniLibro, { backgroundColor: '#FFFFFF' }]}>
                <View style={[styles.miniLibroBisel, { borderColor: senderoActivo.acento + '40' }]}>
                  {React.createElement(iconosCategoria[senderoActivo.categoriaId] || Compass, { color: senderoActivo.acento, size: 22 })}
                </View>
              </View>
              <View style={styles.mapaHeaderInfo}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Texto style={[styles.mapaHeaderTitulo, { color: '#FFFFFF' }]} numberOfLines={1}>{senderoActivo.titulo}</Texto>
                  <Pressable onPress={() => setMostrarMapa(false)} style={[styles.mapaHeaderCerrar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Texto style={[styles.mapaHeaderCerrarTexto, { color: '#FFFFFF' }]}>Cerrar</Texto>
                  </Pressable>
                </View>
                <Texto style={[styles.mapaHeaderSub, { color: 'rgba(255,255,255,0.85)' }]} numberOfLines={1}>{senderoActivo.descripcion}</Texto>
                <View style={{ marginTop: 6 }}>
                  <BarraProgresoLiquida porcentaje={senderoActivo.progresoPorcentaje} color="#FFFFFF" />
                </View>
              </View>
            </View>
          </View>
          
          <MapaCompartido masterColor={senderoActivo.acento} />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  avatarCheck: {
    alignItems: 'center',
    backgroundColor: '#34D946',
    borderColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1.5,
    bottom: -2,
    height: 14,
    justifyContent: 'center',
    position: 'absolute',
    right: -2,
    width: 14,
  },
  avatarCirculo: {
    alignItems: 'center',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  avatarTexto: {
    color: '#FFF',
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 12,
  },
  bitacoraTitulo: {
    color: colores.texto,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 18,
    lineHeight: 22,
  },
  bitacoraTitulos: {
    flex: 1,
    minWidth: 0,
  },
  bitacoraWrapper: {
    marginTop: 8,
    position: 'relative',
  },
  botonEmpujon: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 0.8,
    borderColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 44,
    marginTop: 6,
    paddingHorizontal: 14,
  },
  botonEmpujonTexto: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 12,
  },
  botonPresionado: {
    opacity: 0.7,
    transform: [{ translateY: 2 }],
  },
  cintaLateralBitacora: {
    borderRadius: 999,
    bottom: 20,
    left: 10,
    position: 'absolute',
    top: 20,
    width: 5,
    zIndex: 2,
  },
  exploradorInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  exploradorNombre: {
    color: colores.texto,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 12,
  },
  fichaExploradorGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 16,
    borderWidth: 0.7,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    width: '48%',
  },
  fogataCentro: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fogataOrbita: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.52)',
    borderColor: 'rgba(95, 193, 62, 0.18)',
    borderRadius: 30,
    borderWidth: 0.7,
    height: 80,
    justifyContent: 'center',
    width: 80,
  },
  fogataPulso: {
    backgroundColor: 'rgba(95, 193, 62, 0.16)',
    borderColor: 'rgba(95, 193, 62, 0.24)',
    borderRadius: 999,
    borderWidth: 1,
    height: 68,
    position: 'absolute',
    width: 68,
  },
  grillaExploradores: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  heroEtiqueta: {
    color: Bioma.MasterColor,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 9,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroFogata: {
    borderColor: 'rgba(255, 255, 255, 0.68)',
    borderRadius: 24,
    borderWidth: 0.7,
    flexDirection: 'row',
    minHeight: 90,
    overflow: 'hidden',
    padding: 10,
  },
  heroSubtitulo: {
    color: colores.textoSecundario,
    fontFamily: 'MontserratAlternates-SemiBold',
    fontSize: 10,
    marginTop: 4,
  },
  heroTexto: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 10,
  },
  heroTinte: {
    backgroundColor: 'rgba(255, 250, 239, 0.58)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  heroTitulo: {
    color: colores.texto,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 22,
    marginTop: 2,
  },
  iconoBaseColor: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconoBaseColorCentro: {
    position: 'absolute',
  },
  libreroContenedorPrincipal: {
    height: 180,
    justifyContent: 'flex-end',
    marginTop: 10,
    position: 'relative',
  },
  libreroSvgContenedor: {
    bottom: 0,
    left: -20,
    position: 'absolute',
    right: -20,
  },
  librosFila: {
    alignItems: 'flex-end',
    bottom: 25,
    flexDirection: 'row',
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  libroBiselInterior: {
    alignItems: 'center',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    borderWidth: 1,
    flex: 1,
    paddingTop: 8,
    width: '100%',
  },
  libroCuerpo: {
    borderRadius: 6,
    height: 120,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    width: 42,
  },
  libroGlow: {
    borderRadius: 20,
    bottom: -4,
    left: -4,
    position: 'absolute',
    right: -4,
    top: -4,
    transform: [{ scale: 1.05 }],
  },
  libroHitbox: {
    marginHorizontal: -2,
    padding: 4,
  },
  libroIconoContenedor: {
    alignItems: 'center',
    height: 20,
    justifyContent: 'center',
    marginBottom: 16,
  },
  libroTituloContenedor: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-start',
    width: '100%',
  },
  libroTituloVertical: {
    color: '#FFFFFF',
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 8,
    letterSpacing: 1,
    textAlign: 'center',
    textTransform: 'uppercase',
    transform: [{ rotate: '-90deg' }, { translateY: 0 }],
    width: 90,
  },
  progresoCaja: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    padding: 16,
    paddingLeft: 24,
  },
  progresoNodos: {
    color: colores.textoSecundario,
    fontFamily: 'MontserratAlternates-SemiBold',
    fontSize: 11,
    marginTop: 2,
  },
  raiz: {
    gap: 16,
  },
  ramaPildora: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  ramaPildoraTexto: {
    color: colores.textoSecundario,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 9,
  },
  seccionCabeceraFila: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  seccionExploradores: {
    gap: 6,
  },
  accionWrapper: {
    marginTop: 16,
    position: 'relative',
  },
  accionGlow: {
    position: 'absolute',
    top: 10, left: 20, right: 20, bottom: -5,
    borderRadius: 24,
    opacity: 0.25,
    transform: [{ scale: 1.05 }],
  },
  accionCaja: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingRight: 16,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    gap: 14,
  },
  accionIconoContenedor: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accionTextos: {
    flex: 1,
  },
  accionEtiqueta: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 9,
    color: colores.textoSecundario,
    letterSpacing: 0.5,
  },
  accionTitulo: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 14,
    color: colores.texto,
    marginTop: 2,
  },
  accionFlecha: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  accionBotonIr: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },

  mapaHeaderWrapper: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    gap: 16,
    alignItems: 'center',
  },
  miniLibro: {
    width: 48,
    height: 64,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  miniLibroBisel: {
    width: '85%',
    height: '92%',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapaHeaderInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  mapaHeaderTitulo: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 16,
    color: colores.texto,
    flex: 1,
    marginRight: 8,
  },
  mapaHeaderSub: {
    fontFamily: 'MontserratAlternates-SemiBold',
    fontSize: 11,
    color: colores.textoSecundario,
    marginBottom: 4,
  },
  mapaHeaderCerrar: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mapaHeaderCerrarTexto: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 10,
    color: colores.texto,
  },
});
