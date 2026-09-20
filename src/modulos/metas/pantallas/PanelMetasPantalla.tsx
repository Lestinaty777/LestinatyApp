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
import { useSaldoGemas } from '../../tienda/useSaldoGemas';
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

import { RecuadroGlass, Texto, PixelartIcon, MasterIcon } from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { ESCALA_ESMERALDA } from '../../../diseno/tema/escalaEsmeralda';

// ─── Paleta Dark ─────────────────────────────────────────────────────────────
const D = {
  fondo:         '#0D0F1A',
  texto:         '#F0F2FF',
  textoSuave:    '#8A90B4',
  verde:         ESCALA_ESMERALDA.jade.l79,
  verdeOscuro:   ESCALA_ESMERALDA.jade.l38,
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
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="gradTop" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0"     stopColor={D.fondo} stopOpacity="1" />
            <Stop offset="0.05"  stopColor={D.fondo} stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id="gradBot" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0.85"  stopColor={D.fondo} stopOpacity="0" />
            <Stop offset="1"     stopColor={D.fondo} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#gradTop)" />
        <Rect width="100%" height="100%" fill="url(#gradBot)" />
      </Svg>
    </View>
  );
}

// ─── Calendario Mini ────────────────────────────────────────────────────────────
function CalendarioMini() {
  const hoy = new Date();
  const dias = [];
  const nombres = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  
  for (let i = -3; i <= 3; i++) {
    const d = new Date();
    d.setDate(hoy.getDate() + i);
    dias.push({
      letra: nombres[d.getDay()],
      numero: d.getDate(),
      esHoy: i === 0
    });
  }

  return (
    <RecuadroGlass modo="dark" blur style={s.calendarioMiniContainer}>
      {dias.map((d, i) => (
        <View key={i} style={[s.calendarioMiniDia, d.esHoy && s.calendarioMiniDiaHoy]}>
          <Texto style={[s.calendarioMiniLetra, d.esHoy && s.textoOscuro]}>
            {d.letra}
          </Texto>
          <Texto style={[s.calendarioMiniNumero, d.esHoy && s.textoOscuro]}>
            {d.numero}
          </Texto>
        </View>
      ))}
    </RecuadroGlass>
  );
}

// ─── Panel Principal (Usuario, Saludo) ─────────────────────────────────────────
function PanelPrincipal() {
  return (
    <View style={s.panelWrapper}>
      <RecuadroGlass modo="dark" blur style={s.panelGlass}>
        
        {/* Textos Principales */}
        <View style={s.panelTextos}>
          <Texto style={s.panelTitulo} numberOfLines={1} adjustsFontSizeToFit>
            {obtenerSaludo()}, Alejandro
          </Texto>
          <Texto style={s.panelSubtitulo} numberOfLines={1} adjustsFontSizeToFit>
            Aún puedes lograr algo hoy.
          </Texto>
        </View>
        
      </RecuadroGlass>
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
  { id: 'habitos', label: 'Hábitos', progreso: '1/3', color: D.verde,  colorOscuro: D.verdeOscuro,   icono: 'hoy/habitos', ruta: '/habitos'     },
  { id: 'tareas',  label: 'Tareas',  progreso: '2/4', color: D.naranja, colorOscuro: D.naranjaOscuro, icono: 'hoy/tareas', ruta: '/tareas'      },
  { id: 'rutinas', label: 'Rutinas', progreso: '1/2', color: D.rojo,   colorOscuro: D.rojoOscuro,    icono: 'hoy/rutinas', ruta: '/rutinas'     },
  { id: 'metas',   label: 'Metas',   progreso: '0/1', color: D.morado,  colorOscuro: D.moradoOscuro,  icono: 'hoy/metas', ruta: '/metas-lista' },
];

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
        <View style={s.cardCategoriaIconoWrap}>
          <MasterIcon name={dato.icono} size={52} />
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
export function PanelMetasPantalla() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { data: saldoGemas } = useSaldoGemas();

  return (
    <View style={s.raiz}>
      {/* Fondo fijo de pantalla completa */}
      <Image 
        source={require('../../../../assets/ilustraciones/hoy/fondos/fondo.png')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <GradienteOverlay />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Textos y Panel Principal */}
        <View style={{ paddingTop: insets.top + 12 }}>
          <PanelPrincipal />
          
          {/* Estadísticas flotantes fuera del panel principal */}
          <View style={s.statsFlotantesContenedor}>
            <CalendarioMini />
            <View style={{ gap: 8 }}>
              <RecuadroGlass modo="dark" blur style={s.statFlotante}>
                <Gem color={D.gema} size={14} fill={D.gema} />
                <Texto style={[s.statFlotanteTexto, { color: D.gema }]}>{saldoGemas ?? 0} Gemas</Texto>
              </RecuadroGlass>
              <RecuadroGlass modo="dark" blur style={s.statFlotante}>
                <Flame color={D.racha} size={14} fill={D.racha} />
                <Texto style={[s.statFlotanteTexto, { color: D.racha }]}>3 Días</Texto>
              </RecuadroGlass>
            </View>
          </View>
        </View>

        {/* Contenido inferior */}
        <View style={{ marginTop: 24 }}>
          <CardSenderoActivo />
          <GridCategorias />
          <FraseMotivacional />
        </View>
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

  // ─── Panel Principal ──────────────────────────────────────────────────────────
  panelWrapper: {
    paddingHorizontal: 20,
    marginBottom: 4,
    zIndex: 10,
  },
  panelGlass: {
    padding: 18,
    borderRadius: 24,
  },
  panelTextos: {
    width: '100%',
  },
  panelTitulo: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 24,
    color: D.texto,
    marginBottom: 4,
  },
  panelSubtitulo: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    color: D.textoSuave,
  },
  statsFlotantesContenedor: {
    paddingHorizontal: 20,
    marginTop: 8,
    alignItems: 'flex-start',
    gap: 8,
  },
  statFlotante: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statFlotanteTexto: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 12,
  },
  calendarioMiniContainer: {
    flexDirection: 'row',
    gap: 4,
    padding: 8,
    borderRadius: 16,
    marginBottom: 8,
  },
  calendarioMiniDia: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 10,
    minWidth: 26,
  },
  calendarioMiniDiaHoy: {
    backgroundColor: '#FFFFFF',
  },
  calendarioMiniLetra: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 9,
    color: D.textoSuave,
    marginBottom: 2,
  },
  calendarioMiniNumero: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 12,
    color: D.texto,
  },
  textoOscuro: {
    color: '#0D0F1A',
  },

  // Hero
  heroContenedor: {
    width: '100%',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -80,
    marginBottom: -16,
    zIndex: 1,
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
