import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Switch, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ReanimatedView, { Easing as EasingR, FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { Bell, Check, ChevronLeft, ChevronRight, Clock3, Plus, Search, Sparkles, X } from 'lucide-react-native';

import { Boton, formatoHora12, MasterChip, MasterColorProvider, MasterGlass, MasterIcon, RecuadroGlass, SelectorFechaCalendario, SelectorFranjaElemento, SelectorHora12, Texto, crearTonoMaster, useTonoMaster } from '../../../diseno';
import { TOPE_ESCALA_TEXTO_COMPACTO } from '../../../diseno/fundamentos/accesibilidad';
import { Rebote } from '../../../diseno/ui/Rebote';
import { sugerirFranjaPorHora, type FranjaDia } from '../../../compartido/utilidades/franjas';
import { usePerfilBasico } from '../../configuracion/usePerfilBasico';
import { useTranslation } from 'react-i18next';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { solicitarPermisoYRegistrar } from '../../../nucleo/notificaciones/oneSignal';
import { actualizarPreferenciaNotificacion } from '../../configuracion/configuracion.servicio';
import { GridIconosHabito } from '../../habitos/componentes/CrearHabitoWizard';
import { calcularLayoutTecladoWizard, type PlataformaTeclado } from '../../habitos/componentes/layoutTecladoWizard';
import { iconosHabitos } from '../../habitos/iconosHabitos';
import { obtenerAssetsPaqueteHabito, obtenerEtapaSietePaquete } from '../../habitos/paqueteVisual.assets';
import { obtenerPaqueteVisualHabito } from '../../habitos/paqueteVisual';
import { DIAS_POR_MAPA, RECOMPENSA_COFRE_FINAL } from '../../habitos/senderoNiveles';
import { obtenerColorMasterPaquete } from '../../habitos/temaPaqueteHabito';
import { colorMasterMasCercano } from '../../../diseno/componentes/MasterChanger';
import { asignarSemillaTarea, obtenerCatalogoArboles, obtenerSemillasDisponibles } from '../../tienda/gemas.servicio';
import { CLAVE_SEMILLAS_DISPONIBLES } from '../../tienda/pantallas/TiendaArbolesPantalla';
import { buscarPlantillasTareas, type PlantillaTarea } from '../plantillasTareas';
import type { CrearTareaPremiumInput } from '../tareas.servicio';
import { crearSubitemsTarea } from '../tareas.servicio';
import type { FrecuenciaTarea, TipoTarea } from '../tareas.tipos';
import { TarjetaSenderoTarea } from './TarjetaSenderoTarea';

// Wizard de creación de Tareas — mismo tipo de pantalla que CrearHabitoWizard
// (Modal full-screen, pasos con puntos de progreso, mismos sub-componentes
// reutilizables: Rebote, GridIconosHabito, calcularLayoutTecladoWizard), con
// tres diferencias de fondo:
//   1. Tema dorado fijo (PAQUETE_TAREAS_TEMA), no el tema global de la app —
//      mismo criterio que ya usa TareasPantalla.tsx.
//   2. El paso "Meta" elige uno de los 4 tipos REALES de tarea (simple/
//      checklist/contador/cronometro), no un tipoMeta de hábito.
//   3. La semilla (paso "Semilla") solo se ofrece para tipos con sendero de
//      días (simple/contador/cronometro) — checklist usa el sendero de pasos
//      de la Fase 7, que no crece ningún árbol, así que asignarle una semilla
//      la "gastaría" sin ningún beneficio visual. El paso de Crecimiento,
//      igual, solo aparece si además la frecuencia quedó en 'dias_semana'.
const OTRO_PLANTILLA_ID = 'otro-tarea';
const TIPOS_CON_SENDERO_DIAS: TipoTarea[] = ['simple', 'contador', 'cronometro'];
const PAQUETE_TEMA_WIZARD = 'golden';
const COLOR_TEMA_WIZARD = '#FFAE00';
const HORA_VALIDA_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

type ClavePaso = 'plantillas' | 'identidad' | 'meta' | 'semilla' | 'frecuencia' | 'recordatorio' | 'revision' | 'crecimiento';

const DIAS_SEMANA = [1, 2, 3, 4, 5, 6, 7];
const ETIQUETAS_DIA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function fechaISO(diasDesdeHoy: number): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + diasDesdeHoy);
  return fecha.toISOString().slice(0, 10);
}
const OPCIONES_FECHA: { etiqueta: string; valor: string | null }[] = [
  { etiqueta: 'Hoy', valor: fechaISO(0) },
  { etiqueta: 'Mañana', valor: fechaISO(1) },
  { etiqueta: 'En 7 días', valor: fechaISO(7) },
  { etiqueta: 'Sin fecha', valor: null },
];

const TIPOS_META: { id: TipoTarea; titulo: string; ejemplo: string; icono: string }[] = [
  { ejemplo: 'Un toque y listo', icono: 'tareas', id: 'simple', titulo: 'Simple' },
  { ejemplo: 'Varios pasos chicos', icono: 'metas', id: 'checklist', titulo: 'Checklist' },
  { ejemplo: '8 vasos de agua', icono: 'estadistica', id: 'contador', titulo: 'Contador' },
  { ejemplo: '20 minutos', icono: 'reloj', id: 'cronometro', titulo: 'Cronómetro' },
];

