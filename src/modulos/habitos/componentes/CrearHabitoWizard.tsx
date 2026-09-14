import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleProp, StyleSheet, Switch, TextInput, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ReanimatedView, { Easing as EasingR, FadeIn, FadeInDown, FadeOut, interpolate, interpolateColor, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { Check, ChevronLeft, ChevronRight, Clock3, Search, Sparkles } from 'lucide-react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Boton, MasterAnimation, MasterGlass, MasterIcon, RecuadroGlass, Texto } from '../../../diseno';
import { MasterChanger } from '../../../diseno/componentes/MasterChanger';
import { CrearHabitoInput } from '../habitos.servicio';
import type { TipoMetaHabito } from '../tipos';
import { ARBUSTO_SELVA_BASE, DIAS_REQUERIDOS_POR_NIVEL, NIVEL_MAXIMO_TONO, factorTono, iconosHabitos, obtenerAssetsSelvaPorTono, tonoVerdeNivel, type AssetsSelvaTono } from '../iconosHabitos';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { solicitarPermisoYRegistrar } from '../../../nucleo/notificaciones/oneSignal';
import { estadoPreparacionHabito } from '../creacionPremium';
import { preparacionEstilos as p } from '../creacionPremium.estilos';
import { buscarPlantillasHabitos, type PlantillaHabito } from '../plantillasHabitos';
import { TarjetaSenderoHabito } from './TarjetaSenderoHabito';

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
  const progreso = useSharedValue(activo ? 1 : 0);
  useEffect(() => { progreso.value = withSpring(activo ? 1 : 0, { damping: 14, stiffness: 180 }); }, [activo, progreso]);
  const estilo = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progreso.value, [0, 1], ['#DDD6E9', color]),
    transform: [{ scaleY: 1 + progreso.value * 0.5 }],
  }));
  return <ReanimatedView.View style={[s.punto, estilo]} />;
}

const BIOMA_TITULO = 'Selva viva';
const TONOS = Array.from({ length: NIVEL_MAXIMO_TONO }, (_, indice) => indice + 1);

function ArbustoSelva({ tono, ancho, alto, estilo }: { tono: number; ancho: number; alto: number; estilo?: StyleProp<ViewStyle> }) {
  return <View style={estilo}><MasterChanger ancho={ancho} alto={alto} colorDestino={2} fuente={ARBUSTO_SELVA_BASE} oscurecido={factorTono(tono)} /></View>;
}

const dias = [{ id: 1, etiqueta: 'L' }, { id: 2, etiqueta: 'M' }, { id: 3, etiqueta: 'X' }, { id: 4, etiqueta: 'J' }, { id: 5, etiqueta: 'V' }, { id: 6, etiqueta: 'S' }, { id: 7, etiqueta: 'D' }];
// "Páginas" es a propósito el mismo tipoMeta que "Cantidad" (solo cambia el
// icono/unidad por defecto) — nada más completa el grid 2x2, por eso se
// trackea aparte con subtipoMeta en vez de agregar un tipoMeta real nuevo.
type SubtipoMeta = TipoMetaHabito | 'paginas';
const metas: { id: SubtipoMeta; titulo: string; ejemplo: string; icono: string }[] = [
  { id: 'check', titulo: 'Solo cumplir', ejemplo: 'Hazlo una vez', icono: 'tareas' },
  { id: 'cantidad', titulo: 'Cantidad', ejemplo: 'Ej. 8 vasos', icono: 'estadistica' },
  { id: 'duracion', titulo: 'Duración', ejemplo: 'Ej. 10 minutos', icono: 'reloj' },
  { id: 'paginas', titulo: 'Páginas', ejemplo: 'Ej. 20 páginas', icono: 'estudiar' },
];
// Decoración de los inputs de meta/unidad — un ejemplo vivo según el subtipo
// elegido, en vez de un placeholder genérico igual para todos.
const PLACEHOLDER_META: Record<SubtipoMeta, string> = { cantidad: '8', check: '', duracion: '20', paginas: '20' };
const PLACEHOLDER_UNIDAD: Record<SubtipoMeta, string> = { cantidad: 'vasos, veces…', check: '', duracion: 'minutos', paginas: 'páginas' };
const previewCompacta = { minHeight: 96, padding: 8 };
const iconoPreviewCompacto = { height: 44, width: 44 };
const metaPreviewCompacta = { fontSize: 10 };
const Bell = ({ size = 28 }: { color?: string; size?: number }) => <Image source={require('../../../../assets/icons/hoy/notificaciones.png')} style={{ height: size + 18, resizeMode: 'contain', width: size + 18 }} />;

function EncabezadoPaso({ icono, subtitulo, titulo }: { icono: string; subtitulo: string; titulo: string }) {
  return <View style={s.encabezadoPaso}><MasterIcon color={2} name={icono} size={52} /><View style={s.encabezadoTexto}><Texto style={s.titulo}>{titulo}</Texto><Texto style={s.sub}>{subtitulo}</Texto></View></View>;
}

