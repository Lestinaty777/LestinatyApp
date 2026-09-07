import { useState, useMemo } from 'react';
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
  ChevronRight,
  Droplets,
  Dumbbell,
  Flame,
  Gem,
  Leaf,
  MoreHorizontal,
  Pencil,
  Play,
  FolderOpen,
  Sparkles,
  BookOpen,
  Crown,
  Smile,
  Target,
} from 'lucide-react-native';

import { RecuadroGlass, Texto } from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';

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
  verde: '#22C55E',
  verdeSuave: '#D1FAE5',
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
  { id: 'estudio',  label: 'Estudio',  progreso: '2/4', color: C.morado,  colorSuave: C.moradoSuave, icono: require('../../../../assets/ilustraciones/hoy/icons/estudio.png') },
  { id: 'tareas',   label: 'Tareas',   progreso: '3/5', color: C.naranja, colorSuave: C.naranjaSuave, icono: require('../../../../assets/ilustraciones/hoy/icons/tareas.png') },
  { id: 'rutinas',  label: 'Rutinas',  progreso: '1/3', color: C.rojo,    colorSuave: C.rojoSuave, icono: require('../../../../assets/ilustraciones/hoy/icons/rutinas.png') },
  { id: 'habitos',  label: 'Hábitos',  progreso: '2/4', color: C.verde,   colorSuave: C.verdeSuave, icono: require('../../../../assets/ilustraciones/hoy/icons/habitos.png') },
  { id: 'metas',    label: 'Metas',    progreso: '0/1', color: C.azul,    colorSuave: C.azulSuave, icono: require('../../../../assets/ilustraciones/hoy/icons/metas.png') },
  { id: 'mas',      label: 'Más',      progreso: '',    color: '#7B7494', colorSuave: '#EDE5FB', icono: require('../../../../assets/ilustraciones/hoy/icons/mas.png') },
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
  { id: '1', titulo: 'Leer 10 páginas',   subtitulo: 'Estudio · 15 min',    estado: 'completado', color: '#22C55E', colorSuave: '#D1FAE5' },
  { id: '2', titulo: 'Ejercicio 30 min',  subtitulo: 'Salud · 30 min',      estado: 'completado', color: '#22C55E', colorSuave: '#D1FAE5' },
  { id: '3', titulo: 'Practicar dibujo',  subtitulo: 'Estudio · 20 min',    estado: 'activo',     color: C.morado,  colorSuave: C.moradoSuave },
  { id: '4', titulo: 'Beber agua',        subtitulo: 'Salud · Diario',      estado: 'pendiente',  color: '#3B82F6', colorSuave: '#DBEAFE' },
  { id: '5', titulo: 'Organizar espacio', subtitulo: 'Personal · 10 min',   estado: 'pendiente',  color: '#F59E0B', colorSuave: '#FEF3C7' },
  { id: '6', titulo: 'Meditación 5 min',  subtitulo: 'Bienestar · 5 min',   estado: 'pendiente',  color: '#22C55E', colorSuave: '#D1FAE5' },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Componentes Internos
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ─── Header ──────────────────────────────────────────────────────────────────
function HeaderHoy() {
  return (
    <View style={s.header}>
      <View style={s.headerIzq}>
        <Texto style={s.headerSaludo}>Hola,</Texto>
        <Texto style={s.headerNombre}>Alejandro</Texto>
        <Texto style={s.headerFrase}>Disciplina hoy, libertad mañana.</Texto>
      </View>

      <View style={s.headerDer}>
        <View style={s.statPill}>
          <Image 
            source={require('../../../../assets/ilustraciones/hoy/icons/gemas.png')}
            style={{ width: 22, height: 22, resizeMode: 'contain' }}
          />
          <Texto style={[s.statTexto, { color: '#6D28D9' }]}>235</Texto>
        </View>

        {/* TODO: reemplazar con avatar del usuario */}
        <View style={s.avatar}>
          <View style={s.avatarPlaceholder}>
            <Texto style={{ fontSize: 22 }}>🧙</Texto>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Widget Racha + Ilustración ──────────────────────────────────────────────
function WidgetRachaIlustracion() {
  return (
    <View style={s.rachaIlustracionRow}>
      {/* Widget racha */}
      <RecuadroGlass style={s.rachaCard}>
        <View style={s.rachaTop}>
          <View style={s.rachaIcono}>
            <Image 
              source={require('../../../../assets/ilustraciones/hoy/icons/racha.png')}
              style={{ width: 44, height: 44, resizeMode: 'contain' }}
            />
          </View>
          <View>
            <Texto style={s.rachaLabel}>Racha actual</Texto>
            <Texto style={s.rachaDias}>3 días</Texto>
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

      {/* Ilustración principal */}
      <View style={s.ilustracionContenedor}>
        {/* TODO: reemplazar con asset isométrico (árbol de wisteria) */}
        <Image
          source={require('../../../../assets/ilustraciones/hoy/fondos/fondo.png')}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      </View>
    </View>
  );
}

// ─── Barra de Nivel / XP ────────────────────────────────────────────────────
function BarraNivel() {
  return (
    <View style={{ paddingHorizontal: 20 }}>
      <RecuadroGlass style={s.nivelCard}>
        {/* Usando asset insignia.png */}
        <View style={s.nivelIcono}>
          <Image 
            source={require('../../../../assets/ilustraciones/hoy/icons/insignia.png')}
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
  );
}

// ─── Grid de Categorías ──────────────────────────────────────────────────────
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
            if (cat.id !== 'mas') router.push(`/${cat.id}` as any);
          }}
          style={({ pressed }) => [
            s.categoriaCard,
            pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] },
          ]}
        >
          <RecuadroGlass style={s.categoriaGlass}>
            <View style={[s.categoriaIcono, !cat.icono && { backgroundColor: cat.colorSuave }]}>
              {cat.icono && (
                <Image source={cat.icono} style={{ width: 38, height: 38, resizeMode: 'contain' }} />
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
            source={require('../../../../assets/ilustraciones/hoy/icons/estudio.png')} 
            style={{ width: 64, height: 64, resizeMode: 'contain' }} 
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
  return (
    <RecuadroGlass style={s.timelineGlass}>
      {/* Header dentro del contenedor glass */}
      <View style={s.timelineHeader}>
        <Image 
          source={require('../../../../assets/ilustraciones/hoy/icons/hoy.png')}
          style={{ width: 32, height: 32, resizeMode: 'contain' }}
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

// ─── Calendario Mensual (Columna derecha) ────────────────────────────────────
function CalendarioMensual() {
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth());
  const [anio, setAnio] = useState(hoy.getFullYear());

  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  const diasEnMes = useMemo(() => {
    const primerDia = new Date(anio, mes, 1);
    const ultimoDia = new Date(anio, mes + 1, 0);
    const totalDias = ultimoDia.getDate();
    // getDay(): 0=Dom. Queremos que L=0
    let inicioSemana = primerDia.getDay() - 1;
    if (inicioSemana < 0) inicioSemana = 6;

    const celdas: (number | null)[] = [];
    for (let i = 0; i < inicioSemana; i++) celdas.push(null);
    for (let d = 1; d <= totalDias; d++) celdas.push(d);
    return celdas;
  }, [mes, anio]);

  const esHoy = (dia: number | null) =>
    dia !== null &&
    dia === hoy.getDate() &&
    mes === hoy.getMonth() &&
    anio === hoy.getFullYear();

  function cambiarMes(delta: number) {
    let nuevoMes = mes + delta;
    let nuevoAnio = anio;
    if (nuevoMes < 0) { nuevoMes = 11; nuevoAnio--; }
    if (nuevoMes > 11) { nuevoMes = 0; nuevoAnio++; }
    setMes(nuevoMes);
    setAnio(nuevoAnio);
  }

  return (
    <RecuadroGlass style={s.calendarioCard}>
      {/* Header mes */}
      <View style={s.calendarioHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Image 
            source={require('../../../../assets/ilustraciones/hoy/icons/calendario.png')}
            style={{ width: 20, height: 20, resizeMode: 'contain' }}
          />
          <Texto style={s.calendarioMes}>
            {nombresMeses[mes]}
          </Texto>
        </View>
        <View style={s.calendarioNav}>
          <Pressable onPress={() => cambiarMes(-1)} hitSlop={10}>
            <ChevronLeft color={C.textoSecundario} size={16} />
          </Pressable>
          <Pressable onPress={() => cambiarMes(1)} hitSlop={10}>
            <ChevronRight color={C.textoSecundario} size={16} />
          </Pressable>
        </View>
      </View>

      {/* Días semana */}
      <View style={s.calendarioFilaDias}>
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, i) => (
          <Texto key={i} style={s.calendarioDiaHeader}>{d}</Texto>
        ))}
      </View>

      {/* Grid */}
      <View style={s.calendarioGrid}>
        {diasEnMes.map((dia, idx) => {
          const hoyFlag = esHoy(dia);
          return (
            <View key={idx} style={s.calendarioCelda}>
              {dia !== null && (
                <View style={[s.calendarioDia, hoyFlag && s.calendarioDiaHoy]}>
                  <Texto style={[s.calendarioDiaTexto, hoyFlag && s.calendarioDiaTextoHoy]}>
                    {dia}
                  </Texto>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </RecuadroGlass>
  );
}

// ─── Card Quote Motivacional ─────────────────────────────────────────────────
function CardQuote() {
  return (
    <RecuadroGlass style={s.quoteCard}>
      <View style={s.quoteAvatar}>
        {/* TODO: reemplazar con avatar */}
        <Smile color={C.morado} size={16} />
      </View>
      <View style={s.quoteTextoContainer}>
        <Texto style={s.quoteTexto}>
          "La motivación te hace empezar, el hábito te mantiene en marcha."
        </Texto>
      </View>
    </RecuadroGlass>
  );
}

// ─── Card Próxima Meta ───────────────────────────────────────────────────────
function CardProximaMeta() {
  return (
    <Pressable
      onPress={() => hapticSeguro('seleccion')}
      style={({ pressed }) => [
        pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
      ]}
    >
      <RecuadroGlass style={s.metaCard}>
        {/* TODO: reemplazar con asset de montaña/meta */}
        <View style={s.metaImagen}>
          <Texto style={{ fontSize: 36 }}>🏔️</Texto>
        </View>
        <View style={s.metaInfo}>
          <Texto style={s.metaEtiqueta}>Tu próxima meta</Texto>
          <Texto style={s.metaTitulo}>Aprender dibujo{'\n'}técnico</Texto>
        </View>
        <ChevronRight color="#FFFFFF" size={20} />
      </RecuadroGlass>
    </Pressable>
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
        <View style={{ paddingTop: insets.top + 32 }}>
          <HeaderHoy />
          <WidgetRachaIlustracion />
          <BarraNivel />
          <GridCategorias />
          <CardSendero />

          {/* ── Sección inferior: dos columnas ──────────────────────── */}
          <View style={s.columnasContainer}>
            {/* Columna Izquierda: Timeline */}
            <View style={s.columnaIzq}>
              <TimelineHoy />
            </View>

            {/* Columna Derecha: Calendario + Quote + Meta */}
            <View style={s.columnaDer}>
              <CalendarioMensual />
              <CardQuote />
              <CardProximaMeta />
            </View>
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
    color: C.textoSecundario,
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
    color: C.textoTenue,
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

  // ─── Racha + Ilustración ────────────────────────────
  rachaIlustracionRow: {
    flexDirection: 'row',
    paddingHorizontal: PH,
    gap: 12,
    marginBottom: 12,
    height: 110,
  },
  rachaCard: {
    width: '45%',
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

  // ─── Ilustración ────────────────────────────────────
  ilustracionContenedor: {
    flex: 1,
    borderRadius: RADIO,
    overflow: 'hidden',
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
    marginBottom: 16,
    width: '45%',
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
    alignItems: 'flex-start',
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
    backgroundColor: C.naranja,
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

  // ─── Columnas ──────────────────────────────────────
  columnasContainer: {
    flexDirection: 'row',
    paddingHorizontal: PH,
    gap: 12,
  },
  columnaIzq: {
    flex: 1.2,
  },
  columnaDer: {
    flex: 1,
    gap: 12,
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

  // ─── Calendario ────────────────────────────────────
  calendarioCard: {
    backgroundColor: C.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.glassBorde,
    padding: 12,
  },
  calendarioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  calendarioMes: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 11,
    color: C.texto,
  },
  calendarioNav: {
    flexDirection: 'row',
    gap: 4,
  },
  calendarioFilaDias: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  calendarioDiaHeader: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Montserrat-Bold',
    fontSize: 10,
    color: C.textoTenue,
  },
  calendarioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarioCelda: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarioDia: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarioDiaHoy: {
    backgroundColor: C.morado,
  },
  calendarioDiaTexto: {
    fontFamily: 'MontserratAlternates-Medium',
    fontSize: 9,
    color: C.texto,
  },
  calendarioDiaTextoHoy: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
  },

  // ─── Quote ─────────────────────────────────────────
  quoteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.glass,
    borderRadius: 16,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: C.glassBorde,
  },
  quoteAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.moradoSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteTextoContainer: {
    flex: 1,
  },
  quoteTexto: {
    fontFamily: 'MontserratAlternates-Medium',
    fontSize: 10,
    color: C.textoSecundario,
    fontStyle: 'italic',
    lineHeight: 14,
  },

  // ─── Meta Card ─────────────────────────────────────
  metaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.morado,
    borderRadius: 16,
    padding: 10,
    gap: 8,
    overflow: 'hidden',
  },
  metaImagen: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaInfo: {
    flex: 1,
  },
  metaEtiqueta: {
    fontFamily: 'MontserratAlternates-Medium',
    fontSize: 8,
    color: 'rgba(255,255,255,0.7)',
  },
  metaTitulo: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 11,
    color: '#FFFFFF',
    lineHeight: 15,
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
