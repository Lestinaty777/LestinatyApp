import type { LucideIcon } from 'lucide-react-native';
import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Flame,
  Leaf,
  List,
  Moon,
  PiggyBank,
  Repeat2,
  Sparkles,
} from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Reanimated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { RecuadroGlass, Texto, biomas, colores, espaciado } from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';

const Bioma = biomas.inicio;

type EstadoActivo = 'toca-hoy' | 'proximo' | 'en-riesgo' | 'duerme-hoy';
type FiltroActivo = 'todos' | EstadoActivo;

type SenderoActivo = {
  acento: string;
  analitica: string;
  categoria: string;
  estado: EstadoActivo;
  frecuencia: string;
  Icono: LucideIcon;
  id: string;
  metadata: string[];
  proximo: string;
  titulo: string;
  ultimaActividad: string;
  panel: {
    layout: 'dominante' | 'equilibrado';
    progreso: number;
    progresoEtiqueta: string;
    racha: string;
    rachaEtiqueta: string;
    serie: number[];
    tendencia: string;
  };
  widgets: { etiqueta: string; valor: string }[];
};

const senderosActivos: SenderoActivo[] = [
  {
    acento: '#1463FF',
    analitica: '68% consistencia',
    categoria: 'Rutinas',
    estado: 'proximo',
    frecuencia: 'Mie/Vie',
    Icono: Repeat2,
    id: 'rutina-brazo',
    metadata: ['Proximo: viernes', '45 min', '2 bloques'],
    proximo: 'Viernes',
    titulo: 'Rutina de brazo',
    ultimaActividad: 'Ayer',
    panel: { layout: 'dominante', progreso: 68, progresoEtiqueta: 'consistencia', racha: '6', rachaEtiqueta: 'dias de racha', serie: [28, 42, 35, 58, 48, 74, 66], tendencia: '+12%' },
    widgets: [
      { etiqueta: 'sesiones', valor: '8/12' },
      { etiqueta: 'tiempo medio', valor: '38 min' },
    ],
  },
  {
    acento: '#34D946',
    analitica: '81% bienestar',
    categoria: 'Salud',
    estado: 'toca-hoy',
    frecuencia: 'Lun/Jue/Sab',
    Icono: Leaf,
    id: 'caminar',
    metadata: ['Toca hoy', '20 min', 'Media'],
    proximo: 'Hoy',
    titulo: 'Caminar 20 min',
    ultimaActividad: 'Hoy',
    panel: { layout: 'dominante', progreso: 81, progresoEtiqueta: 'bienestar', racha: '4', rachaEtiqueta: 'semanas activas', serie: [38, 52, 46, 66, 59, 78, 81], tendencia: '+9%' },
    widgets: [
      { etiqueta: 'objetivo', valor: '4/5' },
      { etiqueta: 'mejor dia', valor: 'Jue' },
    ],
  },
  {
    acento: '#FF3B30',
    analitica: 'Racha 7 dias',
    categoria: 'Habitos',
    estado: 'en-riesgo',
    frecuencia: 'Diario',
    Icono: Flame,
    id: 'leer',
    metadata: ['En riesgo', 'Diario', 'Facil'],
    proximo: 'Hoy',
    titulo: 'Leer diario',
    ultimaActividad: 'Ayer',
    panel: { layout: 'equilibrado', progreso: 72, progresoEtiqueta: 'ritmo mensual', racha: '7', rachaEtiqueta: 'dias de racha', serie: [68, 62, 75, 70, 76, 54, 72], tendencia: '-4%' },
    widgets: [
      { etiqueta: 'omitidos', valor: '1 dia' },
      { etiqueta: 'mejor racha', valor: '12 d' },
    ],
  },
  {
    acento: '#FF8A00',
    analitica: '57% de meta',
    categoria: 'Finanzas',
    estado: 'duerme-hoy',
    frecuencia: 'Mensual',
    Icono: PiggyBank,
    id: 'ahorro',
    metadata: ['Duerme hoy', '$500', 'Mensual'],
    proximo: '1 Sep',
    titulo: 'Ahorro mensual',
    ultimaActividad: 'Hace 3 dias',
    panel: { layout: 'equilibrado', progreso: 57, progresoEtiqueta: 'meta acumulada', racha: '3', rachaEtiqueta: 'aportes seguidos', serie: [20, 28, 31, 44, 42, 51, 57], tendencia: '+7%' },
    widgets: [
      { etiqueta: 'acumulado', valor: '$285' },
      { etiqueta: 'proximo aporte', valor: '1 Sep' },
    ],
  },
];

const diasRadar = [
  { dia: 'Jue', puntos: ['#34D946', '#FF3B30'], activo: true },
  { dia: 'Vie', puntos: ['#1463FF'], activo: false },
  { dia: 'Sab', puntos: ['#34D946'], activo: false },
  { dia: 'Dom', puntos: [], activo: false },
  { dia: 'Lun', puntos: ['#FF3B30', '#FF8A00'], activo: false },
  { dia: 'Mar', puntos: ['#8E3DFF'], activo: false },
  { dia: 'Mie', puntos: ['#1463FF', '#FF3B30'], activo: false },
];

