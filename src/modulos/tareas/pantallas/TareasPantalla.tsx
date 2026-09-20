import React, { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Check,
  ChevronLeft,
  XCircle,
  List,
  Columns,
  CalendarDays,
  LayoutGrid,
  Map,
  Clock,
} from 'lucide-react-native';

import { RecuadroGlass, Texto } from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { AuroraBoreal } from '../../hoy/componentes/AuroraBoreal';
import { ESCALA_ESMERALDA } from '../../../diseno/tema/escalaEsmeralda';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Paleta de colores (Tema Amarillo / Naranja para Tareas)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const C = {
  // Fondos
  fondo: '#FFFBEB',           // Amarillo/naranja muy pálido
  superficie: '#FFFFFF',
  glass: 'rgba(255,255,255,0.72)',
  glassBorde: 'rgba(255,255,255,0.85)',

  // Textos
  texto: '#1A1335',
  textoSecundario: '#7B7494',
  textoTenue: '#A8A1BD',

  // Acentos (Tema principal)
  morado: '#F59E0B',          // Reutilizamos la key 'morado' pero con color amarillo/naranja
  moradoSuave: '#FEF3C7',
  verde: ESCALA_ESMERALDA.jade.l70,
  verdeSuave: ESCALA_ESMERALDA.jade.l95,
  naranja: '#F97316',
  naranjaSuave: '#FFEDD5',
  rojo: '#EF4444',
  rojoSuave: '#FEE2E2',
  azul: '#3B82F6',
  azulSuave: '#DBEAFE',
  gris: '#D1D5DB',

  // Utilidad
  barraFondo: '#FEF3C7',
  sombra: '#D97706',
};

const TABS = [
  { id: 'lista', label: 'Lista', color: C.morado, colorSuave: C.moradoSuave, IconoLucide: List },
  { id: 'kanban', label: 'Kanban', color: C.azul, colorSuave: C.azulSuave, IconoLucide: Columns },
  { id: 'agenda', label: 'Agenda', color: C.rojo, colorSuave: C.rojoSuave, IconoLucide: CalendarDays },
  { id: 'eisenhower', label: 'Eisenhower', color: C.verde, colorSuave: C.verdeSuave, IconoLucide: LayoutGrid },
  { id: 'senderos', label: 'Senderos', color: C.naranja, colorSuave: C.naranjaSuave, IconoLucide: Map },
  { id: 'time', label: 'Time block', color: '#7B7494', colorSuave: '#EDE5FB', IconoLucide: Clock },
];

export function TareasPantalla() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [tabActiva, setTabActiva] = useState(TABS[0].id);

  return (
    <View style={s.raiz}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingTop: insets.top + 32, flex: 1 }}>
          <AuroraBoreal tema="amarillo" />

          {/* Header Tareas */}
          <View style={s.header}>
            <View style={s.headerIzq}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <Pressable onPress={() => { hapticSeguro('seleccion'); router.back(); }} style={s.backBtnGlass}>
                  <ChevronLeft color={C.textoSecundario} size={22} />
                </Pressable>
                <View style={{ justifyContent: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Image source={require('../../../../assets/icons/hoy/tareas.png')} style={{ width: 26, height: 26, resizeMode: 'contain' }} />
                    <Texto style={s.headerNombre}>Tareas</Texto>
                  </View>
                  <Texto style={s.headerFrase}>Un paso a la vez.</Texto>
                </View>
              </View>
            </View>
            <View style={s.headerDer}>
              <View style={[s.statPill, { paddingHorizontal: 10, paddingVertical: 10, borderRadius: 22 }]}>
                <Image
                  source={require('../../../../assets/icons/hoy/notificaciones.png')}
                  style={{ width: 30, height: 30, resizeMode: 'contain' }}
                />
              </View>
            </View>
          </View>

          {/* Hero Section */}
          <View style={s.heroRow}>
            {/* Columna Izquierda: Progreso Tareas y Frase Aby */}
            <View style={s.heroColIzq}>
              <RecuadroGlass style={s.rachaCard}>
                <View style={s.rachaTop}>
                  <View style={s.rachaIcono}>
                    {/* Gráfica circular de tareas */}
                    <View style={s.circuloProgreso}>
                      <Texto style={s.circuloTexto}>3/5</Texto>
                    </View>
                  </View>
                  <View style={{ flex: 1, paddingLeft: 8, gap: 4 }}>
                    {/* Checks */}
                    <View style={s.checkRow}>
                      <View style={[s.checkBola, { backgroundColor: C.verde }]}>
                        <Check color="#FFFFFF" size={10} strokeWidth={3} />
                      </View>
                      <Texto style={s.checkTexto}>3 completadas</Texto>
                    </View>
                    <View style={s.checkRow}>
                      <View style={[s.checkBola, { backgroundColor: '#c8c8c8' }]}>
                        {/* Pendientes - check vacio gris */}
                      </View>
                      <Texto style={s.checkTexto}>2 pendientes</Texto>
                    </View>
                    <View style={s.checkRow}>
                      <View style={[s.checkBola, { backgroundColor: C.rojo }]}>
                        <Texto style={{ color: '#fff', fontSize: 8, fontWeight: 'bold', top: -1 }}>!</Texto>
                      </View>
                      <Texto style={s.checkTexto}>0 vencidas</Texto>
                    </View>
                  </View>
                </View>
              </RecuadroGlass>

              <RecuadroGlass style={s.nivelCard}>
                <View style={s.nivelIcono}>
                  <Image
                    source={require('../../../../assets/ilustraciones/Aby/aby.png')}
                    style={{ width: 44, height: 44, resizeMode: 'contain' }}
                  />
                </View>
                <View style={s.nivelInfo}>
                  <Texto style={s.fraseFilosofica}>
                    "La acción es la clave fundamental de todo éxito."
                  </Texto>
                </View>
              </RecuadroGlass>
            </View>

            {/* Columna Derecha: Ilustración cuadrada */}
            <View style={s.heroColDer}>
              <View style={s.ilustracionContenedor}>
                {/* <Image
                  source={require('../../../../assets/ilustraciones/senderos/biomas/arboles/bosque-dorado-01.png')}
                  style={{ width: '100%', height: '100%', transform: [{ scaleX: -1 }] }}
                  resizeMode="cover"
                /> */}
              </View>
            </View>
          </View>

          {/* Tabs Tareas (Mismo diseño que GridCategorias) */}
          <View style={s.categoriasRow}>
            {TABS.map((cat) => {
              const isActivo = tabActiva === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => {
                    hapticSeguro('seleccion');
                    setTabActiva(cat.id);
                  }}
                  style={({ pressed }) => [
                    s.categoriaCard,
                    pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] },
                  ]}
                >
                  <RecuadroGlass style={[s.categoriaGlass, isActivo && { borderColor: C.morado, borderWidth: 1.5 }]}>
                    <View style={s.categoriaIcono}>
                      {cat.IconoLucide && (
                        <cat.IconoLucide size={22} color={C.textoSecundario} />
                      )}
                    </View>
                    <Texto style={[s.categoriaLabel, isActivo && { color: C.morado }]} numberOfLines={1}>
                      {cat.label}
                    </Texto>
                  </RecuadroGlass>
                </Pressable>
              );
            })}
          </View>

          {/* Contenido de la tab (placeholder) */}
          <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
            <Texto style={{ fontFamily: 'Montserrat-Bold', color: C.texto }}>Contenido de la pestaña (Próximamente)</Texto>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Estilos
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const RADIO = 20;
const PH = 20;

