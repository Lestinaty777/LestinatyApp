import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleProp, StyleSheet, Switch, TextInput, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ReanimatedView, { Easing as EasingR, FadeIn, FadeInDown, interpolate, interpolateColor, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSpring, withTiming } from 'react-native-reanimated';
import { Check, ChevronLeft, ChevronRight, Clock3 } from 'lucide-react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { BarraProgresoLiquida, Boton, MasterIcon, RecuadroGlass, Texto } from '../../../diseno';
import { MasterChanger } from '../../../diseno/componentes/MasterChanger';
import { CrearHabitoInput } from '../habitos.servicio';
import { ARBUSTO_SELVA_BASE, DIAS_REQUERIDOS_POR_NIVEL, NIVEL_MAXIMO_TONO, factorTono, iconosHabitos, obtenerAssetsSelvaPorTono, tonoVerdeNivel, type AssetsSelvaTono } from '../iconosHabitos';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { solicitarPermisoYRegistrar } from '../../../nucleo/notificaciones/oneSignal';
import { estadoPreparacionHabito } from '../creacionPremium';
import { preparacionEstilos as p } from '../creacionPremium.estilos';
import { TarjetaSenderoHabito } from './TarjetaSenderoHabito';

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
const metas = [
  { id: 'check' as const, titulo: 'Solo cumplir', ejemplo: 'Hazlo una vez', icono: 'tareas' },
  { id: 'cantidad' as const, titulo: 'Cantidad', ejemplo: 'Ej. 8 vasos', icono: 'estadistica' },
  { id: 'duracion' as const, titulo: 'Duración', ejemplo: 'Ej. 10 minutos', icono: 'reloj' },
];
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

const HOJAS_PARTICULA = ['hoja', 'hoja2', 'hoja3'] as const;

// Una hoja individual sube flotando en un arco suave, gira un poco y se
// desvanece en los bordes — reemplaza a los puntos de color planos de antes.
function ParticulaHoja({ indice }: { indice: number }) {
  const progreso = useSharedValue(0);
  const izquierda = 6 + (indice * 13) % 88;
  const retraso = (indice % 6) * 320;
  const duracion = 3400 + (indice % 5) * 380;
  const tamano = 15 + (indice % 3) * 6;
  const sentido = indice % 2 === 0 ? 1 : -1;

  useEffect(() => {
    progreso.value = withDelay(retraso, withRepeat(withTiming(1, { duration: duracion, easing: EasingR.linear }), -1, false));
  }, [duracion, progreso, retraso]);

  const estilo = useAnimatedStyle(() => {
    const y = interpolate(progreso.value, [0, 1], [30, -420]);
    const x = Math.sin(progreso.value * Math.PI * 2) * 16 * sentido;
    const opacidad = interpolate(progreso.value, [0, 0.12, 0.82, 1], [0, 0.85, 0.85, 0]);
    const rotacion = interpolate(progreso.value, [0, 1], [0, 200 * sentido]);
    return { opacity: opacidad, transform: [{ translateY: y }, { translateX: x }, { rotate: `${rotacion}deg` }] };
  });

  return <ReanimatedView.View pointerEvents="none" style={[{ bottom: 40, left: `${izquierda}%`, position: 'absolute' }, estilo]}>
    <MasterIcon color={2} name={HOJAS_PARTICULA[indice % HOJAS_PARTICULA.length]} size={tamano} />
  </ReanimatedView.View>;
}