function AnilloMeta({ color, meta, unidad }: { color: string; meta: string; unidad: string }) {
  const radio = 42, circunferencia = 2 * Math.PI * radio;
  return <View style={{ alignItems: 'center', height: 112, justifyContent: 'center', width: 112 }}><Svg height={112} style={{ position: 'absolute' }} width={112}><Circle cx="56" cy="56" fill="none" r={radio} stroke={`${color}24`} strokeWidth={8}/><Circle cx="56" cy="56" fill="none" r={radio} rotation="-90" stroke={color} strokeDasharray={`${circunferencia} ${circunferencia}`} strokeDashoffset={circunferencia * .94} strokeLinecap="round" strokeWidth={8} origin="56,56"/></Svg><Texto style={{ color: '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 19 }}>0/{meta}</Texto><Texto style={{ color: '#7B7494', fontSize: 9 }}>{unidad}</Texto></View>;
}

function FondoSelvaWizard({ color }: { color: string }) {
  return <View pointerEvents="none" style={s.fondoDecorativo}><Svg height="100%" viewBox="0 0 390 844" width="100%"><Circle cx="370" cy="22" fill={`${color}0B`} r="142"/><Circle cx="-36" cy="694" fill={`${color}0C`} r="172"/><Path d="M326 8C270 21 249 81 292 120c49-21 70-75 34-112Z" fill={`${color}12`}/><Path d="M389 118c-59 4-91 49-74 97 53-6 82-48 74-97Z" fill={`${color}0D`}/><Path d="M-8 625c55 2 91 42 77 91-51-4-84-43-77-91Z" fill={`${color}12`}/><Path d="M69 785c-56-17-93 13-99 64 52 14 91-15 99-64Z" fill={`${color}0D`}/><Path d="M282 782c17-48 57-68 99-55-12 46-52 67-99 55Z" fill={`${color}0B`}/></Svg></View>;
}

const MULTIPLICADORES_NIVEL = [1, 1.2, 1.5, 1.8, 2.2, 2.6, 3];

function RutaNiveles({ meta, tipo, unidad }: { meta: string; tipo: CrearHabitoInput['tipoMeta']; unidad: string }) {
  const base = Math.max(1, Number(meta) || 1);
  const unidadFinal = tipo === 'duracion' ? 'min' : unidad || 'veces';
  return <View style={s.rutaNiveles}>{Array.from({ length: 7 }, (_, indice) => {
    const nivel = indice + 1;
    const metaNivel = Math.round(base * MULTIPLICADORES_NIVEL[indice]);
    const gemas = nivel * 5;
    const consistencia = nivel === 1 ? 'Empieza tu constancia' : `${DIAS_REQUERIDOS_POR_NIVEL[nivel]} días de constancia`;
    const detalle = tipo === 'duracion' ? `${metaNivel} ${unidadFinal} por día` : tipo === 'check' ? consistencia : nivel === 1 ? `${base} ${unidadFinal} por día` : `${base} ${unidadFinal} por día · ${consistencia}`;
    return <ReanimatedView.View entering={FadeInDown.delay(indice * 70).duration(360).easing(EasingR.out(EasingR.cubic))} key={nivel}><RecuadroGlass blur style={s.nivelRuta}><View style={s.insigniaNivel}><MasterIcon color={2} name={`nivel${nivel}`} oscurecido={1 - indice * .05} size={48}/></View><View style={s.nivelRutaTexto}><Texto style={s.nivelRutaTitulo}>Nivel {nivel}</Texto><Texto style={s.nivelRutaDetalle}>{detalle}</Texto></View>{nivel === 1 ? <Texto style={s.nivelActual}>Actual</Texto> : <View style={s.gemasNivel}><Image source={require('../../../../assets/icons/hoy/gemas.png')} style={s.gemaNivelIcono}/><Texto style={s.gemasNivelTexto}>+{gemas}</Texto></View>}</RecuadroGlass></ReanimatedView.View>;
  })}</View>;
}

// Anillo de progreso 100% SVG (sin imágenes) — el número sube 1 en 1 sin
// saltos (ver el intervalo en guardar()/useEffect de progresoPreparacion), y
// el trazo se rellena exactamente a la par. Sin loops infinitos: solo se
// redibuja cuando progreso cambia, así que en reposo no consume nada.
function AnilloProgresoCarga({ color, progreso, tamano = 136 }: { color: string; progreso: number; tamano?: number }) {
  const radio = (tamano - 18) / 2, centro = tamano / 2, circunferencia = 2 * Math.PI * radio;
  const offset = circunferencia * (1 - Math.min(100, Math.max(0, progreso)) / 100);
  return (
    <View style={{ alignItems: 'center', height: tamano, justifyContent: 'center', width: tamano }}>
      <Svg height={tamano} style={{ position: 'absolute' }} width={tamano}>
        <Circle cx={centro} cy={centro} fill="none" r={radio} stroke={`${color}22`} strokeWidth={10} />
        <Circle cx={centro} cy={centro} fill="none" origin={`${centro},${centro}`} r={radio} rotation="-90" stroke={color} strokeDasharray={`${circunferencia} ${circunferencia}`} strokeDashoffset={offset} strokeLinecap="round" strokeWidth={10} />
      </Svg>
      <Texto style={{ color: '#1A1335', fontFamily: 'MontserratAlternates-Bold', fontSize: 30 }}>{progreso}%</Texto>
    </View>
  );
}

type EtapaCrecimiento = 1 | 2 | 3;
function etapaCrecimientoPorProgreso(progreso: number): EtapaCrecimiento {
  if (progreso >= 70) return 3;
  if (progreso >= 35) return 2;
  return 1;
}
const ESCALA_ARBOL_POR_ETAPA: Record<EtapaCrecimiento, number> = { 1: 0.5, 2: 0.78, 3: 1 };

// Reemplaza la escena anterior (3 imágenes animándose siempre + 14 partículas
// en loop infinito, la fuente real del "se traba" que reportaron) por 3 fotos
// fijas del mismo árbol real del tono elegido — solo una montada a la vez, con
// un fundido simple al cambiar de etapa. Nada corre en reposo.
function EscenaEtapa({ assets, etapa }: { assets: AssetsSelvaTono; etapa: EtapaCrecimiento }) {
  return (
    <ReanimatedView.View entering={FadeIn.duration(420)} exiting={FadeOut.duration(260)} key={etapa} pointerEvents="none" style={p.escena}>
      <Image source={assets.base} style={p.base} />
      <Image source={assets.arbolPrincipal} style={[p.arbolPrincipal, { transform: [{ scale: ESCALA_ARBOL_POR_ETAPA[etapa] }] }]} />
      {etapa >= 2 && <Image source={assets.arbolSecundario} style={p.arbolSecundario} />}
      {etapa >= 3 && <Image source={assets.flor} style={p.flor} />}
    </ReanimatedView.View>
  );
}

function PreparandoHabito({ color, tono, progreso, titulo }: { color: string; tono: number; progreso: number; titulo: string }) {
  const estado = estadoPreparacionHabito(progreso);
  const assetsSelva = useMemo(() => obtenerAssetsSelvaPorTono(tono), [tono]);
  const etapa = etapaCrecimientoPorProgreso(progreso);

  return <View style={p.raiz}>
    <FondoSelvaWizard color={color} />
    <View style={p.contenido}>
      <View style={[p.orbeGlow, { backgroundColor: `${color}18` }]} />
      <AnilloProgresoCarga color={color} progreso={progreso} />
      <Texto style={[p.titulo, { color }]}>{estado.mensaje}</Texto>
      <Texto style={p.sub}>Estamos dejando listo {titulo || 'tu hábito'}.</Texto>
    </View>
    <EscenaEtapa assets={assetsSelva} etapa={etapa} />
  </View>;
}

export function CrearHabitoWizard({ visible, guardando, onCerrar, onCrear }: { visible: boolean; guardando: boolean; onCerrar: () => void; onCrear: (input: CrearHabitoInput) => Promise<void> }) {
  const [paso, setPaso] = useState(0), [titulo, setTitulo] = useState(''), [meta, setMeta] = useState('1'), [unidad, setUnidad] = useState('veces');
  const [tipo, setTipo] = useState<CrearHabitoInput['tipoMeta']>('cantidad'), [frecuencia, setFrecuencia] = useState<CrearHabitoInput['frecuencia']>('diaria');
  const [diasSemana, setDiasSemana] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]), [vecesSemana, setVecesSemana] = useState('3');
  const [recordatorio, setRecordatorio] = useState(false), [hora, setHora] = useState('08:00'), [horaPersonalizada, setHoraPersonalizada] = useState(false), [mostrar, setMostrar] = useState(false);
  const [tono, setTono] = useState(1), [iconoLucide, setIconoLucide] = useState(iconosHabitos[0].id);
  const [plantillaId, setPlantillaId] = useState<string | null>(null), [buscarPlantilla, setBuscarPlantilla] = useState('');
  const [preparando, setPreparando] = useState(false), [progresoPreparacion, setProgresoPreparacion] = useState(0), [errorCrear, setErrorCrear] = useState<string | null>(null);
  const [habitoCreado, setHabitoCreado] = useState(false);
  const pulso = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef<ScrollView>(null);
  const desplazarAlFoco = () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  useEffect(() => { if (!recordatorio) return; void solicitarPermisoYRegistrar().then((concedido) => { if (!concedido) setRecordatorio(false); }).catch(() => setRecordatorio(false)); }, [recordatorio]);
  useEffect(() => { if (visible) return; setPreparando(false); setProgresoPreparacion(0); setHabitoCreado(false); setErrorCrear(null); setPlantillaId(null); setBuscarPlantilla(''); }, [visible]);
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
  const color = useMemo(() => tonoVerdeNivel(tono), [tono]);
  const assetsSelva: AssetsSelvaTono = useMemo(() => obtenerAssetsSelvaPorTono(tono), [tono]);
  const icono = useMemo(() => iconosHabitos.find((item) => item.id === iconoLucide) ?? iconosHabitos[0], [iconoLucide]);
  const horaValida = /^([01]\d|2[0-3]):[0-5]\d$/.test(hora);
  const puedeContinuar = plantillaId !== null && titulo.trim().length > 0 && (frecuencia !== 'dias_semana' || diasSemana.length > 0) && (frecuencia !== 'veces_semana' || Number(vecesSemana) > 0) && (!recordatorio || horaValida);
  const plantillasFiltradas = useMemo(() => buscarPlantillasHabitos(buscarPlantilla), [buscarPlantilla]);
  const [subtipoMeta, setSubtipoMeta] = useState<SubtipoMeta>('cantidad');
  const elegirSubtipo = (nuevo: SubtipoMeta) => {
    setSubtipoMeta(nuevo);
    setTipo(nuevo === 'paginas' ? 'cantidad' : nuevo);
    if (nuevo === 'check') setUnidad('');
    else if (nuevo === 'duracion') { setMeta('10'); setUnidad('minutos'); }
    else if (nuevo === 'paginas') { setMeta('20'); setUnidad('páginas'); }
    else { setMeta('1'); setUnidad('veces'); }
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
    setUnidad(plantilla.tipoMeta === 'check' ? '' : plantilla.unidad ?? (plantilla.tipoMeta === 'duracion' ? 'minutos' : 'veces'));
    setTimeout(() => setPaso(1), 260);
  };
  const elegirPersonalizado = () => { hapticSeguro('seleccion'); setPlantillaId(OTRO_PLANTILLA_ID); setTimeout(() => setPaso(1), 200); };
  const guardar = async () => { setErrorCrear(null); setHabitoCreado(false); setPreparando(true); setProgresoPreparacion(1); try { await onCrear({ titulo, meta: Number(meta) || 1, unidad: tipo === 'check' ? '' : unidad, tipoMeta: tipo, iconoLucide, color, frecuencia, diasSemana: frecuencia === 'dias_semana' ? diasSemana : null, vecesPorSemana: frecuencia === 'veces_semana' ? Math.max(1, Number(vecesSemana) || 1) : null, recordatorioActivo: recordatorio, horaRecordatorio: recordatorio ? hora : null, mostrarNombreNotificacion: mostrar }); setHabitoCreado(true); } catch (error) { setPreparando(false); setErrorCrear(error instanceof Error ? error.message : 'No pudimos crear tu hábito. Inténtalo de nuevo.'); } };
  const toggleDia = (dia: number) => setDiasSemana((v) => { const siguiente = v.includes(dia) ? v.filter((x) => x !== dia) : [...v, dia].sort(); setFrecuencia(siguiente.length === 7 ? 'diaria' : 'dias_semana'); return siguiente; });
  const seleccionarDias = (seleccion: number[]) => { setDiasSemana(seleccion); setFrecuencia(seleccion.length === 7 ? 'diaria' : 'dias_semana'); };
  const detalleMeta = tipo === 'check' ? 'Una vez al día' : `${meta || 1} ${unidad || (tipo === 'duracion' ? 'minutos' : 'veces')}`;
  const etiquetaMeta = tipo === 'check' ? '1 vez' : tipo === 'duracion' ? `${meta || 1} min` : `${meta || 1} ${unidad || 'veces'}`;
  return <Modal animationType="slide" visible={visible} onRequestClose={onCerrar}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}><View style={s.raiz}><FondoSelvaWizard color={color}/>
    <View style={s.cab}><Pressable onPress={() => { hapticSeguro('seleccion'); paso ? setPaso(paso - 1) : onCerrar(); }}><ChevronLeft color="#1A1335" size={26} /></Pressable><Texto style={s.indice}>{paso + 1} de {TOTAL_PASOS}</Texto><Pressable onPress={onCerrar}><Texto style={s.cancelar}>Cancelar</Texto></Pressable></View><View style={s.linea}>{Array.from({ length: TOTAL_PASOS }, (_, i) => i).map((i) => <PuntoProgreso activo={i <= paso} color={color} key={i} />)}</View>
    <ScrollView contentContainerStyle={s.cuerpo} ref={scrollRef} showsVerticalScrollIndicator={false} style={s.contenidoPrincipal}>
      <ReanimatedView.View entering={FadeIn.duration(260).easing(EasingR.out(EasingR.cubic))} key={paso} style={s.pasoContenido}>
      {paso === 0 && <>
        <EncabezadoPaso icono="idea" titulo="¿Qué quieres construir?" subtitulo="Elige una plantilla y lo dejamos listo — puedes ajustar todo después."/>
        <RecuadroGlass blur style={s.buscadorGlass}><Search color="#7B7494" size={18}/><TextInput onChangeText={setBuscarPlantilla} placeholder="Buscar un hábito… ej. meditar, correr, agua" placeholderTextColor="#9A93A8" style={s.buscadorInput} value={buscarPlantilla}/></RecuadroGlass>
        <View style={s.plantillasGrid}>
          {plantillasFiltradas.map((plantilla) => {
            const iconoPlantilla = iconosHabitos.find((x) => x.id === plantilla.iconoId);
            const activa = plantillaId === plantilla.iconoId;
            return <Rebote accessibilityLabel={`Plantilla ${plantilla.titulo}`} key={plantilla.iconoId} estilo={[s.plantillaCard, activa && { borderColor: color, backgroundColor: `${color}12` }]} onPress={() => elegirPlantilla(plantilla)} overlay={activa && <AnilloSeleccion activo color={color}/>}>
              <View style={s.plantillaContenido}>
                <View style={s.plantillaIcono}>{iconoPlantilla ? <Image source={iconoPlantilla.fuente} style={s.plantillaImagen}/> : <Sparkles color={color} size={40}/>}</View>
                <Texto numberOfLines={2} style={s.plantillaTitulo}>{plantilla.titulo}</Texto>
              </View>
              {activa && <View style={[s.plantillaCheck,{backgroundColor:color}]}><Check color="#fff" size={10}/></View>}
            </Rebote>;
          })}
          {plantillasFiltradas.length === 0 && <Texto style={s.plantillasVacio}>No encontramos nada con eso — prueba con "Personalizado" abajo.</Texto>}
        </View>
        <Rebote accessibilityLabel="Hábito personalizado" estilo={[s.tarjeta, plantillaId === OTRO_PLANTILLA_ID && { borderColor: color, backgroundColor: `${color}12` }]} onPress={elegirPersonalizado} overlay={plantillaId === OTRO_PLANTILLA_ID && <AnilloSeleccion activo color={color}/>}>
          <View style={s.metaIcono}><Sparkles color={color} size={30}/></View>
          <View style={s.metaTexto}><Texto style={s.metaTitulo}>Personalizado</Texto><Texto style={s.metaEjemplo}>Ninguna plantilla me queda — quiero armarlo yo mismo.</Texto></View>
          {plantillaId === OTRO_PLANTILLA_ID && <View style={[s.check,{backgroundColor:color}]}><Check color="#fff" size={12}/></View>}
        </Rebote>
      </>}
      {paso === 1 && (
        <MasterAnimation duracion={220}>
          <EncabezadoPaso icono="idea" titulo="¿Qué hábito quieres construir?" subtitulo="Dale una identidad que te dé ganas de verlo cada día."/>
          <TextInput autoFocus value={titulo} onChangeText={setTitulo} placeholder="Ej. Meditar" style={s.input}/>
          <View>
            <Texto style={s.etiqueta}>Tono de tu selva</Texto>
            <View style={s.colores}>{TONOS.map((t) => <Rebote key={t} estilo={[s.color,{backgroundColor:tonoVerdeNivel(t)},tono===t&&s.colorActivo]} onPress={() => setTono(t)} overlay={tono===t && <AnilloSeleccion activo color="#FFFFFF"/>}><CheckAnimado visible={tono===t}/></Rebote>)}</View>
          </View>
          <MasterGlass style={s.biomaGlass}>
            <Image source={assetsSelva.arbolPrincipal} style={s.arbol}/>
            <View><Texto style={[s.biomaTitulo,{color}]}>{BIOMA_TITULO}</Texto><Texto style={s.sub}>Este será el mundo visual de tu hábito.</Texto></View>
          </MasterGlass>
          <View>
            <Texto style={s.etiqueta}>Elige un icono</Texto>
            <ScrollView nestedScrollEnabled style={s.iconosScroll} contentContainerStyle={s.iconos} showsVerticalScrollIndicator={false}>
              {ICONOS_SELECCIONABLES.map((x) => <Rebote accessibilityLabel={`Icono ${x.etiqueta}`} key={x.id} estilo={[s.iconoOpcion,iconoLucide===x.id&&{borderColor:color,backgroundColor:`${color}12`}]} onPress={() => setIconoLucide(x.id)} overlay={iconoLucide===x.id && <AnilloSeleccion activo color={color}/>}><Image source={x.fuente} style={s.iconoImagen}/></Rebote>)}
            </ScrollView>
          </View>
        </MasterAnimation>
      )}
      {paso === 2 && <>
        <EncabezadoPaso icono="metas" titulo="Hazlo alcanzable" subtitulo="Una meta pequeña gana a una meta perfecta."/>
        <View style={s.tarjetasGrid}>
          {metas.map((x) => <Rebote estilo={s.tarjetaGridColumna} key={x.id} onPress={() => elegirSubtipo(x.id)} overlay={subtipoMeta===x.id && <AnilloSeleccion activo color={color}/>}>
            <MasterGlass style={[s.tarjetaCompacta,subtipoMeta===x.id&&{borderColor:color,backgroundColor:`${color}12`}]}>
              <View style={s.metaIconoCompacto}><MasterIcon color={2} name={x.icono} size={60}/></View>
              <Texto style={s.metaTituloCompacto}>{x.titulo}</Texto>
              <Texto numberOfLines={1} style={s.metaEjemploCompacto}>{x.ejemplo}</Texto>
              {subtipoMeta===x.id&&<View style={[s.plantillaCheck,{backgroundColor:color}]}><Check color="#fff" size={10}/></View>}
            </MasterGlass>
          </Rebote>)}
        </View>
        {tipo !== 'check' && <ReanimatedView.View entering={FadeInDown.duration(240).easing(EasingR.out(EasingR.cubic))} exiting={FadeOut.duration(160)} style={s.campos}><MasterGlass style={{borderRadius:16}}><TextInput keyboardType="decimal-pad" onFocus={desplazarAlFoco} placeholder={PLACEHOLDER_META[subtipoMeta]} value={meta} onChangeText={setMeta} style={s.input}/></MasterGlass><MasterGlass style={{borderRadius:16}}><TextInput onFocus={desplazarAlFoco} placeholder={PLACEHOLDER_UNIDAD[subtipoMeta]} value={unidad} onChangeText={setUnidad} style={s.input}/></MasterGlass></ReanimatedView.View>}
      </>}
      {paso === 3 && <><EncabezadoPaso icono="calendario" titulo="Elige tus días" subtitulo="Toca los días en los que quieres encontrar este hábito en Hoy."/><Animated.View style={{ borderRadius: 28, overflow: 'hidden', transform:[{scale:pulso}]}}><TarjetaSenderoHabito assets={assetsSelva} diasProgramados={diasSemana} icono={icono} meta={Number(meta) || 1} metaEtiqueta={etiquetaMeta} titulo={titulo.trim()}/></Animated.View><RecuadroGlass blur style={{borderRadius:22,borderWidth:0,padding:14}}><View style={{alignItems:'center',flexDirection:'row',justifyContent:'space-between'}}><View><Texto style={{color:'#1A1335',fontFamily:'Montserrat-Bold',fontSize:16}}>Esta semana</Texto><Texto style={s.sub}>{diasSemana.length===7?'Todos los días':`${diasSemana.length} días seleccionados`}</Texto></View><Clock3 color={color} size={24}/></View><View style={{flexDirection:'row',justifyContent:'space-between',marginTop:16}}>{dias.map((x) => <Rebote key={x.id} estilo={[{alignItems:'center',backgroundColor:'#FFFFFF',borderRadius:15,height:58,justifyContent:'center',width:38},diasSemana.includes(x.id)&&{backgroundColor:color}]} onPress={() => toggleDia(x.id)}><Texto style={[{color:'#6F687F',fontFamily:'Montserrat-Bold',fontSize:12},diasSemana.includes(x.id)&&{color:'#fff'}]}>{x.etiqueta}</Texto><View style={[{backgroundColor:'rgba(111,104,127,.18)',borderRadius:3,height:5,marginTop:5,width:5},diasSemana.includes(x.id)&&{backgroundColor:'#fff'}]}/></Rebote>)}</View><View style={{flexDirection:'row',gap:8,marginTop:16}}><Rebote estilo={{backgroundColor:'#FFFFFF',borderRadius:12,flex:1,paddingVertical:10}} onPress={() => seleccionarDias([1,2,3,4,5,6,7])}><Texto style={{color:'#1A1335',fontFamily:'Montserrat-Bold',fontSize:12,textAlign:'center'}}>Todos los días</Texto></Rebote><Rebote estilo={{backgroundColor:'#FFFFFF',borderRadius:12,flex:1,paddingVertical:10}} onPress={() => seleccionarDias([1,2,3,4,5])}><Texto style={{color:'#1A1335',fontFamily:'Montserrat-Bold',fontSize:12,textAlign:'center'}}>Lunes a viernes</Texto></Rebote></View></RecuadroGlass></>}
      {paso === 3 && <Image source={assetsSelva.base} style={{ alignSelf:'center', height:225, marginTop:-22, opacity:0.9, resizeMode:'contain', width:'100%' }} />}
      {paso === 4 && <>
        <EncabezadoPaso icono="reloj" titulo="Que no se te pase" subtitulo="Un recordatorio amable en el momento correcto."/>
        <RecuadroGlass blur style={{ borderRadius: 24, borderWidth: 0, padding: 16 }}>
          <View style={{ alignItems: 'center', flexDirection: 'row' }}>
            <View style={{ alignItems: 'center', height: 62, justifyContent: 'center', width: 62 }}><Bell size={40} /></View>
            <View style={{ flex: 1, marginLeft: 12 }}><Texto style={{ color: '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 16 }}>Recordatorio diario</Texto><Texto style={s.sub}>{recordatorio ? 'Te avisaremos a la hora elegida.' : 'Actívalo cuando quieras mantener el ritmo.'}</Texto></View>
            <Switch value={recordatorio} onValueChange={(valor) => { hapticSeguro('seleccion'); setRecordatorio(valor); }} />
          </View>
          {recordatorio && <ReanimatedView.View entering={FadeInDown.duration(280).easing(EasingR.out(EasingR.cubic))} style={{ gap: 13, marginTop: 18 }}>
            <Texto style={{ color: '#554E68', fontFamily: 'Montserrat-Bold', fontSize: 13 }}>Elige una hora</Texto>
            <View style={{ flexDirection: 'row', gap: 8 }}>{['08:00', '13:00', '20:00'].map((valor) => <Rebote key={valor} estilo={{ backgroundColor: !horaPersonalizada && hora === valor ? color : '#FFFFFF', borderRadius: 13, flex: 1, paddingVertical: 10 }} onPress={() => { setHora(valor); setHoraPersonalizada(false); }}><Texto style={{ color: !horaPersonalizada && hora === valor ? '#FFFFFF' : '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 12, textAlign: 'center' }}>{valor}</Texto></Rebote>)}</View>
            <Rebote estilo={{ alignItems: 'center', backgroundColor: horaPersonalizada ? `${color}16` : '#FFFFFF', borderRadius: 14, flexDirection: 'row', gap: 9, justifyContent: 'center', paddingVertical: 12 }} onPress={() => setHoraPersonalizada(true)}><Clock3 color={color} size={17} /><Texto style={{ color: '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 13 }}>Elegir otra hora</Texto></Rebote>
            {horaPersonalizada && <ReanimatedView.View entering={FadeIn.duration(220)}><RecuadroGlass blur style={{ borderRadius: 16, borderWidth: 0, padding: 13 }}><Texto style={{ color: '#554E68', fontFamily: 'Montserrat-Bold', fontSize: 12 }}>Hora personalizada</Texto><TextInput keyboardType="numbers-and-punctuation" maxLength={5} onChangeText={(valor) => setHora(valor)} onFocus={desplazarAlFoco} placeholder="07:30" placeholderTextColor="#9A93A8" value={hora} style={[s.horaInput, !horaValida && { color: '#B64747' }]} /><Texto style={s.sub}>{horaValida ? 'Formato de 24 horas.' : 'Usa el formato HH:MM, por ejemplo 07:30.'}</Texto></RecuadroGlass></ReanimatedView.View>}
            <RecuadroGlass blur style={{ borderRadius: 15, borderWidth: 0, padding: 12 }}>
              <View style={{ alignItems: 'center', flexDirection: 'row' }}><View style={{ flex: 1 }}><Texto style={{ color: '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 13 }}>Incluir el nombre del hábito</Texto><Texto style={s.sub}>{mostrar ? `“Tu hábito ${titulo.trim() || 'Mi hábito'} te espera.”` : 'El aviso será discreto y no mostrará el nombre.'}</Texto></View><Switch value={mostrar} onValueChange={(valor) => { hapticSeguro('seleccion'); setMostrar(valor); }} /></View>
            </RecuadroGlass>
          </ReanimatedView.View>}
        </RecuadroGlass>
      </>}
      {paso === 5 && <><EncabezadoPaso icono="trofeo" titulo="Tu hábito está listo" subtitulo="Revisa los detalles antes de comenzar."/><Animated.View style={{ borderRadius: 28, overflow: 'hidden'}}><TarjetaSenderoHabito assets={assetsSelva} diasProgramados={diasSemana} icono={icono} meta={Number(meta) || 1} metaEtiqueta={etiquetaMeta} titulo={titulo.trim()}/></Animated.View></>}
      {paso === 6 && <><EncabezadoPaso icono="trofeo" titulo="Tu ruta de crecimiento" subtitulo={tipo === 'check' ? 'Tu hábito crece con los días que lo sostienes.' : 'Cada nivel te invita a avanzar un poco más.'}/><RutaNiveles meta={meta} tipo={tipo} unidad={unidad}/>{errorCrear&&<Texto style={{color:'#B64747',fontFamily:'Montserrat-Bold',fontSize:12,textAlign:'center',marginTop:12}}>{errorCrear}</Texto>}</>}
      </ReanimatedView.View>
    </ScrollView>{paso === 4 && <View pointerEvents="none" style={s.paisajeRecordatorio}><Image source={assetsSelva.arbolPrincipal} style={s.arbolRecordatorio}/><ArbustoSelva ancho={145} alto={145} estilo={{ bottom: 48, position: 'absolute', right: 2 }} tono={tono} /></View>}<SafeAreaView edges={['bottom']} style={s.pie}><Boton color={color} disabled={!puedeContinuar||guardando||preparando} iconoIzquierda={paso===6?Check:ChevronRight} onPress={() => paso===6?void guardar():setPaso(paso+1)} variante="sendero">{guardando?'Creando…':paso===6?'Crear mi hábito':'Continuar'}</Boton></SafeAreaView>{preparando&&<PreparandoHabito color={color} progreso={progresoPreparacion} titulo={titulo.trim()} tono={tono} />}
  </View></KeyboardAvoidingView></Modal>;
}

const s=StyleSheet.create({raiz:{flex:1,backgroundColor:'#F3FAF0'},fondoDecorativo:{bottom:0,left:0,position:'absolute',right:0,top:0},cab:{alignItems:'center',zIndex:1,flexDirection:'row',justifyContent:'space-between',padding:22,paddingTop:55},indice:{color:'#7B7494',fontFamily:'Montserrat-Bold'},cancelar:{color:'#7C3AED',fontFamily:'Montserrat-Bold'},linea:{flexDirection:'row',zIndex:1,gap:5,paddingHorizontal:22},punto:{backgroundColor:'#DDD6E9',borderRadius:4,flex:1,height:5},contenidoPrincipal:{zIndex:1},cuerpo:{padding:24,paddingTop:38},pasoContenido:{gap:14},encabezadoPaso:{alignItems:'center',flexDirection:'row',gap:11},encabezadoTexto:{flex:1,paddingTop:1},titulo:{color:'#1A1335',fontFamily:'Montserrat-Bold',fontSize:28,lineHeight:34},sub:{color:'#7B7494',fontSize:13,lineHeight:19},etiqueta:{color:'#554E68',fontFamily:'Montserrat-Bold',fontSize:13,marginTop:4},input:{backgroundColor:'#fff',borderColor:'#E4DDF0',borderRadius:16,borderWidth:1,color:'#1A1335',fontSize:16,padding:15},horaInput:{backgroundColor:'#FFFFFF',borderRadius:12,color:'#1A1335',fontFamily:'Montserrat-Bold',fontSize:22,letterSpacing:1,marginTop:8,paddingHorizontal:13,paddingVertical:10},colores:{flexDirection:'row',flexWrap:'nowrap',justifyContent:'space-between',width:'100%'},color:{alignItems:'center',aspectRatio:1,borderRadius:999,justifyContent:'center',width:'12.5%'},colorActivo:{borderColor:'#1A1335',borderWidth:3},biomaGlass:{alignItems:'center',flexDirection:'row',gap:10,paddingHorizontal:11,paddingVertical:11},arbol:{height:56,resizeMode:'contain',width:48},biomaTitulo:{fontFamily:'Montserrat-Bold',fontSize:14},iconosScroll:{maxHeight:300},iconos:{flexDirection:'row',flexWrap:'wrap',gap:7,paddingBottom:4},iconoOpcion:{alignItems:'center',backgroundColor:'#FFFFFFB8',borderColor:'#E4DDF0',borderRadius:12,borderWidth:1,height:58,justifyContent:'center',width:'17.5%'},iconoImagen:{height:38,resizeMode:'contain',width:38},preview:{backgroundColor:'#FFFFFFB8',borderRadius:20,borderWidth:1,minHeight:126,overflow:'hidden',padding:13},aura:{borderRadius:80,height:150,position:'absolute',right:-45,top:-56,width:150},previewArbol:{bottom:9,height:100,opacity:.14,position:'absolute',resizeMode:'contain',right:-5,width:105},previewFila:{alignItems:'center',flexDirection:'row',flex:1},previewIcono:{alignItems:'center',borderRadius:18,height:66,justifyContent:'center',width:66},previewImagen:{height:53,resizeMode:'contain',width:53},previewTexto:{flex:1,marginLeft:11},previewTitulo:{color:'#1A1335',fontFamily:'Montserrat-Bold',fontSize:17},pildora:{alignItems:'center',alignSelf:'flex-start',borderRadius:99,flexDirection:'row',gap:4,marginTop:5,paddingHorizontal:8,paddingVertical:4},previewMeta:{fontFamily:'Montserrat-Bold',fontSize:11},separador:{color:'#8D869D',fontSize:11},frecuencia:{color:'#6F687F',fontFamily:'Montserrat-Bold',fontSize:10},estado:{alignItems:'center',flexDirection:'row',gap:5,marginTop:8},estadoPunto:{borderRadius:4,height:8,width:8},estadoTexto:{color:'#6F687F',fontFamily:'Montserrat-Bold',fontSize:10},progreso:{backgroundColor:'#E9E4F0',borderRadius:9,height:5,marginTop:11,overflow:'hidden'},progresoInicio:{borderRadius:9,height:'100%',width:'9%'},tarjeta:{alignItems:'center',backgroundColor:'#FFFFFFB8',borderColor:'#E4DDF0',borderRadius:18,borderWidth:1,flexDirection:'row',minHeight:82,padding:11,position:'relative'},metaIcono:{alignItems:'center',height:66,justifyContent:'center',width:66},metaTexto:{flex:1,marginLeft:10},metaTitulo:{color:'#1A1335',fontFamily:'Montserrat-Bold',fontSize:16},metaEjemplo:{color:'#7B7494',fontSize:12,marginTop:2},check:{alignItems:'center',borderRadius:11,height:22,justifyContent:'center',position:'absolute',right:12,top:12,width:22},campos:{gap:10},opciones:{gap:10},opcion:{alignItems:'center',backgroundColor:'#fff',borderColor:'#E4DDF0',borderRadius:16,borderWidth:1,flexDirection:'row',gap:10,padding:15},opcionTexto:{color:'#1A1335',flex:1,fontFamily:'Montserrat-Bold',fontSize:14},dias:{flexDirection:'row',justifyContent:'space-between'},dia:{alignItems:'center',backgroundColor:'#fff',borderColor:'#E4DDF0',borderRadius:18,borderWidth:1,height:36,justifyContent:'center',width:36},diaTexto:{color:'#554E68',fontFamily:'Montserrat-Bold',fontSize:12},fila:{alignItems:'center',backgroundColor:'#fff',borderRadius:16,flexDirection:'row',gap:10,padding:15},iconoFinal:{alignItems:'center',alignSelf:'flex-start',borderRadius:24,height:92,justifyContent:'center',width:92},finalImagen:{height:74,resizeMode:'contain',width:74},resumen:{backgroundColor:'#FFFFFFC8',borderRadius:24,borderWidth:1,gap:13,padding:16},resumenHero:{alignItems:'center',flexDirection:'row',gap:13},resumenHeroTexto:{flex:1},resumenDivisor:{backgroundColor:'#E4DDF0',height:1},resumenFila:{alignItems:'center',flexDirection:'row',gap:11},resumenFilaTexto:{flex:1},resumenEtiqueta:{color:'#7B7494',fontFamily:'Montserrat-Medium',fontSize:10},resumenValor:{color:'#1A1335',fontFamily:'MontserratAlternates-Bold',fontSize:13,marginTop:1},resumenTitulo:{color:'#1A1335',fontFamily:'MontserratAlternates-Bold',fontSize:20},paisajeRecordatorio:{bottom:112,height:205,left:0,position:'absolute',right:0,zIndex:0},arbolRecordatorio:{bottom:0,height:205,left:0,position:'absolute',resizeMode:'contain',width:185},arbustoRecordatorio:{bottom:48,height:145,position:'absolute',resizeMode:'contain',right:2,width:145},rutaNiveles:{gap:9},nivelRuta:{alignItems:'center',backgroundColor:'#FFFFFFA8',borderRadius:18,borderWidth:0,flexDirection:'row',minHeight:68,paddingHorizontal:12,paddingVertical:9},insigniaNivel:{alignItems:'center',height:50,justifyContent:'center',width:54},nivelRutaTexto:{flex:1,marginLeft:7},nivelRutaTitulo:{color:'#145C37',fontFamily:'MontserratAlternates-Bold',fontSize:15},nivelRutaDetalle:{color:'#4A7F5D',fontFamily:'Montserrat-Medium',fontSize:11,marginTop:2},nivelActual:{backgroundColor:'#D8F6D1',borderRadius:99,color:'#19673A',fontFamily:'MontserratAlternates-Bold',fontSize:10,paddingHorizontal:9,paddingVertical:5},gemasNivel:{alignItems:'center',flexDirection:'row',gap:3},gemaNivelIcono:{height:20,resizeMode:'contain',width:20},gemasNivelTexto:{color:'#6D28D9',fontFamily:'MontserratAlternates-Bold',fontSize:13},pie:{backgroundColor:'#F3FAF0',borderTopColor:'#E4DDF0',borderTopWidth:1,paddingHorizontal:22,paddingTop:22,zIndex:2},
buscadorGlass:{alignItems:'center',backgroundColor:'#FFFFFFB8',borderColor:'#E4DDF0',borderRadius:16,borderWidth:1,flexDirection:'row',gap:9,paddingHorizontal:14,paddingVertical:12},
buscadorInput:{color:'#1A1335',flex:1,fontSize:14,padding:0},
plantillasGrid:{flexDirection:'row',flexWrap:'wrap',gap:8},
plantillaCard:{backgroundColor:'#FFFFFFB8',borderColor:'#E4DDF0',borderRadius:16,borderWidth:1,justifyContent:'center',minHeight:112,padding:10,position:'relative',width:'31%'},
plantillaContenido:{alignItems:'center',width:'100%'},
plantillaIcono:{alignItems:'center',height:56,justifyContent:'center',marginBottom:6,width:56},
plantillaImagen:{height:50,resizeMode:'contain',width:50},
plantillaTitulo:{color:'#1A1335',fontFamily:'Montserrat-Bold',fontSize:11,lineHeight:14,textAlign:'center'},
plantillaCheck:{alignItems:'center',borderRadius:9,height:18,justifyContent:'center',position:'absolute',right:6,top:6,width:18},
plantillasVacio:{color:'#7B7494',fontSize:12,paddingVertical:14,textAlign:'center',width:'100%'},
tarjetasGrid:{flexDirection:'row',flexWrap:'wrap',gap:10},
tarjetaGridColumna:{width:'47%'},
tarjetaCompacta:{alignItems:'center',justifyContent:'center',minHeight:150,padding:12,position:'relative'},
metaIconoCompacto:{alignItems:'center',height:80,justifyContent:'center',marginBottom:6,width:80},
metaTituloCompacto:{color:'#1A1335',fontFamily:'Montserrat-Bold',fontSize:14,textAlign:'center'},
metaEjemploCompacto:{color:'#7B7494',fontSize:11,marginTop:2,textAlign:'center'},
});
