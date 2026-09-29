import { useSaldoGemas } from '../../tienda/useSaldoGemas';
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
  Droplets,
  Dumbbell,
  Leaf,
  Pencil,
  Play,
  FolderOpen,
  BookOpen,
} from 'lucide-react-native';

import { RecuadroGlass, Texto, MasterIcon } from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { AuroraBoreal } from '../componentes/AuroraBoreal';
import { ESCALA_ESMERALDA } from '../../../diseno/tema/escalaEsmeralda';
import { useAssetsPaqueteTema } from '../../habitos/usePaqueteTema';
import { INTERCAMBIAR_BANDERA_Y_ARBUSTO } from '../../habitos/pruebaIntercambio';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Paleta de colores del mockup (tema lila / morado claro)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const C = {
  // Fondos
  fondo: '#F3EEFA',           // Lila muy pálido
  superficie: '#FFFFFF',
  glass: 'rgba(255,255,255,0.72)',
  glassBorde: 'rgba(255,255,255,0.85)',

  // Textos
  texto: '#1A1335',           // Azul noche oscuro
  textoSecundario: '#7B7494',
  textoTenue: '#A8A1BD',

  // Acentos
  morado: '#7C3AED',          // Morado principal
  moradoSuave: '#EDE5FB',
  moradoMedio: '#B794F6',
  verde: ESCALA_ESMERALDA.jade.l70,
  verdeSuave: ESCALA_ESMERALDA.jade.l95,
  naranja: '#F59E0B',
  naranjaSuave: '#FEF3C7',
  rojo: '#EF4444',
  rojoSuave: '#FEE2E2',
  azul: '#3B82F6',
  azulSuave: '#DBEAFE',
  gema: '#818CF8',
  racha: '#F97316',

  // Utilidad
  barraFondo: '#E8E0F3',
  sombra: '#6C3FBF',
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Helpers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function obtenerSaludo(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Datos mock
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const DIAS_SEMANA = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const RACHA_CHECKS = [true, true, true, true, true, false, false]; // L-D

type Categoria = {
  id: string;
  label: string;
  progreso: string;
  color: string;
  colorSuave: string;
  icono: any; // require(...) o null para placeholder
};

const CATEGORIAS: Categoria[] = [
  { id: 'estudio',  label: 'Estudio',  progreso: '2/4', color: C.morado,  colorSuave: C.moradoSuave, icono: 'hoy/estudio' },
  { id: 'tareas',   label: 'Tareas',   progreso: '3/5', color: C.naranja, colorSuave: C.naranjaSuave, icono: 'hoy/tareas' },
  { id: 'rutinas',  label: 'Rutinas',  progreso: '1/3', color: C.rojo,    colorSuave: C.rojoSuave, icono: 'hoy/rutinas' },
  { id: 'habitos',  label: 'Hábitos',  progreso: '2/4', color: C.verde,   colorSuave: C.verdeSuave, icono: 'hoy/habitos' },
  { id: 'mi-espacio', label: 'Mi espacio', progreso: '', color: C.morado, colorSuave: C.moradoSuave, icono: 'hoy/metas' },
  { id: 'mas',      label: 'Más',      progreso: '',    color: '#7B7494', colorSuave: '#EDE5FB', icono: 'hoy/mas' },
];

type EstadoTarea = 'completado' | 'activo' | 'pendiente';
type Tarea = {
  id: string;
  titulo: string;
  subtitulo: string;
  estado: EstadoTarea;
  color: string;
  colorSuave: string;
};

const TAREAS_HOY: Tarea[] = [
  { id: '1', titulo: 'Leer 10 páginas',   subtitulo: 'Estudio · 15 min',    estado: 'completado', color: ESCALA_ESMERALDA.jade.l70, colorSuave: ESCALA_ESMERALDA.jade.l95 },
  { id: '2', titulo: 'Ejercicio 30 min',  subtitulo: 'Salud · 30 min',      estado: 'completado', color: ESCALA_ESMERALDA.jade.l70, colorSuave: ESCALA_ESMERALDA.jade.l95 },
  { id: '3', titulo: 'Practicar dibujo',  subtitulo: 'Estudio · 20 min',    estado: 'activo',     color: C.morado,  colorSuave: C.moradoSuave },
  { id: '4', titulo: 'Beber agua',        subtitulo: 'Salud · Diario',      estado: 'pendiente',  color: '#3B82F6', colorSuave: '#DBEAFE' },
  { id: '5', titulo: 'Organizar espacio', subtitulo: 'Personal · 10 min',   estado: 'pendiente',  color: '#F59E0B', colorSuave: '#FEF3C7' },
  { id: '6', titulo: 'Meditación 5 min',  subtitulo: 'Bienestar · 5 min',   estado: 'pendiente',  color: ESCALA_ESMERALDA.jade.l70, colorSuave: ESCALA_ESMERALDA.jade.l95 },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Componentes Internos
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ─── Header ──────────────────────────────────────────────────────────────────
function HeaderHoy() {
  const router = useRouter();
  const { data: saldoGemas } = useSaldoGemas();
  return (
    <View style={s.header}>
      <View style={s.headerIzq}>
        <Texto style={s.headerSaludo}>Hola,</Texto>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Texto style={s.headerNombre}>Alejandro</Texto>
          <Image
            source={require('../../../../assets/icons/hoy/saludo.png')}
            style={{ width: 28, height: 28, resizeMode: 'contain' }}
          />
        </View>
        <Texto style={s.headerFrase}>Disciplina hoy, libertad mañana.</Texto>
      </View>

      <View style={s.headerDer}>
        <Pressable accessibilityLabel="Comprar gemas" onPress={() => router.push('/tienda')} style={s.statPill}>
          <Image
            source={require('../../../../assets/icons/hoy/gemas.png')}
            style={{ width: 22, height: 22, resizeMode: 'contain' }}
          />
          <Texto style={[s.statTexto, { color: '#6D28D9' }]}>{saldoGemas ?? 0}</Texto>
        </Pressable>

        {/* Notificaciones */}
        <View style={[s.statPill, { paddingHorizontal: 10, paddingVertical: 10, borderRadius: 22 }]}>
          <Image 
            source={require('../../../../assets/icons/hoy/notificaciones.png')}
            style={{ width: 30, height: 30, resizeMode: 'contain' }}
          />
        </View>
      </View>
    </View>
  );
}

// ─── Hero Section (Racha, Nivel, Ilustración) ────────────────────────────────
function HeroSection() {
  return (
    <View style={s.heroRow}>
      {/* Columna Izquierda: Racha y Nivel */}
      <View style={s.heroColIzq}>
        <RecuadroGlass style={s.rachaCard}>
          <View style={s.rachaTop}>
            <View style={s.rachaIcono}>
              <Image 
                source={require('../../../../assets/icons/hoy/racha.png')}
                style={{ width: 44, height: 44, resizeMode: 'contain' }}
              />
            </View>
            <View>
              <Texto style={s.rachaLabel}>Racha actual</Texto>
              <Texto style={s.rachaDias}>3 Días</Texto>
            </View>
          </View>
          <View style={s.rachaSemana}>
            {DIAS_SEMANA.map((dia, i) => (
              <View key={i} style={s.rachaDiaCol}>
                <Texto style={[s.rachaDiaLetra, i === 3 && s.rachaDiaActivo]}>{dia}</Texto>
                {RACHA_CHECKS[i] ? (
                  <View style={s.rachaCheck}>
                    <Check color="#FFFFFF" size={10} strokeWidth={3} />
                  </View>
                ) : (
                  <View style={s.rachaEmpty} />
                )}
              </View>
            ))}
          </View>
        </RecuadroGlass>

        <RecuadroGlass style={s.nivelCard}>
          <View style={s.nivelIcono}>
            <Image 
              source={require('../../../../assets/icons/hoy/insignia.png')}
              style={{ width: 44, height: 44, resizeMode: 'contain' }}
            />
          </View>
          <View style={s.nivelInfo}>
            <View style={s.nivelTextoRow}>
              <Texto style={s.nivelLabel}>Nivel 4</Texto>
              <Texto style={s.nivelXP}>95/120 XP</Texto>
            </View>
            <View style={s.nivelBarraFondo}>
              <View style={[s.nivelBarraRelleno, { width: '79%' }]} />
            </View>
          </View>
        </RecuadroGlass>
      </View>

      {/* Columna Derecha: Ilustración cuadrada */}
      <View style={s.heroColDer}>
        <View style={s.ilustracionContenedor}>
          <Image
            source={require('../../../../assets/ilustraciones/hoy/fondos/fondo.png')}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        </View>
      </View>
    </View>
  );
}

// ─── Grid de Categorías ──────────────────────────────────────────────────────
// Solo estas dos categorías tienen pantalla real hoy — el resto (Estudio,
// Rutinas, Mi espacio, Más) siguen siendo placeholder: navegar ahí rompería
// contra una ruta que no existe (expo-router la marcaría "Unmatched Route").
const CATEGORIAS_CON_PANTALLA = new Set(['tareas', 'habitos']);

function GridCategorias() {
  const router = useRouter();

  function obtenerAnchoProgreso(progreso: string) {
    if (!progreso) return 0;
    const [act, max] = progreso.split('/');
    if (!act || !max) return 0;
    return (parseInt(act) / parseInt(max)) * 100;
  }

  return (
    <View style={s.categoriasRow}>
      {CATEGORIAS.map((cat) => (
        <Pressable
          key={cat.id}
          onPress={() => {
            hapticSeguro('seleccion');
            if (CATEGORIAS_CON_PANTALLA.has(cat.id)) router.navigate(`/${cat.id}` as any);
          }}
          style={({ pressed }) => [
            s.categoriaCard,
            pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] },
          ]}
        >
          <RecuadroGlass style={s.categoriaGlass}>
            <View style={[s.categoriaIcono, !cat.icono && { backgroundColor: cat.colorSuave }]}>
              {cat.icono && (
                <MasterIcon name={cat.icono} size={38} />
              )}
            </View>
            <Texto style={s.categoriaLabel} numberOfLines={1}>{cat.label}</Texto>
            
            {cat.progreso !== '' && (
              <>
                <Texto style={s.categoriaProgreso}>{cat.progreso}</Texto>
                <View style={s.categoriaBarraFondo}>
                  <View 
                    style={[
                      s.categoriaBarraRelleno, 
                      { backgroundColor: cat.color, width: `${obtenerAnchoProgreso(cat.progreso)}%` }
                    ]} 
                  />
                </View>
              </>
            )}
          </RecuadroGlass>
        </Pressable>
      ))}
    </View>
  );
}

// ─── Card Sendero Activo ─────────────────────────────────────────────────────
function CardSendero() {
  return (
    <Pressable
      onPress={() => hapticSeguro('seleccion')}
      style={({ pressed }) => [
        pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
      ]}
    >
      <RecuadroGlass style={s.senderoCard}>
        {/* Usando el asset de estudio.png en lugar del ícono genérico */}
        <View style={s.senderoIcono}>
          <Image 
            source={require('../../../../assets/ilustraciones/Aby/aby.png')} 
            style={{ width: 90, height: 90, resizeMode: 'contain' }} 
          />
        </View>
        <View style={s.senderoInfo}>
          <Texto style={s.senderoEtiqueta}>Continúa tu sendero</Texto>
          <Texto style={s.senderoTitulo}>El camino del artista</Texto>
          <View style={s.senderoProgresoContenedor}>
            <View style={s.senderoBarraFondo}>
              <View style={[s.senderoBarraRelleno, { width: '50%' }]} />
            </View>
            <Texto style={s.senderoProgreso}>6/12 lecciones</Texto>
          </View>
        </View>
        <View style={s.senderoPlay}>
          <Play color="#FFFFFF" size={20} fill="#FFFFFF" />
        </View>
      </RecuadroGlass>
    </Pressable>
  );
}

// ─── Timeline "Hoy" (Columna izquierda) ──────────────────────────────────────
function TimelineHoy() {
  const tema = useAssetsPaqueteTema();
  return (
    <RecuadroGlass style={s.timelineGlass}>
      {/* Header dentro del contenedor glass */}
      <View style={s.timelineHeader}>
        {/* PRUEBA TEMPORAL: ver pruebaIntercambio.ts */}
        <Image
          source={INTERCAMBIAR_BANDERA_Y_ARBUSTO ? tema.arbusto : require('../../../../assets/icons/hoy/hoy.png')}
          style={{ width: INTERCAMBIAR_BANDERA_Y_ARBUSTO ? 44 : 32, height: INTERCAMBIAR_BANDERA_Y_ARBUSTO ? 44 : 32, resizeMode: 'contain' }}
        />
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, flex: 1, paddingBottom: 2 }}>
          <Texto style={s.timelineTitulo}>Hoy</Texto>
          <Texto style={s.timelineContador}>4/6 completadas</Texto>
        </View>
      </View>

      <ScrollView
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        style={s.timelineScroll}
      >
        <View style={{ position: 'relative', paddingVertical: 4 }}>
          {/* LÍNEA CONTINUA DE FONDO PARA TODO EL TIMELINE */}
          <View style={s.timelineLineaContinua} />

          {TAREAS_HOY.map((tarea) => {
            return (
              <View key={tarea.id} style={s.timelineItem}>
                {/* Columna del nodo */}
                <View style={s.timelineNodoCol}>
                  {/* Nodo estado */}
                  {tarea.estado === 'completado' && (
                    <View style={[s.timelineNodo, { backgroundColor: C.verde }]}>  
                      <Check color="#FFFFFF" size={10} strokeWidth={3} />
                    </View>
                  )}
                  {tarea.estado === 'activo' && (
                    <View style={[s.timelineNodo, { backgroundColor: C.morado }]}>
                      <Play color="#FFFFFF" size={8} fill="#FFFFFF" />
                    </View>
                  )}
                  {tarea.estado === 'pendiente' && (
                    <View style={s.timelineNodoVacio} />
                  )}
                </View>

                {/* Contenido tarea */}
                <View
                  style={[
                    s.timelineTareaContenido,
                    tarea.estado === 'activo' && s.timelineTareaActiva,
                  ]}
                >
                  <View style={[s.timelineTareaIcono, { backgroundColor: tarea.colorSuave }]}>
                    {tarea.id === '1' && <BookOpen color={tarea.color} size={14} />}
                    {tarea.id === '2' && <Dumbbell color={tarea.color} size={14} />}
                    {tarea.id === '3' && <Pencil color={tarea.color} size={14} />}
                    {tarea.id === '4' && <Droplets color={tarea.color} size={14} />}
                    {tarea.id === '5' && <FolderOpen color={tarea.color} size={14} />}
                    {tarea.id === '6' && <Leaf color={tarea.color} size={14} />}
                  </View>
                  <View style={s.timelineTareaTextos}>
                    <Texto style={s.timelineTareaTitulo} numberOfLines={1}>{tarea.titulo}</Texto>
                    <Texto style={s.timelineTareaSub} numberOfLines={1}>{tarea.subtitulo}</Texto>
                  </View>
                  {tarea.estado === 'activo' && (
                    <View style={s.timelinePlayBtn}>
                      <Play color="#FFFFFF" size={10} fill="#FFFFFF" />
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </RecuadroGlass>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Pantalla Principal
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function HoyPantalla() {
  const insets = useSafeAreaInsets();

  return (
    <View style={s.raiz}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingTop: insets.top + 32, flex: 1 }}>
          <AuroraBoreal />
          <HeaderHoy />
          <HeroSection />
          <GridCategorias />
          {/* CardSendero oculta a propósito por ahora — se vuelve a mostrar más adelante. */}

          <View style={s.timelineContenedor}>
            <TimelineHoy />
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
const PH = 20; // padding horizontal global

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
    width: '45%',
  },
  headerSaludo: {
    fontFamily: 'MontserratAlternates-Medium',
    fontSize: 14,
    color: '#4B4B4B', // Gris carbón no tan oscuro
  },
  headerNombre: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 22, // Un poco más pequeño
    color: C.texto,
    lineHeight: 26,
  },
  headerFrase: {
    fontFamily: 'MontserratAlternates-Medium',
    fontSize: 8, // Mucho más pequeño
    color: '#5A5A5A', // Gris carbón (un pelín más suave para jerarquía)
    marginTop: 4,
    lineHeight: 12,
  },
  headerDer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: -16, // Lo subimos manteniendo estático el lado izquierdo
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
  statTexto: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.moradoSuave,
    borderWidth: 2,
    borderColor: C.morado,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── Hero Section ────────────────────────────
  heroRow: {
    flexDirection: 'row',
    paddingHorizontal: PH,
    gap: 12,
    marginBottom: 16,
  },
  heroColIzq: {
    width: '45%', // Mantiene el 45% original
    gap: 12,
  },
  heroColDer: {
    position: 'absolute',
    right: PH,
    top: 0,
    width: '50%',
    zIndex: -1, // Se asegura de que la imagen quede por debajo de otros elementos interactivos
  },
  rachaCard: {
    width: '100%',
    backgroundColor: C.glass,
    borderRadius: RADIO,
    padding: 10,
    borderWidth: 1,
    borderColor: C.glassBorde,
    justifyContent: 'space-between',
  },
  rachaTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rachaIcono: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rachaLabel: {
    fontFamily: 'MontserratAlternates-Medium',
    fontSize: 10,
    color: C.textoSecundario,
  },
  rachaDias: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 20,
    color: '#1A1A1A', // Gris carbón muy oscuro
    marginTop: -2,
  },
  rachaSemana: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  rachaDiaCol: {
    alignItems: 'center',
    gap: 4,
  },
  rachaDiaLetra: {
    fontFamily: 'MontserratAlternates-Medium',
    fontSize: 8,
    color: C.textoSecundario,
  },
  rachaDiaActivo: {
    fontFamily: 'Montserrat-Bold',
    color: C.texto,
  },
  rachaCheck: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: C.naranja,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rachaEmpty: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#c8c8c8',
  },

  ilustracionContenedor: {
    width: '135%', // La hace un 35% más grande que su columna
    aspectRatio: 1, 
    borderRadius: RADIO,
    overflow: 'hidden',
    transform: [{ translateX: 15 }], // La empuja hacia la derecha para que se corte con el borde
  },

  // ─── Barra Nivel ───────────────────────────────────
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
  nivelTextoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nivelLabel: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 11,
    color: C.texto,
  },
  nivelXP: {
    fontFamily: 'MontserratAlternates-Medium',
    fontSize: 9,
    color: C.textoSecundario,
  },
  nivelBarraFondo: {
    height: 6,
    borderRadius: 3,
    backgroundColor: C.barraFondo,
  },
  nivelBarraRelleno: {
    height: 6,
    borderRadius: 3,
    backgroundColor: C.morado,
  },

  // ─── Categorías ─────────────────────────────────────
  categoriasRow: {
    flexDirection: 'row',
    paddingHorizontal: PH,
    paddingBottom: 4,
    marginBottom: 16,
    justifyContent: 'space-between',
    alignItems: 'flex-end', // Esto ancla la tarjeta 'Más' abajo junto con las demás
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
    justifyContent: 'flex-end', // Alinea los assets a la par en la parte inferior
    marginBottom: 1,
  },
  categoriaLabel: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 8,
    color: C.texto,
    textAlign: 'center',
    lineHeight: 10,
  },
  categoriaProgreso: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 7,
    color: C.textoTenue,
    marginTop: 3,
    lineHeight: 9,
  },
  categoriaBarraFondo: {
    width: '90%',
    height: 3,
    borderRadius: 1.5,
    backgroundColor: C.barraFondo,
    marginTop: 3,
  },
  categoriaBarraRelleno: {
    height: 3,
    borderRadius: 1.5,
  },

  // ─── Sendero Card ──────────────────────────────────
  senderoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: PH,
    marginBottom: 24,
    backgroundColor: C.glass,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: C.glassBorde,
  },
  senderoIcono: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  senderoInfo: {
    flex: 1,
  },
  senderoEtiqueta: {
    fontFamily: 'MontserratAlternates-Medium',
    fontSize: 11,
    color: C.textoSecundario,
  },
  senderoTitulo: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    color: C.texto,
    marginBottom: 0, // Ajustado para controlar el margen desde el contenedor
  },
  senderoProgresoContenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4, // Reducido para que esté más cerca del título
  },
  senderoProgreso: {
    fontFamily: 'MontserratAlternates-Medium',
    fontSize: 10,
    color: C.textoSecundario,
  },
  senderoBarraFondo: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.barraFondo,
  },
  senderoBarraRelleno: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9333EA', // Morado saturado
  },
  senderoPlay: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.morado,
    alignItems: 'center',
    justifyContent: 'center',
    ...sombra(0.15),
  },

  // ─── Contenedor de Hoy (100% del ancho) ─────────────
  timelineContenedor: {
    paddingHorizontal: PH,
  },

  // ─── Timeline ──────────────────────────────────────
  timelineGlass: {
    backgroundColor: C.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.glassBorde,
    padding: 10,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  timelineTitulo: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    color: C.texto,
  },
  timelineContador: {
    fontFamily: 'MontserratAlternates-Medium',
    fontSize: 8,
    color: C.textoSecundario,
  },
  timelineScroll: {
    maxHeight: 320,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingVertical: 3,
  },
  timelineNodoCol: {
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  timelineLineaContinua: {
    position: 'absolute',
    top: 24, // Inicia en el centro del primer nodo
    bottom: 24, // Termina en el centro del último nodo
    left: 10, // Mitad del ancho del timelineNodoCol (22 / 2 = 11, pero ajustado visualmente a 10)
    width: 2,
    backgroundColor: C.barraFondo,
    borderRadius: 1,
  },
  timelineNodo: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineNodoVacio: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#c8c8c8',
  },
  timelineTareaContenido: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 6,
    gap: 5,
  },
  timelineTareaActiva: {
    backgroundColor: C.moradoSuave,
    borderWidth: 1,
    borderColor: C.moradoMedio,
  },
  timelineTareaIcono: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineTareaTextos: {
    flex: 1,
  },
  timelineTareaTitulo: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 8,
    color: C.texto,
    lineHeight: 11,
  },
  timelineTareaSub: {
    fontFamily: 'MontserratAlternates-Medium',
    fontSize: 7,
    color: C.textoSecundario,
    lineHeight: 9,
  },
  timelinePlayBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.morado,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineMore: {
    padding: 2,
  },
});

// ─── Utilidad de sombra ──────────────────────────────
function sombra(opacidad: number) {
  return {
    shadowColor: C.sombra,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: opacidad,
    shadowRadius: 16,
    elevation: 3,
  };
}
