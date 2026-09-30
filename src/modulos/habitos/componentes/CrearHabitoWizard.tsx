import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, Image, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleProp, StyleSheet, Switch, TextInput, View, ViewStyle, useWindowDimensions } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ReanimatedView, { Easing as EasingR, FadeIn, FadeInDown, FadeOut, interpolate, interpolateColor, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { Check, ChevronLeft, ChevronRight, Clock3, Search, Sparkles } from 'lucide-react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Boton, MasterAnimation, MasterColorProvider, MasterGlass, MasterIcon, MasterSand, RecuadroGlass, TONO_ESMERALDA, Texto, crearTonoMaster, useTonoMaster } from '../../../diseno';
import { colorMasterMasCercano } from '../../../diseno/componentes/MasterChanger';
import { TOPE_ESCALA_TEXTO_COMPACTO } from '../../../diseno/fundamentos/accesibilidad';
import { CrearHabitoInput } from '../habitos.servicio';
import type { TipoMetaHabito } from '../tipos';
import { DIAS_REQUERIDOS_POR_NIVEL, iconosHabitos } from '../iconosHabitos';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { solicitarPermisoYRegistrar } from '../../../nucleo/notificaciones/oneSignal';
import { actualizarPreferenciaNotificacion } from '../../configuracion/configuracion.servicio';
import { estadoPreparacionHabito } from '../creacionPremium';
import { preparacionEstilos as p } from '../creacionPremium.estilos';
import { buscarPlantillasHabitos, type PlantillaHabito } from '../plantillasHabitos';
import { asignarSemillaHabito, obtenerCatalogoArboles, obtenerSemillasDisponibles } from '../../tienda/gemas.servicio';
import { CLAVE_SEMILLAS_DISPONIBLES } from '../../tienda/pantallas/TiendaArbolesPantalla';
import { TarjetaSenderoHabito } from './TarjetaSenderoHabito';
import { obtenerAssetsPaqueteHabito, obtenerEtapaSietePaquete } from '../paqueteVisual.assets';
import { obtenerPaqueteVisualHabito } from '../paqueteVisual';
import { obtenerColorMasterPaquete } from '../temaPaqueteHabito';
import { useTranslation } from 'react-i18next';
import { useEscala } from '../../../diseno/tema/MasterColorContext';
import type { EscalaMaster } from '../../../diseno/tema/escalaEsmeralda';
import { calcularLayoutTecladoWizard, type PlataformaTeclado } from './layoutTecladoWizard';

const OTRO_PLANTILLA_ID = 'otro';
const TOTAL_PASOS = 7;
// bandera/racha son iconografía propia de Hoy (la bandera del encabezado, el
// icono de racha) y nivel1..7 son medallas de progreso — ninguno representa
// un hábito, así que no tiene sentido ofrecerlos en el selector manual.
const IDS_ICONOS_NO_SELECCIONABLES = ['bandera', 'racha', 'nivel1', 'nivel2', 'nivel3', 'nivel4', 'nivel5', 'nivel6', 'nivel7'];
const ICONOS_SELECCIONABLES = iconosHabitos.filter((icono) => !IDS_ICONOS_NO_SELECCIONABLES.includes(icono.id));

// Envoltorio táctil reutilizable: hunde con un tap (spring al soltar) y avisa
// con haptic — la micro-interacción base para cada punto de selección del wizard.
function Rebote({ accessibilityLabel, children, estilo, onPress, overlay }: { accessibilityLabel?: string; children: ReactNode; estilo?: StyleProp<ViewStyle>; onPress: () => void; overlay?: ReactNode }) {
  const escala = useSharedValue(1);
  const estiloAnimado = useAnimatedStyle(() => ({ transform: [{ scale: escala.value }] }));
  return <Pressable
    accessibilityLabel={accessibilityLabel}
    onPress={() => { hapticSeguro('seleccion'); onPress(); }}
    onPressIn={() => { escala.value = withTiming(0.86, { duration: 90 }); }}
    onPressOut={() => { escala.value = withSpring(1, { damping: 8, stiffness: 260 }); }}
    style={estilo}
  >
    {/* overlay va fuera del envoltorio de escala (que se ajusta a su
        contenido) para que ancle al tamaño real del botón, no al del ícono. */}
    {overlay}
    <ReanimatedView.View style={estiloAnimado}>{children}</ReanimatedView.View>
  </Pressable>;
}

// Check con rebote+giro al aparecer (no un simple mostrar/ocultar).
function CheckAnimado({ visible }: { visible: boolean }) {
  const progreso = useSharedValue(visible ? 1 : 0);
  useEffect(() => { progreso.value = withSpring(visible ? 1 : 0, { damping: 9, stiffness: 260 }); }, [progreso, visible]);
  const estilo = useAnimatedStyle(() => ({ opacity: progreso.value, transform: [{ scale: progreso.value }, { rotate: `${(1 - progreso.value) * -90}deg` }] }));
  return <ReanimatedView.View style={estilo}><Check color="#fff" size={16} strokeWidth={3.4} /></ReanimatedView.View>;
}

// Anillo que se expande y se desvanece al seleccionar — un "burst" de
// confirmación en vez de un cambio de color plano.
function AnilloSeleccion({ activo, color }: { activo: boolean; color: string }) {
  const progreso = useSharedValue(0);
  useEffect(() => { if (activo) { progreso.value = 0; progreso.value = withTiming(1, { duration: 480, easing: EasingR.out(EasingR.cubic) }); } }, [activo, progreso]);
  const estilo = useAnimatedStyle(() => ({
    opacity: interpolate(progreso.value, [0, 0.6, 1], [0.6, 0.28, 0]),
    transform: [{ scale: 1 + progreso.value * 0.85 }],
  }));
  if (!activo) return null;
  return <ReanimatedView.View pointerEvents="none" style={[{ borderColor: color, borderRadius: 999, borderWidth: 2, bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }, estilo]} />;
}

function PuntoProgreso({ activo, color }: { activo: boolean; color: string }) {
  const s = useEstilosS();
  const progreso = useSharedValue(activo ? 1 : 0);
  useEffect(() => { progreso.value = withSpring(activo ? 1 : 0, { damping: 14, stiffness: 180 }); }, [activo, progreso]);
  const estilo = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progreso.value, [0, 1], ['#DDD6E9', color]),
    transform: [{ scaleY: 1 + progreso.value * 0.5 }],
  }));
  return <ReanimatedView.View style={[s.punto, estilo]} />;
}

const PAQUETE_GRATUITO_DEFECTO = 'esmeralda';

const dias = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }, { id: 7 }];
// "Páginas" es a propósito el mismo tipoMeta que "Cantidad" (solo cambia el
// icono/unidad por defecto) — nada más completa el grid 2x2, por eso se
// trackea aparte con subtipoMeta en vez de agregar un tipoMeta real nuevo.
type SubtipoMeta = TipoMetaHabito | 'paginas';
// Decoración de los inputs de meta/unidad — un ejemplo vivo según el subtipo
// elegido, en vez de un placeholder genérico igual para todos.
const PLACEHOLDER_META: Record<SubtipoMeta, string> = { cantidad: '8', check: '', duracion: '20', paginas: '20' };
const previewCompacta = { minHeight: 96, padding: 8 };
const iconoPreviewCompacto = { height: 44, width: 44 };
const metaPreviewCompacta = { fontSize: 12 };
const Bell = ({ size = 28 }: { color?: string; size?: number }) => <Image source={require('../../../../assets/icons/hoy/notificaciones.png')} style={{ height: size + 18, resizeMode: 'contain', width: size + 18 }} />;

function EncabezadoPaso({ colorMaster, icono, subtitulo, titulo }: { colorMaster: ReturnType<typeof obtenerColorMasterPaquete>; icono: string; subtitulo: string; titulo: string }) {
  const s = useEstilosS();
  const tono = useTonoMaster();
  return <View style={s.encabezadoPaso}><MasterIcon color={colorMaster} hueDestino={tono.hueIcono} name={icono} size={52} /><View style={s.encabezadoTexto}><Texto style={s.titulo}>{titulo}</Texto><Texto style={s.sub}>{subtitulo}</Texto></View></View>;
}

