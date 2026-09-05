import Svg, { Rect, Defs, Pattern, Path, Circle, Line } from 'react-native-svg';
import React from 'react';
import { StyleSheet, View, useWindowDimensions, Pressable, ScrollView, Text as TextoRN } from 'react-native';
import { BotonTab, IconoTab } from '../../../nucleo/navegacion/BarraTabs';
import { BlurView } from 'expo-blur';
import { PixelartIcon } from '../../../diseno/iconos/PixelartIcon';
import Animated, { useSharedValue, useAnimatedStyle, useAnimatedProps, withTiming, Easing, withSpring, withRepeat } from 'react-native-reanimated';
import { Beaker, Users, Activity } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Book, Calendar, Sparkles, Store } from 'lucide-react-native';
import { ContenedorMapaSenderos } from '../../senderos/componentes/mapa/ContenedorMapaSenderos';
import { biomas } from '../../../diseno/tema/biomas';
import { Texto, colores, RecuadroGlass } from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';

export function InicioPantalla() {

  const [menuAbierto, setMenuAbierto] = React.useState(false);
  const animMenu = useSharedValue(0);
  
  const ASIGNATURAS = [
    { id: '1', titulo: 'Anatomía I', color: biomas.inicio.MasterColor, categoriaId: 'salud' as any, desc: 'Sistema óseo, cráneo y articulaciones superiores.', Icono: () => <Activity color="#FFFFFF" size={24} />, IconoGrande: () => <PixelartIcon name="book-open" size={26} color="#FFFFFF" />, IconoFondo: () => <PixelartIcon name="book-open" size={42} color="#FFFFFF" style={[styles.tarjetaIconoFondo, { opacity: 0.15 }]} /> },
    { id: '2', titulo: 'Farmacología', color: '#B34A4A', categoriaId: 'habitos' as any, desc: 'Mecanismos de acción y farmacocinética básica.', Icono: () => <Beaker color="#FFFFFF" size={24} />, IconoGrande: () => <PixelartIcon name="book-open" size={26} color="#FFFFFF" />, IconoFondo: () => <PixelartIcon name="book-open" size={42} color="#FFFFFF" style={[styles.tarjetaIconoFondo, { opacity: 0.15 }]} /> },
    { id: '3', titulo: 'Ciencias Sociales', color: '#4A8BB3', categoriaId: 'rutinas' as any, desc: 'Sociología, psicología y comportamiento humano.', Icono: () => <Users color="#FFFFFF" size={24} />, IconoGrande: () => <PixelartIcon name="book-open" size={26} color="#FFFFFF" />, IconoFondo: () => <PixelartIcon name="book-open" size={42} color="#FFFFFF" style={[styles.tarjetaIconoFondo, { opacity: 0.15 }]} /> },
  ];
  const [asignatura, setAsignatura] = React.useState(ASIGNATURAS[0]);

  React.useEffect(() => {
    animMenu.value = withSpring(menuAbierto ? 1 : 0, { damping: 16, stiffness: 100 });
  }, [menuAbierto]);

  const animNavbarEstilos = useAnimatedStyle(() => ({
    height: 62 + 140 * animMenu.value,
  }));

  const animContenidoEstilos = useAnimatedStyle(() => ({
    opacity: animMenu.value,
    transform: [
      { translateY: -10 * (1 - animMenu.value) },
    ],
  }));

  const { height } = useWindowDimensions();
  const alturaMapa = height * 0.8;

  

  return (
    <View style={styles.raiz}>
      <SafeAreaView edges={['top']} style={styles.contenedorPrincipal}>
        
        {/* Barra de Navegación Superior */}
        <View style={{ zIndex: 10 }}>
          <Animated.View style={[styles.navbarContenedor, animNavbarEstilos, { overflow: 'hidden' }]}>
            <FondoTabsGlass />
            <View style={styles.navbarFila}>
              <BotonTab onPress={() => setMenuAbierto(!menuAbierto)}><IconoTab nombre="top_book" focused={menuAbierto} /></BotonTab>
              <BotonTab><IconoTab nombre="top_calendar" focused={false} /></BotonTab>
              <BotonTab><IconoTab nombre="top_sparkle" focused={false} /></BotonTab>
              <BotonTab><IconoTab nombre="top_store" focused={false} /></BotonTab>
            </View>

            <Animated.View pointerEvents={menuAbierto ? 'auto' : 'none'} style={[{ flex: 1 }, animContenidoEstilos]}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carruselSenderos} style={{ flex: 1 }}>
                                {ASIGNATURAS.map(asig => {
                  const h = 85;
                  // Cálculo dinámico del ancho basado en la longitud del texto
                  const bodyWidth = Math.min(220, Math.max(95, 16 + (asig.titulo.length * 8.2) + 10));
                  const w = bodyWidth + 45; // 45px es el ancho fijo del talón (stub)
                  
                  const cutoutStart = bodyWidth;
                  const cutoutEnd = bodyWidth + 16;
                  const dashX = bodyWidth + 8;
                  
                  const path = `M 0,0 L ${cutoutStart},0 A 8,8 0 0,0 ${cutoutEnd},0 L ${w},0 L ${w},${h} L ${cutoutEnd},${h} A 8,8 0 0,0 ${cutoutStart},${h} L 0,${h} Z`;
                  
                  return (
                    <Pressable key={asig.id} style={[{ width: w, height: h + 4 }]} onPress={() => { hapticSeguro('seleccion'); setAsignatura(asig); setMenuAbierto(false); }}>
                      {({ pressed }) => (
                        <>
                          {/* Capa Base: Sombra 3D Sólida */}
                          <View style={StyleSheet.absoluteFill} pointerEvents="none">
                            <Svg width="100%" height="100%" viewBox={`0 0 ${w} ${h + 4}`}>
                              <Path d={path} fill={oscurecer(asig.color, 0.6)} transform="translate(0, 4)" />
                            </Svg>
                          </View>

                          {/* Capa Principal: Se hunde 4px cuando está presionada */}
                          <View style={[StyleSheet.absoluteFill, { transform: [{ translateY: pressed ? 4 : 0 }] }]}>
                            
                            <View style={StyleSheet.absoluteFill} pointerEvents="none">
                              <Svg width="100%" height="100%" viewBox={`0 0 ${w} ${h + 4}`}>
                                {/* Cuerpo del Boleto */}
                                <Path d={path} fill={asig.color} />
                                
                                {/* Línea punteada de desgarre */}
                                <Line x1={dashX} y1="12" x2={dashX} y2={h - 12} stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeDasharray="3 3" />
                                
                                {/* Simulación de Código de Barras en el Stub (Derecha) */}
                                <Rect x={dashX + 15} y="25" width="2" height="35" fill="rgba(255,255,255,0.6)" />
                                <Rect x={dashX + 19} y="25" width="4" height="35" fill="rgba(255,255,255,0.6)" />
                                <Rect x={dashX + 25} y="25" width="1" height="35" fill="rgba(255,255,255,0.6)" />
                                <Rect x={dashX + 28} y="25" width="3" height="35" fill="rgba(255,255,255,0.6)" />
                              </Svg>
                              {/* Pequeño texto en el stub inferior derecho */}
                              <TextoRN style={{ position: 'absolute', right: 8, bottom: 8, fontSize: 7, color: 'rgba(255,255,255,0.6)', fontFamily: 'Montserrat-Bold' }}>Nº 0{asig.id}</TextoRN>
                            </View>
                            
                            {/* Textura pixel art enmascarada */}
                            <View style={{ position: 'absolute', left: 0, top: 0, width: dashX, height: h, overflow: 'hidden', opacity: 0.3 }} pointerEvents="none">
                              <TexturaPixelArt />
                            </View>

                            {/* Brillo diagonal rasante (Infinito) */}
                            <View style={[styles.tarjetaBrilloCarrusel, { top: -50, left: -40, height: 350, width: 25, backgroundColor: 'rgba(255,255,255,0.08)' }]} pointerEvents="none" />

                            {/* Icono Principal (Arriba Izquierda) */}
                            <View style={{ position: 'absolute', top: 12, left: 12 }}>
                              <asig.Icono />
                            </View>
                            
                            {/* Título y Label (Abajo Izquierda) */}
                            <View style={{ position: 'absolute', bottom: 12, left: 12, right: 45 }}>
                              <Texto style={{ fontSize: 6, color: 'rgba(255,255,255,0.6)', fontFamily: 'Montserrat-Bold', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }} numberOfLines={1}>PASE DE ACCESO</Texto>
                              <Texto style={[styles.textoCarruselTitulo, { fontSize: 13, lineHeight: 14 }]} numberOfLines={1}>{asig.titulo}</Texto>
                            </View>

                          </View>
                        </>
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Animated.View>
          </Animated.View>
        </View>
        
        {/* Tarjeta de Asignatura (3D Node Style) */}
        <View style={styles.tarjetaContenedor}>
          <View style={[styles.tarjetaAsignaturaBase, { backgroundColor: oscurecer(asignatura.color, 0.6) }]}>
            <View style={{...StyleSheet.absoluteFill as any, overflow: 'hidden', borderRadius: 24}}>
               <TexturaPixelArt />
            </View>
          </View>
          <View style={[styles.tarjetaAsignatura, { backgroundColor: asignatura.color }]}>
            <TexturaPixelArt />
            <View style={styles.tarjetaBrillo} />
            <asignatura.IconoFondo />
            <View style={{ padding: 20, flex: 1, justifyContent: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <asignatura.IconoGrande />
                <Texto style={[styles.tituloAsignatura, { marginBottom: 0 }]}>{asignatura.titulo}</Texto>
              </View>
              <Texto style={styles.descAsignatura}>{asignatura.desc}</Texto>
            </View>
          </View>
        </View>
        
        {/* Espacio que empuja el mapa hacia abajo para respetar el 80% */}
        
        
        {/* Espacio que empuja el mapa hacia abajo para respetar el 80% */}
        
        
        {/* Contenedor del Mapa (80%) */}
        <View style={styles.capaMapa}>
          <ContenedorMapaSenderos
            altura={alturaMapa}
            categoriaId={asignatura.categoriaId}
            color={asignatura.color}
            enfocado={true}
            subcategoriaId="manana"
          />
        </View>
      </SafeAreaView>
    </View>
  );
}




const TexturaPixelArt = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <Svg style={StyleSheet.absoluteFill}>
      <Defs>
        <Pattern id="dither" patternUnits="userSpaceOnUse" width="4" height="4">
          <Rect x="0" y="0" width="2" height="2" fill="#000000" opacity="0.1" />
          <Rect x="2" y="2" width="2" height="2" fill="#000000" opacity="0.1" />
        </Pattern>
      </Defs>
      <Rect width="2000" height="2000" fill="url(#dither)" />
    </Svg>
  </View>
);

function oscurecer(color: string, factor = 0.7) {
  const hex = color.replace('#', '');
  const canal = (inicio: number) => Math.round(parseInt(hex.slice(inicio, inicio + 2), 16) * factor).toString(16).padStart(2, '0');
  return `#${canal(0)}${canal(2)}${canal(4)}`;
}

function FondoTabsGlass() {
  return (
    <BlurView intensity={24} tint="light" style={styles.fondoTabs}>
      <View style={styles.fondoTabsTinte} />
      <View pointerEvents="none" style={styles.fondoTabsBrilloLateral} />
      <View pointerEvents="none" style={styles.fondoTabsBorde} />
    </BlurView>
  );
}

const styles = StyleSheet.create({
  raiz: {
    backgroundColor: '#EAEAEA',
    flex: 1,
    position: 'relative',
  },
  contenedorPrincipal: {
    flex: 1,
  },
  fondoTabs: {
    borderRadius: 15,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    overflow: 'hidden',
  },
  fondoTabsTinte: {
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  fondoTabsBrilloLateral: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 999,
    bottom: 12,
    left: 8,
    position: 'absolute',
    top: 12,
    width: 3,
  },
  fondoTabsBorde: {
    borderColor: 'rgba(255, 255, 255, 0.62)',
    borderRadius: 15,
    borderTopWidth: 0.8,
    borderWidth: 0.45,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  navbarContenedor: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 20,
  },
  carruselSenderos: {
    paddingHorizontal: 15,
    gap: 12,
    alignItems: 'center',
  },
  tarjetaCarrusel: {
    
    borderRadius: 16,
    width: 120,
    height: 90,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  iconoCarrusel: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  textoCarruselTitulo: {
    fontSize: 11,
    fontFamily: 'MontserratAlternates-Bold',
    color: '#FFFFFF',
    lineHeight: 13,
  },
  textoCarruselDesc: {
    fontSize: 8.5,
    fontFamily: 'MontserratAlternates-Medium',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 1,
  },
  navbarFila: {
    flexDirection: 'row',
    height: 62,
  },
  navbarSuperior: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 14,
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tarjetaContenedor: {
    marginHorizontal: 20,
    marginTop: 5,
    position: 'relative',
    height: 100,
  },
  tarjetaAsignaturaBase: {
    position: 'absolute',
    top: 6,
    left: 0,
    right: 0,
    height: 100,
    borderRadius: 24,
  },
  tarjetaBrilloCarrusel: {
    position: 'absolute',
    top: -62,
    left: -50,
    height: 280,
    width: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    transform: [{ rotate: '45deg' }],
  },
  tarjetaBrillo: {
    position: 'absolute',
    top: -30,
    left: -50,
    right: 0,
    height: 150,
    width: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transform: [{ rotate: '45deg' }],
  },
  tarjetaIconoFondo: {
    position: 'absolute',
    right: -10,
    bottom: -10,
  },
  tarjetaAsignatura: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    borderRadius: 24,
    overflow: 'hidden',
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.35)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.2)',
  },
  tituloAsignatura: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 22,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  descAsignatura: {
    fontFamily: 'MontserratAlternates-Medium',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  espacioFlexible: {
    flex: 1, // Toma todo el espacio restante hasta empujar la capaMapa
  },
  botonAccion: {
    padding: 8, // Aumenta el area táctil
  },
  botonAccionPresionado: {
    opacity: 0.5,
    transform: [{ scale: 0.9 }],
  },
  capaMapa: {
    height: '80%', // Forzamos el 80% de altura estricto
    overflow: 'hidden',
  }
});
