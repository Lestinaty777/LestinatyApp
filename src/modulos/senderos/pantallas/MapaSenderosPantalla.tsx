import Svg, { Polygon, Rect, Defs, Pattern, Path, Circle, Line } from 'react-native-svg';
import React from 'react';
import { StyleSheet, View, useWindowDimensions, Pressable, ScrollView, Text as TextoRN } from 'react-native';
import { BotonTab, IconoTab } from '../../../nucleo/navegacion/BarraTabs';
import { BlurView } from 'expo-blur';
import { PixelartIcon } from '../../../diseno/iconos/PixelartIcon';
import Animated, { useSharedValue, useAnimatedStyle, useAnimatedProps, withTiming, Easing, withSpring, withRepeat } from 'react-native-reanimated';
import { Beaker, Users, Activity, Calculator, BookOpen } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Book, Calendar, Sparkles, Store, Flame, Zap, Shield, Terminal, Hexagon } from 'lucide-react-native';
import { ContenedorMapaSenderos } from '../../senderos/componentes/mapa/ContenedorMapaSenderos';
import { biomas } from '../../../diseno/tema/biomas';
import { Texto, colores, RecuadroGlass } from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';


const GemaMorada = ({ focused, size = 20 }: { focused: boolean, size?: number }) => (
  <Svg height={size} viewBox="0 0 24 24" width={size}>
    <Polygon
      fill={focused ? '#A100FF' : '#76736D'}
      stroke={focused ? '#A100FF' : '#76736D'}
      strokeWidth="1.7"
      strokeLinejoin="round"
      points="12,2 19.8,5.7 21.7,14.1 16.3,20.8 7.7,20.8 2.3,14.1 4.2,5.7"
    />
    <Polygon
      fill={focused ? '#E6B8FF' : 'rgba(255,255,255,0.4)'}
      points="12,7.1 15.6,8.8 16.5,12.7 14,15.8 10,15.8 7.5,12.7 8.4,8.8"
    />
  </Svg>
);

