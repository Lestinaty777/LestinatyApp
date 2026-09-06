import React, { useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BookOpen,
  CheckSquare,
  ChevronRight,
  Dumbbell,
  Flame,
  Gem,
  Repeat2,
  Target,
} from 'lucide-react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { Canvas, Circle, Blur } from '@shopify/react-native-skia';
import { useSharedValue, useDerivedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';

import { RecuadroGlass, Texto, PixelartIcon } from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';

// ─── Paleta Dark ─────────────────────────────────────────────────────────────
const D = {
  fondo:         '#0D0F1A',
  texto:         '#F0F2FF',
  textoSuave:    '#8A90B4',
  verde:         '#4ADE80',
  verdeOscuro:   '#166534',
  naranja:       '#F59E0B',
  naranjaOscuro: '#92400E',
  rojo:          '#EF4444',
  rojoOscuro:    '#7F1D1D',
  morado:        '#A855F7',
  moradoOscuro:  '#581C87',
  gema:          '#818CF8',
  racha:         '#F97316',
};

// ─── Helper ───────────────────────────────────────────────────────────────────
function obtenerSaludo(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

// ─── Gradiente overlay ────────────────────────────────────────────────────────
function GradienteOverlay() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="gradTop" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0"   stopColor={D.fondo} stopOpacity="1" />
            <Stop offset="0.3" stopColor={D.fondo} stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id="gradBot" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0.5" stopColor={D.fondo} stopOpacity="0" />
            <Stop offset="1"   stopColor={D.fondo} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#gradTop)" />
        <Rect width="100%" height="100%" fill="url(#gradBot)" />
      </Svg>
    </View>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
function HeaderHoy() {
  return (
    <View style={s.header}>
      <View style={s.avatarContenedor}>
        <RecuadroGlass modo="dark" style={s.avatarGlass}>
          <Texto style={s.avatarEmoji}>🧙</Texto>
        </RecuadroGlass>
      </View>

      <View style={s.headerStats}>
        <RecuadroGlass modo="dark" style={s.statPill}>
          <Gem color={D.gema} size={14} fill={D.gema} />
          <Texto style={[s.statTexto, { color: D.gema }]}>235</Texto>
        </RecuadroGlass>
        <RecuadroGlass modo="dark" style={s.statPill}>
          <Flame color={D.racha} size={14} fill={D.racha} />
          <Texto style={[s.statTexto, { color: D.racha }]}>3</Texto>
        </RecuadroGlass>
      </View>
    </View>
  );
}

// ─── Saludo ───────────────────────────────────────────────────────────────────
function SaludoHoy() {
  return (
    <View style={s.saludoContenedor}>
      <Texto style={s.saludoTitulo}>{obtenerSaludo()}, Alejandro</Texto>
      <Texto style={s.saludoSubtitulo}>Aún puedes lograr algo hoy.</Texto>
    </View>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroIlustracion({ ancho }: { ancho: number }) {
  const alto = ancho * 0.72;
  return (
    <View style={[s.heroContenedor, { height: alto }]}>
      {/* Placeholder — reemplazar con <Image> cuando el asset esté listo */}
      <View style={s.heroPlaceholder}>
        <Texto style={s.heroEmoji}>🏯</Texto>
        <Texto style={s.heroPlaceholderTexto}>Asset isométrico próximamente</Texto>
      </View>
      <GradienteOverlay />
    </View>
  );
}

// ─── Card Sendero Activo ──────────────────────────────────────────────────────
function CardSenderoActivo() {
  return (
    <Pressable
      onPress={() => hapticSeguro('seleccion')}
      style={({ pressed }) => [
        s.cardSenderoWrapper,
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
      ]}
    >
      <RecuadroGlass modo="dark" blur style={s.cardSendero}>
        <View style={s.cardSenderoIconoBg}>
          <BookOpen color="#FFFFFF" size={20} />
        </View>

        <View style={s.cardSenderoTexto}>
          <Texto style={s.cardSenderoEtiqueta}>CONTINÚA TU SENDERO</Texto>
          <Texto style={s.cardSenderoTitulo}>Leer 10 páginas</Texto>
          <Texto style={s.cardSenderoSub}>Estudio · 20 min</Texto>
        </View>

        <View style={s.cardSenderoFlecha}>
          <ChevronRight color={D.textoSuave} size={20} />
        </View>
      </RecuadroGlass>
    </Pressable>
  );
}

// ─── Grid 2×2 ─────────────────────────────────────────────────────────────────
type DatoCategoria = {
  id: string;
  label: string;
  progreso: string;
  color: string;
  colorOscuro: string;
  ruta: string;
  icono: any;
};

const CATEGORIAS: DatoCategoria[] = [
  { id: 'habitos', label: 'Hábitos', progreso: '1/3', color: D.verde,  colorOscuro: D.verdeOscuro,   icono: require('../../../../assets/ilustraciones/hoy/icons/habitos.png'), ruta: '/habitos'     },
  { id: 'tareas',  label: 'Tareas',  progreso: '2/4', color: D.naranja, colorOscuro: D.naranjaOscuro, icono: require('../../../../assets/ilustraciones/hoy/icons/taeras.png'), ruta: '/tareas'      },
  { id: 'rutinas', label: 'Rutinas', progreso: '1/2', color: D.rojo,   colorOscuro: D.rojoOscuro,    icono: require('../../../../assets/ilustraciones/hoy/icons/rutinas.png'), ruta: '/rutinas'     },
  { id: 'metas',   label: 'Metas',   progreso: '0/1', color: D.morado,  colorOscuro: D.moradoOscuro,  icono: require('../../../../assets/ilustraciones/hoy/icons/metas.png'), ruta: '/metas-lista' },
];

function EfectoAurora({ color }: { color: string }) {
  const progreso = useSharedValue(0);

  useEffect(() => {
    // Velocidad ligeramente aleatoria para que cada card se vea distinto
    const duration = 4000 + Math.random() * 2000;
    progreso.value = withRepeat(
      withTiming(2 * Math.PI, { duration, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const cx1 = useDerivedValue(() => 60 + Math.cos(progreso.value) * 40);
  const cy1 = useDerivedValue(() => 60 + Math.sin(progreso.value) * 20);

  const cx2 = useDerivedValue(() => 100 + Math.sin(progreso.value * 0.8) * 50);
  const cy2 = useDerivedValue(() => 70 + Math.cos(progreso.value * 0.8) * 20);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Canvas style={{ flex: 1 }}>
        <Circle cx={cx1} cy={cy1} r={45} color={color} opacity={0.35}>
          <Blur blur={25} />
        </Circle>
        <Circle cx={cx2} cy={cy2} r={55} color={color} opacity={0.25}>
          <Blur blur={30} />
        </Circle>
      </Canvas>
    </View>
  );
}

function CardCategoria({ dato }: { dato: DatoCategoria }) {
  const router = useRouter();
  
  return (
    <Pressable
      onPress={() => { hapticSeguro('seleccion'); router.push(dato.ruta as any); }}
      style={({ pressed }) => [
        s.cardCategoriaWrapper,
        pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] },
      ]}
    >
      <RecuadroGlass modo="dark" blur style={s.cardCategoria}>
        {/* Efecto animado tipo Aurora boreal */}
        <EfectoAurora color={dato.color} />

        <View style={s.cardCategoriaIconoWrap}>
          <Image source={dato.icono} style={{ width: 52, height: 52 }} resizeMode="contain" />
        </View>

        <View style={s.cardCategoriaTextos}>
          <Texto style={s.cardCategoriaLabel} numberOfLines={1} adjustsFontSizeToFit>{dato.label}</Texto>
          <View style={s.cardCategoriaFooter}>
            <Texto style={[s.cardCategoriaProgreso, { color: dato.color }]}>
              {dato.progreso}
            </Texto>
          </View>
        </View>
        
        <View style={s.cardCategoriaChevron}>
          <PixelartIcon name="chevron-right" size={20} color="#FFFFFF" />
        </View>
      </RecuadroGlass>
    </Pressable>
  );
}

function GridCategorias() {
  return (
    <View style={s.gridContenedor}>
      <View style={s.gridFila}>
        <CardCategoria dato={CATEGORIAS[0]} />
        <CardCategoria dato={CATEGORIAS[1]} />
      </View>
      <View style={s.gridFila}>
        <CardCategoria dato={CATEGORIAS[2]} />
        <CardCategoria dato={CATEGORIAS[3]} />
      </View>
    </View>
  );
}

// ─── Frase ────────────────────────────────────────────────────────────────────
function FraseMotivacional() {
  return (
    <View style={s.fraseContenedor}>
      <Texto style={s.fraseIcono}>✦</Texto>
      <Texto style={s.fraseTexto}>"Disciplina hoy, libertad mañana."</Texto>
    </View>
  );
}

// ─── Pantalla ─────────────────────────────────────────────────────────────────
export function HoyPantalla() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  return (
    <View style={s.raiz}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        <HeaderHoy />
        <SaludoHoy />
        <HeroIlustracion ancho={width} />
        <CardSenderoActivo />
        <GridCategorias />
        <FraseMotivacional />
      </ScrollView>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  raiz: {
    flex: 1,
    backgroundColor: D.fondo,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  avatarContenedor: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarGlass: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 20 },
  headerStats: {
    flexDirection: 'row',
    gap: 8,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  statTexto: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 13,
  },

  // Saludo
  saludoContenedor: {
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  saludoTitulo: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 26,
    color: D.texto,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  saludoSubtitulo: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    color: D.textoSuave,
    marginTop: 4,
  },

  // Hero
  heroContenedor: {
    width: '100%',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -16,
  },
  heroPlaceholder: {
    flex: 1,
    width: '100%',
    backgroundColor: '#0F1220',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  heroEmoji: { fontSize: 72 },
  heroPlaceholderTexto: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    color: D.textoSuave,
  },

  // Card Sendero
  cardSenderoWrapper: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 18,
  },
  cardSendero: {
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  cardSenderoIconoBg: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardSenderoTexto: { flex: 1, gap: 2 },
  cardSenderoEtiqueta: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 9,
    color: D.textoSuave,
    letterSpacing: 1.5,
  },
  cardSenderoTitulo: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 15,
    color: D.texto,
    lineHeight: 20,
  },
  cardSenderoSub: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    color: D.textoSuave,
  },
  cardSenderoFlecha: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Grid de Categorías
  gridContenedor: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  gridFila: {
    flexDirection: 'row',
    gap: 12,
  },

  // Card Categoría Horizontal (dentro del Grid)
  cardCategoriaWrapper: { flex: 1 },
  cardCategoria: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 10,
    overflow: 'hidden',
    minHeight: 80,
  },
  cardCategoriaIconoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCategoriaTextos: {
    flex: 1,
    gap: 2,
    justifyContent: 'center',
  },
  cardCategoriaLabel: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 13,
    color: D.texto,
  },
  cardCategoriaFooter: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  cardCategoriaProgreso: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 14,
  },
  cardCategoriaChevron: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    opacity: 0.6,
  },

  // Frase
  fraseContenedor: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  fraseIcono: { color: D.textoSuave, fontSize: 12 },
  fraseTexto: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 13,
    color: D.textoSuave,
    fontStyle: 'italic',
    flex: 1,
  },
});