// Escena central: un solo brote creciendo (no una fila repetida de árboles),
// con los assets reales del tono elegido apareciendo con rebote conforme
// avanza el progreso real.
function EscenaCreciendo({ assets, estado }: { assets: AssetsSelvaTono; estado: ReturnType<typeof estadoPreparacionHabito> }) {
  const escalaPrincipal = useSharedValue(0);
  const escalaSecundario = useSharedValue(0);
  const escalaFlor = useSharedValue(0);

  useEffect(() => { escalaPrincipal.value = withSpring(1, { damping: 10, stiffness: 110 }); }, [escalaPrincipal]);
  useEffect(() => { escalaSecundario.value = withSpring(estado.arboles >= 2 ? 1 : 0, { damping: 10, stiffness: 110 }); }, [escalaSecundario, estado.arboles]);
  useEffect(() => { escalaFlor.value = withSpring(estado.arboles >= 3 ? 1 : 0, { damping: 8, stiffness: 140 }); }, [escalaFlor, estado.arboles]);

  const estiloPrincipal = useAnimatedStyle(() => ({ transform: [{ scale: escalaPrincipal.value }] }));
  const estiloSecundario = useAnimatedStyle(() => ({ opacity: escalaSecundario.value, transform: [{ scale: escalaSecundario.value }] }));
  const estiloFlor = useAnimatedStyle(() => ({ opacity: escalaFlor.value, transform: [{ scale: escalaFlor.value }, { rotate: `${(1 - escalaFlor.value) * 35}deg` }] }));

  return <View pointerEvents="none" style={p.escena}>
    <ReanimatedView.Image source={assets.arbolSecundario} style={[p.arbolSecundario, estiloSecundario]} />
    <ReanimatedView.Image source={assets.arbolPrincipal} style={[p.arbolPrincipal, estiloPrincipal]} />
    <ReanimatedView.Image source={assets.flor} style={[p.flor, estiloFlor]} />
    <Image source={assets.base} style={p.base} />
  </View>;
}

function PreparandoHabito({ color, tono, progreso, titulo }: { color: string; tono: number; progreso: number; titulo: string }) {
  const respiro = useSharedValue(0);
  const estado = estadoPreparacionHabito(progreso);
  const assetsSelva = useMemo(() => obtenerAssetsSelvaPorTono(tono), [tono]);
  useEffect(() => { respiro.value = withRepeat(withTiming(1, { duration: 1500, easing: EasingR.inOut(EasingR.sin) }), -1, true); }, [respiro]);
  const estiloOrbe = useAnimatedStyle(() => ({ transform: [{ scale: 1 + respiro.value * 0.06 }] }));
  const estiloGlow = useAnimatedStyle(() => ({ opacity: 0.25 + respiro.value * 0.2, transform: [{ scale: 1 + respiro.value * 0.18 }] }));

  return <View style={p.raiz}>
    <FondoSelvaWizard color={color} />
    {Array.from({ length: 14 }, (_, indice) => <ParticulaHoja indice={indice} key={indice} />)}
    <View style={p.contenido}>
      <ReanimatedView.View style={[p.orbeGlow, { backgroundColor: `${color}30` }, estiloGlow]} />
      <ReanimatedView.View style={[p.orbe, { backgroundColor: `${color}18` }, estiloOrbe]}><ArbustoSelva ancho={92} alto={92} tono={tono} /></ReanimatedView.View>
      <Texto style={[p.titulo, { color }]}>{estado.mensaje}</Texto>
      <Texto style={p.sub}>Estamos dejando listo {titulo || 'tu hábito'}.</Texto>
      <View style={p.barra}><BarraProgresoLiquida color={color} porcentaje={progreso} /></View>
      <Texto style={p.porcentaje}>{progreso}%</Texto>
    </View>
    <EscenaCreciendo assets={assetsSelva} estado={estado} />
  </View>;
}