function RutaNivelesTarea({ colorMaster, objetivoValor, tipo, unidad }: { colorMaster: ReturnType<typeof obtenerColorMasterPaquete>; objetivoValor: string; tipo: TipoTarea; unidad: string }) {
  const tono = useTonoMaster();
  const base = Math.max(1, Number(objetivoValor) || 1);
  const unidadFinal = tipo === 'cronometro' ? 'min' : (unidad.trim() || 'veces');
  return (
    <View style={{ gap: 9 }}>
      {Array.from({ length: 7 }, (_, indice) => {
        const nivel = (indice + 1) as keyof typeof DIAS_POR_MAPA;
        // Mismo cálculo que registrar_progreso_tarea: objetivo_valor *= 1.15
        // por nivel (salvo tipo 'simple', que no escala).
        const metaNivel = tipo === 'simple' ? base : Math.round(base * 1.15 ** indice);
        const gemas = RECOMPENSA_COFRE_FINAL[nivel];
        const dias = DIAS_POR_MAPA[nivel];
        const detalle = tipo === 'simple' ? `${dias} días de constancia` : `${metaNivel} ${unidadFinal} · ${dias} días`;
        return (
          <ReanimatedView.View entering={FadeInDown.delay(indice * 70).duration(360).easing(EasingR.out(EasingR.cubic))} key={nivel}>
            <RecuadroGlass blur style={{ alignItems: 'center', backgroundColor: '#FFFFFFA8', borderRadius: 18, borderWidth: 0, flexDirection: 'row', minHeight: 68, paddingHorizontal: 12, paddingVertical: 9 }}>
              <View style={{ alignItems: 'center', height: 50, justifyContent: 'center', width: 54 }}>
                <MasterIcon color={colorMaster} hueDestino={tono.hueIcono} name={`nivel${nivel}`} oscurecido={1 - indice * 0.05} size={48} />
              </View>
              <View style={{ flex: 1, marginLeft: 7 }}>
                <Texto style={{ color: tono.tarjeta.tinta, fontFamily: 'MontserratAlternates-Bold', fontSize: 15 }}>Nivel {nivel}</Texto>
                <Texto style={{ color: tono.tarjeta.tintaMedia, fontFamily: 'Montserrat-Medium', fontSize: 12, marginTop: 2 }}>{detalle}</Texto>
              </View>
              {nivel === 1 ? (
                <Texto style={{ backgroundColor: '#FFF4D6', borderRadius: 99, color: '#92650A', fontFamily: 'MontserratAlternates-Bold', fontSize: 12, paddingHorizontal: 9, paddingVertical: 5 }}>Actual</Texto>
              ) : (
                <View style={{ alignItems: 'center', flexDirection: 'row', gap: 3 }}>
                  <Image source={require('../../../../assets/icons/hoy/gemas.png')} style={{ height: 20, resizeMode: 'contain', width: 20 }} />
                  <Texto style={{ color: '#6D28D9', fontFamily: 'MontserratAlternates-Bold', fontSize: 13 }}>+{gemas}</Texto>
                </View>
              )}
            </RecuadroGlass>
          </ReanimatedView.View>
        );
      })}
    </View>
  );
}