const estadosRadar = [
  { etiqueta: 'Toca hoy', cantidad: 2, color: '#34D946' },
  { etiqueta: 'Proximos', cantidad: 5, color: '#1463FF' },
  { etiqueta: 'Riesgo', cantidad: 1, color: '#FF3B30' },
  { etiqueta: 'Pausa', cantidad: 1, color: '#FF8A00' },
];

function colorConAlpha(color: string, alpha: string) {
  return `${color}${alpha}`;
}

function etiquetaEstado(estado: EstadoActivo) {
  if (estado === 'toca-hoy') return 'Toca hoy';
  if (estado === 'proximo') return 'Proximo';
  if (estado === 'en-riesgo') return 'En riesgo';
  return 'Duerme hoy';
}

function MedidorCircular({ color, progreso }: { color: string; progreso: number }) {
  const radio = 26;
  const circunferencia = 2 * Math.PI * radio;
  const progresoSeguro = Math.max(0, Math.min(100, progreso));

  return (
    <View style={styles.medidorCircular}>
      <Svg height={64} width={64} viewBox="0 0 64 64">
        <Circle cx={32} cy={32} fill="none" r={radio} stroke="rgba(255,255,255,0.58)" strokeWidth={6} />
        <Circle
          cx={32}
          cy={32}
          fill="none"
          r={radio}
          rotation="-90"
          stroke={color}
          strokeDasharray={`${circunferencia} ${circunferencia}`}
          strokeDashoffset={circunferencia * (1 - progresoSeguro / 100)}
          strokeLinecap="round"
          strokeWidth={6}
          origin="32, 32"
        />
      </Svg>
      <Texto style={styles.medidorValor}>{progresoSeguro}%</Texto>
    </View>
  );
}

function GraficaMini({ color, serie }: { color: string; serie: number[] }) {
  return (
    <View style={styles.graficaMini}>
      {serie.map((alto, indice) => (
        <View
          key={indice}
          style={[
            styles.barraMini,
            {
              backgroundColor: colorConAlpha(color, indice === serie.length - 1 ? 'E8' : '48'),
              height: Math.max(5, alto * 0.22),
            },
          ]}
        />
      ))}
    </View>
  );
}

function ObservatorioSendero({ sendero }: { sendero: SenderoActivo }) {
  const { panel, widgets } = sendero;

  return (
    <RecuadroGlass blur intensity={78} style={[styles.observatorioGlass, { borderColor: colorConAlpha(sendero.acento, '42') }]}>
      <View pointerEvents="none" style={[styles.observatorioTinte, { backgroundColor: colorConAlpha(sendero.acento, '0C') }]} />
      <View style={styles.observatorioMetricas}>
        <RecuadroGlass blur intensity={30} style={styles.metricasGlass}>
          <MedidorCircular color={sendero.acento} progreso={panel.progreso} />
          <Texto style={styles.medidorEtiqueta}>{panel.progresoEtiqueta}</Texto>
        </RecuadroGlass>
        <RecuadroGlass blur intensity={30} style={styles.metricasGlass}>
          <Texto style={[styles.observatorioNumero, { color: sendero.acento }]}>{panel.racha}</Texto>
          <Texto style={styles.observatorioEtiqueta}>{panel.rachaEtiqueta}</Texto>
        </RecuadroGlass>
        <RecuadroGlass blur intensity={30} style={styles.metricasGlass}>
          <Texto style={[styles.observatorioNumero, { color: sendero.acento }]}>{panel.tendencia}</Texto>
          <Texto style={styles.observatorioEtiqueta}>ritmo semanal</Texto>
        </RecuadroGlass>
      </View>

      <RecuadroGlass blur intensity={34} style={styles.graficaObservatorioGlass}>
        <View style={styles.graficaObservatorioCabecera}>
          <Texto style={styles.graficaObservatorioEtiqueta}>RITMO DE LOS ULTIMOS 7 DIAS</Texto>
          <View style={[styles.puntoGrafica, { backgroundColor: sendero.acento }]} />
        </View>
        <View style={styles.graficaObservatorio}>
          {panel.serie.map((alto, indice) => (
            <View key={indice} style={styles.columnaGrafica}>
              <View style={[styles.barraObservatorio, { backgroundColor: colorConAlpha(sendero.acento, indice === panel.serie.length - 1 ? 'E8' : '4D'), height: Math.max(12, alto * 0.78) }]} />
              <Texto style={styles.diaGrafica}>{['L', 'M', 'X', 'J', 'V', 'S', 'D'][indice]}</Texto>
            </View>
          ))}
        </View>
      </RecuadroGlass>

      <View style={styles.observatorioInferior}>
        {widgets.map((widget) => (
          <RecuadroGlass blur intensity={30} key={widget.etiqueta} style={styles.widgetObservatorio}>
            <Texto style={styles.widgetObservatorioValor}>{widget.valor}</Texto>
            <Texto style={styles.widgetObservatorioEtiqueta}>{widget.etiqueta}</Texto>
          </RecuadroGlass>
        ))}
      </View>
    </RecuadroGlass>
  );
}