const s = StyleSheet.create({
  raiz: {
    flex: 1,
    backgroundColor: C.fondo,
  },

  // ─── Header ─────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: PH,
    marginBottom: 16,
  },
  headerIzq: {
    width: '60%', // Ampliado un poco para que quepa el botón back
  },
  backBtnGlass: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.glass,
    borderWidth: 1,
    borderColor: C.glassBorde,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  headerSaludo: {
    fontFamily: 'MontserratAlternates-Medium',
    fontSize: 14,
    color: '#4B4B4B',
  },
  headerNombre: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 22,
    color: C.texto,
    lineHeight: 26,
  },
  headerFrase: {
    fontFamily: 'MontserratAlternates-Medium',
    fontSize: 8,
    color: '#5A5A5A',
    marginTop: 4,
    lineHeight: 12,
  },
  headerDer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.glass,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: C.glassBorde,
  },

  // ─── Hero Section ────────────────────────────
  heroRow: {
    flexDirection: 'row',
    paddingHorizontal: PH,
    gap: 12,
    marginBottom: 16,
  },
  heroColIzq: {
    width: '52%',
    gap: 12,
  },
  heroColDer: {
    position: 'absolute',
    right: PH,
    top: 0,
    width: '50%',
    zIndex: -1,
  },
  rachaCard: {
    width: '100%',
    backgroundColor: C.glass,
    borderRadius: RADIO,
    padding: 10,
    borderWidth: 1,
    borderColor: C.glassBorde,
    justifyContent: 'center',
    minHeight: 100,
  },
  rachaTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rachaIcono: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circuloProgreso: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 6,
    borderColor: C.morado,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circuloTexto: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 14,
    color: C.texto,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  checkBola: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkTexto: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 8,
    color: C.textoSecundario,
  },

  ilustracionContenedor: {
    width: '135%',
    aspectRatio: 1,
    borderRadius: RADIO,
    overflow: 'hidden',
    transform: [{ translateX: 15 }],
  },

  nivelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.glass,
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.glassBorde,
    width: '100%',
  },
  nivelIcono: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  nivelInfo: {
    flex: 1,
  },
  fraseFilosofica: {
    fontFamily: 'MontserratAlternates-Medium',
    fontSize: 8,
    color: C.textoSecundario,
    lineHeight: 12,
  },

  // ─── Tabs Tareas (Estilo GridCategorias) ────────────
  categoriasRow: {
    flexDirection: 'row',
    paddingHorizontal: PH,
    paddingBottom: 4,
    marginBottom: 16,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  categoriaCard: {
    width: '15.8%',
  },
  categoriaGlass: {
    alignItems: 'center',
    paddingHorizontal: 2,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.glassBorde,
    backgroundColor: C.glass,
  },
  categoriaIcono: {
    width: 40,
    height: 40,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    marginTop: 2,
  },
  categoriaLabel: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 7.5, // Ligeramente más pequeño para que quepa "Time block" o "Eisenhower"
    color: C.texto,
    textAlign: 'center',
    lineHeight: 10,
  },
});