function EncabezadoPaso({ colorMaster, icono, subtitulo, titulo }: { colorMaster: ReturnType<typeof obtenerColorMasterPaquete>; icono: string; subtitulo: string; titulo: string }) {
  const tono = useTonoMaster();
  return (
    <View style={{ alignItems: 'center', flexDirection: 'row', gap: 11 }}>
      <MasterIcon color={colorMaster} hueDestino={tono.hueIcono} name={icono} size={52} />
      <View style={{ flex: 1, paddingTop: 1 }}>
        <Texto style={{ color: '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 28, lineHeight: 34 }}>{titulo}</Texto>
        <Texto style={{ color: '#7B7494', fontSize: 13, lineHeight: 19 }}>{subtitulo}</Texto>
      </View>
    </View>
  );
}

function PuntoProgreso({ activo, color }: { activo: boolean; color: string }) {
  return <View style={{ backgroundColor: activo ? color : '#DDD6E9', borderRadius: 4, flex: 1, height: 5 }} />;
}

const Campana = ({ size = 28 }: { size?: number }) => (
  <Image source={require('../../../../assets/icons/hoy/notificaciones.png')} style={{ height: size + 18, resizeMode: 'contain', width: size + 18 }} />
);

export function CrearTareaWizard({ visible, guardando, onCerrar, onCrear }: {
  visible: boolean;
  guardando: boolean;
  onCerrar: () => void;
  onCrear: (input: CrearTareaPremiumInput) => Promise<{ id: string }>;
}) {
  const cliente = useQueryClient();
  const [paso, setPaso] = useState(0);
  const [titulo, setTitulo] = useState('');
  const [iconoLucide, setIconoLucide] = useState(iconosHabitos[0].id);
  const [tipo, setTipo] = useState<TipoTarea>('simple');
  const [objetivoValor, setObjetivoValor] = useState('1');
  const [unidad, setUnidad] = useState('');
  const [pasosChecklist, setPasosChecklist] = useState<string[]>(['', '']);
  const [semillaSeleccionada, setSemillaSeleccionada] = useState<string | null>(null);
  const [frecuencia, setFrecuencia] = useState<FrecuenciaTarea>('dias_semana');
  const [diasSemana, setDiasSemana] = useState<number[]>(DIAS_SEMANA);
  const [fechaVencimiento, setFechaVencimiento] = useState<string | null>(OPCIONES_FECHA[0].valor);
  const [fechaPersonalizada, setFechaPersonalizada] = useState(false);
  const [recordatorioActivo, setRecordatorioActivo] = useState(false);
  const [hora, setHora] = useState('08:00');
  const [horaPersonalizada, setHoraPersonalizada] = useState(false);
  const [franja, setFranja] = useState<FranjaDia>('cualquier_momento');
  const [franjaManual, setFranjaManual] = useState(false);
  const { limitesFranja } = usePerfilBasico();
  const [mostrarNombre, setMostrarNombre] = useState(true);
  const [plantillaId, setPlantillaId] = useState<string | null>(null);
  const [buscarPlantilla, setBuscarPlantilla] = useState('');
  const [preparando, setPreparando] = useState(false);
  const [errorCrear, setErrorCrear] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [tecladoVisible, setTecladoVisible] = useState(false);
  const [altoFooter, setAltoFooter] = useState(96);

  const { t } = useTranslation();

  const layoutTeclado = calcularLayoutTecladoWizard({
    altoFooter, plataforma: Platform.OS as PlataformaTeclado, safeAreaBottom: 0, tecladoVisible,
  });

  useEffect(() => {
    const showSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setTecladoVisible(true));
    const hideSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setTecladoVisible(false));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  // Mismo motivo que CrearHabitoWizard: sin el permiso + la preferencia
  // global habilitada, el recordatorio queda prendido en la UI pero
  // reclamar_recordatorios_tareas nunca lo manda.
  useEffect(() => {
    if (!recordatorioActivo) return;
    void solicitarPermisoYRegistrar().then((resultado) => {
      if (resultado.estado !== 'concedido') { setRecordatorioActivo(false); return; }
      void actualizarPreferenciaNotificacion('tarea_recordatorio', true).catch(() => undefined);
    }).catch(() => setRecordatorioActivo(false));
  }, [recordatorioActivo]);

  useEffect(() => {
    if (recordatorioActivo && !franjaManual) {
      const sugerida = sugerirFranjaPorHora(hora, limitesFranja);
      if (sugerida) setFranja(sugerida);
    }
  }, [recordatorioActivo, hora, franjaManual, limitesFranja]);

  // El Modal no desmonta sus hijos al ocultarse — se reinicia TODO el estado
  // transitorio al cerrar, mismo motivo (y mismo bug evitado) que en
  // CrearHabitoWizard.
  useEffect(() => {
    if (visible) return;
    setPaso(0);
    setTitulo('');
    setIconoLucide(iconosHabitos[0].id);
    setTipo('simple');
    setObjetivoValor('1');
    setUnidad('');
    setPasosChecklist(['', '']);
    setSemillaSeleccionada(null);
    setFrecuencia('dias_semana');
    setDiasSemana(DIAS_SEMANA);
    setFechaVencimiento(OPCIONES_FECHA[0].valor);
    setRecordatorioActivo(false);
    setHora('08:00');
    setHoraPersonalizada(false);
    setFranja('cualquier_momento');
    setFranjaManual(false);
    setMostrarNombre(true);
    setPlantillaId(null);
    setBuscarPlantilla('');
    setPreparando(false);
    setErrorCrear(null);
  }, [visible]);

  const consultaSemillas = useQuery({ enabled: visible, queryKey: CLAVE_SEMILLAS_DISPONIBLES, queryFn: obtenerSemillasDisponibles });
  const consultaPaquetesArbol = useQuery({ enabled: visible, queryKey: ['tienda', 'catalogoArboles'], queryFn: obtenerCatalogoArboles });
  const paquetePorId = useMemo(() => new Map((consultaPaquetesArbol.data ?? []).map((paquete) => [paquete.id, paquete])), [consultaPaquetesArbol.data]);
  const semillasPorPaquete = useMemo(() => {
    const agrupadas = new Map<string, string[]>();
    for (const semilla of consultaSemillas.data ?? []) {
      const lista = agrupadas.get(semilla.paqueteId) ?? [];
      lista.push(semilla.id);
      agrupadas.set(semilla.paqueteId, lista);
    }
    return [...agrupadas.entries()]
      .map(([paqueteId, semillaIds]) => ({ paquete: paquetePorId.get(paqueteId), semillaIds }))
      .filter((grupo): grupo is { paquete: NonNullable<typeof grupo.paquete>; semillaIds: string[] } => Boolean(grupo.paquete))
      .sort((a, b) => colorMasterMasCercano(a.paquete.masterPackColor) - colorMasterMasCercano(b.paquete.masterPackColor));
  }, [consultaSemillas.data, paquetePorId]);
  const semillaInfo = useMemo(() => (consultaSemillas.data ?? []).find((semilla) => semilla.id === semillaSeleccionada), [consultaSemillas.data, semillaSeleccionada]);
  const paqueteSeleccionado = semillaInfo ? paquetePorId.get(semillaInfo.paqueteId) : undefined;

  // Sendero de días (Fase 8): solo simple/contador/cronometro, nunca
  // checklist (que ya tiene su propio sendero de pasos sin árbol, Fase 7).
  const tieneSenderoDias = TIPOS_CON_SENDERO_DIAS.includes(tipo);

  const pasosVisibles = useMemo(() => {
    const lista: ClavePaso[] = ['plantillas', 'identidad', 'meta'];
    if (tieneSenderoDias) lista.push('semilla');
    lista.push('frecuencia', 'recordatorio', 'revision');
    if (tieneSenderoDias && frecuencia === 'dias_semana') lista.push('crecimiento');
    return lista;
  }, [tieneSenderoDias, frecuencia]);
  useEffect(() => {
    if (paso > pasosVisibles.length - 1) setPaso(pasosVisibles.length - 1);
  }, [pasosVisibles, paso]);
  const claveActual = pasosVisibles[paso] ?? 'plantillas';
  const esUltimoPaso = paso === pasosVisibles.length - 1;

  // Tema dorado fijo del wizard; el de la semilla elegida (si hay) lo
  // reemplaza — mismo mecanismo que CrearHabitoWizard con MasterColorProvider.
  const tonoWizard = useMemo(() => crearTonoMaster(PAQUETE_TEMA_WIZARD, COLOR_TEMA_WIZARD), []);
  const tono = useMemo(() => paqueteSeleccionado ? crearTonoMaster(paqueteSeleccionado.id, paqueteSeleccionado.masterPackColor) : tonoWizard, [paqueteSeleccionado, tonoWizard]);
  const color = tono.acento;
  const colorMaster = useMemo(() => obtenerColorMasterPaquete(color), [color]);
  const paqueteVisual = useMemo(() => obtenerPaqueteVisualHabito(paqueteSeleccionado?.id ?? PAQUETE_TEMA_WIZARD), [paqueteSeleccionado]);
  const arbolPaqueteVisual = useMemo(() => obtenerEtapaSietePaquete(paqueteVisual.id), [paqueteVisual.id]);
  const assetsPaquete = useMemo(() => obtenerAssetsPaqueteHabito(paqueteVisual.id, 1), [paqueteVisual.id]);

  const etiquetaIcono = (id: string, etiquetaPredeterminada: string) => etiquetaPredeterminada;
  const plantillasFiltradas = useMemo(() => buscarPlantillasTareas(buscarPlantilla), [buscarPlantilla]);
  const pasosValidos = pasosChecklist.map((p) => p.trim()).filter((p) => p.length > 0);
  const horaValida = HORA_VALIDA_REGEX.test(hora);

  const puedeContinuar = (() => {
    switch (claveActual) {
      case 'plantillas': return plantillaId !== null;
      case 'identidad': return titulo.trim().length > 0;
      case 'meta':
        if (tipo === 'checklist') return pasosValidos.length > 0;
        if (tipo === 'contador' || tipo === 'cronometro') return Number(objetivoValor) > 0;
        return true;
      case 'frecuencia': return frecuencia === 'una_vez' || diasSemana.length > 0;
      case 'recordatorio': return !recordatorioActivo || horaValida;
      default: return true;
    }
  })();

  const elegirPlantilla = (plantilla: PlantillaTarea) => {
    hapticSeguro('seleccion');
    setPlantillaId(plantilla.iconoId);
    setIconoLucide(plantilla.iconoId);
    setTitulo(plantilla.titulo);
    setTipo(plantilla.tipo);
    setObjetivoValor(String(plantilla.objetivoValor ?? 1));
    setUnidad(plantilla.unidad ?? '');
    if (plantilla.pasos) setPasosChecklist(plantilla.pasos);
    setTimeout(() => setPaso(1), 260);
  };
  const elegirPersonalizada = () => { hapticSeguro('seleccion'); setPlantillaId(OTRO_PLANTILLA_ID); setTimeout(() => setPaso(1), 200); };

  function toggleDia(dia: number) {
    setDiasSemana((actual) => (actual.includes(dia) ? actual.filter((x) => x !== dia) : [...actual, dia].sort()));
  }
  function actualizarPasoChecklist(indice: number, texto: string) {
    setPasosChecklist((actual) => actual.map((p, i) => (i === indice ? texto : p)));
  }
  function quitarPasoChecklist(indice: number) {
    setPasosChecklist((actual) => (actual.length > 1 ? actual.filter((_, i) => i !== indice) : actual));
  }
  const desplazarAlFoco = () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 260);

  const descripcionMeta = tipo === 'simple'
    ? 'Un toque y listo'
    : tipo === 'checklist'
      ? `${pasosValidos.length || pasosChecklist.length} pasos`
      : tipo === 'contador'
        ? `${objetivoValor || 1} ${unidad.trim() || 'veces'}`
        : `${objetivoValor || 1} min`;
  const descripcionFrecuencia = frecuencia === 'una_vez'
    ? (fechaVencimiento ? `Una vez · ${fechaVencimiento}` : 'Una vez, sin fecha')
    : diasSemana.length === 7 ? 'Todos los días' : `${diasSemana.length} días por semana`;

  const etiquetasFranja = useMemo<Record<FranjaDia, string>>(() => ({
    manana: t('franjas.manana'),
    tarde: t('franjas.tarde'),
    noche: t('franjas.noche'),
    cualquier_momento: t('franjas.cualquier_momento'),
  }), [t]);

  async function guardar() {
    setErrorCrear(null);
    setPreparando(true);
    try {
      const resultado = await onCrear({
        color: paqueteSeleccionado ? color : null,
        diasSemana: frecuencia === 'dias_semana' ? diasSemana : null,
        fechaVencimiento: frecuencia === 'una_vez' ? fechaVencimiento : null,
        frecuencia,
        franja,
        horaRecordatorio: recordatorioActivo ? hora : null,
        iconoLucide,
        mostrarNombreNotificacion: mostrarNombre,
        nivelInicial: 1,
        objetivoValor: tipo === 'contador' || tipo === 'cronometro' ? Math.max(1, Number(objetivoValor) || 1) : 1,
        paqueteId: null,
        recordatorioActivo,
        tipo,
        titulo: titulo.trim(),
        unidad: tipo === 'contador' || tipo === 'cronometro' ? unidad.trim() || null : null,
      });
      if (tipo === 'checklist' && pasosValidos.length > 0) {
        await crearSubitemsTarea(resultado.id, pasosValidos);
      }
      if (semillaSeleccionada) {
        await asignarSemillaTarea(semillaSeleccionada, resultado.id);
        cliente.invalidateQueries({ queryKey: CLAVE_SEMILLAS_DISPONIBLES });
      }
      // Recién ahora está todo escrito (tarea + pasos + semilla) — se
      // invalida de nuevo (la mutación del padre ya invalidó justo después
      // de crear la tarea base, antes de que esto terminara) y se cierra.
      cliente.invalidateQueries({ queryKey: ['tareas'] });
      setPreparando(false);
      onCerrar();
    } catch (error) {
      setPreparando(false);
      setErrorCrear(error instanceof Error ? error.message : 'No pudimos crear la tarea.');
    }
  }

  return (
    <Modal animationType="slide" onRequestClose={onCerrar} visible={visible}>
      <SafeAreaProvider>
        <MasterColorProvider tono={tono}>
          <KeyboardAvoidingView behavior={layoutTeclado.behavior} style={{ flex: 1 }}>
            <View style={{ backgroundColor: '#FFFBF0', flex: 1 }}>
              <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', padding: 22, paddingTop: 55, zIndex: 1 }}>
                <Pressable onPress={() => { hapticSeguro('seleccion'); paso ? setPaso(paso - 1) : onCerrar(); }}>
                  <ChevronLeft color="#1A1335" size={26} />
                </Pressable>
                <Texto style={{ color: '#7B7494', fontFamily: 'Montserrat-Bold' }}>{paso + 1} de {pasosVisibles.length}</Texto>
                <Pressable onPress={onCerrar}><Texto style={{ color: '#7C3AED', fontFamily: 'Montserrat-Bold' }}>Cancelar</Texto></Pressable>
              </View>
              <View style={{ flexDirection: 'row', gap: 5, paddingHorizontal: 22, zIndex: 1 }}>
                {pasosVisibles.map((_, i) => <PuntoProgreso activo={i <= paso} color={color} key={i} />)}
              </View>

              <ScrollView
                contentContainerStyle={{ gap: 14, padding: 24, paddingBottom: layoutTeclado.paddingBottomScroll, paddingTop: 38 }}
                keyboardShouldPersistTaps={layoutTeclado.keyboardShouldPersistTaps}
                ref={scrollRef}
                showsVerticalScrollIndicator={false}
                style={{ flex: 1, zIndex: 1 }}
              >
                <ReanimatedView.View entering={FadeIn.duration(260).easing(EasingR.out(EasingR.cubic))} key={claveActual} style={{ gap: 14 }}>

                {claveActual === 'plantillas' && (
                  <>
                    <EncabezadoPaso colorMaster={colorMaster} icono="idea" subtitulo="Elegí una plantilla y la dejamos lista — podés ajustar todo después." titulo="¿Qué necesitás hacer?" />
                    <RecuadroGlass blur style={{ alignItems: 'center', backgroundColor: '#FFFFFFB8', borderColor: '#E4DDF0', borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 9, paddingHorizontal: 14, paddingVertical: 12 }}>
                      <Search color="#7B7494" size={18} />
                      <TextInput keyboardAppearance="light" maxFontSizeMultiplier={TOPE_ESCALA_TEXTO_COMPACTO} onChangeText={setBuscarPlantilla} placeholder="Buscar… ej. agua, leer, viaje" style={{ color: '#1A1335', flex: 1, fontSize: 14, padding: 0 }} value={buscarPlantilla} />
                    </RecuadroGlass>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {plantillasFiltradas.map((plantilla) => {
                        const iconoPlantilla = iconosHabitos.find((x) => x.id === plantilla.iconoId);
                        const activa = plantillaId === plantilla.iconoId;
                        return (
                          <Rebote
                            key={plantilla.iconoId}
                            estilo={[{ backgroundColor: '#FFFFFFB8', borderColor: '#E4DDF0', borderRadius: 16, borderWidth: 1, justifyContent: 'center', minHeight: 112, padding: 10, position: 'relative', width: '31%' }, activa && { backgroundColor: `${color}12`, borderColor: color }]}
                            onPress={() => elegirPlantilla(plantilla)}
                          >
                            <View style={{ alignItems: 'center', width: '100%' }}>
                              <View style={{ alignItems: 'center', height: 56, justifyContent: 'center', marginBottom: 6, width: 56 }}>
                                {iconoPlantilla ? <MasterIcon name={iconoPlantilla.id} size={50} /> : <Sparkles color={color} size={40} />}
                              </View>
                              <Texto numberOfLines={2} style={{ color: '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 12, lineHeight: 16, textAlign: 'center' }}>{plantilla.titulo}</Texto>
                            </View>
                            {activa && <View style={{ alignItems: 'center', backgroundColor: color, borderRadius: 9, height: 18, justifyContent: 'center', position: 'absolute', right: 6, top: 6, width: 18 }}><Check color="#fff" size={10} /></View>}
                          </Rebote>
                        );
                      })}
                      {plantillasFiltradas.length === 0 && <Texto style={{ color: '#7B7494', fontSize: 12, paddingVertical: 14, textAlign: 'center', width: '100%' }}>No encontramos nada — probá "Personalizada" abajo.</Texto>}
                    </View>
                    <Rebote
                      estilo={[{ alignItems: 'center', backgroundColor: '#FFFFFFB8', borderColor: '#E4DDF0', borderRadius: 18, borderWidth: 1, flexDirection: 'row', minHeight: 82, padding: 11, position: 'relative' }, plantillaId === OTRO_PLANTILLA_ID && { backgroundColor: `${color}12`, borderColor: color }]}
                      onPress={elegirPersonalizada}
                    >
                      <View style={{ alignItems: 'center', height: 66, justifyContent: 'center', width: 66 }}><Sparkles color={color} size={30} /></View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Texto style={{ color: '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 16 }}>Personalizada</Texto>
                        <Texto style={{ color: '#7B7494', fontSize: 12, marginTop: 2 }}>Ninguna plantilla encaja — la armo yo mismo.</Texto>
                      </View>
                      {plantillaId === OTRO_PLANTILLA_ID && <View style={{ alignItems: 'center', backgroundColor: color, borderRadius: 11, height: 22, justifyContent: 'center', position: 'absolute', right: 12, top: 12, width: 22 }}><Check color="#fff" size={12} /></View>}
                    </Rebote>
                  </>
                )}

                {claveActual === 'identidad' && (
                  <>
                    <EncabezadoPaso colorMaster={colorMaster} icono="idea" subtitulo="El nombre y el ícono que vas a ver cada vez." titulo="¿Cómo se llama?" />
                    <TextInput autoFocus keyboardAppearance="light" maxFontSizeMultiplier={TOPE_ESCALA_TEXTO_COMPACTO} onChangeText={setTitulo} placeholder="Ej. Tomar agua" style={{ backgroundColor: '#fff', borderColor: '#E4DDF0', borderRadius: 16, borderWidth: 1, color: '#1A1335', fontSize: 16, padding: 15 }} value={titulo} />
                    <View>
                      <Texto style={{ color: '#554E68', fontFamily: 'Montserrat-Bold', fontSize: 13, marginTop: 4 }}>Elegí un ícono</Texto>
                      <GridIconosHabito color={color} etiquetaIcono={etiquetaIcono} iconoSeleccionado={iconoLucide} onElegir={setIconoLucide} />
                    </View>
                  </>
                )}

                {claveActual === 'meta' && (
                  <>
                    <EncabezadoPaso colorMaster={colorMaster} icono="metas" subtitulo="Cómo se completa esta tarea." titulo="Tipo de tarea" />
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                      {TIPOS_META.map((x) => (
                        <Rebote key={x.id} estilo={{ width: '47%' }} onPress={() => { hapticSeguro('seleccion'); setTipo(x.id); }}>
                          <MasterGlass style={[{ alignItems: 'center', justifyContent: 'center', minHeight: 150, padding: 12, position: 'relative' }, tipo === x.id && { backgroundColor: `${color}12`, borderColor: color }]}>
                            <View style={{ alignItems: 'center', height: 80, justifyContent: 'center', marginBottom: 6, width: 80 }}>
                              <MasterIcon color={colorMaster} hueDestino={tono.hueIcono} name={x.icono} size={60} />
                            </View>
                            <Texto style={{ color: '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 14, textAlign: 'center' }}>{x.titulo}</Texto>
                            <Texto numberOfLines={1} style={{ color: '#7B7494', fontSize: 12, marginTop: 2, textAlign: 'center' }}>{x.ejemplo}</Texto>
                            {tipo === x.id && <View style={{ alignItems: 'center', backgroundColor: color, borderRadius: 9, height: 18, justifyContent: 'center', position: 'absolute', right: 6, top: 6, width: 18 }}><Check color="#fff" size={10} /></View>}
                          </MasterGlass>
                        </Rebote>
                      ))}
                    </View>

                    {tipo === 'checklist' && (
                      <ReanimatedView.View entering={FadeInDown.duration(240).easing(EasingR.out(EasingR.cubic))} exiting={FadeOut.duration(160)} style={{ gap: 8 }}>
                        <Texto style={{ color: '#554E68', fontFamily: 'Montserrat-Bold', fontSize: 13 }}>Pasos</Texto>
                        <Texto style={{ color: '#7B7494', fontSize: 12 }}>Cada uno se convierte en una parada de su propio sendero.</Texto>
                        {pasosChecklist.map((p, indice) => (
                          <View key={indice} style={{ alignItems: 'center', flexDirection: 'row', gap: 8 }}>
                            <TextInput
                              keyboardAppearance="light"
                              maxFontSizeMultiplier={TOPE_ESCALA_TEXTO_COMPACTO}
                              onChangeText={(texto) => actualizarPasoChecklist(indice, texto)}
                              onFocus={desplazarAlFoco}
                              placeholder={`Paso ${indice + 1}`}
                              style={{ backgroundColor: '#F5F3F9', borderRadius: 12, color: '#1A1335', flex: 1, fontFamily: 'Montserrat-Medium', fontSize: 14, padding: 12 }}
                              value={p}
                            />
                            {pasosChecklist.length > 1 && (
                              <Rebote onPress={() => quitarPasoChecklist(indice)} estilo={{ alignItems: 'center', height: 32, justifyContent: 'center', width: 32 }}>
                                <X color="#9A93A8" size={18} />
                              </Rebote>
                            )}
                          </View>
                        ))}
                        <Rebote onPress={() => setPasosChecklist((actual) => [...actual, ''])} estilo={{ alignItems: 'center', flexDirection: 'row', gap: 6, paddingVertical: 4 }}>
                          <Plus color="#5B21B6" size={16} /><Texto style={{ color: '#5B21B6', fontFamily: 'Montserrat-Bold', fontSize: 12 }}>Agregar paso</Texto>
                        </Rebote>
                      </ReanimatedView.View>
                    )}

                    {(tipo === 'contador' || tipo === 'cronometro') && (
                      <ReanimatedView.View entering={FadeInDown.duration(240).easing(EasingR.out(EasingR.cubic))} exiting={FadeOut.duration(160)} style={{ gap: 10 }}>
                        <MasterGlass style={{ borderRadius: 16 }}>
                          <TextInput keyboardAppearance="light" keyboardType="decimal-pad" maxFontSizeMultiplier={TOPE_ESCALA_TEXTO_COMPACTO} onChangeText={setObjetivoValor} onFocus={desplazarAlFoco} placeholder={tipo === 'cronometro' ? '20' : '8'} style={{ backgroundColor: '#fff', borderColor: '#E4DDF0', borderRadius: 16, borderWidth: 1, color: '#1A1335', fontSize: 16, padding: 15 }} value={objetivoValor} />
                        </MasterGlass>
                        {tipo === 'contador' && (
                          <MasterGlass style={{ borderRadius: 16 }}>
                            <TextInput keyboardAppearance="light" maxFontSizeMultiplier={TOPE_ESCALA_TEXTO_COMPACTO} onChangeText={setUnidad} onFocus={desplazarAlFoco} placeholder="vasos, páginas, veces…" style={{ backgroundColor: '#fff', borderColor: '#E4DDF0', borderRadius: 16, borderWidth: 1, color: '#1A1335', fontSize: 16, padding: 15 }} value={unidad} />
                          </MasterGlass>
                        )}
                        {tipo === 'cronometro' && <Texto style={{ color: '#7B7494', fontSize: 12 }}>En minutos.</Texto>}
                      </ReanimatedView.View>
                    )}
                  </>
                )}

                {claveActual === 'semilla' && (
                  <>
                    <EncabezadoPaso colorMaster={colorMaster} icono="idea" subtitulo="Esta tarea va a tener su propio árbol — elegí con qué semilla plantarlo." titulo="Elegí una semilla" />
                    {semillasPorPaquete.length > 0 ? (
                      <ScrollView contentContainerStyle={{ flexDirection: 'row', gap: 10, paddingVertical: 4 }} horizontal showsHorizontalScrollIndicator={false}>
                        {semillasPorPaquete.map(({ paquete, semillaIds }) => {
                          const activa = semillaIds.includes(semillaSeleccionada ?? '');
                          return (
                            <Rebote
                              key={paquete.id}
                              onPress={() => setSemillaSeleccionada(activa ? null : semillaIds[0])}
                              estilo={[{ alignItems: 'center', backgroundColor: paquete.masterPackColor, borderRadius: 999, height: 44, justifyContent: 'center', width: 44 }, activa && { borderColor: '#1A1335', borderWidth: 3 }]}
                            >
                              {activa && <Check color="#fff" size={18} strokeWidth={3} />}
                            </Rebote>
                          );
                        })}
                      </ScrollView>
                    ) : (
                      <Texto style={{ color: '#7B7494', fontSize: 13 }}>Todavía no tenés semillas disponibles — esta tarea va a crecer con el árbol gratuito. Podés comprar semillas en la Tienda y asignarla más adelante.</Texto>
                    )}
                    <MasterGlass style={{ alignItems: 'center', flexDirection: 'row', gap: 10, paddingHorizontal: 11, paddingVertical: 11 }}>
                      <Image source={arbolPaqueteVisual} style={{ height: 56, resizeMode: 'contain', width: 48 }} />
                      <View>
                        <Texto style={{ color, fontFamily: 'Montserrat-Bold', fontSize: 14 }}>{paqueteVisual.nombre}</Texto>
                        <Texto style={{ color: '#7B7494', fontSize: 13, lineHeight: 19 }}>Así se va a ver tu sendero.</Texto>
                      </View>
                    </MasterGlass>
                  </>
                )}

                {claveActual === 'frecuencia' && (
                  <>
                    <EncabezadoPaso colorMaster={colorMaster} icono="calendario" subtitulo="¿Una vez, o se repite?" titulo="¿Cuándo?" />
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {(['una_vez', 'dias_semana'] as const).map((opcion) => (
                        <MasterChip activo={frecuencia === opcion} key={opcion} onPress={() => { hapticSeguro('seleccion'); setFrecuencia(opcion); }} texto={opcion === 'una_vez' ? 'Una vez' : 'Días de la semana'} />
                      ))}
                    </View>
                    {frecuencia === 'una_vez' ? (
                      <>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                          {OPCIONES_FECHA.map((opcion) => {
                            const activa = !fechaPersonalizada && fechaVencimiento === opcion.valor;
                            return (
                              <Rebote key={opcion.etiqueta} onPress={() => { setFechaPersonalizada(false); setFechaVencimiento(opcion.valor); }} estilo={{ backgroundColor: activa ? '#1A1335' : '#F5F3F9', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 }}>
                                <Texto style={{ color: activa ? '#FFFFFF' : '#554E68', fontFamily: 'Montserrat-Bold', fontSize: 12 }}>{opcion.etiqueta}</Texto>
                              </Rebote>
                            );
                          })}
                          <Rebote onPress={() => setFechaPersonalizada((valor) => !valor)} estilo={{ alignItems: 'center', backgroundColor: fechaPersonalizada ? `${color}16` : '#F5F3F9', borderRadius: 999, flexDirection: 'row', gap: 6, paddingHorizontal: 14, paddingVertical: 9 }}>
                            <MasterIcon name="calendario" size={14} />
                            <Texto style={{ color: '#554E68', fontFamily: 'Montserrat-Bold', fontSize: 12 }}>Elegir fecha</Texto>
                          </Rebote>
                        </View>
                        {fechaPersonalizada && (
                          <ReanimatedView.View entering={FadeIn.duration(220)}>
                            <RecuadroGlass blur style={{ borderRadius: 18, borderWidth: 0, padding: 14 }}>
                              <SelectorFechaCalendario color={color} fechaSeleccionada={fechaVencimiento} onSeleccionar={setFechaVencimiento} />
                            </RecuadroGlass>
                          </ReanimatedView.View>
                        )}
                      </>
                    ) : (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        {DIAS_SEMANA.map((dia, indice) => {
                          const activo = diasSemana.includes(dia);
                          return (
                            <Rebote key={dia} onPress={() => toggleDia(dia)} estilo={[{ alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 15, height: 58, justifyContent: 'center', width: 38 }, activo && { backgroundColor: color }]}>
                              <Texto style={[{ color: '#6F687F', fontFamily: 'Montserrat-Bold', fontSize: 12 }, activo && { color: '#FFFFFF' }]}>{ETIQUETAS_DIA[indice]}</Texto>
                              <View style={[{ backgroundColor: 'rgba(111,104,127,.18)', borderRadius: 3, height: 5, marginTop: 5, width: 5 }, activo && { backgroundColor: '#FFFFFF' }]} />
                            </Rebote>
                          );
                        })}
                      </View>
                    )}
                  </>
                )}

                {claveActual === 'recordatorio' && (
                  <>
                    <EncabezadoPaso colorMaster={colorMaster} icono="reloj" subtitulo="Te avisamos a la hora que elijas." titulo="Recordatorio" />
                    <RecuadroGlass blur style={{ borderRadius: 24, borderWidth: 0, padding: 16 }}>
                      <View style={{ alignItems: 'center', flexDirection: 'row' }}>
                        <View style={{ alignItems: 'center', height: 62, justifyContent: 'center', width: 62 }}><Campana size={40} /></View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Texto style={{ color: '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 16 }}>Recordatorio diario</Texto>
                          <Texto style={{ color: '#7B7494', fontSize: 13, lineHeight: 19 }}>{recordatorioActivo ? 'Te vamos a avisar.' : 'Sin recordatorio por ahora.'}</Texto>
                        </View>
                        <Switch onValueChange={(valor) => { hapticSeguro('seleccion'); setRecordatorioActivo(valor); }} value={recordatorioActivo} />
                      </View>
                      {recordatorioActivo && (
                        <ReanimatedView.View entering={FadeInDown.duration(280).easing(EasingR.out(EasingR.cubic))} style={{ gap: 13, marginTop: 18 }}>
                          <Texto style={{ color: '#554E68', fontFamily: 'Montserrat-Bold', fontSize: 13 }}>Elegí una hora</Texto>
                          <View style={{ flexDirection: 'row', gap: 8 }}>
                            {['08:00', '13:00', '20:00'].map((valor) => (
                              <Rebote key={valor} onPress={() => { setHora(valor); setHoraPersonalizada(false); }} estilo={{ backgroundColor: !horaPersonalizada && hora === valor ? color : '#FFFFFF', borderRadius: 13, flex: 1, paddingVertical: 10 }}>
                                <Texto style={{ color: !horaPersonalizada && hora === valor ? '#FFFFFF' : '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 12, textAlign: 'center' }}>{formatoHora12(valor)}</Texto>
                              </Rebote>
                            ))}
                          </View>
                          <Rebote onPress={() => setHoraPersonalizada(true)} estilo={{ alignItems: 'center', backgroundColor: horaPersonalizada ? `${color}16` : '#FFFFFF', borderRadius: 14, flexDirection: 'row', gap: 9, justifyContent: 'center', paddingVertical: 12 }}>
                            <Clock3 color={color} size={17} /><Texto style={{ color: '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 13 }}>Otra hora</Texto>
                          </Rebote>
                          {horaPersonalizada && (
                            <ReanimatedView.View entering={FadeIn.duration(220)}>
                              <RecuadroGlass blur style={{ borderRadius: 16, borderWidth: 0, padding: 13 }}>
                                <SelectorHora12 hora={hora} onCambiar={setHora} />
                              </RecuadroGlass>
                            </ReanimatedView.View>
                          )}
                          <Texto style={{ color: '#554E68', fontFamily: 'Montserrat-Bold', fontSize: 13 }}>{t('franjas.titulo')}</Texto>
                          <SelectorFranjaElemento
                            color={color}
                            etiquetas={etiquetasFranja}
                            onCambiar={(f) => {
                              setFranja(f);
                              setFranjaManual(true);
                            }}
                            valor={franja}
                          />
                          <RecuadroGlass blur style={{ borderRadius: 15, borderWidth: 0, padding: 12 }}>
                            <View style={{ alignItems: 'center', flexDirection: 'row' }}>
                              <View style={{ flex: 1 }}>
                                <Texto style={{ color: '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 13 }}>Incluir el nombre</Texto>
                                <Texto style={{ color: '#7B7494', fontSize: 11 }}>{mostrarNombre ? `"${titulo.trim() || 'Tu tarea'}" en la notificación` : 'Notificación genérica'}</Texto>
                              </View>
                              <Switch onValueChange={setMostrarNombre} value={mostrarNombre} />
                            </View>
                          </RecuadroGlass>
                        </ReanimatedView.View>
                      )}
                    </RecuadroGlass>
                  </>
                )}

                {claveActual === 'revision' && (
                  <>
                    <EncabezadoPaso colorMaster={colorMaster} icono="trofeo" subtitulo="Así queda tu tarea." titulo="Todo listo" />
                    <TarjetaSenderoTarea
                      arbol={tieneSenderoDias ? assetsPaquete.arbolPrincipal : undefined}
                      descripcionFrecuencia={descripcionFrecuencia}
                      descripcionMeta={descripcionMeta}
                      icono={{ fuente: iconosHabitos.find((x) => x.id === iconoLucide)?.fuente ?? iconosHabitos[0].fuente }}
                      titulo={titulo.trim()}
                    />
                    {errorCrear && <Texto style={{ color: '#B64747', fontFamily: 'Montserrat-Bold', fontSize: 12, marginTop: 12, textAlign: 'center' }}>{errorCrear}</Texto>}
                  </>
                )}

                {claveActual === 'crecimiento' && (
                  <>
                    <EncabezadoPaso colorMaster={colorMaster} icono="trofeo" subtitulo="Cada nivel te acerca a un árbol más grande." titulo="Cómo crece" />
                    <RutaNivelesTarea colorMaster={colorMaster} objetivoValor={objetivoValor} tipo={tipo} unidad={unidad} />
                    {errorCrear && <Texto style={{ color: '#B64747', fontFamily: 'Montserrat-Bold', fontSize: 12, marginTop: 12, textAlign: 'center' }}>{errorCrear}</Texto>}
                  </>
                )}

                </ReanimatedView.View>
              </ScrollView>

              <ReanimatedView.View onLayout={(e) => setAltoFooter(e.nativeEvent.layout.height)} style={{ backgroundColor: '#FFFBF0', borderTopColor: '#E4DDF0', borderTopWidth: 1, paddingHorizontal: 22, paddingTop: 22, zIndex: 2 }}>
                <SafeAreaView edges={['bottom']}>
                  <Boton
                    color={color}
                    disabled={!puedeContinuar || guardando || preparando}
                    iconoIzquierda={esUltimoPaso ? Check : ChevronRight}
                    onPress={() => (esUltimoPaso ? void guardar() : setPaso(paso + 1))}
                    variante="sendero"
                  >
                    {guardando || preparando ? 'Creando…' : esUltimoPaso ? 'Crear tarea' : 'Continuar'}
                  </Boton>
                </SafeAreaView>
              </ReanimatedView.View>
            </View>
          </KeyboardAvoidingView>
        </MasterColorProvider>
      </SafeAreaProvider>
    </Modal>
  );
}