export function MapaSenderosPantalla() {

  const [activeMenu, setActiveMenu] = React.useState<'none' | 'courses' | 'calendar' | 'sparkle' | 'store'>('none');
  const animMenuState = useSharedValue(0);
  const animExpansionHeight = useSharedValue(0);

  const handleToggleMenu = (menu: 'courses' | 'calendar' | 'sparkle' | 'store') => {
    hapticSeguro('seleccion');
    if (activeMenu === menu) {
      setActiveMenu('none');
    } else {
      setActiveMenu(menu);
    }
  };
  
  const ASIGNATURAS = [
    { id: '1', titulo: 'Anatomía I', color: biomas.inicio.MasterColor, categoriaId: 'salud' as any, desc: 'Sistema óseo.', Icono: () => <Activity color="#FFFFFF" size={24} />, IconoGrande: () => <PixelartIcon name="book-open" size={26} color="#FFFFFF" />, IconoFondo: () => <PixelartIcon name="book-open" size={42} color="#FFFFFF" style={[styles.tarjetaIconoFondo, { opacity: 0.15 }]} /> },
    { id: '2', titulo: 'Farmacología', color: '#B34A4A', categoriaId: 'habitos' as any, desc: 'Fármacos.', Icono: () => <Beaker color="#FFFFFF" size={24} />, IconoGrande: () => <PixelartIcon name="book-open" size={26} color="#FFFFFF" />, IconoFondo: () => <PixelartIcon name="book-open" size={42} color="#FFFFFF" style={[styles.tarjetaIconoFondo, { opacity: 0.15 }]} /> },
    { id: '3', titulo: 'Ciencias Sociales', color: '#4A8BB3', categoriaId: 'rutinas' as any, desc: 'Sociedad.', Icono: () => <Users color="#FFFFFF" size={24} />, IconoGrande: () => <PixelartIcon name="book-open" size={26} color="#FFFFFF" />, IconoFondo: () => <PixelartIcon name="book-open" size={42} color="#FFFFFF" style={[styles.tarjetaIconoFondo, { opacity: 0.15 }]} /> },
    { id: '4', titulo: 'Matemáticas', color: '#D4AF37', categoriaId: 'tareas' as any, desc: 'Cálculo.', Icono: () => <Calculator color="#FFFFFF" size={24} />, IconoGrande: () => <PixelartIcon name="book-open" size={26} color="#FFFFFF" />, IconoFondo: () => <PixelartIcon name="book-open" size={42} color="#FFFFFF" style={[styles.tarjetaIconoFondo, { opacity: 0.15 }]} /> },
    { id: '5', titulo: 'Literatura', color: '#734AB3', categoriaId: 'diario' as any, desc: 'Lectura.', Icono: () => <BookOpen color="#FFFFFF" size={24} />, IconoGrande: () => <PixelartIcon name="book-open" size={26} color="#FFFFFF" />, IconoFondo: () => <PixelartIcon name="book-open" size={42} color="#FFFFFF" style={[styles.tarjetaIconoFondo, { opacity: 0.15 }]} /> },
  ];
  

  const [asignatura, setAsignatura] = React.useState(ASIGNATURAS[0]);

  React.useEffect(() => {
    const isAnyOpen = activeMenu !== 'none';
    animMenuState.value = withSpring(isAnyOpen ? 1 : 0, { damping: 16, stiffness: 100 });
    
    let targetH = 0;
    if (activeMenu === 'courses') targetH = 200;
    if (activeMenu === 'calendar') targetH = 390;
    if (activeMenu === 'store') targetH = 260;
    
    animExpansionHeight.value = withSpring(targetH, { damping: 16, stiffness: 100 });
  }, [activeMenu]);

  const animNavbarEstilos = useAnimatedStyle(() => ({
    height: 62 + animExpansionHeight.value,
  }));

  const animContenidoEstilos = useAnimatedStyle(() => ({
    opacity: animMenuState.value,
    transform: [
      { translateY: -20 * (1 - animMenuState.value) }
    ]
  }));



  const { height, width: windowWidth } = useWindowDimensions();
  const alturaMapa = height * 0.8;

  

  return (
    <View style={styles.raiz}>
      <SafeAreaView edges={['top']} style={styles.contenedorPrincipal}>
        
        {/* Barra de Navegación Superior */}
        <View style={{ zIndex: 10 }}>
          <Animated.View style={[styles.navbarContenedor, animNavbarEstilos, { overflow: 'hidden' }]}>
            <FondoTabsGlass />
            <View style={styles.navbarFila}>
              <BotonTab onPress={() => handleToggleMenu('courses')}>
                <View style={[{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 6 }, activeMenu === 'courses' && { backgroundColor: 'rgba(0,0,0,0.05)' }]}>
                  <BookOpen color={activeMenu === 'courses' ? '#4A8BB3' : '#76736D'} size={20} />
                  <Texto style={{ fontSize: 14, fontFamily: 'Montserrat-Bold', color: activeMenu === 'courses' ? '#111111' : '#76736D', marginTop: -2 }}>{ASIGNATURAS.length}</Texto>
                </View>
              </BotonTab>
              <BotonTab onPress={() => handleToggleMenu('calendar')}>
                <View style={[{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 6 }, activeMenu === 'calendar' && { backgroundColor: 'rgba(242, 109, 33, 0.1)' }]}>
                  <Flame color={activeMenu === 'calendar' ? '#F26D21' : '#76736D'} size={20} fill={activeMenu === 'calendar' ? '#F26D21' : 'transparent'} />
                  <Texto style={{ fontSize: 14, fontFamily: 'Montserrat-Bold', color: activeMenu === 'calendar' ? '#F26D21' : '#76736D', marginTop: -2 }}>3</Texto>
                </View>
              </BotonTab>
              <BotonTab><IconoTab nombre="top_sparkle" focused={false} /></BotonTab>
              <BotonTab onPress={() => handleToggleMenu('store')}>
                <View style={[{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 6 }, activeMenu === 'store' && { backgroundColor: 'rgba(161, 0, 255, 0.1)' }]}>
                  <GemaMorada focused={activeMenu === 'store'} size={20} />
                  <Texto style={{ fontSize: 14, fontFamily: 'Montserrat-Bold', color: activeMenu === 'store' ? '#A100FF' : '#76736D', marginTop: -2 }}>1,250</Texto>
                </View>
              </BotonTab>
            </View>

            <Animated.View pointerEvents={activeMenu !== 'none' ? 'auto' : 'none'} style={[{ flex: 1 }, animContenidoEstilos]}>
              {activeMenu === 'courses' && (
                <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 5, paddingBottom: 5 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ width: 42, height: 42 }}>
                        <View style={{ position: 'absolute', top: 4, left: 0, right: 0, bottom: -4, backgroundColor: oscurecer('#4A8BB3', 0.6), borderRadius: 8 }} />
                        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#4A8BB3', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
                          <BookOpen color="#FFFFFF" size={24} fill="#FFFFFF" />
                        </View>
                      </View>
                      <View>
                        <Texto style={{ fontSize: 9, color: 'rgba(0,0,0,0.5)', fontFamily: 'Montserrat-Bold', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 0 }}>INVENTARIO ACTIVO</Texto>
                        <Texto style={{ fontSize: 22, fontFamily: 'Montserrat-Bold', color: '#111111' }}>{ASIGNATURAS.length} Módulos</Texto>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Texto style={{ fontSize: 8, color: 'rgba(0,0,0,0.5)', fontFamily: 'Montserrat-Bold', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 }}>PROGRESO GLOBAL</Texto>
                      <View style={{ backgroundColor: '#111111', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderBottomWidth: 2, borderBottomColor: '#000000' }}>
                        <Texto style={{ fontSize: 13, fontFamily: 'Montserrat-Bold', color: '#FFFFFF' }}>12%</Texto>
                      </View>
                    </View>
                  </View>
                  
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 15, paddingBottom: 15 }} style={{ flex: 1, overflow: 'visible' }}>
                                {ASIGNATURAS.map(asig => {
                  const h = 85;
                  // Scroll Mode: Ancho dinámico
                  const bodyWidth = Math.min(220, Math.max(95, 16 + (asig.titulo.length * 8.2) + 10));
                  const w = bodyWidth + 45;
                  
                  const cutoutStart = bodyWidth;
                  const cutoutEnd = bodyWidth + 16;
                  const dashX = bodyWidth + 8;
                  
                  const path = `M 0,0 L ${cutoutStart},0 A 8,8 0 0,0 ${cutoutEnd},0 L ${w},0 L ${w},${h} L ${cutoutEnd},${h} A 8,8 0 0,0 ${cutoutStart},${h} L 0,${h} Z`;
                  
                  return (
                    <Pressable key={asig.id} style={[{ width: w, height: h + 4 }]} onPress={() => { hapticSeguro('seleccion'); setAsignatura(asig); setActiveMenu('none'); }}>
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
                </View>
              )}
              {activeMenu === 'calendar' && <PanelRacha />}
              {activeMenu === 'store' && <PanelTienda />}
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
    color: '#FFFFFF',
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


function PanelRacha() {
  const diasRacha = [
    { dia: 'L', activo: true },
    { dia: 'M', activo: true },
    { dia: 'M', activo: false },
    { dia: 'J', activo: true, hoy: true },
    { dia: 'V', activo: false },
    { dia: 'S', activo: false },
    { dia: 'D', activo: false },
  ];

  // Calendario mensual realista (ej. empieza en Miércoles, offset = 2)
  const offset = 2;
  const mesCeldas = Array.from({ length: 35 }).map((_, i) => {
    const num = i - offset + 1;
    const valido = num > 0 && num <= 30; // Mes de 30 días
    // Días aleatorios activos para simular historial
    const activo = valido && [1,2,3,5,6,8,9,10,11,15,16,18,19,20,22,23,24,25].includes(num);
    const esHoy = num === 26;
    return { num: valido ? num.toString() : '', activo, valido, esHoy };
  });

  const progresoSemana = (3 / 6) * 100; 
  const diasSemanales = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  return (
    <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 5, paddingBottom: 25 }}>
      {/* Background Texture */}
      <View style={[StyleSheet.absoluteFill, { opacity: 0.1 }]} pointerEvents="none">
        <TexturaPixelArt />
      </View>
      
      {/* 1. CABECERA */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 42, height: 42 }}>
            <View style={{ position: 'absolute', top: 4, left: 0, right: 0, bottom: -4, backgroundColor: oscurecer('#F26D21', 0.6), borderRadius: 8 }} />
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#F26D21', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
              <Flame color="#FFFFFF" size={24} fill="#FFFFFF" />
            </View>
          </View>
          <View>
            <Texto style={{ fontSize: 9, color: 'rgba(0,0,0,0.5)', fontFamily: 'Montserrat-Bold', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 0 }}>VITALIDAD ACTUAL</Texto>
            <Texto style={{ fontSize: 22, fontFamily: 'Montserrat-Bold', color: '#111111' }}>3 Días</Texto>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Texto style={{ fontSize: 8, color: 'rgba(0,0,0,0.5)', fontFamily: 'Montserrat-Bold', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 }}>XP SEMANAL</Texto>
          <View style={{ backgroundColor: '#4A8BB3', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderBottomWidth: 2, borderBottomColor: oscurecer('#4A8BB3', 0.6) }}>
            <Texto style={{ fontSize: 13, fontFamily: 'Montserrat-Bold', color: '#FFFFFF' }}>+450</Texto>
          </View>
        </View>
      </View>

      {/* 2. CALENDARIO HIPER DETALLADO (MES) */}
      <View style={{ marginBottom: 25 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.1)', paddingBottom: 8 }}>
          <Texto style={{ fontSize: 11, color: '#111111', fontFamily: 'Montserrat-Bold', letterSpacing: 1, textTransform: 'uppercase' }}>SEPTIEMBRE</Texto>
          <Texto style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)', fontFamily: 'Montserrat-Bold', letterSpacing: 1, textTransform: 'uppercase' }}>18/30 LOGRADOS</Texto>
        </View>
        
        {/* Cabecera de días de la semana */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          {diasSemanales.map((letra, i) => (
             <View key={i} style={{ width: '13%', alignItems: 'center' }}>
               <Texto style={{ fontSize: 9, color: 'rgba(0,0,0,0.4)', fontFamily: 'Montserrat-Bold' }}>{letra}</Texto>
             </View>
          ))}
        </View>

        {/* Rejilla 7x5 */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' }}>
          {mesCeldas.map((celda, i) => (
            <View key={i} style={{ width: 36, height: 36 }}>
               {/* Sombra 3D (Solo para activos o el día de hoy) */}
               {celda.valido && (celda.activo || celda.esHoy) && (
                 <View style={{ position: 'absolute', top: 3, left: 0, right: 0, bottom: -3, backgroundColor: celda.esHoy ? '#111111' : oscurecer('#F26D21', 0.6), borderRadius: 6 }} />
               )}
               
               {/* Cara frontal */}
               <View style={[{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  borderRadius: 6, justifyContent: 'center', alignItems: 'center'
               },
               celda.valido 
                  ? (celda.activo 
                      ? { backgroundColor: '#F26D21' }
                      : { backgroundColor: 'rgba(0,0,0,0.02)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' }
                    )
                  : {},
               celda.esHoy && { borderColor: '#111111', borderWidth: 2, backgroundColor: celda.activo ? '#F26D21' : '#FFFFFF' }
               ]}>
                 {celda.valido && (
                   <Texto style={{ fontSize: 11, color: celda.esHoy ? '#111111' : (celda.activo ? '#FFF' : 'rgba(0,0,0,0.3)'), fontFamily: 'Montserrat-Bold' }}>
                     {celda.num}
                   </Texto>
                 )}
               </View>
            </View>
          ))}
        </View>
      </View>
      
          </View>
  );
}


function PanelTienda() {
  const articulos = [
    { id: 1, titulo: 'Tema: Matrix', desc: 'Esquema de color negro y verde hacker.', precio: 500, color: '#2E7D32', Icono: Terminal },
    { id: 2, titulo: 'Escudo', desc: 'Congela y salva tu racha por 24 horas.', precio: 200, color: '#B34A4A', Icono: Shield },
    { id: 3, titulo: 'Hexágonos', desc: 'Textura de panal para tus boletos.', precio: 800, color: '#734AB3', Icono: Hexagon },
  ];

  return (
    <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 5, paddingBottom: 15 }}>
      {/* Background Texture */}
      <View style={[StyleSheet.absoluteFill, { opacity: 0.1 }]} pointerEvents="none">
        <TexturaPixelArt />
      </View>
      
      {/* CABECERA */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 42, height: 42 }}>
            <View style={{ position: 'absolute', top: 4, left: 0, right: 0, bottom: -4, backgroundColor: '#000000', borderRadius: 8 }} />
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#111111', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
              <GemaMorada focused={true} size={24} />
            </View>
          </View>
          <View>
            <Texto style={{ fontSize: 9, color: 'rgba(0,0,0,0.5)', fontFamily: 'Montserrat-Bold', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 0 }}>SUMINISTROS</Texto>
            <Texto style={{ fontSize: 22, fontFamily: 'Montserrat-Bold', color: '#111111' }}>Almacén</Texto>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Texto style={{ fontSize: 8, color: 'rgba(0,0,0,0.5)', fontFamily: 'Montserrat-Bold', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 }}>FONDOS (CRÉDITOS)</Texto>
          <View style={{ backgroundColor: '#111111', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderBottomWidth: 2, borderBottomColor: '#000000', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Hexagon size={10} color="#FFD700" fill="#FFD700" />
            <Texto style={{ fontSize: 13, fontFamily: 'Montserrat-Bold', color: '#FFD700' }}>1,250</Texto>
          </View>
        </View>
      </View>

      {/* CARRUSEL DE PRODUCTOS */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 15, paddingBottom: 15 }} style={{ flex: 1, overflow: 'visible' }}>
        {articulos.map(art => (
          <Pressable key={art.id} style={({ pressed }) => [{ width: 140, height: 130 }, pressed && { transform: [{ translateY: 3 }] }]}>
            {({ pressed }) => (
              <>
                {/* Sombra 3D del producto */}
                <View style={{ position: 'absolute', top: 4, left: 0, right: 0, bottom: -4, backgroundColor: oscurecer(art.color, 0.5), borderRadius: 12 }} />
                
                {/* Carta Frontal */}
                <View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: art.color, borderRadius: 12, padding: 12, overflow: 'hidden' }]}>
                  {/* Máquina de Vending Brillo / Textura */}
                  <View style={{ position: 'absolute', top: -20, right: -20, width: 60, height: 60, backgroundColor: 'rgba(255,255,255,0.1)', transform: [{ rotate: '45deg' }] }} />
                  
                  <View style={{ marginBottom: 'auto' }}>
                     <art.Icono color="#FFF" size={24} />
                  </View>
                  
                  <View style={{ marginTop: 'auto' }}>
                    <Texto style={{ fontSize: 12, fontFamily: 'Montserrat-Bold', color: '#FFFFFF', marginBottom: 2 }} numberOfLines={1}>{art.titulo}</Texto>
                    <Texto style={{ fontSize: 9, fontFamily: 'Montserrat-Medium', color: 'rgba(255,255,255,0.7)' }} numberOfLines={2}>{art.desc}</Texto>
                  </View>
                </View>
                
                {/* Etiqueta de Precio Brutalista */}
                <View style={{ position: 'absolute', top: -8, right: -8, backgroundColor: '#111111', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6, borderBottomWidth: 3, borderBottomColor: '#000000', flexDirection: 'row', alignItems: 'center', gap: 4, transform: [{ rotate: '5deg' }] }}>
                  <Hexagon size={10} color="#FFD700" fill="#FFD700" />
                  <Texto style={{ fontSize: 11, fontFamily: 'Montserrat-Bold', color: '#FFD700' }}>{art.precio}</Texto>
                </View>
              </>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