export function CrearHabitoWizard({ visible, guardando, onCerrar, onCrear }: { visible: boolean; guardando: boolean; onCerrar: () => void; onCrear: (input: CrearHabitoInput) => Promise<void> }) {
  const [paso, setPaso] = useState(0), [titulo, setTitulo] = useState(''), [meta, setMeta] = useState('1'), [unidad, setUnidad] = useState('veces');
  const [tipo, setTipo] = useState<CrearHabitoInput['tipoMeta']>('cantidad'), [frecuencia, setFrecuencia] = useState<CrearHabitoInput['frecuencia']>('diaria');
  const [diasSemana, setDiasSemana] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]), [vecesSemana, setVecesSemana] = useState('3');
  const [recordatorio, setRecordatorio] = useState(false), [hora, setHora] = useState('08:00'), [horaPersonalizada, setHoraPersonalizada] = useState(false), [mostrar, setMostrar] = useState(false);
  const [tono, setTono] = useState(1), [iconoLucide, setIconoLucide] = useState(iconosHabitos[0].id);
  const [preparando, setPreparando] = useState(false), [progresoPreparacion, setProgresoPreparacion] = useState(0), [errorCrear, setErrorCrear] = useState<string | null>(null);
  const pulso = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef<ScrollView>(null);
  const desplazarAlFoco = () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  useEffect(() => { if (!recordatorio) return; void solicitarPermisoYRegistrar().then((concedido) => { if (!concedido) setRecordatorio(false); }).catch(() => setRecordatorio(false)); }, [recordatorio]);
  useEffect(() => { if (visible) return; setPreparando(false); setProgresoPreparacion(0); setErrorCrear(null); }, [visible]);
  useEffect(() => { if (!preparando) return; const intervalo = setInterval(() => setProgresoPreparacion((actual) => Math.min(72, actual + (actual < 35 ? 11 : 5))), 360); return () => clearInterval(intervalo); }, [preparando]);
  const color = useMemo(() => tonoVerdeNivel(tono), [tono]);
  const assetsSelva: AssetsSelvaTono = useMemo(() => obtenerAssetsSelvaPorTono(tono), [tono]);
  const icono = useMemo(() => iconosHabitos.find((item) => item.id === iconoLucide) ?? iconosHabitos[0], [iconoLucide]);
  const horaValida = /^([01]\d|2[0-3]):[0-5]\d$/.test(hora);
  const puedeContinuar = titulo.trim().length > 0 && (frecuencia !== 'dias_semana' || diasSemana.length > 0) && (frecuencia !== 'veces_semana' || Number(vecesSemana) > 0) && (!recordatorio || horaValida);
  const elegirTipo = (nuevo: CrearHabitoInput['tipoMeta']) => { setTipo(nuevo); if (nuevo === 'check') setUnidad(''); else if (nuevo === 'duracion') { setMeta('10'); setUnidad('minutos'); } else { setMeta('1'); setUnidad('veces'); } Animated.sequence([Animated.timing(pulso, { toValue: 1.035, duration: 115, useNativeDriver: true }), Animated.spring(pulso, { toValue: 1, friction: 4, useNativeDriver: true })]).start(); };
  const guardar = async () => { const inicio = Date.now(); setErrorCrear(null); setPreparando(true); setProgresoPreparacion(12); try { await onCrear({ titulo, meta: Number(meta) || 1, unidad: tipo === 'check' ? '' : unidad, tipoMeta: tipo, iconoLucide, color, frecuencia, diasSemana: frecuencia === 'dias_semana' ? diasSemana : null, vecesPorSemana: frecuencia === 'veces_semana' ? Math.max(1, Number(vecesSemana) || 1) : null, recordatorioActivo: recordatorio, horaRecordatorio: recordatorio ? hora : null, mostrarNombreNotificacion: mostrar, nivelInicial: tono }); const restante = Math.max(0, 900 - (Date.now() - inicio)); if (restante) await new Promise((resolver) => setTimeout(resolver, restante)); setProgresoPreparacion(100); setTimeout(onCerrar, 900); } catch (error) { setPreparando(false); setErrorCrear(error instanceof Error ? error.message : 'No pudimos crear tu hábito. Inténtalo de nuevo.'); } };
  const toggleDia = (dia: number) => setDiasSemana((v) => { const siguiente = v.includes(dia) ? v.filter((x) => x !== dia) : [...v, dia].sort(); setFrecuencia(siguiente.length === 7 ? 'diaria' : 'dias_semana'); return siguiente; });
  const seleccionarDias = (seleccion: number[]) => { setDiasSemana(seleccion); setFrecuencia(seleccion.length === 7 ? 'diaria' : 'dias_semana'); };
  const detalleMeta = tipo === 'check' ? 'Una vez al día' : `${meta || 1} ${unidad || (tipo === 'duracion' ? 'minutos' : 'veces')}`;
  const etiquetaMeta = tipo === 'check' ? '1 vez' : tipo === 'duracion' ? `${meta || 1} min` : `${meta || 1} ${unidad || 'veces'}`;
  return <Modal animationType="slide" visible={visible} onRequestClose={onCerrar}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}><View style={s.raiz}><FondoSelvaWizard color={color}/>
    <View style={s.cab}><Pressable onPress={() => { hapticSeguro('seleccion'); paso ? setPaso(paso - 1) : onCerrar(); }}><ChevronLeft color="#1A1335" size={26} /></Pressable><Texto style={s.indice}>{paso + 1} de 6</Texto><Pressable onPress={onCerrar}><Texto style={s.cancelar}>Cancelar</Texto></Pressable></View><View style={s.linea}>{[0,1,2,3,4,5].map((i) => <PuntoProgreso activo={i <= paso} color={color} key={i} />)}</View>
    <ScrollView contentContainerStyle={s.cuerpo} ref={scrollRef} showsVerticalScrollIndicator={false} style={s.contenidoPrincipal}>
      <ReanimatedView.View entering={FadeIn.duration(260).easing(EasingR.out(EasingR.cubic))} key={paso} style={s.pasoContenido}>
      {paso === 0 && <><EncabezadoPaso icono="idea" titulo="¿Qué hábito quieres construir?" subtitulo="Dale una identidad que te dé ganas de verlo cada día."/><TextInput autoFocus value={titulo} onChangeText={setTitulo} placeholder="Ej. Meditar" style={s.input}/><Texto style={s.etiqueta}>Tono de tu selva</Texto><View style={s.colores}>{TONOS.map((t) => <Rebote key={t} estilo={[s.color,{backgroundColor:tonoVerdeNivel(t)},tono===t&&s.colorActivo]} onPress={() => setTono(t)} overlay={<AnilloSeleccion activo={tono===t} color="#FFFFFF"/>}><CheckAnimado visible={tono===t}/></Rebote>)}</View><View style={[s.bioma,{borderColor:`${color}55`}]}><Image source={assetsSelva.arbolPrincipal} style={s.arbol}/><View><Texto style={[s.biomaTitulo,{color}]}>{BIOMA_TITULO}</Texto><Texto style={s.sub}>Este será el mundo visual de tu hábito.</Texto></View></View><Texto style={s.etiqueta}>Elige un icono</Texto><ScrollView nestedScrollEnabled style={s.iconosScroll} contentContainerStyle={s.iconos} showsVerticalScrollIndicator={false}>{iconosHabitos.map((x) => <Rebote accessibilityLabel={`Icono ${x.etiqueta}`} key={x.id} estilo={[s.iconoOpcion,iconoLucide===x.id&&{borderColor:color,backgroundColor:`${color}12`}]} onPress={() => setIconoLucide(x.id)}><Image source={x.fuente} style={s.iconoImagen}/></Rebote>)}</ScrollView></>}
      {paso === 1 && <><EncabezadoPaso icono="metas" titulo="Hazlo alcanzable" subtitulo="Una meta pequeña gana a una meta perfecta."/><Animated.View style={{ borderRadius: 28, overflow: 'hidden', transform:[{scale:pulso}]}}><TarjetaSenderoHabito assets={assetsSelva} diasProgramados={diasSemana} icono={icono} meta={Number(meta) || 1} metaEtiqueta={etiquetaMeta} titulo={titulo.trim()}/></Animated.View><View style={s.tarjetas}>{metas.map((x) => <Rebote key={x.id} onPress={() => elegirTipo(x.id)}><RecuadroGlass blur style={[s.tarjeta,tipo===x.id&&{borderColor:color,backgroundColor:`${color}12`}]}><View style={s.metaIcono}><MasterIcon color={2} name={x.icono} size={44}/></View><View style={s.metaTexto}><Texto style={s.metaTitulo}>{x.titulo}</Texto><Texto style={s.metaEjemplo}>{x.ejemplo}</Texto></View>{tipo===x.id&&<View style={[s.check,{backgroundColor:color}]}><Check color="#fff" size={12}/></View>}</RecuadroGlass></Rebote>)}</View>{tipo !== 'check' && <View style={s.campos}><RecuadroGlass blur style={{borderRadius:16}}><TextInput keyboardType="decimal-pad" onFocus={desplazarAlFoco} value={meta} onChangeText={setMeta} style={s.input}/></RecuadroGlass><RecuadroGlass blur style={{borderRadius:16}}><TextInput onFocus={desplazarAlFoco} value={unidad} onChangeText={setUnidad} placeholder="vasos, minutos, páginas…" style={s.input}/></RecuadroGlass></View>}</>}
      {paso === 2 && <><EncabezadoPaso icono="calendario" titulo="Elige tus días" subtitulo="Toca los días en los que quieres encontrar este hábito en Hoy."/><Animated.View style={{ borderRadius: 28, overflow: 'hidden', transform:[{scale:pulso}]}}><TarjetaSenderoHabito assets={assetsSelva} diasProgramados={diasSemana} icono={icono} meta={Number(meta) || 1} metaEtiqueta={etiquetaMeta} titulo={titulo.trim()}/></Animated.View><RecuadroGlass blur style={{borderRadius:22,borderWidth:0,padding:14}}><View style={{alignItems:'center',flexDirection:'row',justifyContent:'space-between'}}><View><Texto style={{color:'#1A1335',fontFamily:'Montserrat-Bold',fontSize:16}}>Esta semana</Texto><Texto style={s.sub}>{diasSemana.length===7?'Todos los días':`${diasSemana.length} días seleccionados`}</Texto></View><Clock3 color={color} size={24}/></View><View style={{flexDirection:'row',justifyContent:'space-between',marginTop:16}}>{dias.map((x) => <Rebote key={x.id} estilo={[{alignItems:'center',backgroundColor:'#FFFFFF',borderRadius:15,height:58,justifyContent:'center',width:38},diasSemana.includes(x.id)&&{backgroundColor:color}]} onPress={() => toggleDia(x.id)}><Texto style={[{color:'#6F687F',fontFamily:'Montserrat-Bold',fontSize:12},diasSemana.includes(x.id)&&{color:'#fff'}]}>{x.etiqueta}</Texto><View style={[{backgroundColor:'rgba(111,104,127,.18)',borderRadius:3,height:5,marginTop:5,width:5},diasSemana.includes(x.id)&&{backgroundColor:'#fff'}]}/></Rebote>)}</View><View style={{flexDirection:'row',gap:8,marginTop:16}}><Rebote estilo={{backgroundColor:'#FFFFFF',borderRadius:12,flex:1,paddingVertical:10}} onPress={() => seleccionarDias([1,2,3,4,5,6,7])}><Texto style={{color:'#1A1335',fontFamily:'Montserrat-Bold',fontSize:12,textAlign:'center'}}>Todos los días</Texto></Rebote><Rebote estilo={{backgroundColor:'#FFFFFF',borderRadius:12,flex:1,paddingVertical:10}} onPress={() => seleccionarDias([1,2,3,4,5])}><Texto style={{color:'#1A1335',fontFamily:'Montserrat-Bold',fontSize:12,textAlign:'center'}}>Lunes a viernes</Texto></Rebote></View></RecuadroGlass></>}
      {paso === 2 && <Image source={assetsSelva.base} style={{ alignSelf:'center', height:225, marginTop:-22, opacity:0.9, resizeMode:'contain', width:'100%' }} />}
      {paso === 3 && <>
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
      {paso === 4 && <><EncabezadoPaso icono="trofeo" titulo="Tu hábito está listo" subtitulo="Revisa los detalles antes de comenzar."/><Animated.View style={{ borderRadius: 28, overflow: 'hidden'}}><TarjetaSenderoHabito assets={assetsSelva} diasProgramados={diasSemana} icono={icono} meta={Number(meta) || 1} metaEtiqueta={etiquetaMeta} titulo={titulo.trim()}/></Animated.View></>}
      {paso === 5 && <><EncabezadoPaso icono="trofeo" titulo="Tu ruta de crecimiento" subtitulo={tipo === 'check' ? 'Tu hábito crece con los días que lo sostienes.' : 'Cada nivel te invita a avanzar un poco más.'}/><RutaNiveles meta={meta} tipo={tipo} unidad={unidad}/>{errorCrear&&<Texto style={{color:'#B64747',fontFamily:'Montserrat-Bold',fontSize:12,textAlign:'center',marginTop:12}}>{errorCrear}</Texto>}</>}
      </ReanimatedView.View>
    </ScrollView>{paso === 3 && <View pointerEvents="none" style={s.paisajeRecordatorio}><Image source={assetsSelva.arbolPrincipal} style={s.arbolRecordatorio}/><ArbustoSelva ancho={145} alto={145} estilo={{ bottom: 48, position: 'absolute', right: 2 }} tono={tono} /></View>}<SafeAreaView edges={['bottom']} style={s.pie}><Boton color={color} disabled={!puedeContinuar||guardando||preparando} iconoIzquierda={paso===5?Check:ChevronRight} onPress={() => paso===5?void guardar():setPaso(paso+1)} variante="sendero">{guardando?'Creando…':paso===5?'Crear mi hábito':'Continuar'}</Boton></SafeAreaView>{preparando&&<PreparandoHabito color={color} progreso={progresoPreparacion} titulo={titulo.trim()} tono={tono} />}
  </View></KeyboardAvoidingView></Modal>;
}