function TarjetaActivo({
  animacionMazo,
  compacta = false,
  direccionMazo = 1,
  expandida = false,
  indiceMazo = 0,
  interactiva = true,
  onAlternar,
  sendero,
}: {
  animacionMazo?: Animated.Value;
  compacta?: boolean;
  direccionMazo?: 1 | -1;
  expandida?: boolean;
  indiceMazo?: number;
  interactiva?: boolean;
  onAlternar: () => void;
  sendero: SenderoActivo;
}) {
  const entrada = useRef(new Animated.Value(0)).current;
  const progresoExpansion = useSharedValue(expandida ? 1 : 0);
  const Icono = sendero.Icono;

  useEffect(() => {
    Animated.spring(entrada, {
      damping: 18,
      mass: 0.72,
      stiffness: 220,
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [entrada]);

  const desplazamiento = entrada.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0],
  });

  const desplazamientoMazo = indiceMazo * 10;
  const escalaMazo = 1 - indiceMazo * 0.035;
  const salidaMazo = animacionMazo?.interpolate({ inputRange: [0, 1], outputRange: [0, direccionMazo * -110] });
  const giroMazo = animacionMazo?.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${direccionMazo * 13}deg`] });
  useEffect(() => {
    progresoExpansion.value = withTiming(expandida ? 1 : 0, {
      duration: 280,
      easing: Easing.out(Easing.cubic),
    });
  }, [expandida, progresoExpansion]);

  const estiloElevacion = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(progresoExpansion.value, [0, 1], [0, -12]) }, { scale: interpolate(progresoExpansion.value, [0, 1], [1, 1.012]) }],
  }));
  const estiloPanel = useAnimatedStyle(() => ({
    height: interpolate(progresoExpansion.value, [0, 1], [0, 310]),
    transform: [{ translateY: interpolate(progresoExpansion.value, [0, 1], [12, 0]) }],
  }));

  return (
    <Animated.View
      style={[
        compacta ? styles.tarjetaCompactaWrapper : styles.tarjetaMazoWrapper,
        {
          opacity: compacta ? entrada : 1,
          zIndex: 3 - indiceMazo,
          transform: [
            { perspective: 900 },
            { translateX: salidaMazo || 0 },
            { translateY: desplazamiento },
            { translateY: desplazamientoMazo },
            { rotateY: giroMazo || '0deg' },
            { scale: escalaMazo },
          ],
        },
      ]}
    >
      <Reanimated.View style={estiloElevacion}>
        <Pressable
          disabled={!interactiva}
          onPress={() => { hapticSeguro('accion'); onAlternar(); }}
          style={({ pressed }) => [styles.tarjetaActivo, compacta && styles.tarjetaActivoCompacta, pressed && styles.tarjetaActivoPresionada]}
        >
          <RecuadroGlass blur intensity={72} style={[styles.tarjetaActivoGlass, styles.tarjetaGlassBlanca, expandida && styles.tarjetaElevada, { borderColor: colorConAlpha(sendero.acento, '38') }]}>
              <View pointerEvents="none" style={[styles.tarjetaActivoTinte, { backgroundColor: colorConAlpha(sendero.acento, '10') }]} />
              <View style={[styles.marcadorActivo, { backgroundColor: sendero.acento }]} />

              <View style={styles.tarjetaActivoTexto}>
                <View style={styles.tarjetaActivoCabecera}>
                  <View style={[styles.iconoActivo, { backgroundColor: sendero.acento }]}>
                    <Icono color="#FFFFFF" size={17} strokeWidth={2.6} />
                  </View>
                  <Texto style={[styles.badgeEstadoActivo, { color: sendero.acento }]}>{etiquetaEstado(sendero.estado)}</Texto>
                </View>

                <Texto numberOfLines={2} style={styles.tarjetaActivoTitulo}>{sendero.titulo}</Texto>
                <Texto style={styles.tarjetaActivoSubtitulo}>{sendero.categoria} · {sendero.frecuencia}</Texto>

                <View style={styles.metadataActivoFila}>
                  {sendero.metadata.map((item) => <Texto key={item} style={styles.metadataActivo}>{item}</Texto>)}
                </View>

                <View style={styles.pieActivo}>
                  <Texto style={styles.pieActivoTexto}>{sendero.analitica}</Texto>
                  <Texto style={styles.pieActivoTexto}>Toca para analizar</Texto>
                </View>
              </View>

              <View style={[styles.placeholderActivo, { backgroundColor: colorConAlpha(sendero.acento, '20') }]}>
                <View pointerEvents="none" style={[styles.placeholderActivoOrbe, { backgroundColor: colorConAlpha(sendero.acento, '2E') }]} />
                <View pointerEvents="none" style={styles.placeholderActivoBrillo} />
                <Icono color={sendero.acento} size={34} strokeWidth={2.3} />
              </View>
          </RecuadroGlass>
        </Pressable>
      </Reanimated.View>
      <Reanimated.View style={[styles.panelObservatorioRecorte, estiloPanel]}>
        <ObservatorioSendero sendero={sendero} />
      </Reanimated.View>
    </Animated.View>
  );
}

export function ActivosSenderos() {
  const entrada = useRef(new Animated.Value(0)).current;
  const pulso = useRef(new Animated.Value(0)).current;
  const activos = senderosActivos.filter((sendero) => sendero.estado !== 'duerme-hoy').length;
  const enRiesgo = senderosActivos.filter((sendero) => sendero.estado === 'en-riesgo').length;
  const [filtroActivo, setFiltroActivo] = useState<FiltroActivo>('todos');
  const [indiceMazo, setIndiceMazo] = useState(0);
  const [modoLista, setModoLista] = useState(false);
  const [direccionMazo, setDireccionMazo] = useState<1 | -1>(1);
  const [senderoExpandidoId, setSenderoExpandidoId] = useState<string | null>(null);
  const animacionMazo = useRef(new Animated.Value(0)).current;
  const mazoEnMovimiento = useRef(false);

  const senderosFiltrados = filtroActivo === 'todos'
    ? senderosActivos
    : senderosActivos.filter((sendero) => sendero.estado === filtroActivo);
  const indiceSeguro = senderosFiltrados.length === 0 ? 0 : indiceMazo % senderosFiltrados.length;
  const tarjetasVisibles = Array.from({ length: senderoExpandidoId ? 1 : Math.min(3, senderosFiltrados.length) }, (_, indice) => ({
    indice,
    sendero: senderosFiltrados[(indiceSeguro + indice) % senderosFiltrados.length],
  })).filter(({ sendero }) => sendero);

  const cambiarFiltro = (filtro: FiltroActivo) => {
    hapticSeguro('seleccion');
    setFiltroActivo(filtro);
    setIndiceMazo(0);
    setModoLista(false);
    setSenderoExpandidoId(null);
  };

  const avanzarMazo = (direccion: 1 | -1) => {
    if (senderosFiltrados.length < 2 || mazoEnMovimiento.current || senderoExpandidoId) return;
    hapticSeguro('seleccion');
    mazoEnMovimiento.current = true;
    setDireccionMazo(direccion);
    Animated.timing(animacionMazo, {
      duration: 220,
      toValue: 1,
      useNativeDriver: true,
    }).start(() => {
      setIndiceMazo((indice) => (indice + direccion + senderosFiltrados.length) % senderosFiltrados.length);
      animacionMazo.setValue(0);
      mazoEnMovimiento.current = false;
    });
  };

  useEffect(() => {
    Animated.spring(entrada, {
      damping: 18,
      mass: 0.78,
      stiffness: 210,
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [entrada]);

  useEffect(() => {
    const animacion = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, {
          duration: 1800,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(pulso, {
          duration: 1600,
          toValue: 0,
          useNativeDriver: true,
        }),
      ])
    );

    animacion.start();
    return () => animacion.stop();
  }, [pulso]);

  const entradaY = entrada.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 0],
  });
  const escalaPulso = pulso.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1.04],
  });
  const opacidadPulso = pulso.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.32, 0.68, 0.34],
  });

  return (
    <Animated.View style={[styles.raiz, { opacity: entrada, transform: [{ translateY: entradaY }] }]}>
      <RecuadroGlass blur intensity={70} style={styles.heroRadar}>
        <View pointerEvents="none" style={styles.heroRadarTinte} />
        <View style={styles.heroRadarTexto}>
          <Texto style={styles.heroRadarEtiqueta}>Radar de senderos</Texto>
          <Texto style={styles.heroRadarTitulo}>Senderos vivos</Texto>
          <Texto style={styles.heroRadarSubtitulo}>
            {activos} activos · {enRiesgo} en riesgo · {senderosActivos.length} monitoreados
          </Texto>
        </View>

        <View style={styles.radarOrbita}>
          <Animated.View style={[styles.radarPulso, { opacity: opacidadPulso, transform: [{ scale: escalaPulso }] }]} />
          {senderosActivos.map((sendero, indice) => (
            <View
              key={sendero.id}
              style={[
                styles.radarPunto,
                {
                  backgroundColor: sendero.acento,
                  left: 18 + (indice % 2) * 40,
                  top: 14 + indice * 13,
                },
              ]}
            />
          ))}
          <Sparkles color={Bioma.MasterColor} size={20} strokeWidth={2.3} />
        </View>
      </RecuadroGlass>

      <ScrollView horizontal contentContainerStyle={styles.estadosRadarFila} showsHorizontalScrollIndicator={false}>
        {[{ etiqueta: 'Todos', cantidad: senderosActivos.length, color: Bioma.MasterColor, filtro: 'todos' as const }, ...estadosRadar.map((estado) => ({ ...estado, filtro: estado.etiqueta === 'Toca hoy' ? 'toca-hoy' as const : estado.etiqueta === 'Proximos' ? 'proximo' as const : estado.etiqueta === 'Riesgo' ? 'en-riesgo' as const : 'duerme-hoy' as const }))].map((estado) => (
          <Pressable
            key={estado.etiqueta}
            onPress={() => cambiarFiltro(estado.filtro)}
            style={({ pressed }) => [styles.chipRadar, filtroActivo === estado.filtro && styles.chipRadarActivo, pressed && styles.tarjetaActivoPresionada]}
          >
            <View style={[styles.chipRadarPunto, { backgroundColor: estado.color }]} />
            <Texto style={styles.chipRadarTexto}>{estado.etiqueta}</Texto>
            <Texto style={[styles.chipRadarNumero, { color: estado.color }]}>{estado.cantidad}</Texto>
          </Pressable>
        ))}
      </ScrollView>

      <RecuadroGlass blur intensity={55} style={styles.timelineRadar}>
        <View style={styles.timelineCabecera}>
          <CalendarDays color={Bioma.MasterColor} size={17} strokeWidth={2.4} />
          <Texto style={styles.timelineTitulo}>Proximos 7 dias</Texto>
        </View>

        <View style={styles.diasRadar}>
          {diasRadar.map((dia) => (
            <View key={dia.dia} style={[styles.diaRadar, dia.activo && styles.diaRadarActivo]}>
              <Texto style={[styles.diaRadarTexto, dia.activo && styles.diaRadarTextoActivo]}>{dia.dia}</Texto>
              <View style={styles.puntosDia}>
                {dia.puntos.length > 0 ? (
                  dia.puntos.map((punto, indice) => <View key={`${dia.dia}-${punto}-${indice}`} style={[styles.puntoDia, { backgroundColor: punto }]} />)
                ) : (
                  <Moon color="rgba(80, 70, 58, 0.34)" size={10} strokeWidth={2.4} />
                )}
              </View>
            </View>
          ))}
        </View>
      </RecuadroGlass>

      <View style={styles.alertaRadar}>
        <AlertTriangle color="#FF8A00" size={15} strokeWidth={2.4} />
        <Texto style={styles.alertaRadarTexto}>Lectura diaria esta en riesgo si no se completa hoy.</Texto>
        <ChevronRight color="#FF8A00" size={16} strokeWidth={2.6} />
      </View>

      <View style={styles.coleccionCabecera}>
        <View>
          <Texto style={styles.coleccionEtiqueta}>{modoLista ? 'Todos tus senderos' : 'Mazo de monitoreo'}</Texto>
          <Texto style={styles.coleccionTitulo}>{senderosFiltrados.length} senderos visibles</Texto>
        </View>
        <Pressable onPress={() => { hapticSeguro('seleccion'); setModoLista((modo) => !modo); }} style={styles.botonModoLista}>
          <List color={Bioma.MasterColor} size={15} strokeWidth={2.5} />
          <Texto style={styles.botonModoListaTexto}>{modoLista ? 'Mazo' : 'Ver todos'}</Texto>
        </Pressable>
      </View>

      {modoLista ? (
        <View style={styles.listaActivos}>
          {senderosFiltrados.map((sendero) => (
            <TarjetaActivo
              compacta
              expandida={senderoExpandidoId === sendero.id}
              key={sendero.id}
              onAlternar={() => setSenderoExpandidoId((id) => id === sendero.id ? null : sendero.id)}
              sendero={sendero}
            />
          ))}
        </View>
      ) : senderosFiltrados.length > 0 ? (
        <>
          <View style={[styles.mazoActivos, senderoExpandidoId && styles.mazoActivosExpandido]}>
            {tarjetasVisibles.map(({ sendero, indice }) => (
              <TarjetaActivo
                animacionMazo={animacionMazo}
                direccionMazo={direccionMazo}
                expandida={senderoExpandidoId === sendero.id}
                indiceMazo={indice}
                interactiva={indice === 0}
                key={sendero.id}
                onAlternar={() => setSenderoExpandidoId((id) => id === sendero.id ? null : sendero.id)}
                sendero={sendero}
              />
            ))}
          </View>
          {!senderoExpandidoId && (
            <View style={styles.controlesMazo}>
              <Pressable onPress={() => avanzarMazo(-1)} style={styles.botonMazo}>
                <ChevronLeft color={colores.texto} size={17} strokeWidth={2.5} />
              </Pressable>
              <Texto style={styles.contadorMazo}>{indiceSeguro + 1} de {senderosFiltrados.length}</Texto>
              <Pressable onPress={() => avanzarMazo(1)} style={styles.botonMazo}>
                <ChevronRight color={colores.texto} size={17} strokeWidth={2.5} />
              </Pressable>
            </View>
          )}
        </>
      ) : (
        <RecuadroGlass blur intensity={48} style={styles.estadoVacio}>
          <Sparkles color={Bioma.MasterColor} size={20} />
          <Texto style={styles.estadoVacioTexto}>No hay senderos en este estado.</Texto>
        </RecuadroGlass>
      )}
    </Animated.View>
  );
}

export default ActivosSenderos;

const styles = StyleSheet.create({
  raiz: {
    gap: 12,
  },
  heroRadar: {
    borderColor: 'rgba(255, 255, 255, 0.68)',
    borderRadius: 24,
    borderWidth: 0.7,
    flexDirection: 'row',
    minHeight: 126,
    overflow: 'hidden',
    padding: 14,
    shadowColor: '#594936',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
  },
  heroRadarTinte: {
    backgroundColor: 'rgba(255, 250, 239, 0.58)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  heroRadarTexto: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 10,
  },
  heroRadarEtiqueta: {
    color: Bioma.MasterColor,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 9,
    letterSpacing: 0.5,
    lineHeight: 13,
    textTransform: 'uppercase',
  },
  heroRadarTitulo: {
    color: colores.texto,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 22,
    lineHeight: 27,
    marginTop: 3,
  },
  heroRadarSubtitulo: {
    color: colores.textoSecundario,
    fontFamily: 'MontserratAlternates-SemiBold',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 5,
  },
  radarOrbita: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderColor: 'rgba(95, 193, 62, 0.18)',
    borderRadius: 32,
    borderWidth: 0.7,
    height: 88,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    width: 88,
  },
  radarPulso: {
    backgroundColor: 'rgba(95, 193, 62, 0.16)',
    borderColor: 'rgba(95, 193, 62, 0.24)',
    borderRadius: 999,
    borderWidth: 1,
    height: 76,
    position: 'absolute',
    width: 76,
  },
  radarPunto: {
    borderColor: 'rgba(255, 255, 255, 0.74)',
    borderRadius: 999,
    borderWidth: 1,
    height: 9,
    position: 'absolute',
    width: 9,
  },
  estadosRadarFila: {
    gap: 8,
    paddingHorizontal: 1,
  },
  chipRadarActivo: {
    backgroundColor: 'rgba(95, 193, 62, 0.16)',
    borderColor: Bioma.MasterColor,
  },
  chipRadar: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.52)',
    borderColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 999,
    borderWidth: 0.6,
    flexDirection: 'row',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 11,
  },
  chipRadarPunto: {
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  chipRadarTexto: {
    color: colores.texto,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 9,
    lineHeight: 13,
  },
  chipRadarNumero: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 11,
    lineHeight: 15,
  },
  timelineRadar: {
    borderColor: 'rgba(255, 255, 255, 0.64)',
    borderRadius: 22,
    borderWidth: 0.7,
    overflow: 'hidden',
    padding: 12,
  },
  timelineCabecera: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
    marginBottom: 10,
  },
  timelineTitulo: {
    color: colores.texto,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 13,
    lineHeight: 17,
  },
  diasRadar: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-between',
  },
  diaRadar: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.42)',
    borderRadius: 15,
    flex: 1,
    gap: 7,
    minHeight: 62,
    paddingVertical: 9,
  },
  diaRadarActivo: {
    backgroundColor: 'rgba(95, 193, 62, 0.14)',
  },
  diaRadarTexto: {
    color: colores.textoSecundario,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 9,
    lineHeight: 13,
  },
  diaRadarTextoActivo: {
    color: Bioma.MasterColor,
  },
  puntosDia: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    justifyContent: 'center',
    minHeight: 14,
  },
  puntoDia: {
    borderColor: 'rgba(255, 255, 255, 0.74)',
    borderRadius: 999,
    borderWidth: 0.7,
    height: 7,
    width: 7,
  },
  alertaRadar: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 138, 0, 0.12)',
    borderColor: 'rgba(255, 138, 0, 0.22)',
    borderRadius: 18,
    borderWidth: 0.7,
    flexDirection: 'row',
    gap: 8,
    minHeight: 42,
    paddingHorizontal: 12,
  },
  alertaRadarTexto: {
    color: '#7A4B11',
    flex: 1,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 10,
    lineHeight: 14,
  },
  listaActivos: {
    gap: 10,
  },
  coleccionCabecera: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  coleccionEtiqueta: {
    color: colores.textoSecundario,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  coleccionTitulo: {
    color: colores.texto,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 15,
    lineHeight: 19,
    marginTop: 2,
  },
  botonModoLista: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.58)',
    borderColor: 'rgba(255, 255, 255, 0.76)',
    borderRadius: 999,
    borderWidth: 0.7,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  botonModoListaTexto: {
    color: Bioma.MasterColor,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 9,
  },
  mazoActivos: {
    height: 158,
    position: 'relative',
  },
  mazoActivosExpandido: {
    height: 466,
  },
  tarjetaMazoWrapper: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  tarjetaCompactaWrapper: {
    position: 'relative',
  },
  tarjetaActivoCompacta: {
    minHeight: 116,
  },
  controlesMazo: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    marginTop: 2,
  },
  botonMazo: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.58)',
    borderColor: 'rgba(255, 255, 255, 0.76)',
    borderRadius: 999,
    borderWidth: 0.7,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  contadorMazo: {
    color: colores.textoSecundario,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 9,
    minWidth: 56,
    textAlign: 'center',
  },
  estadoVacio: {
    alignItems: 'center',
    borderColor: 'rgba(255, 255, 255, 0.68)',
    borderRadius: 22,
    borderWidth: 0.7,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 90,
    padding: 14,
  },
  estadoVacioTexto: {
    color: colores.textoSecundario,
    fontFamily: 'MontserratAlternates-SemiBold',
    fontSize: 10,
  },
  tarjetaActivo: {
    borderRadius: 23,
  },
  tarjetaActivoPresionada: {
    opacity: 0.84,
    transform: [{ translateY: 1 }],
  },
  tarjetaActivoGlass: {
    borderRadius: 23,
    borderWidth: 0.7,
    flexDirection: 'row',
    gap: 12,
    height: 156,
    overflow: 'hidden',
    paddingBottom: 12,
    paddingLeft: 17,
    paddingRight: 12,
    paddingTop: 12,
    shadowColor: '#312719',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.11,
    shadowRadius: 16,
  },
  tarjetaGlassBlanca: {
    backgroundColor: 'rgba(255, 255, 255, 0.68)',
  },
  tarjetaElevada: {
    shadowOpacity: 0.22,
    shadowRadius: 24,
  },
  panelObservatorioRecorte: {
    overflow: 'hidden',
  },
  observatorioGlass: {
    borderRadius: 24,
    borderWidth: 0.8,
    height: 294,
    marginTop: 16,
    overflow: 'hidden',
    padding: 12,
  },
  observatorioTinte: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  observatorioMetricas: {
    flexDirection: 'row',
    gap: 8,
    height: 70,
  },
  metricasGlass: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.58)',
    borderColor: 'rgba(255, 255, 255, 0.76)',
    borderRadius: 17,
    borderWidth: 0.7,
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  observatorioNumero: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 22,
    lineHeight: 26,
  },
  observatorioEtiqueta: {
    color: colores.textoSecundario,
    fontFamily: 'MontserratAlternates-SemiBold',
    fontSize: 7,
    marginTop: 2,
    textAlign: 'center',
  },
  graficaObservatorioGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.52)',
    borderColor: 'rgba(255, 255, 255, 0.74)',
    borderRadius: 19,
    borderWidth: 0.7,
    height: 112,
    marginTop: 8,
    overflow: 'hidden',
    padding: 10,
  },
  graficaObservatorioCabecera: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  graficaObservatorioEtiqueta: {
    color: colores.textoSecundario,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 7,
    letterSpacing: 0.5,
  },
  puntoGrafica: {
    borderRadius: 999,
    height: 7,
    width: 7,
  },
  graficaObservatorio: {
    alignItems: 'flex-end',
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  columnaGrafica: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barraObservatorio: {
    borderRadius: 999,
    maxHeight: 63,
    width: '74%',
  },
  diaGrafica: {
    color: colores.textoSecundario,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 7,
    marginTop: 3,
  },
  observatorioInferior: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  widgetObservatorio: {
    backgroundColor: 'rgba(255, 255, 255, 0.58)',
    borderColor: 'rgba(255, 255, 255, 0.76)',
    borderRadius: 16,
    borderWidth: 0.7,
    flex: 1,
    minHeight: 54,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  widgetObservatorioValor: {
    color: colores.texto,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 13,
  },
  widgetObservatorioEtiqueta: {
    color: colores.textoSecundario,
    fontFamily: 'MontserratAlternates-SemiBold',
    fontSize: 8,
    marginTop: 2,
  },
  botonCerrarObservatorio: {
    alignSelf: 'center',
    marginTop: 7,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  botonCerrarObservatorioTexto: {
    color: colores.textoSecundario,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 8,
  },
  tarjetaActivoTinte: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  marcadorActivo: {
    borderRadius: 999,
    bottom: 14,
    left: 8,
    position: 'absolute',
    top: 14,
    width: 4,
  },
  tarjetaActivoTexto: {
    flex: 1,
    justifyContent: 'space-between',
    minWidth: 0,
  },
  tarjetaActivoCabecera: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconoActivo: {
    alignItems: 'center',
    borderColor: 'rgba(255, 255, 255, 0.56)',
    borderRadius: 13,
    borderWidth: 0.7,
    height: 34,
    justifyContent: 'center',
    shadowColor: '#1E241D',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 7,
    width: 34,
  },
  badgeEstadoActivo: {
    backgroundColor: 'rgba(255, 255, 255, 0.54)',
    borderRadius: 999,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 8,
    lineHeight: 12,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 3,
    textTransform: 'uppercase',
  },
  tarjetaActivoTitulo: {
    color: colores.texto,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 15,
    lineHeight: 19,
    marginTop: 7,
  },
  tarjetaActivoSubtitulo: {
    color: colores.textoSecundario,
    fontFamily: 'MontserratAlternates-SemiBold',
    fontSize: 9,
    lineHeight: 13,
    marginTop: 1,
  },
  metadataActivoFila: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 8,
  },
  metadataActivo: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 999,
    color: colores.textoSecundario,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 8,
    lineHeight: 12,
    overflow: 'hidden',
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  pieActivo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  pieActivoTexto: {
    color: colores.textoSecundario,
    fontFamily: 'MontserratAlternates-SemiBold',
    fontSize: 8,
    lineHeight: 12,
  },
  analiticasContenido: {
    flex: 1,
    minWidth: 0,
  },
  medidorCircular: {
    alignItems: 'center',
    height: 64,
    justifyContent: 'center',
    position: 'relative',
    width: 64,
  },
  medidorValor: {
    color: colores.texto,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 12,
    lineHeight: 15,
    position: 'absolute',
  },
  medidorEtiqueta: {
    color: colores.textoSecundario,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 7,
    marginTop: 1,
    textAlign: 'center',
  },
  rachaValor: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 30,
    lineHeight: 31,
  },
  rachaEquilibrada: {
    fontSize: 24,
    lineHeight: 25,
  },
  rachaEtiqueta: {
    color: colores.textoSecundario,
    fontFamily: 'MontserratAlternates-SemiBold',
    fontSize: 8,
    lineHeight: 11,
  },
  tendenciaPildora: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tendenciaTexto: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 8,
  },
  tendenciaPeriodo: {
    color: colores.textoSecundario,
    fontFamily: 'MontserratAlternates-SemiBold',
    fontSize: 7,
  },
  grillaDominante: {
    flex: 1,
    flexDirection: 'row',
    gap: 7,
  },
  columnaDominante: {
    flex: 1,
    gap: 7,
  },
  grillaEquilibrada: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  widgetPremium: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 14,
    borderWidth: 0.7,
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#5D5141',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 7,
  },
  widgetProgresoDominante: {
    flex: 1,
  },
  widgetRachaDominante: {
    flex: 1,
    alignItems: 'flex-start',
    paddingHorizontal: 10,
  },
  widgetTendenciaDominante: {
    flex: 1,
    alignItems: 'stretch',
    paddingHorizontal: 8,
    paddingTop: 5,
  },
  widgetEquilibrado: {
    alignItems: 'flex-start',
    height: '47%',
    justifyContent: 'center',
    paddingHorizontal: 9,
    width: '48.3%',
  },
  widgetProgresoEquilibrado: {
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  widgetConGrafica: {
    justifyContent: 'flex-end',
  },
  widgetTexto: {
    flex: 1,
    minWidth: 0,
  },
  widgetValor: {
    color: colores.texto,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 9,
    lineHeight: 12,
  },
  widgetEtiqueta: {
    color: colores.textoSecundario,
    fontFamily: 'MontserratAlternates-SemiBold',
    fontSize: 6.5,
    lineHeight: 9,
    marginTop: 1,
  },
  graficaMini: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 4,
    height: 17,
    width: '100%',
  },
  barraMini: {
    borderRadius: 999,
    flex: 1,
    minHeight: 5,
  },
  metricasEnLinea: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  metricaCompacta: {
    flex: 1,
    minWidth: 0,
  },
  placeholderActivo: {
    alignItems: 'center',
    alignSelf: 'stretch',
    borderColor: 'rgba(255, 255, 255, 0.62)',
    borderRadius: 22,
    borderWidth: 0.7,
    justifyContent: 'center',
    minHeight: 104,
    overflow: 'hidden',
    width: 104,
  },
  placeholderActivoOrbe: {
    borderRadius: 999,
    height: 92,
    position: 'absolute',
    right: -34,
    top: -30,
    transform: [{ rotate: '-18deg' }],
    width: 64,
  },
  placeholderActivoBrillo: {
    backgroundColor: 'rgba(255, 255, 255, 0.38)',
    borderRadius: 999,
    height: 36,
    left: 13,
    position: 'absolute',
    top: 12,
    transform: [{ rotate: '-18deg' }],
    width: 8,
  },
});