function AnilloMeta({ color, meta, unidad }: { color: string; meta: string; unidad: string }) {
  const radio = 42, circunferencia = 2 * Math.PI * radio;
  return <View style={{ alignItems: 'center', height: 112, justifyContent: 'center', width: 112 }}><Svg height={112} style={{ position: 'absolute' }} width={112}><Circle cx="56" cy="56" fill="none" r={radio} stroke={`${color}24`} strokeWidth={8}/><Circle cx="56" cy="56" fill="none" r={radio} rotation="-90" stroke={color} strokeDasharray={`${circunferencia} ${circunferencia}`} strokeDashoffset={circunferencia * .94} strokeLinecap="round" strokeWidth={8} origin="56,56"/></Svg><Texto style={{ color: '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 19 }}>0/{meta}</Texto><Texto style={{ color: '#7B7494', fontSize: 11 }}>{unidad}</Texto></View>;
}

function FondoSelvaWizard({ color }: { color: string }) {
  const s = useEstilosS();
  return <View pointerEvents="none" style={s.fondoDecorativo}><Svg height="100%" viewBox="0 0 390 844" width="100%"><Circle cx="370" cy="22" fill={`${color}0B`} r="142"/><Circle cx="-36" cy="694" fill={`${color}0C`} r="172"/><Path d="M326 8C270 21 249 81 292 120c49-21 70-75 34-112Z" fill={`${color}12`}/><Path d="M389 118c-59 4-91 49-74 97 53-6 82-48 74-97Z" fill={`${color}0D`}/><Path d="M-8 625c55 2 91 42 77 91-51-4-84-43-77-91Z" fill={`${color}12`}/><Path d="M69 785c-56-17-93 13-99 64 52 14 91-15 99-64Z" fill={`${color}0D`}/><Path d="M282 782c17-48 57-68 99-55-12 46-52 67-99 55Z" fill={`${color}0B`}/></Svg></View>;
}

const MULTIPLICADORES_NIVEL = [1, 1.2, 1.5, 1.8, 2.2, 2.6, 3];

function RutaNiveles({ colorMaster, meta, tipo, unidad }: { colorMaster: ReturnType<typeof obtenerColorMasterPaquete>; meta: string; tipo: CrearHabitoInput['tipoMeta']; unidad: string }) {
  const s = useEstilosS();
  const { t } = useTranslation();
  const tono = useTonoMaster();
  const base = Math.max(1, Number(meta) || 1);
  const unidadFinal = tipo === 'duracion' ? t('habitos.crearWizard.meta.minutes') : unidad || t('habitos.crearWizard.meta.times');
  return <View style={s.rutaNiveles}>{Array.from({ length: 7 }, (_, indice) => {
    const nivel = indice + 1;
    const metaNivel = Math.round(base * MULTIPLICADORES_NIVEL[indice]);
    const gemas = nivel * 5;
    const consistencia = nivel === 1 ? t('habitos.crearWizard.growth.startConsistency') : t('habitos.crearWizard.growth.consistencyDays', { days: DIAS_REQUERIDOS_POR_NIVEL[nivel] });
    const porDia = (cantidad: number) => t('habitos.crearWizard.growth.perDay', { amount: cantidad, unit: unidadFinal });
    const detalle = tipo === 'duracion' ? porDia(metaNivel) : tipo === 'check' ? consistencia : nivel === 1 ? porDia(base) : `${porDia(base)} · ${consistencia}`;
    return <ReanimatedView.View entering={FadeInDown.delay(indice * 70).duration(360).easing(EasingR.out(EasingR.cubic))} key={nivel}><RecuadroGlass blur style={s.nivelRuta}><View style={s.insigniaNivel}><MasterIcon color={colorMaster} hueDestino={tono.hueIcono} name={`nivel${nivel}`} oscurecido={1 - indice * .05} size={48}/></View><View style={s.nivelRutaTexto}><Texto style={[s.nivelRutaTitulo, { color: tono.tarjeta.tinta }]}>{t('habitos.crearWizard.growth.level', { level: nivel })}</Texto><Texto style={[s.nivelRutaDetalle, { color: tono.tarjeta.tintaMedia }]}>{detalle}</Texto></View>{nivel === 1 ? <Texto style={[s.nivelActual, { backgroundColor: tono.etiquetaActual.fondo, color: tono.etiquetaActual.texto }]}>{t('habitos.crearWizard.growth.current')}</Texto> : <View style={s.gemasNivel}><Image source={require('../../../../assets/icons/hoy/gemas.png')} style={s.gemaNivelIcono}/><Texto style={s.gemasNivelTexto}>+{gemas}</Texto></View>}</RecuadroGlass></ReanimatedView.View>;
  })}</View>;
}

// Pantalla de espera al crear el hábito: un solo anillo MasterSand sobre fondo
// liso, con el porcentaje al centro. El número sube 1 en 1 sin saltos (ver el
// intervalo de progresoPreparacion) y el anillo se rellena a la par; al llegar
// a 100 el número da paso a una palomita. Sin árboles ni fondos decorativos.
function PreparandoHabito({ color, fondo, progreso, titulo }: { color: string; fondo: string; progreso: number; titulo: string }) {
  const { t } = useTranslation();
  const estado = estadoPreparacionHabito(progreso);
  // El anillo ocupa todo el ancho disponible (menos un margen a cada lado).
  const { width } = useWindowDimensions();
  const tamano = Math.min(width - 64, 460);
  return <View style={[p.raiz, { backgroundColor: fondo }]}>
    <ReanimatedView.View entering={FadeIn.duration(360)} style={p.contenido}>
      <MasterSand color={color} forma="anillo" grosor={Math.round(tamano * 0.085)} porcentaje={progreso} tamano={tamano}>
        {progreso >= 100
          ? <Check color={color} size={Math.round(tamano * 0.28)} strokeWidth={3} />
          : <Texto adjustsFontSizeToFit minimumFontScale={0.6} numberOfLines={1} style={[p.porcentaje, { color, fontSize: Math.round(tamano * 0.2), lineHeight: Math.round(tamano * 0.26) }]}>{progreso}%</Texto>}
      </MasterSand>
      <Texto style={[p.titulo, { color }]}>{t(estado.mensajeClave)}</Texto>
      <Texto style={p.sub}>{t('habitos.crearWizard.preparation.description', { title: titulo || t('habitos.crearWizard.preparation.defaultHabit') })}</Texto>
    </ReanimatedView.View>
  </View>;
}

// El fondo hace un fundido al cambiar de tono (elegir/quitar una semilla) en vez
// de saltar de golpe — interpolateColor sobre el par [anterior, nuevo].
function useFondoAnimado(color: string) {
  const [par, setPar] = useState({ desde: color, hasta: color });
  const progreso = useSharedValue(1);
  useEffect(() => { setPar((actual) => actual.hasta === color ? actual : { desde: actual.hasta, hasta: color }); }, [color]);
  useEffect(() => { progreso.value = 0; progreso.value = withTiming(1, { duration: 420 }); }, [par, progreso]);
  return useAnimatedStyle(() => ({ backgroundColor: interpolateColor(progreso.value, [0, 1], [par.desde, par.hasta]) }), [par]);
}

const INTERVALO_REVELADO_ICONOS_MS = 70;

// Cuántos elementos ya "se procesaron": sube de a 1 cada `intervalo` ms. Sirve
// para tintar decenas de iconos (cada uno es un Canvas de Skia) sin montarlos
// todos de golpe — el usuario ve el skeleton convertirse en icono uno a uno.
// Se reinicia cuando cambia `clave` (p. ej. otro tono).
function useRevelacionProgresiva(total: number, clave: string, activo: boolean) {
  const [revelados, setRevelados] = useState(activo ? 0 : total);
  useEffect(() => { setRevelados(activo ? 0 : total); }, [activo, clave, total]);
  useEffect(() => {
    if (!activo || revelados >= total) return;
    const temporizador = setTimeout(() => setRevelados(revelados + 1), INTERVALO_REVELADO_ICONOS_MS);
    return () => clearTimeout(temporizador);
  }, [activo, revelados, total]);
  return revelados;
}

// Grid de iconos aparte del wizard: el revelado progresivo re-renderiza cada
// 70 ms, y así solo se repinta este grid — no los 500 líneas del wizard entero.
// Exportado para reutilizarse tal cual en EditarHabitoFormulario — mismo
// selector de ícono en creación y edición, sin duplicar el grid ni la
// revelación progresiva.
export function GridIconosHabito({ color, etiquetaIcono, iconoSeleccionado, onElegir }: { color: string; etiquetaIcono: (id: string, etiquetaPredeterminada: string) => string; iconoSeleccionado: string; onElegir: (id: string) => void }) {
  const s = useEstilosS();
  const { t } = useTranslation();
  const tono = useTonoMaster();
  const tinta = tono.hueIcono !== undefined;
  const revelados = useRevelacionProgresiva(ICONOS_SELECCIONABLES.length, tono.id, tinta);
  const indiceSeleccionado = ICONOS_SELECCIONABLES.findIndex((x) => x.id === iconoSeleccionado);
  // El icono elegido se procesa primero; los demás siguen en su orden.
  const posicion = (indice: number) => indice === indiceSeleccionado ? 0 : indiceSeleccionado >= 0 && indice < indiceSeleccionado ? indice + 1 : indice;
  return <ScrollView nestedScrollEnabled style={s.iconosScroll} contentContainerStyle={s.iconos} showsVerticalScrollIndicator={false}>
    {ICONOS_SELECCIONABLES.map((x, indice) => <Rebote accessibilityLabel={t('habitos.crearWizard.identity.iconAccessibility', { label: etiquetaIcono(x.id, x.etiqueta) })} key={x.id} estilo={[s.iconoOpcion, iconoSeleccionado === x.id && { borderColor: color, backgroundColor: `${color}12` }]} onPress={() => onElegir(x.id)} overlay={iconoSeleccionado === x.id && <AnilloSeleccion activo color={color}/>}>
      {tinta ? <MasterIcon cargando={posicion(indice) >= revelados} name={x.id} size={38}/> : <MasterIcon name={x.id} size={38}/>}
    </Rebote>)}
  </ScrollView>;
}

export function CrearHabitoWizard({ visible, guardando, onCerrar, onCrear }: { visible: boolean; guardando: boolean; onCerrar: () => void; onCrear: (input: CrearHabitoInput) => Promise<{ id: string }> }) {
  const s = useEstilosS();
  const { t, i18n } = useTranslation();
  const [paso, setPaso] = useState(0), [titulo, setTitulo] = useState(''), [meta, setMeta] = useState('1'), [unidad, setUnidad] = useState(() => t('habitos.crearWizard.meta.times'));
  const [tipo, setTipo] = useState<CrearHabitoInput['tipoMeta']>('cantidad'), [frecuencia, setFrecuencia] = useState<CrearHabitoInput['frecuencia']>('diaria');
  const [diasSemana, setDiasSemana] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]), [vecesSemana, setVecesSemana] = useState('3');
  const [recordatorio, setRecordatorio] = useState(false), [hora, setHora] = useState('08:00'), [horaPersonalizada, setHoraPersonalizada] = useState(false), [mostrar, setMostrar] = useState(false);
  const [iconoLucide, setIconoLucide] = useState(iconosHabitos[0].id);
  const [subtipoMeta, setSubtipoMeta] = useState<SubtipoMeta>('cantidad');
  // Semilla premium elegida (id de usuario_semillas) en vez de un tono verde
  // gratuito — null significa "usar el tono verde de siempre". Se limpia al
  // cerrar el wizard igual que el resto del estado transitorio.
  const [semillaSeleccionada, setSemillaSeleccionada] = useState<string | null>(null);
  const cliente = useQueryClient();
  const consultaSemillas = useQuery({ enabled: visible, queryKey: CLAVE_SEMILLAS_DISPONIBLES, queryFn: obtenerSemillasDisponibles });
  const consultaPaquetesArbol = useQuery({ enabled: visible, queryKey: ['tienda', 'catalogoArboles'], queryFn: obtenerCatalogoArboles });
  const paquetePorId = useMemo(() => new Map((consultaPaquetesArbol.data ?? []).map((paquete) => [paquete.id, paquete])), [consultaPaquetesArbol.data]);
  // Una tarjeta por paquete premium con semillas libres (no una por semilla
  // individual) — si tenés 3 semillas de Albedo, elegís "Albedo" una vez y se
  // consume la primera semilla libre de ese paquete al guardar.
  const semillasPorPaquete = useMemo(() => {
    const agrupadas = new Map<string, string[]>();
    for (const semilla of consultaSemillas.data ?? []) {
      const lista = agrupadas.get(semilla.paqueteId) ?? [];
      lista.push(semilla.id);
      agrupadas.set(semilla.paqueteId, lista);
    }
    // Ordenadas por familia de color (azul→verde→amarillo→naranja→rojo→
    // rosa→morado, el mismo orden numérico de ColorMaster) — con muchas
    // semillas, una fila sin orden se sentía caótica; así se agrupan
    // visualmente los tonos parecidos en vez de aparecer salteados.
    return [...agrupadas.entries()]
      .map(([paqueteId, semillaIds]) => ({ paquete: paquetePorId.get(paqueteId), semillaIds }))
      .filter((grupo): grupo is { paquete: NonNullable<typeof grupo.paquete>; semillaIds: string[] } => Boolean(grupo.paquete))
      .sort((a, b) => colorMasterMasCercano(a.paquete.masterPackColor) - colorMasterMasCercano(b.paquete.masterPackColor));
  }, [consultaSemillas.data, paquetePorId]);
  const [plantillaId, setPlantillaId] = useState<string | null>(null), [buscarPlantilla, setBuscarPlantilla] = useState('');
  const [preparando, setPreparando] = useState(false), [progresoPreparacion, setProgresoPreparacion] = useState(0), [errorCrear, setErrorCrear] = useState<string | null>(null);
  const [habitoCreado, setHabitoCreado] = useState(false);
  const pulso = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef<ScrollView>(null);
  const [tecladoVisible, setTecladoVisible] = useState(false);
  const [altoFooter, setAltoFooter] = useState(96);
  const layoutTeclado = calcularLayoutTecladoWizard({
    plataforma: Platform.OS as PlataformaTeclado,
    tecladoVisible,
    altoFooter,
    // El pie ya envuelve su propio SafeAreaView (edges bottom): su altura
    // medida por onLayout ya incluye el inset, sumarlo de nuevo lo duplicaría.
    safeAreaBottom: 0,
  });

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setTecladoVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setTecladoVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const desplazarAlFoco = () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 260);

  useEffect(() => {
    if (tecladoVisible && horaPersonalizada) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 160);
    }
  }, [tecladoVisible, horaPersonalizada]);
  // El permiso nativo y el registro del dispositivo no bastan: el despachador
  // de recordatorios (privacidad.reclamar_recordatorios_habitos) también exige
  // que la preferencia global 'habito_recordatorio' esté habilitada — sin este
  // paso el recordatorio del hábito quedaba activado en la UI pero nunca se
  // enviaba ninguna notificación real.
  useEffect(() => {
    if (!recordatorio) return;
    void solicitarPermisoYRegistrar().then((resultado) => {
      // No se vuelve a pedir permiso automáticamente tras 'denegado' — el
      // toggle simplemente se apaga, igual que ante 'no_disponible'/'error'.
      if (resultado.estado !== 'concedido') { setRecordatorio(false); return; }
      void actualizarPreferenciaNotificacion('habito_recordatorio', true).catch(() => undefined);
    }).catch(() => setRecordatorio(false));
  }, [recordatorio]);
  // El Modal no desmonta sus hijos al ocultarse (solo dispara la animación de
  // salida) — sin este reinicio, todo el estado del hábito anterior (título,
  // ícono, horario, recordatorio... e incluso `paso`) seguía vivo la próxima
  // vez que se abría, y el wizard reaparecía en el último paso en vez del
  // primero. Se resetea TODO el estado transitorio a sus valores iniciales,
  // no solo una parte — de ahí el bug: antes solo se limpiaban 7 de 15 campos.
  useEffect(() => {
    if (visible) return;
    setPaso(0);
    setTitulo('');
    setMeta('1');
    setUnidad(t('habitos.crearWizard.meta.times'));
    setTipo('cantidad');
    setFrecuencia('diaria');
    setDiasSemana([1, 2, 3, 4, 5, 6, 7]);
    setVecesSemana('3');
    setRecordatorio(false);
    setHora('08:00');
    setHoraPersonalizada(false);
    setMostrar(false);
    setIconoLucide(iconosHabitos[0].id);
    setSubtipoMeta('cantidad');
    setPreparando(false);
    setProgresoPreparacion(0);
    setHabitoCreado(false);
    setErrorCrear(null);
    setPlantillaId(null);
    setBuscarPlantilla('');
    setSemillaSeleccionada(null);
  }, [visible]);
  // Cuenta 1 en 1, nunca a saltos: sube despacio hasta 96% mientras esperamos
  // el guardado real, y solo sigue de 97 a 100 cuando ya se confirmó creado —
  // así el número nunca "brinca" de golpe a 100 cuando la red responde rápido.
  useEffect(() => {
    if (!preparando) return;
    const tope = habitoCreado ? 100 : 96;
    const intervalo = setInterval(() => setProgresoPreparacion((actual) => Math.min(tope, actual + 1)), 55);
    return () => clearInterval(intervalo);
  }, [preparando, habitoCreado]);
  // Solo cierra el modal una vez que el número YA llegó a 100 en pantalla,
  // nunca antes — aunque el guardado real haya terminado mucho antes.
  useEffect(() => {
    if (!habitoCreado || progresoPreparacion < 100) return;
    const temporizador = setTimeout(onCerrar, 700);
    return () => clearTimeout(temporizador);
  }, [habitoCreado, onCerrar, progresoPreparacion]);
  const semillaInfo = useMemo(() => (consultaSemillas.data ?? []).find((semilla) => semilla.id === semillaSeleccionada), [consultaSemillas.data, semillaSeleccionada]);
  const paqueteSeleccionado = semillaInfo ? paquetePorId.get(semillaInfo.paqueteId) : undefined;
  const paqueteVisual = useMemo(
    () => obtenerPaqueteVisualHabito(paqueteSeleccionado?.id ?? PAQUETE_GRATUITO_DEFECTO),
    [paqueteSeleccionado],
  );
  const arbolPaqueteVisual = useMemo(
    () => obtenerEtapaSietePaquete(paqueteVisual.id),
    [paqueteVisual.id],
  );
  // El tono del paquete elegido se inyecta a todo el wizard vía MasterColorProvider
  // (iconos, glass, chips, tarjeta...). Sin semilla premium queda el tema global
  // de la app (Esmeralda, el verde de siempre, si no eligió otro) — por eso el
  // paso 0 (plantillas) se ve como el resto de la app.
  const tonoGlobal = useTonoMaster();
  const tono = useMemo(() => paqueteSeleccionado ? crearTonoMaster(paqueteSeleccionado.id, paqueteSeleccionado.masterPackColor) : tonoGlobal, [paqueteSeleccionado, tonoGlobal]);
  const color = tono.acento;
  const estiloFondo = useFondoAnimado(tono.fondo);
  const colorMaster = useMemo(() => obtenerColorMasterPaquete(color), [color]);
  const assetsPaquete = useMemo(() => obtenerAssetsPaqueteHabito(paqueteVisual.id, 1), [paqueteVisual.id]);
  const icono = useMemo(() => iconosHabitos.find((item) => item.id === iconoLucide) ?? iconosHabitos[0], [iconoLucide]);
  const etiquetaIcono = (id: string, etiquetaPredeterminada: string) => {
    const clave = id.replace(/-([a-z])/g, (_, letra: string) => letra.toUpperCase());
    return t(`habitos.crearWizard.templateTitles.${clave}`, {
      defaultValue: t(`habitos.crearWizard.iconLabels.${clave}`, { defaultValue: etiquetaPredeterminada }),
    });
  };
  const horaValida = /^([01]\d|2[0-3]):[0-5]\d$/.test(hora);
  const puedeContinuar = plantillaId !== null && titulo.trim().length > 0 && (frecuencia !== 'dias_semana' || diasSemana.length > 0) && (frecuencia !== 'veces_semana' || Number(vecesSemana) > 0) && (!recordatorio || horaValida);
  const plantillasFiltradas = useMemo(() => buscarPlantillasHabitos(buscarPlantilla), [buscarPlantilla, i18n.language]);
  const metas: { id: SubtipoMeta; titulo: string; ejemplo: string; icono: string }[] = [
    { id: 'check', titulo: t('habitos.crearWizard.goal.checkTitle'), ejemplo: t('habitos.crearWizard.goal.checkExample'), icono: 'tareas' },
    { id: 'cantidad', titulo: t('habitos.crearWizard.goal.quantityTitle'), ejemplo: t('habitos.crearWizard.goal.quantityExample'), icono: 'estadistica' },
    { id: 'duracion', titulo: t('habitos.crearWizard.goal.durationTitle'), ejemplo: t('habitos.crearWizard.goal.durationExample'), icono: 'reloj' },
    { id: 'paginas', titulo: t('habitos.crearWizard.goal.pagesTitle'), ejemplo: t('habitos.crearWizard.goal.pagesExample'), icono: 'estudiar' },
  ];
  const placeholderUnidad: Record<SubtipoMeta, string> = { cantidad: t('habitos.crearWizard.goal.quantityUnitPlaceholder'), check: '', duracion: t('habitos.crearWizard.goal.durationUnitPlaceholder'), paginas: t('habitos.crearWizard.goal.pagesUnitPlaceholder') };
  const elegirSubtipo = (nuevo: SubtipoMeta) => {
    setSubtipoMeta(nuevo);
    setTipo(nuevo === 'paginas' ? 'cantidad' : nuevo);
    if (nuevo === 'check') setUnidad('');
    else if (nuevo === 'duracion') { setMeta('10'); setUnidad(t('habitos.crearWizard.goal.durationUnitPlaceholder')); }
    else if (nuevo === 'paginas') { setMeta('20'); setUnidad(t('habitos.crearWizard.goal.pagesTitle').toLowerCase()); }
    else { setMeta('1'); setUnidad(t('habitos.crearWizard.meta.times')); }
    Animated.sequence([Animated.timing(pulso, { toValue: 1.035, duration: 115, useNativeDriver: true }), Animated.spring(pulso, { toValue: 1, friction: 4, useNativeDriver: true })]).start();
  };
  // Elegir una plantilla deja el hábito "listo" en un toque (ícono, título,
  // tipo de meta y cantidad/duración) pero nada queda bloqueado — el resto del
  // wizard sigue siendo editable exactamente igual que antes.
  const elegirPlantilla = (plantilla: PlantillaHabito) => {
    hapticSeguro('seleccion');
    setPlantillaId(plantilla.iconoId);
    setIconoLucide(plantilla.iconoId);
    setTitulo(plantilla.titulo);
    setTipo(plantilla.tipoMeta);
    setMeta(String(plantilla.meta));
    setUnidad(plantilla.tipoMeta === 'check' ? '' : plantilla.unidad ?? (plantilla.tipoMeta === 'duracion' ? t('habitos.crearWizard.goal.durationUnitPlaceholder') : t('habitos.crearWizard.meta.times')));
    setTimeout(() => setPaso(1), 260);
  };
  const elegirPersonalizado = () => { hapticSeguro('seleccion'); setPlantillaId(OTRO_PLANTILLA_ID); setTimeout(() => setPaso(1), 200); };
  const guardar = async () => {
    setErrorCrear(null); setHabitoCreado(false); setPreparando(true); setProgresoPreparacion(1);
    try {
      // Siempre se crea con el paquete verde gratuito (comportamiento de
      // siempre); si se eligió una semilla premium, se asigna aparte justo
      // después — asignar_semilla_habito consume la semilla y sobrescribe el
      // paquete_id del hábito recién creado.
      const resultado = await onCrear({
        titulo, meta: Number(meta) || 1, unidad: tipo === 'check' ? '' : unidad, tipoMeta: tipo, iconoLucide, color: paqueteSeleccionado ? color : TONO_ESMERALDA.acento, frecuencia,
        diasSemana: frecuencia === 'dias_semana' ? diasSemana : null,
        vecesPorSemana: frecuencia === 'veces_semana' ? Math.max(1, Number(vecesSemana) || 1) : null,
        recordatorioActivo: recordatorio, horaRecordatorio: recordatorio ? hora : null, mostrarNombreNotificacion: mostrar,
        paqueteId: PAQUETE_GRATUITO_DEFECTO,
      });
      if (semillaSeleccionada) {
        await asignarSemillaHabito(semillaSeleccionada, resultado.id);
        cliente.invalidateQueries({ queryKey: CLAVE_SEMILLAS_DISPONIBLES });
      }
      setHabitoCreado(true);
    } catch (error) {
      setPreparando(false);
      setErrorCrear(error instanceof Error ? error.message : t('habitos.crearWizard.errors.create'));
    }
  };
  const toggleDia = (dia: number) => setDiasSemana((v) => { const siguiente = v.includes(dia) ? v.filter((x) => x !== dia) : [...v, dia].sort(); setFrecuencia(siguiente.length === 7 ? 'diaria' : 'dias_semana'); return siguiente; });
  const seleccionarDias = (seleccion: number[]) => { setDiasSemana(seleccion); setFrecuencia(seleccion.length === 7 ? 'diaria' : 'dias_semana'); };
  const detalleMeta = tipo === 'check' ? t('habitos.crearWizard.meta.oncePerDay') : `${meta || 1} ${unidad || (tipo === 'duracion' ? t('habitos.crearWizard.goal.durationUnitPlaceholder') : t('habitos.crearWizard.meta.times'))}`;
  const etiquetaMeta = tipo === 'check' ? t('habitos.crearWizard.meta.once') : tipo === 'duracion' ? `${meta || 1} ${t('habitos.crearWizard.meta.minutes')}` : `${meta || 1} ${unidad || t('habitos.crearWizard.meta.times')}`;
  // Modal de RN renderiza en una jerarquía nativa aparte — el SafeAreaProvider
  // de la raíz de la app no la alcanza, así que sin uno propio acá adentro
  // useSafeAreaInsets()/SafeAreaView devuelven valores incorrectos y el CTA
  // del pie queda tapado por la barra inferior de iOS.
  return <Modal animationType="slide" visible={visible} onRequestClose={onCerrar}><SafeAreaProvider><MasterColorProvider tono={tono}><KeyboardAvoidingView behavior={layoutTeclado.behavior} style={{ flex: 1 }}><ReanimatedView.View style={[s.raiz, estiloFondo]}><FondoSelvaWizard color={color}/>
    <View style={s.cab}><Pressable onPress={() => { hapticSeguro('seleccion'); paso ? setPaso(paso - 1) : onCerrar(); }}><ChevronLeft color="#1A1335" size={26} /></Pressable><Texto style={s.indice}>{t('habitos.crearWizard.stepCounter', { current: paso + 1, total: TOTAL_PASOS })}</Texto><Pressable onPress={onCerrar}><Texto style={s.cancelar}>{t('habitos.crearWizard.cancel')}</Texto></Pressable></View><View style={s.linea}>{Array.from({ length: TOTAL_PASOS }, (_, i) => i).map((i) => <PuntoProgreso activo={i <= paso} color={color} key={i} />)}</View>
    <ScrollView contentContainerStyle={[s.cuerpo, { paddingBottom: layoutTeclado.paddingBottomScroll }]} keyboardShouldPersistTaps={layoutTeclado.keyboardShouldPersistTaps} ref={scrollRef} showsVerticalScrollIndicator={false} style={s.contenidoPrincipal}>
      <ReanimatedView.View entering={FadeIn.duration(260).easing(EasingR.out(EasingR.cubic))} key={paso} style={s.pasoContenido}>
      {paso === 0 && <>
        <EncabezadoPaso colorMaster={colorMaster} icono="idea" titulo={t('habitos.crearWizard.templates.title')} subtitulo={t('habitos.crearWizard.templates.subtitle')}/>
        <RecuadroGlass blur style={s.buscadorGlass}><Search color="#7B7494" size={18}/><TextInput keyboardAppearance="light" maxFontSizeMultiplier={TOPE_ESCALA_TEXTO_COMPACTO} onChangeText={setBuscarPlantilla} placeholder={t('habitos.crearWizard.templates.searchPlaceholder')} placeholderTextColor="#9A93A8" style={s.buscadorInput} value={buscarPlantilla}/></RecuadroGlass>
        <View style={s.plantillasGrid}>
          {plantillasFiltradas.map((plantilla) => {
            const iconoPlantilla = iconosHabitos.find((x) => x.id === plantilla.iconoId);
            const activa = plantillaId === plantilla.iconoId;
            return (
              <Rebote
                accessibilityLabel={t('habitos.crearWizard.templates.accessibility', { title: plantilla.titulo })}
                key={plantilla.iconoId}
                estilo={[s.plantillaCard, activa && { borderColor: color, backgroundColor: `${color}12` }]}
                onPress={() => elegirPlantilla(plantilla)}
                overlay={activa && <AnilloSeleccion activo color={color}/>}
              >
              <View style={s.plantillaContenido}>
                <View style={s.plantillaIcono}>{iconoPlantilla ? <MasterIcon name={iconoPlantilla.id} size={50}/> : <Sparkles color={color} size={40}/>}</View>
                <Texto numberOfLines={2} style={s.plantillaTitulo}>{plantilla.titulo}</Texto>
              </View>
              {activa && <View style={[s.plantillaCheck,{backgroundColor:color}]}><Check color="#fff" size={10}/></View>}
              </Rebote>
            );
          })}
          {plantillasFiltradas.length === 0 && <Texto style={s.plantillasVacio}>{t('habitos.crearWizard.templates.empty')}</Texto>}
        </View>
        <Rebote
          accessibilityLabel={t('habitos.crearWizard.templates.customAccessibility')}
          estilo={[s.tarjeta, plantillaId === OTRO_PLANTILLA_ID && { borderColor: color, backgroundColor: `${color}12` }]}
          onPress={elegirPersonalizado}
          overlay={plantillaId === OTRO_PLANTILLA_ID && <AnilloSeleccion activo color={color}/>}
        >
          <View style={s.metaIcono}><Sparkles color={color} size={30}/></View>
          <View style={s.metaTexto}><Texto style={s.metaTitulo}>{t('habitos.crearWizard.templates.customTitle')}</Texto><Texto style={s.metaEjemplo}>{t('habitos.crearWizard.templates.customDescription')}</Texto></View>
          {plantillaId === OTRO_PLANTILLA_ID && <View style={[s.check,{backgroundColor:color}]}><Check color="#fff" size={12}/></View>}
        </Rebote>
      </>}
      {paso === 1 && (
        <MasterAnimation duracion={220}>
          <EncabezadoPaso colorMaster={colorMaster} icono="idea" titulo={t('habitos.crearWizard.identity.title')} subtitulo={t('habitos.crearWizard.identity.subtitle')}/>
          <TextInput autoFocus keyboardAppearance="light" maxFontSizeMultiplier={TOPE_ESCALA_TEXTO_COMPACTO} value={titulo} onChangeText={setTitulo} placeholder={t('habitos.crearWizard.identity.namePlaceholder')} style={s.input}/>
          {semillasPorPaquete.length > 0 && (
            <View>
              <Texto style={s.etiqueta}>{t('habitos.crearWizard.identity.seedsTitle')}</Texto>
              <Texto style={s.sub}>{t('habitos.crearWizard.identity.seedsDescription')}</Texto>
              <ScrollView contentContainerStyle={s.colores} horizontal showsHorizontalScrollIndicator={false}>
                {semillasPorPaquete.map(({ paquete, semillaIds }) => {
                  const activa = semillaIds.includes(semillaSeleccionada ?? '');
                  return (
                    <Rebote
                      accessibilityLabel={t('habitos.crearWizard.identity.seedAccessibility', { name: paquete.nombre, availability: semillaIds.length > 1 ? t('habitos.crearWizard.identity.seedAvailability', { count: semillaIds.length }) : '' })}
                      key={paquete.id}
                      estilo={[s.color, { backgroundColor: paquete.masterPackColor }, activa && s.colorActivo]}
                      onPress={() => setSemillaSeleccionada(activa ? null : semillaIds[0])}
                      overlay={activa && <AnilloSeleccion activo color="#FFFFFF"/>}
                    >
                      <CheckAnimado visible={activa}/>
                    </Rebote>
                  );
                })}
              </ScrollView>
            </View>
          )}
          <MasterGlass style={s.biomaGlass}>
            <Image source={arbolPaqueteVisual} style={s.arbol}/>
            <View><Texto style={[s.biomaTitulo,{color}]}>{paqueteVisual.nombre}</Texto><Texto style={s.sub}>{t('habitos.crearWizard.identity.visualWorld')}</Texto></View>
          </MasterGlass>
          <View>
            <Texto style={s.etiqueta}>{t('habitos.crearWizard.identity.chooseIcon')}</Texto>
            <GridIconosHabito color={color} etiquetaIcono={etiquetaIcono} iconoSeleccionado={iconoLucide} onElegir={setIconoLucide}/>
          </View>
        </MasterAnimation>
      )}
      {paso === 2 && <>
        <EncabezadoPaso colorMaster={colorMaster} icono="metas" titulo={t('habitos.crearWizard.goal.title')} subtitulo={t('habitos.crearWizard.goal.subtitle')}/>
        <View style={s.tarjetasGrid}>
          {metas.map((x) => <Rebote estilo={s.tarjetaGridColumna} key={x.id} onPress={() => elegirSubtipo(x.id)} overlay={subtipoMeta===x.id && <AnilloSeleccion activo color={color}/>}>
            <MasterGlass style={[s.tarjetaCompacta,subtipoMeta===x.id&&{borderColor:color,backgroundColor:`${color}12`}]}>
              <View style={s.metaIconoCompacto}><MasterIcon color={colorMaster} hueDestino={tono.hueIcono} name={x.icono} size={60}/></View>
              <Texto style={s.metaTituloCompacto}>{x.titulo}</Texto>
              <Texto numberOfLines={1} style={s.metaEjemploCompacto}>{x.ejemplo}</Texto>
              {subtipoMeta===x.id&&<View style={[s.plantillaCheck,{backgroundColor:color}]}><Check color="#fff" size={10}/></View>}
            </MasterGlass>
          </Rebote>)}
        </View>
        {tipo !== 'check' && <ReanimatedView.View entering={FadeInDown.duration(240).easing(EasingR.out(EasingR.cubic))} exiting={FadeOut.duration(160)} style={s.campos}><MasterGlass style={{borderRadius:16}}><TextInput keyboardAppearance="light" keyboardType="decimal-pad" maxFontSizeMultiplier={TOPE_ESCALA_TEXTO_COMPACTO} onFocus={desplazarAlFoco} placeholder={PLACEHOLDER_META[subtipoMeta]} value={meta} onChangeText={setMeta} style={s.input}/></MasterGlass><MasterGlass style={{borderRadius:16}}><TextInput keyboardAppearance="light" maxFontSizeMultiplier={TOPE_ESCALA_TEXTO_COMPACTO} onFocus={desplazarAlFoco} placeholder={placeholderUnidad[subtipoMeta]} value={unidad} onChangeText={setUnidad} style={s.input}/></MasterGlass></ReanimatedView.View>}
      </>}
      {paso === 3 && <><EncabezadoPaso colorMaster={colorMaster} icono="calendario" titulo={t('habitos.crearWizard.schedule.title')} subtitulo={t('habitos.crearWizard.schedule.subtitle')}/><Animated.View style={{ borderRadius: 28, overflow: 'hidden', transform:[{scale:pulso}]}}><TarjetaSenderoHabito assets={assetsPaquete} diasProgramados={diasSemana} icono={icono} meta={Number(meta) || 1} metaEtiqueta={etiquetaMeta} titulo={titulo.trim()}/></Animated.View><RecuadroGlass blur style={{borderRadius:22,borderWidth:0,padding:14}}><View style={{alignItems:'center',flexDirection:'row',justifyContent:'space-between'}}><View><Texto style={{color:'#1A1335',fontFamily:'Montserrat-Bold',fontSize:16}}>{t('habitos.crearWizard.schedule.thisWeek')}</Texto><Texto style={s.sub}>{diasSemana.length===7 ? t('habitos.crearWizard.schedule.everyDay') : t('habitos.crearWizard.schedule.selectedDays', { count: diasSemana.length })}</Texto></View><Clock3 color={color} size={24}/></View><View style={{flexDirection:'row',justifyContent:'space-between',marginTop:16}}>{dias.map((x) => <Rebote key={x.id} estilo={[{alignItems:'center',backgroundColor:'#FFFFFF',borderRadius:15,height:58,justifyContent:'center',width:38},diasSemana.includes(x.id)&&{backgroundColor:color}]} onPress={() => toggleDia(x.id)}><Texto style={[{color:'#6F687F',fontFamily:'Montserrat-Bold',fontSize:12},diasSemana.includes(x.id)&&{color:'#fff'}]}>{t(`habitos.crearWizard.schedule.dayLabels.${x.id - 1}`)}</Texto><View style={[{backgroundColor:'rgba(111,104,127,.18)',borderRadius:3,height:5,marginTop:5,width:5},diasSemana.includes(x.id)&&{backgroundColor:'#fff'}]}/></Rebote>)}</View><View style={{flexDirection:'row',gap:8,marginTop:16}}><Rebote estilo={{backgroundColor:'#FFFFFF',borderRadius:12,flex:1,paddingVertical:10}} onPress={() => seleccionarDias([1,2,3,4,5,6,7])}><Texto style={{color:'#1A1335',fontFamily:'Montserrat-Bold',fontSize:12,textAlign:'center'}}>{t('habitos.crearWizard.schedule.everyDay')}</Texto></Rebote><Rebote estilo={{backgroundColor:'#FFFFFF',borderRadius:12,flex:1,paddingVertical:10}} onPress={() => seleccionarDias([1,2,3,4,5])}><Texto style={{color:'#1A1335',fontFamily:'Montserrat-Bold',fontSize:12,textAlign:'center'}}>{t('habitos.crearWizard.schedule.weekdays')}</Texto></Rebote></View></RecuadroGlass></>}
      {paso === 3 && <Image source={assetsPaquete.base} style={{ alignSelf:'center', height:225, marginTop:-22, opacity:0.9, resizeMode:'contain', width:'100%' }} />}
      {paso === 4 && <>
        <EncabezadoPaso colorMaster={colorMaster} icono="reloj" titulo={t('habitos.crearWizard.reminder.title')} subtitulo={t('habitos.crearWizard.reminder.subtitle')}/>
        <RecuadroGlass blur style={{ borderRadius: 24, borderWidth: 0, padding: 16 }}>
          <View style={{ alignItems: 'center', flexDirection: 'row' }}>
            <View style={{ alignItems: 'center', height: 62, justifyContent: 'center', width: 62 }}><Bell size={40} /></View>
            <View style={{ flex: 1, marginLeft: 12 }}><Texto style={{ color: '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 16 }}>{t('habitos.crearWizard.reminder.daily')}</Texto><Texto style={s.sub}>{recordatorio ? t('habitos.crearWizard.reminder.enabledDescription') : t('habitos.crearWizard.reminder.disabledDescription')}</Texto></View>
            <Switch value={recordatorio} onValueChange={(valor) => { hapticSeguro('seleccion'); setRecordatorio(valor); }} />
          </View>
          {recordatorio && <ReanimatedView.View entering={FadeInDown.duration(280).easing(EasingR.out(EasingR.cubic))} style={{ gap: 13, marginTop: 18 }}>
            <Texto style={{ color: '#554E68', fontFamily: 'Montserrat-Bold', fontSize: 13 }}>{t('habitos.crearWizard.reminder.chooseTime')}</Texto>
            <View style={{ flexDirection: 'row', gap: 8 }}>{['08:00', '13:00', '20:00'].map((valor) => <Rebote key={valor} estilo={{ backgroundColor: !horaPersonalizada && hora === valor ? color : '#FFFFFF', borderRadius: 13, flex: 1, paddingVertical: 10 }} onPress={() => { setHora(valor); setHoraPersonalizada(false); }}><Texto style={{ color: !horaPersonalizada && hora === valor ? '#FFFFFF' : '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 12, textAlign: 'center' }}>{valor}</Texto></Rebote>)}</View>
            <Rebote estilo={{ alignItems: 'center', backgroundColor: horaPersonalizada ? `${color}16` : '#FFFFFF', borderRadius: 14, flexDirection: 'row', gap: 9, justifyContent: 'center', paddingVertical: 12 }} onPress={() => { setHoraPersonalizada(true); setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 140); }}><Clock3 color={color} size={17} /><Texto style={{ color: '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 13 }}>{t('habitos.crearWizard.reminder.otherTime')}</Texto></Rebote>
            {horaPersonalizada && <ReanimatedView.View entering={FadeIn.duration(220)}><RecuadroGlass blur style={{ borderRadius: 16, borderWidth: 0, padding: 13 }}><Texto style={{ color: '#554E68', fontFamily: 'Montserrat-Bold', fontSize: 12 }}>{t('habitos.crearWizard.reminder.customTime')}</Texto><TextInput keyboardAppearance="light" keyboardType="numbers-and-punctuation" maxFontSizeMultiplier={TOPE_ESCALA_TEXTO_COMPACTO} maxLength={5} onChangeText={(valor) => setHora(valor)} onFocus={desplazarAlFoco} placeholder={t('habitos.crearWizard.reminder.timePlaceholder')} placeholderTextColor="#9A93A8" value={hora} style={[s.horaInput, !horaValida && { color: '#B64747' }]} /><Texto style={s.sub}>{horaValida ? t('habitos.crearWizard.reminder.validTime') : t('habitos.crearWizard.reminder.invalidTime')}</Texto></RecuadroGlass></ReanimatedView.View>}
            <RecuadroGlass blur style={{ borderRadius: 15, borderWidth: 0, padding: 12 }}>
              <View style={{ alignItems: 'center', flexDirection: 'row' }}><View style={{ flex: 1 }}><Texto style={{ color: '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 13 }}>{t('habitos.crearWizard.reminder.includeName')}</Texto><Texto style={s.sub}>{mostrar ? t('habitos.crearWizard.reminder.notificationWithName', { title: titulo.trim() || t('habitos.crearWizard.reminder.defaultHabitName') }) : t('habitos.crearWizard.reminder.notificationWithoutName')}</Texto></View><Switch value={mostrar} onValueChange={(valor) => { hapticSeguro('seleccion'); setMostrar(valor); }} /></View>
            </RecuadroGlass>
          </ReanimatedView.View>}
        </RecuadroGlass>
      </>}
      {paso === 5 && <><EncabezadoPaso colorMaster={colorMaster} icono="trofeo" titulo={t('habitos.crearWizard.review.title')} subtitulo={t('habitos.crearWizard.review.subtitle')}/><Animated.View style={{ borderRadius: 28, overflow: 'hidden'}}><TarjetaSenderoHabito assets={assetsPaquete} diasProgramados={diasSemana} icono={icono} meta={Number(meta) || 1} metaEtiqueta={etiquetaMeta} titulo={titulo.trim()}/></Animated.View></>}
      {paso === 6 && <><EncabezadoPaso colorMaster={colorMaster} icono="trofeo" titulo={t('habitos.crearWizard.growth.title')} subtitulo={tipo === 'check' ? t('habitos.crearWizard.growth.checkSubtitle') : t('habitos.crearWizard.growth.otherSubtitle')}/><RutaNiveles colorMaster={colorMaster} meta={meta} tipo={tipo} unidad={unidad}/>{errorCrear&&<Texto style={{color:'#B64747',fontFamily:'Montserrat-Bold',fontSize:12,textAlign:'center',marginTop:12}}>{errorCrear}</Texto>}</>}
      </ReanimatedView.View>
    </ScrollView>{paso === 4 && !tecladoVisible && <View pointerEvents="none" style={s.paisajeRecordatorio}><Image source={assetsPaquete.arbolPrincipal} style={s.arbolRecordatorio}/><Image source={assetsPaquete.arbusto} style={s.arbustoRecordatorio} /></View>}<ReanimatedView.View onLayout={(e) => setAltoFooter(e.nativeEvent.layout.height)} style={[s.pie, estiloFondo]}><SafeAreaView edges={['bottom']}><Boton color={color} disabled={!puedeContinuar||guardando||preparando} iconoIzquierda={paso===6?Check:ChevronRight} onPress={() => paso===6?void guardar():setPaso(paso+1)} variante="sendero">{guardando ? t('habitos.crearWizard.actions.creating') : paso === 6 ? t('habitos.crearWizard.actions.createHabit') : t('habitos.crearWizard.continue')}</Boton></SafeAreaView></ReanimatedView.View>{preparando&&<PreparandoHabito color={color} fondo={tono.fondo} progreso={progresoPreparacion} titulo={titulo.trim()} />}
  </ReanimatedView.View></KeyboardAvoidingView></MasterColorProvider></SafeAreaProvider></Modal>;
}

const crearEstilosS=(esc: EscalaMaster) => StyleSheet.create({raiz:{flex:1,backgroundColor:esc.lima.l98},fondoDecorativo:{bottom:0,left:0,position:'absolute',right:0,top:0},cab:{alignItems:'center',zIndex:1,flexDirection:'row',justifyContent:'space-between',padding:22,paddingTop:55},indice:{color:'#7B7494',fontFamily:'Montserrat-Bold'},cancelar:{color:'#7C3AED',fontFamily:'Montserrat-Bold'},linea:{flexDirection:'row',zIndex:1,gap:5,paddingHorizontal:22},punto:{backgroundColor:'#DDD6E9',borderRadius:4,flex:1,height:5},contenidoPrincipal:{flex:1,zIndex:1},cuerpo:{padding:24,paddingTop:38},pasoContenido:{gap:14},encabezadoPaso:{alignItems:'center',flexDirection:'row',gap:11},encabezadoTexto:{flex:1,paddingTop:1},titulo:{color:'#1A1335',fontFamily:'Montserrat-Bold',fontSize:28,lineHeight:34},sub:{color:'#7B7494',fontSize:13,lineHeight:19},etiqueta:{color:'#554E68',fontFamily:'Montserrat-Bold',fontSize:13,marginTop:4},input:{backgroundColor:'#fff',borderColor:'#E4DDF0',borderRadius:16,borderWidth:1,color:'#1A1335',fontSize:16,padding:15},horaInput:{backgroundColor:'#FFFFFF',borderRadius:12,color:'#1A1335',fontFamily:'Montserrat-Bold',fontSize:22,letterSpacing:1,marginTop:8,paddingHorizontal:13,paddingVertical:10},colores:{flexDirection:'row',gap:10,paddingVertical:4},color:{alignItems:'center',borderRadius:999,height:44,justifyContent:'center',width:44},colorActivo:{borderColor:'#1A1335',borderWidth:3},biomaGlass:{alignItems:'center',flexDirection:'row',gap:10,paddingHorizontal:11,paddingVertical:11},arbol:{height:56,resizeMode:'contain',width:48},biomaTitulo:{fontFamily:'Montserrat-Bold',fontSize:14},iconosScroll:{maxHeight:300},iconos:{flexDirection:'row',flexWrap:'wrap',gap:7,paddingBottom:4},iconoOpcion:{alignItems:'center',backgroundColor:'#FFFFFFB8',borderColor:'#E4DDF0',borderRadius:12,borderWidth:1,height:58,justifyContent:'center',width:'17.5%'},iconoImagen:{height:38,resizeMode:'contain',width:38},preview:{backgroundColor:'#FFFFFFB8',borderRadius:20,borderWidth:1,minHeight:126,overflow:'hidden',padding:13},aura:{borderRadius:80,height:150,position:'absolute',right:-45,top:-56,width:150},previewArbol:{bottom:9,height:100,opacity:.14,position:'absolute',resizeMode:'contain',right:-5,width:105},previewFila:{alignItems:'center',flexDirection:'row',flex:1},previewIcono:{alignItems:'center',borderRadius:18,height:66,justifyContent:'center',width:66},previewImagen:{height:53,resizeMode:'contain',width:53},previewTexto:{flex:1,marginLeft:11},previewTitulo:{color:'#1A1335',fontFamily:'Montserrat-Bold',fontSize:17},pildora:{alignItems:'center',alignSelf:'flex-start',borderRadius:99,flexDirection:'row',gap:4,marginTop:5,paddingHorizontal:8,paddingVertical:4},previewMeta:{fontFamily:'Montserrat-Bold',fontSize: 12},separador:{color:'#8D869D',fontSize: 12},frecuencia:{color:'#6F687F',fontFamily:'Montserrat-Bold',fontSize: 12},estado:{alignItems:'center',flexDirection:'row',gap:5,marginTop:8},estadoPunto:{borderRadius:4,height:8,width:8},estadoTexto:{color:'#6F687F',fontFamily:'Montserrat-Bold',fontSize: 12},progreso:{backgroundColor:'#E9E4F0',borderRadius:9,height:5,marginTop:11,overflow:'hidden'},progresoInicio:{borderRadius:9,height:'100%',width:'9%'},tarjeta:{alignItems:'center',backgroundColor:'#FFFFFFB8',borderColor:'#E4DDF0',borderRadius:18,borderWidth:1,flexDirection:'row',minHeight:82,padding:11,position:'relative'},metaIcono:{alignItems:'center',height:66,justifyContent:'center',width:66},metaTexto:{flex:1,marginLeft:10},metaTitulo:{color:'#1A1335',fontFamily:'Montserrat-Bold',fontSize:16},metaEjemplo:{color:'#7B7494',fontSize:12,marginTop:2},check:{alignItems:'center',borderRadius:11,height:22,justifyContent:'center',position:'absolute',right:12,top:12,width:22},campos:{gap:10},opciones:{gap:10},opcion:{alignItems:'center',backgroundColor:'#fff',borderColor:'#E4DDF0',borderRadius:16,borderWidth:1,flexDirection:'row',gap:10,padding:15},opcionTexto:{color:'#1A1335',flex:1,fontFamily:'Montserrat-Bold',fontSize:14},dias:{flexDirection:'row',justifyContent:'space-between'},dia:{alignItems:'center',backgroundColor:'#fff',borderColor:'#E4DDF0',borderRadius:18,borderWidth:1,height:36,justifyContent:'center',width:36},diaTexto:{color:'#554E68',fontFamily:'Montserrat-Bold',fontSize:12},fila:{alignItems:'center',backgroundColor:'#fff',borderRadius:16,flexDirection:'row',gap:10,padding:15},iconoFinal:{alignItems:'center',alignSelf:'flex-start',borderRadius:24,height:92,justifyContent:'center',width:92},finalImagen:{height:74,resizeMode:'contain',width:74},resumen:{backgroundColor:'#FFFFFFC8',borderRadius:24,borderWidth:1,gap:13,padding:16},resumenHero:{alignItems:'center',flexDirection:'row',gap:13},resumenHeroTexto:{flex:1},resumenDivisor:{backgroundColor:'#E4DDF0',height:1},resumenFila:{alignItems:'center',flexDirection:'row',gap:11},resumenFilaTexto:{flex:1},resumenEtiqueta:{color:'#7B7494',fontFamily:'Montserrat-Medium',fontSize: 12},resumenValor:{color:'#1A1335',fontFamily:'MontserratAlternates-Bold',fontSize:13,marginTop:1},resumenTitulo:{color:'#1A1335',fontFamily:'MontserratAlternates-Bold',fontSize:20},paisajeRecordatorio:{bottom:112,height:205,left:0,position:'absolute',right:0,zIndex:0},arbolRecordatorio:{bottom:0,height:205,left:0,position:'absolute',resizeMode:'contain',width:185},arbustoRecordatorio:{bottom:48,height:145,position:'absolute',resizeMode:'contain',right:2,width:145},rutaNiveles:{gap:9},nivelRuta:{alignItems:'center',backgroundColor:'#FFFFFFA8',borderRadius:18,borderWidth:0,flexDirection:'row',minHeight:68,paddingHorizontal:12,paddingVertical:9},insigniaNivel:{alignItems:'center',height:50,justifyContent:'center',width:54},nivelRutaTexto:{flex:1,marginLeft:7},nivelRutaTitulo:{color:esc.jade.l34,fontFamily:'MontserratAlternates-Bold',fontSize:15},nivelRutaDetalle:{color:esc.musgo.l49,fontFamily:'Montserrat-Medium',fontSize: 12,marginTop:2},nivelActual:{backgroundColor:esc.lima.l94,borderRadius:99,color:esc.jade.l38,fontFamily:'MontserratAlternates-Bold',fontSize: 12,paddingHorizontal:9,paddingVertical:5},gemasNivel:{alignItems:'center',flexDirection:'row',gap:3},gemaNivelIcono:{height:20,resizeMode:'contain',width:20},gemasNivelTexto:{color:'#6D28D9',fontFamily:'MontserratAlternates-Bold',fontSize:13},pie:{backgroundColor:esc.lima.l98,borderTopColor:'#E4DDF0',borderTopWidth:1,paddingHorizontal:22,paddingTop:22,zIndex:2},
buscadorGlass:{alignItems:'center',backgroundColor:'#FFFFFFB8',borderColor:'#E4DDF0',borderRadius:16,borderWidth:1,flexDirection:'row',gap:9,paddingHorizontal:14,paddingVertical:12},
buscadorInput:{color:'#1A1335',flex:1,fontSize:14,padding:0},
plantillasGrid:{flexDirection:'row',flexWrap:'wrap',gap:8},
plantillaCard:{backgroundColor:'#FFFFFFB8',borderColor:'#E4DDF0',borderRadius:16,borderWidth:1,justifyContent:'center',minHeight:112,padding:10,position:'relative',width:'31%'},
plantillaContenido:{alignItems:'center',width:'100%'},
plantillaIcono:{alignItems:'center',height:56,justifyContent:'center',marginBottom:6,width:56},
plantillaImagen:{height:50,resizeMode:'contain',width:50},
plantillaTitulo:{color:'#1A1335',fontFamily:'Montserrat-Bold',fontSize: 12,lineHeight: 16,textAlign:'center'},
plantillaCheck:{alignItems:'center',borderRadius:9,height:18,justifyContent:'center',position:'absolute',right:6,top:6,width:18},
plantillasVacio:{color:'#7B7494',fontSize:12,paddingVertical:14,textAlign:'center',width:'100%'},
tarjetasGrid:{flexDirection:'row',flexWrap:'wrap',gap:10},
tarjetaGridColumna:{width:'47%'},
tarjetaCompacta:{alignItems:'center',justifyContent:'center',minHeight:150,padding:12,position:'relative'},
metaIconoCompacto:{alignItems:'center',height:80,justifyContent:'center',marginBottom:6,width:80},
metaTituloCompacto:{color:'#1A1335',fontFamily:'Montserrat-Bold',fontSize:14,textAlign:'center'},
metaEjemploCompacto:{color:'#7B7494',fontSize: 12,marginTop:2,textAlign:'center'},
});

const estilosPorEscalaS = new WeakMap<EscalaMaster, ReturnType<typeof crearEstilosS>>();

function useEstilosS() {
  const esc = useEscala();
  let valor = estilosPorEscalaS.get(esc);
  if (!valor) {
    valor = crearEstilosS(esc);
    estilosPorEscalaS.set(esc, valor);
  }
  return valor;
}