const s=StyleSheet.create({raiz:{flex:1,backgroundColor:'#F3FAF0'},fondoDecorativo:{bottom:0,left:0,position:'absolute',right:0,top:0},cab:{alignItems:'center',zIndex:1,flexDirection:'row',justifyContent:'space-between',padding:22,paddingTop:55},indice:{color:'#7B7494',fontFamily:'Montserrat-Bold'},cancelar:{color:'#7C3AED',fontFamily:'Montserrat-Bold'},linea:{flexDirection:'row',zIndex:1,gap:5,paddingHorizontal:22},punto:{backgroundColor:'#DDD6E9',borderRadius:4,flex:1,height:5},contenidoPrincipal:{zIndex:1},cuerpo:{padding:24,paddingTop:38},pasoContenido:{gap:14},encabezadoPaso:{alignItems:'center',flexDirection:'row',gap:11},encabezadoTexto:{flex:1,paddingTop:1},titulo:{color:'#1A1335',fontFamily:'Montserrat-Bold',fontSize:28,lineHeight:34},sub:{color:'#7B7494',fontSize:13,lineHeight:19},etiqueta:{color:'#554E68',fontFamily:'Montserrat-Bold',fontSize:13,marginTop:4},input:{backgroundColor:'#fff',borderColor:'#E4DDF0',borderRadius:16,borderWidth:1,color:'#1A1335',fontSize:16,padding:15},horaInput:{backgroundColor:'#FFFFFF',borderRadius:12,color:'#1A1335',fontFamily:'Montserrat-Bold',fontSize:22,letterSpacing:1,marginTop:8,paddingHorizontal:13,paddingVertical:10},colores:{flexDirection:'row',flexWrap:'nowrap',justifyContent:'space-between',width:'100%'},color:{alignItems:'center',aspectRatio:1,borderRadius:999,justifyContent:'center',width:'12.5%'},colorActivo:{borderColor:'#1A1335',borderWidth:3},bioma:{alignItems:'center',backgroundColor:'#FFFFFF99',borderRadius:16,borderWidth:1,flexDirection:'row',gap:10,paddingHorizontal:11,paddingVertical:7},arbol:{height:56,resizeMode:'contain',width:48},biomaTitulo:{fontFamily:'Montserrat-Bold',fontSize:14},iconosScroll:{maxHeight:300},iconos:{flexDirection:'row',flexWrap:'wrap',gap:7,paddingBottom:4},iconoOpcion:{alignItems:'center',backgroundColor:'#FFFFFFB8',borderColor:'#E4DDF0',borderRadius:12,borderWidth:1,height:58,justifyContent:'center',width:'17.5%'},iconoImagen:{height:38,resizeMode:'contain',width:38},preview:{backgroundColor:'#FFFFFFB8',borderRadius:20,borderWidth:1,minHeight:126,overflow:'hidden',padding:13},aura:{borderRadius:80,height:150,position:'absolute',right:-45,top:-56,width:150},previewArbol:{bottom:9,height:100,opacity:.14,position:'absolute',resizeMode:'contain',right:-5,width:105},previewFila:{alignItems:'center',flexDirection:'row',flex:1},previewIcono:{alignItems:'center',borderRadius:18,height:66,justifyContent:'center',width:66},previewImagen:{height:53,resizeMode:'contain',width:53},previewTexto:{flex:1,marginLeft:11},previewTitulo:{color:'#1A1335',fontFamily:'Montserrat-Bold',fontSize:17},pildora:{alignItems:'center',alignSelf:'flex-start',borderRadius:99,flexDirection:'row',gap:4,marginTop:5,paddingHorizontal:8,paddingVertical:4},previewMeta:{fontFamily:'Montserrat-Bold',fontSize:11},separador:{color:'#8D869D',fontSize:11},frecuencia:{color:'#6F687F',fontFamily:'Montserrat-Bold',fontSize:10},estado:{alignItems:'center',flexDirection:'row',gap:5,marginTop:8},estadoPunto:{borderRadius:4,height:8,width:8},estadoTexto:{color:'#6F687F',fontFamily:'Montserrat-Bold',fontSize:10},progreso:{backgroundColor:'#E9E4F0',borderRadius:9,height:5,marginTop:11,overflow:'hidden'},progresoInicio:{borderRadius:9,height:'100%',width:'9%'},tarjetas:{gap:10},tarjeta:{alignItems:'center',backgroundColor:'#FFFFFFB8',borderColor:'#E4DDF0',borderRadius:18,borderWidth:1,flexDirection:'row',minHeight:82,padding:11,position:'relative'},metaIcono:{alignItems:'center',height:66,justifyContent:'center',width:66},metaTexto:{flex:1,marginLeft:10},metaTitulo:{color:'#1A1335',fontFamily:'Montserrat-Bold',fontSize:16},metaEjemplo:{color:'#7B7494',fontSize:12,marginTop:2},check:{alignItems:'center',borderRadius:11,height:22,justifyContent:'center',position:'absolute',right:12,top:12,width:22},campos:{gap:10},opciones:{gap:10},opcion:{alignItems:'center',backgroundColor:'#fff',borderColor:'#E4DDF0',borderRadius:16,borderWidth:1,flexDirection:'row',gap:10,padding:15},opcionTexto:{color:'#1A1335',flex:1,fontFamily:'Montserrat-Bold',fontSize:14},dias:{flexDirection:'row',justifyContent:'space-between'},dia:{alignItems:'center',backgroundColor:'#fff',borderColor:'#E4DDF0',borderRadius:18,borderWidth:1,height:36,justifyContent:'center',width:36},diaTexto:{color:'#554E68',fontFamily:'Montserrat-Bold',fontSize:12},fila:{alignItems:'center',backgroundColor:'#fff',borderRadius:16,flexDirection:'row',gap:10,padding:15},iconoFinal:{alignItems:'center',alignSelf:'flex-start',borderRadius:24,height:92,justifyContent:'center',width:92},finalImagen:{height:74,resizeMode:'contain',width:74},resumen:{backgroundColor:'#FFFFFFC8',borderRadius:24,borderWidth:1,gap:13,padding:16},resumenHero:{alignItems:'center',flexDirection:'row',gap:13},resumenHeroTexto:{flex:1},resumenDivisor:{backgroundColor:'#E4DDF0',height:1},resumenFila:{alignItems:'center',flexDirection:'row',gap:11},resumenFilaTexto:{flex:1},resumenEtiqueta:{color:'#7B7494',fontFamily:'Montserrat-Medium',fontSize:10},resumenValor:{color:'#1A1335',fontFamily:'MontserratAlternates-Bold',fontSize:13,marginTop:1},resumenTitulo:{color:'#1A1335',fontFamily:'MontserratAlternates-Bold',fontSize:20},paisajeRecordatorio:{bottom:112,height:205,left:0,position:'absolute',right:0,zIndex:0},arbolRecordatorio:{bottom:0,height:205,left:0,position:'absolute',resizeMode:'contain',width:185},arbustoRecordatorio:{bottom:48,height:145,position:'absolute',resizeMode:'contain',right:2,width:145},rutaNiveles:{gap:9},nivelRuta:{alignItems:'center',backgroundColor:'#FFFFFFA8',borderRadius:18,borderWidth:0,flexDirection:'row',minHeight:68,paddingHorizontal:12,paddingVertical:9},insigniaNivel:{alignItems:'center',height:50,justifyContent:'center',width:54},nivelRutaTexto:{flex:1,marginLeft:7},nivelRutaTitulo:{color:'#145C37',fontFamily:'MontserratAlternates-Bold',fontSize:15},nivelRutaDetalle:{color:'#4A7F5D',fontFamily:'Montserrat-Medium',fontSize:11,marginTop:2},nivelActual:{backgroundColor:'#D8F6D1',borderRadius:99,color:'#19673A',fontFamily:'MontserratAlternates-Bold',fontSize:10,paddingHorizontal:9,paddingVertical:5},gemasNivel:{alignItems:'center',flexDirection:'row',gap:3},gemaNivelIcono:{height:20,resizeMode:'contain',width:20},gemasNivelTexto:{color:'#6D28D9',fontFamily:'MontserratAlternates-Bold',fontSize:13},pie:{backgroundColor:'#F3FAF0',borderTopColor:'#E4DDF0',borderTopWidth:1,paddingHorizontal:22,paddingTop:22,zIndex:2}});
