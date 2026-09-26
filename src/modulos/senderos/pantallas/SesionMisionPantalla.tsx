import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  Check,
  ChevronRight,
  Flame,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react-native';

import {
  MasterButton,
  MasterGlass,
  MasterIcon,
  MasterIconBg,
  MasterKicker,
  MasterProgressbar,
  Rebote,
  Texto,
  entradaEncadenada,
} from '../../../diseno';
import { AuroraBoreal } from '../../hoy/componentes/AuroraBoreal';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import {
  obtenerProgresoNivelHabito,
  registrarProgresoHabito,
} from '../../habitos/habitos.servicio';
import { sincronizarSesionesCronometroPendientes } from '../../habitos/cronometro.servicio';
import { fechaLocalHoy } from '../../../nucleo/dispositivo/fechaLocal';
import { buscarIconoHabito } from '../../habitos/iconosHabitos';
import { obtenerAssetsPaqueteHabito } from '../../habitos/paqueteVisual.assets';
import { resolverPaqueteHabito } from '../../habitos/paqueteHabito';
import { ModalAperturaCofre } from '../componentes/mapa/ModalAperturaCofre';
import type { TransicionSendero } from '../../habitos/senderoHabito.tipos';
import { CLAVE_SALDO_GEMAS, useSaldoGemas } from '../../tienda/useSaldoGemas';
import type { TipoMetaHabito } from '../../habitos/tipos';
import {
  detenerCronometroNativo,
  iniciarCronometroNativo,
  obtenerEstadoCronometroNativo,
  pausarCronometroNativo,
  reanudarCronometroNativo,
  suscribirEventoCronometro,
} from '../../../../modules/habito-widget';
import { useEscala } from '../../../diseno/tema/MasterColorContext';
import { ESCALA_ESMERALDA } from '../../../diseno/tema/escalaEsmeralda';
import { conAlfa } from '../../../diseno/tema/masterColor';

const CirculoAnimado = Animated.createAnimatedComponent(Circle);

// Paleta Light idéntica a HabitosPantalla e InsightsPantalla
const C = {
  fondo: '#F3EEFA',
  texto: '#1A1335',
  tenue: ESCALA_ESMERALDA.musgo.l51,
  verde: ESCALA_ESMERALDA.jade.l50,
  verdeBorde: ESCALA_ESMERALDA.jade.l59,
  verdeClaro: ESCALA_ESMERALDA.hoja.l95,
  rojo: '#DC2626',
  glass: 'rgba(255,255,255,0.72)',
  glassBorde: 'rgba(255,255,255,0.85)',
};

type ResultadoCelebracion = {
  gemas: number;
  nivel: number;
  subioNivel: boolean;
  diaNumero: string;
};

// Micro-animación suave flotante como en InsightsPantalla
function ElementoFlotanteSuave({
  children,
  distancia = 3.5,
  duracion = 2800,
  delay = 0,
  rotacion = '0deg',
  style,
}: {
  children: React.ReactNode;
  distancia?: number;
  duracion?: number;
  delay?: number;
  rotacion?: string;
  style?: any;
}) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-distancia, { duration: duracion, easing: Easing.inOut(Easing.sin) }),
          withTiming(distancia, { duration: duracion, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true
      )
    );
  }, [delay, distancia, duracion, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { rotate: rotacion }],
  }));

  return <Animated.View style={[style, animStyle]}>{children}</Animated.View>;
}

// Dial Circular SVG de Alta Gama para el Cronómetro y Contadores
function DialCircularProgreso({
  porcentaje,
  color,
  tamano = 220,
  grosor = 12,
  children,
}: {
  porcentaje: number;
  color: string;
  tamano?: number;
  grosor?: number;
  children?: React.ReactNode;
}) {
  const esc = useEscala();
  const radio = (tamano - grosor) / 2;
  const circunferencia = 2 * Math.PI * radio;
  const animacionProgreso = useSharedValue(0);

  useEffect(() => {
    animacionProgreso.value = withSpring(Math.min(100, Math.max(0, porcentaje)), {
      damping: 15,
      stiffness: 110,
    });
  }, [porcentaje]);

  const propsAnimadas = useAnimatedProps(() => ({
    strokeDashoffset: circunferencia * (1 - animacionProgreso.value / 100),
  }));

  return (
    <View style={[s.dialContenedor, { height: tamano, width: tamano }]}>
      <Svg height={tamano} style={StyleSheet.absoluteFill} width={tamano}>
        <Defs>
          <SvgLinearGradient id="dialGrad" x1="0%" x2="100%" y1="0%" y2="100%">
            <Stop offset="0%" stopColor={color} />
            <Stop offset="100%" stopColor={esc.hoja.l82} />
          </SvgLinearGradient>
          <RadialGradient cx="50%" cy="50%" id="brilloFondo" r="50%">
            <Stop offset="0%" stopColor={`${color}16`} />
            <Stop offset="100%" stopColor="transparent" />
          </RadialGradient>
        </Defs>

        {/* Círculo de brillo ambiental interior */}
        <Circle cx={tamano / 2} cy={tamano / 2} fill="url(#brilloFondo)" r={radio - grosor} />

        {/* Pista de fondo */}
        <Circle
          cx={tamano / 2}
          cy={tamano / 2}
          fill="none"
          r={radio}
          stroke={conAlfa(esc.jade.l50, 0.12)}
          strokeWidth={grosor}
        />

        {/* Arco de progreso animado */}
        <CirculoAnimado
          animatedProps={propsAnimadas}
          cx={tamano / 2}
          cy={tamano / 2}
          fill="none"
          origin={`${tamano / 2}, ${tamano / 2}`}
          r={radio}
          rotation={-90}
          stroke="url(#dialGrad)"
          strokeDasharray={`${circunferencia} ${circunferencia}`}
          strokeLinecap="round"
          strokeWidth={grosor}
        />
      </Svg>

      <View pointerEvents="box-none" style={s.dialContenido}>
        {children}
      </View>
    </View>
  );
}

export function SesionMisionPantalla() {
  const { t } = useTranslation();
  const esc = useEscala();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const cliente = useQueryClient();
  const { data: saldoGemas } = useSaldoGemas();

  const params = useLocalSearchParams<{
    habitoId?: string;
    diaGlobal?: string;
    nivel?: string;
    color?: string;
  }>();

  const habitoId = params.habitoId ?? '';
  const diaGlobal = params.diaGlobal ?? '1';
  const nivelParam = Number(params.nivel) || 1;

  // Carga de datos reales
  const consulta = useQuery({
    enabled: Boolean(habitoId),
    queryKey: ['habitos', 'progreso-nivel', habitoId],
    queryFn: () => obtenerProgresoNivelHabito(habitoId),
  });

  const habito = consulta.data?.habito;
  const nivelActual = consulta.data?.nivel ?? nivelParam;
  const diasCompletados = consulta.data?.diasCompletados ?? 0;
  const diasRequeridos = consulta.data?.diasRequeridos ?? 7;
  const colorTema = habito?.color || params.color || C.verde;

  const [celebracion, setCelebracion] = useState<ResultadoCelebracion | null>(null);
  // Cofre final de sendero (nivel 1-6 o ciclo de maestría del 7): lo paga
  // registrar_progreso_habito en la misma transacción, así que acá solo se
  // muestra el modal automático con las gemas ya confirmadas — reemplaza a
  // la celebración vieja cuando hay transición.
  const [transicionCofre, setTransicionCofre] = useState<TransicionSendero | null>(null);

  // Metas e interactivos
  const tipoMeta: TipoMetaHabito = habito?.tipoMeta ?? 'check';
  const metaValor: number = habito?.meta ?? 1;
  const unidad: string = habito?.unidad || '';

  // Estados interactivos
  const [conteo, setConteo] = useState<number>(habito?.valorHoy ?? 0);
  const [segundos, setSegundos] = useState<number>((habito?.valorHoy ?? 0) * 60);
  const [corriendo, setCorriendo] = useState<boolean>(false);
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Trackea si YA existe una sesión nativa (notificación) para este hábito —
  // decide si el botón de play debe "iniciar" (primera vez) o "reanudar"
  // (ya había una sesión nativa pausada), evitando reanudar algo que nunca
  // se inició nativamente (ej. segundos>0 solo por el valorHoy ya guardado).
  const sesionNativaActivaRef = useRef(false);

  useEffect(() => {
    if (habito?.valorHoy !== undefined) {
      setConteo(habito.valorHoy);
      if (!corriendo) {
        setSegundos(habito.valorHoy * 60);
      }
    }
  }, [habito?.valorHoy]);

  useEffect(() => {
    if (corriendo) {
      intervaloRef.current = setInterval(() => {
        setSegundos((s) => s + 1);
      }, 1000);
    } else if (intervaloRef.current) {
      clearInterval(intervaloRef.current);
    }
    return () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current);
    };
  }, [corriendo]);

  // Al entrar (o volver) a una misión de duración, el cronómetro nativo
  // (que sigue corriendo aunque la app se haya ido a segundo plano o la
  // pantalla se haya cerrado) es la fuente de verdad — si hay una sesión
  // nativa activa para ESTE hábito, la UI local se resincroniza con ella.
  useEffect(() => {
    if (tipoMeta !== 'duracion' || !habitoId) return;
    let vigente = true;
    obtenerEstadoCronometroNativo().then((estado) => {
      if (!vigente || estado.habitoId !== habitoId) return;
      sesionNativaActivaRef.current = estado.activo;
      setSegundos(estado.segundos);
      setCorriendo(estado.corriendo);
    });
    return () => {
      vigente = false;
    };
  }, [tipoMeta, habitoId]);

  // Reacciona a acciones tomadas desde la notificación (pantalla bloqueada o
  // app en segundo plano) mientras esta pantalla sigue montada.
  useEffect(() => {
    if (tipoMeta !== 'duracion' || !habitoId) return () => {};
    return suscribirEventoCronometro((evento) => {
      if (evento.habitoId !== habitoId) return;
      if (evento.tipo === 'pausado') {
        setSegundos(evento.segundos);
        setCorriendo(false);
      } else if (evento.tipo === 'reanudado') {
        setCorriendo(true);
      } else if (evento.tipo === 'finalizado') {
        sesionNativaActivaRef.current = false;
        setCorriendo(false);
        setSegundos(0);
        sincronizarSesionesCronometroPendientes().then((huboDrenaje) => {
          if (huboDrenaje) {
            cliente.invalidateQueries({ queryKey: ['habitos', 'progreso-nivel', habitoId] });
            cliente.invalidateQueries({ queryKey: ['habitos', 'panel'] });
          }
        });
      }
    });
  }, [tipoMeta, habitoId, cliente]);

  // Aura animada viva
  const escalaAura = useSharedValue(1);
  const opacidadAura = useSharedValue(0.28);

  useEffect(() => {
    escalaAura.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 2600, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    opacidadAura.value = withRepeat(
      withSequence(
        withTiming(0.48, { duration: 2600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.22, { duration: 2600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const estiloAuraAnimada = useAnimatedStyle(() => ({
    opacity: opacidadAura.value,
    transform: [{ scale: escalaAura.value }],
  }));

  // Mutación
  const mutacion = useMutation({
    mutationFn: registrarProgresoHabito,
    onSuccess: (resultado) => {
      cliente.invalidateQueries({ queryKey: ['habitos', 'progreso-nivel', habitoId] });
      cliente.invalidateQueries({ queryKey: ['habitos', 'sendero-resumen', habitoId] });
      cliente.invalidateQueries({ queryKey: ['habitos', 'panel'] });
      cliente.invalidateQueries({ queryKey: ['habitos', 'detalles-hoy'] });
      cliente.invalidateQueries({ queryKey: ['habitos', 'cercania-nivel'] });
      cliente.invalidateQueries({ queryKey: ['habitos', 'mejor-racha'] });
      if (resultado.gemasGanadas > 0) {
        cliente.invalidateQueries({ queryKey: CLAVE_SALDO_GEMAS });
      }

      hapticSeguro('confirmacion');
      if (resultado.transicionSendero) {
        setTransicionCofre(resultado.transicionSendero);
      } else {
        setCelebracion({
          gemas: resultado.gemasGanadas,
          nivel: resultado.nivel,
          subioNivel: resultado.subioNivel,
          diaNumero: diaGlobal,
        });
      }
    },
    onError: () => {
      hapticSeguro('accion');
    },
  });

  const enviarRegistro = (valorAGuardar: number) => {
    hapticSeguro('seleccion');
    mutacion.mutate({
      habitoId,
      fechaLocal: fechaLocalHoy(),
      valor: valorAGuardar,
    });
  };

  const assetsPaquete = obtenerAssetsPaqueteHabito(habito?.paqueteId, nivelActual);
  const iconoInfo = habito ? buscarIconoHabito(habito.iconoLucide) : null;

  // Tiempos
  const formatoMinutos = Math.floor(segundos / 60);
  const formatoSegundos = segundos % 60;
  const textoTiempo = `${String(formatoMinutos).padStart(2, '0')}:${String(formatoSegundos).padStart(2, '0')}`;

  const porcentajeCronometro = Math.min(100, Math.round(((segundos / 60) / Math.max(1, metaValor)) * 100));
  const porcentajeConteo = Math.min(100, Math.round((conteo / Math.max(1, metaValor)) * 100));
  const porcentajeProgresoNivel = Math.min(100, Math.round((diasCompletados / Math.max(1, diasRequeridos)) * 100));

  return (
    <LinearGradient
      colors={[esc.hoja.l99, esc.hoja.l95, esc.hoja.l93]}
      end={{ x: 0, y: 1 }}
      start={{ x: 0, y: 0 }}
      style={s.raiz}
    >
      <ScrollView
        bounces={false}
        contentContainerStyle={[s.scrollContenido, { paddingBottom: insets.bottom + 48 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabecera Pro: Aurora Boreal y Navegación Flotante */}
        <View style={[s.superiorHeader, { paddingTop: insets.top + 16 }]}>
          <AuroraBoreal tema="verde" />

          {/* Fila Superior de Controles y Stats */}
          <View style={s.topBarFila}>
            <Animated.View entering={entradaEncadenada(0)}>
              <Rebote
                accessibilityLabel={t('senderos.mision.volver')}
                hitSlop={12}
                onPress={() => {
                  hapticSeguro('seleccion');
                  router.back();
                }}
                estilo={s.botonCerrar}
              >
                <MasterGlass style={s.cerrarGlass}>
                  <X color={C.texto} size={20} strokeWidth={2.6} />
                </MasterGlass>
              </Rebote>
            </Animated.View>

            {/* Pastilla Central de Identificación del Nodo */}
            <Animated.View entering={entradaEncadenada(1)}>
              <MasterGlass style={s.pillCentroGlass}>
                <View style={[s.puntoPill, { backgroundColor: colorTema }]} />
                <Texto style={s.pillCentroTexto}>
                  {t('senderos.mision.pillCentro', { dia: diaGlobal, nivel: nivelActual })}
                </Texto>
              </MasterGlass>
            </Animated.View>

            {/* Stats: Gemas y Racha */}
            <View style={s.headerDer}>
              <Animated.View entering={entradaEncadenada(2)}>
                <Rebote accessibilityLabel={t('senderos.mision.saldoGemas')} onPress={() => router.push('/tienda/gemas')} estilo={s.statPill}>
                  <View style={s.statPillFila}>
                    <Image source={require('../../../../assets/icons/hoy/gemas.png')} style={s.gemaIcono} />
                    <Texto style={s.statTexto}>{saldoGemas ?? 0}</Texto>
                  </View>
                </Rebote>
              </Animated.View>

              <Animated.View entering={entradaEncadenada(3)}>
                <MasterGlass style={s.rachaPillGlass}>
                  <Flame color="#F97316" fill="#F97316" size={17} />
                  <Texto style={s.rachaTexto}>{t('senderos.mision.rachaDias', { dias: diasCompletados })}</Texto>
                </MasterGlass>
              </Animated.View>
            </View>
          </View>

          {/* Título de la Misión y Breve Propósito */}
          <View style={s.headerInfoBloque}>
            <Animated.View entering={entradaEncadenada(4)}>
              <View style={s.kickerFila}>
                <MasterKicker
                  icono={<MasterIcon alTema name="hoja" size={12} />}
                  texto={t('senderos.mision.kicker')}
                />
              </View>
              <Texto style={s.headerTituloPrincipal}>{habito?.titulo || t('senderos.mision.cargandoHabito')}</Texto>
              <Texto style={s.headerSubtitulo}>
                {tipoMeta === 'check'
                  ? t('senderos.mision.subtituloCheck')
                  : tipoMeta === 'cantidad'
                  ? t('senderos.mision.subtituloCantidad', { meta: metaValor, unidad: unidad || t('senderos.mision.unidadVeces') })
                  : t('senderos.mision.subtituloDuracion', { meta: metaValor })}
              </Texto>
            </Animated.View>
          </View>
        </View>

        {/* HERO PRO: DIORAMA DEL ÁRBOL CON ELEMENTOS FLOTANTES Y PEDESTAL */}
        <Animated.View entering={entradaEncadenada(5)} style={s.heroDioramaSeccion}>
          <MasterGlass style={s.heroDioramaTarjeta}>
            {/* Fondo SVG de Rayos de Luz y Niebla */}
            <Svg height="100%" style={StyleSheet.absoluteFill} width="100%">
              <Defs>
                <RadialGradient cx="50%" cy="45%" id="resplandorSol" r="60%">
                  <Stop offset="0%" stopColor={`${colorTema}22`} />
                  <Stop offset="50%" stopColor="rgba(255,255,255,0.4)" />
                  <Stop offset="100%" stopColor="transparent" />
                </RadialGradient>
              </Defs>
              <Circle cx="50%" cy="45%" fill="url(#resplandorSol)" r="120" />
            </Svg>

            {/* Aura de respiración / concentración viva */}
            <Animated.View
              pointerEvents="none"
              style={[
                s.auraRespiracion,
                estiloAuraAnimada,
                { backgroundColor: `${colorTema}28` },
              ]}
            />

            {/* Ilustración de Árbol Vivo Central */}
            <View style={s.arbolContenedor}>
              <Image
                resizeMode="contain"
                source={assetsPaquete.arbolPrincipal}
                style={s.arbolIlustracion}
              />
            </View>

            {/* Elementos vivos flotantes como en InsightsPantalla */}
            <ElementoFlotanteSuave delay={0} distancia={3.5} duracion={2600} rotacion="-12deg" style={s.flotanteRocaTop}>
              <Image
                resizeMode="contain"
                source={require('../../../../assets/ilustraciones/senderos/biomas/arboles/roca.png')}
                style={s.imgFlotante}
              />
            </ElementoFlotanteSuave>

            <ElementoFlotanteSuave delay={400} distancia={4} duracion={3100} rotacion="14deg" style={s.flotantePastoTop}>
              <Image
                resizeMode="contain"
                source={require('../../../../assets/ilustraciones/senderos/biomas/arboles/pasto.png')}
                style={s.imgFlotante}
              />
            </ElementoFlotanteSuave>

            <ElementoFlotanteSuave delay={700} distancia={3} duracion={2500} rotacion="20deg" style={s.flotanteRocaLeft}>
              <Image
                resizeMode="contain"
                source={require('../../../../assets/ilustraciones/senderos/biomas/arboles/roca1.png')}
                style={s.imgFlotante}
              />
            </ElementoFlotanteSuave>

            <ElementoFlotanteSuave delay={300} distancia={4.5} duracion={2900} rotacion="-8deg" style={s.flotantePastoRight}>
              <Image
                resizeMode="contain"
                source={require('../../../../assets/ilustraciones/senderos/biomas/arboles/pasto2.png')}
                style={s.imgFlotante}
              />
            </ElementoFlotanteSuave>

            {/* Insignia Flotante con Icono del Hábito */}
            {iconoInfo && (
              <View style={s.badgeIconoFlotante}>
                <MasterIconBg
                  colorBordeInicio="rgba(255,255,255,0.9)"
                  colorBordeFin={`${colorTema}66`}
                  degradadoInicio="#FFFFFF"
                  degradadoFin={esc.hoja.l97}
                  size={46}
                  tinte={colorTema}
                >
                  <MasterIcon name={iconoInfo.id} size={26} />
                </MasterIconBg>
              </View>
            )}
          </MasterGlass>

          {/* Tarjeta inferior con el progreso hacia el próximo nivel */}
          <View style={s.progresionBox}>
            <MasterGlass style={s.progresionGlass}>
              <View style={s.progresionFila}>
                <View style={s.progresionTextoCol}>
                  <Texto style={s.progresionKicker}>{t('senderos.mision.crecimientoBioma')}</Texto>
                  <Texto style={s.progresionTitulo}>{t('senderos.mision.rumboEtapa', { nivel: nivelActual + 1 })}</Texto>
                </View>
                <View style={[s.progresionBadge, { backgroundColor: `${colorTema}18` }]}>
                  <Texto style={[s.progresionBadgeTexto, { color: colorTema }]}>
                    {t('senderos.mision.diasProgreso', { completados: diasCompletados, requeridos: diasRequeridos })}
                  </Texto>
                </View>
              </View>
              <MasterProgressbar
                altura={10}
                colorBase={colorTema}
                porcentaje={porcentajeProgresoNivel}
              />
            </MasterGlass>
          </View>
        </Animated.View>

        {/* CENTRO DE ACCIÓN PRINCIPAL (LAYOUTS DEDICADOS POR TIPO DE HÁBITO) */}
        <View style={s.seccionAccionContainer}>
          {/* 1. TIPO CHECK: Tarjeta Táctil con Call-To-Action Pro */}
          {tipoMeta === 'check' && (
            <Animated.View entering={entradaEncadenada(6)} style={s.bloqueAccion}>
              <MasterGlass style={s.bannerCheckPro}>
                <View style={s.bannerCheckIcono}>
                  <Image
                    resizeMode="contain"
                    source={require('../../../../assets/icons/hoy/gemas.png')}
                    style={s.gemaMiniIcono}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Texto style={s.bannerCheckTitulo}>{t('senderos.mision.recompensaTitulo')}</Texto>
                  <Texto style={s.bannerCheckSub}>
                    {t('senderos.mision.recompensaSub')}
                  </Texto>
                </View>
              </MasterGlass>

              <View style={s.ctaContainer}>
                <MasterButton
                  color={colorTema}
                  disabled={mutacion.isPending}
                  onPress={() => enviarRegistro(1)}
                  style={s.botonGrandeCTA}
                  iconoDerecha={({ size }) =>
                    mutacion.isPending ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Check color="#FFFFFF" size={size} strokeWidth={3.5} />
                    )
                  }
                >
                  {t('senderos.mision.cumplirDia', { dia: diaGlobal })}
                </MasterButton>
              </View>
            </Animated.View>
          )}

          {/* 2. TIPO CANTIDAD: Dial Pro con Stepper y Métricas SVG */}
          {tipoMeta === 'cantidad' && (
            <Animated.View entering={entradaEncadenada(6)} style={s.bloqueAccion}>
              <MasterGlass style={s.tarjetaDialPro}>
                <View style={s.dialHeader}>
                  <Texto style={s.dialHeaderTitulo}>{t('senderos.mision.progresoConteo')}</Texto>
                  <Texto style={[s.dialHeaderMeta, { color: colorTema }]}>
                    {t('senderos.mision.objetivoConteo', {
                      meta: metaValor,
                      unidad: unidad || t('senderos.mision.unidadVeces'),
                    })}
                  </Texto>
                </View>

                {/* Dial circular con valor grande y medidor SVG */}
                <View style={s.dialCentro}>
                  <DialCircularProgreso
                    color={colorTema}
                    grosor={14}
                    porcentaje={porcentajeConteo}
                    tamano={190}
                  >
                    <Texto style={s.dialNumeroGrande}>{conteo}</Texto>
                    <Texto style={s.dialUnidadTexto}>{unidad || t('senderos.mision.unidadVeces')}</Texto>
                    <View style={[s.dialBadgePorcentaje, { backgroundColor: `${colorTema}18` }]}>
                      <Texto style={[s.dialPorcentajeTexto, { color: colorTema }]}>
                        {porcentajeConteo}%
                      </Texto>
                    </View>
                  </DialCircularProgreso>
                </View>

                {/* Stepper Táctil con Botones Rebote */}
                <View style={s.stepperFila}>
                  <Rebote
                    accessibilityLabel={t('senderos.mision.restar')}
                    disabled={conteo <= 0 || mutacion.isPending}
                    onPress={() => {
                      hapticSeguro('seleccion');
                      setConteo((prev) => Math.max(0, prev - 1));
                    }}
                    estilo={[s.stepperBtn, conteo <= 0 && s.stepperBtnDisabled]}
                  >
                    <MasterGlass style={s.stepperBtnGlass}>
                      <Minus color={conteo <= 0 ? '#9CA3AF' : colorTema} size={24} strokeWidth={3} />
                    </MasterGlass>
                  </Rebote>

                  <Texto style={s.stepperInfoTexto}>
                    {t('senderos.mision.ajustaRepeticiones')}
                  </Texto>

                  <Rebote
                    accessibilityLabel={t('senderos.mision.sumar')}
                    disabled={mutacion.isPending}
                    onPress={() => {
                      hapticSeguro('seleccion');
                      setConteo((prev) => prev + 1);
                    }}
                    estilo={s.stepperBtn}
                  >
                    <LinearGradient
                      colors={[colorTema, colorTema]}
                      style={s.stepperBtnGradiente}
                    >
                      <Plus color="#FFFFFF" size={24} strokeWidth={3} />
                    </LinearGradient>
                  </Rebote>
                </View>

                <View style={s.ctaContainer}>
                  <MasterButton
                    color={colorTema}
                    disabled={mutacion.isPending || conteo <= 0}
                    onPress={() => enviarRegistro(conteo)}
                    style={s.botonGrandeCTA}
                    iconoDerecha={({ size }) =>
                      mutacion.isPending ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Check color="#FFFFFF" size={size} strokeWidth={3.5} />
                      )
                    }
                  >
                    {t('senderos.mision.registrarConteo', {
                      conteo,
                      unidad: (unidad || '').toUpperCase(),
                    }).trim()}
                  </MasterButton>
                </View>
              </MasterGlass>
            </Animated.View>
          )}

          {/* 3. TIPO DURACIÓN: Cronómetro Digital con Dial SVG y Controles de Meditación */}
          {tipoMeta === 'duracion' && (
            <Animated.View entering={entradaEncadenada(6)} style={s.bloqueAccion}>
              <MasterGlass style={s.tarjetaDialPro}>
                <View style={s.cronoHeaderFila}>
                  <View style={[s.puntoEnfoqueLive, { backgroundColor: corriendo ? C.verde : '#94A3B8' }]} />
                  <Texto style={s.cronoEstadoTexto}>
                    {corriendo ? t('senderos.mision.cronoActivo') : t('senderos.mision.cronoPausa')}
                  </Texto>
                </View>

                {/* Dial SVG del Cronómetro */}
                <View style={s.dialCentro}>
                  <DialCircularProgreso
                    color={colorTema}
                    grosor={14}
                    porcentaje={porcentajeCronometro}
                    tamano={210}
                  >
                    <Texto style={[s.cronoNumeroGrande, { color: corriendo ? colorTema : C.texto }]}>
                      {textoTiempo}
                    </Texto>
                    <Texto style={s.cronoMetaSub}>
                      {t('senderos.mision.cronoMeta', { meta: metaValor, minutos: Math.round((segundos / 60) * 10) / 10 })}
                    </Texto>
                  </DialCircularProgreso>
                </View>

                {/* Controles Play/Pausa/Reset */}
                <View style={s.cronoBotonera}>
                  <Rebote
                    accessibilityLabel={t('senderos.mision.reiniciarTiempo')}
                    disabled={segundos === 0 || mutacion.isPending}
                    onPress={() => {
                      hapticSeguro('seleccion');
                      setCorriendo(false);
                      setSegundos(0);
                      sesionNativaActivaRef.current = false;
                      detenerCronometroNativo();
                    }}
                    estilo={s.cronoSecundarioBtn}
                  >
                    <MasterGlass style={s.cronoSecundarioGlass}>
                      <RotateCcw color={C.tenue} size={18} strokeWidth={2.4} />
                    </MasterGlass>
                  </Rebote>

                  <Rebote
                    accessibilityLabel={corriendo ? t('senderos.mision.pausarSesion') : t('senderos.mision.comenzarSesion')}
                    disabled={mutacion.isPending}
                    onPress={() => {
                      hapticSeguro('accion');
                      setCorriendo((c) => {
                        const nuevoCorriendo = !c;
                        if (nuevoCorriendo) {
                          if (sesionNativaActivaRef.current) {
                            reanudarCronometroNativo();
                          } else {
                            sesionNativaActivaRef.current = true;
                            iniciarCronometroNativo({ color: colorTema, habitoId, segundosIniciales: segundos, titulo: habito?.titulo || '' });
                          }
                        } else {
                          pausarCronometroNativo();
                        }
                        return nuevoCorriendo;
                      });
                    }}
                    estilo={s.cronoPrincipalBtn}
                  >
                    <LinearGradient
                      colors={[colorTema, colorTema]}
                      style={s.cronoPrincipalGradiente}
                    >
                      {corriendo ? (
                        <Pause color="#FFFFFF" fill="#FFFFFF" size={26} />
                      ) : (
                        <Play color="#FFFFFF" fill="#FFFFFF" size={26} />
                      )}
                    </LinearGradient>
                  </Rebote>
                </View>

                {/* Guardar y Finalizar */}
                <View style={s.ctaContainer}>
                  <MasterButton
                    color={colorTema}
                    disabled={mutacion.isPending || segundos < 30}
                    onPress={() => {
                      setCorriendo(false);
                      sesionNativaActivaRef.current = false;
                      detenerCronometroNativo();
                      const mins = Math.max(1, Math.round(segundos / 60));
                      enviarRegistro(mins);
                    }}
                    style={s.botonGrandeCTA}
                    iconoDerecha={({ size }) =>
                      mutacion.isPending ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Check color="#FFFFFF" size={size} strokeWidth={3.5} />
                      )
                    }
                  >
                    {t('senderos.mision.terminarGuardar', { minutos: Math.max(1, Math.round(segundos / 60)) })}
                  </MasterButton>
                </View>
              </MasterGlass>
            </Animated.View>
          )}
        </View>
      </ScrollView>

      {/* MODAL / PANTALLA TRIUNFAL DE VICTORIA LIGHT CON ILUSTRACIÓN */}
      {celebracion !== null && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(180)}
          style={s.celebracionOverlay}
        >
          <Pressable
            onPress={() => {
              hapticSeguro('confirmacion');
              router.back();
            }}
            style={StyleSheet.absoluteFill}
          >
            <View style={s.celebracionBackdrop} />
          </Pressable>

          <Animated.View
            entering={FadeInUp.duration(380).springify().damping(14)}
            style={s.tarjetaVictoriaContenedor}
          >
            <MasterGlass style={s.tarjetaVictoriaGlass}>
              <View style={[s.iconoVictoriaCirculo, { backgroundColor: `${colorTema}22` }]}>
                <Trophy color={colorTema} size={44} strokeWidth={2.4} />
              </View>

              <Texto style={[s.victoriaKicker, { color: colorTema }]}>{t('senderos.mision.victoriaKicker')}</Texto>
              <Texto style={s.victoriaTitulo}>
                {celebracion.subioNivel
                  ? t('senderos.mision.victoriaSubioNivel', { nivel: celebracion.nivel })
                  : t('senderos.mision.victoriaDiaCompletado', { dia: celebracion.diaNumero })}
              </Texto>

              <Texto style={s.victoriaDescripcion}>
                {celebracion.subioNivel
                  ? t('senderos.mision.victoriaDescSubio')
                  : t('senderos.mision.victoriaDescDia')}
              </Texto>

              {celebracion.gemas > 0 && (
                <View style={s.recompensaBox}>
                  <Image
                    resizeMode="contain"
                    source={require('../../../../assets/icons/hoy/gemas.png')}
                    style={s.recompensaGemaIcono}
                  />
                  <Texto style={s.recompensaTexto}>{t('senderos.mision.gemasGanadas', { gemas: celebracion.gemas })}</Texto>
                </View>
              )}

              <MasterButton
                color={colorTema}
                onPress={() => {
                  hapticSeguro('confirmacion');
                  router.back();
                }}
                style={s.botonVictoriaContinuar}
              >
                {t('senderos.mision.continuarSendero')}
              </MasterButton>
            </MasterGlass>
          </Animated.View>
        </Animated.View>
      )}

      <ModalAperturaCofre
        cofre={null}
        color={colorTema}
        colorPaquete={habito?.colorPaquete ?? colorTema}
        gemasAcreditadas={transicionCofre?.gemas}
        modo="automatico"
        onCerrar={() => setTransicionCofre(null)}
        onFinalizarAutomatico={() => {
          setTransicionCofre(null);
          router.back();
        }}
        paqueteId={resolverPaqueteHabito(habito?.paqueteId)}
        visible={transicionCofre !== null}
      />
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  raiz: {
    flex: 1,
  },
  scrollContenido: {
    paddingBottom: 32,
  },
  superiorHeader: {
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  topBarFila: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  botonCerrar: {
    borderRadius: 22,
  },
  cerrarGlass: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  pillCentroGlass: {
    alignItems: 'center',
    borderRadius: 20,
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  puntoPill: {
    borderRadius: 4,
    height: 7,
    width: 7,
  },
  pillCentroTexto: {
    color: C.texto,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  headerDer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  statPill: {
    backgroundColor: C.glass,
    borderColor: C.glassBorde,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  statPillFila: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  gemaIcono: {
    height: 18,
    resizeMode: 'contain',
    width: 18,
  },
  statTexto: {
    color: '#A100FF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 13,
  },
  rachaPillGlass: {
    alignItems: 'center',
    borderRadius: 20,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  rachaTexto: {
    color: '#F97316',
    fontFamily: 'Montserrat-Bold',
    fontSize: 13,
  },
  headerInfoBloque: {
    marginTop: 18,
    paddingHorizontal: 20,
  },
  kickerFila: {
    marginBottom: 6,
  },
  headerTituloPrincipal: {
    color: C.texto,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 27,
    lineHeight: 33,
  },
  headerSubtitulo: {
    color: C.tenue,
    fontFamily: 'Montserrat-Medium',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  heroDioramaSeccion: {
    marginTop: 16,
    paddingHorizontal: 16,
    width: '100%',
  },
  heroDioramaTarjeta: {
    alignItems: 'center',
    borderRadius: 28,
    height: 230,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  auraRespiracion: {
    borderRadius: 100,
    height: 180,
    position: 'absolute',
    width: 180,
  },
  arbolContenedor: {
    alignItems: 'center',
    height: 185,
    justifyContent: 'center',
    width: 185,
    zIndex: 2,
  },
  arbolIlustracion: {
    height: '100%',
    width: '100%',
  },
  badgeIconoFlotante: {
    bottom: 14,
    position: 'absolute',
    right: 16,
    zIndex: 4,
  },
  iconoHabitoImg: {
    height: 26,
    width: 26,
  },
  flotanteRocaTop: { height: 32, left: 16, position: 'absolute', top: 12, width: 32, zIndex: 1 },
  flotantePastoTop: { height: 32, position: 'absolute', right: 20, top: 10, width: 36, zIndex: 1 },
  flotanteRocaLeft: { height: 26, left: 14, position: 'absolute', top: 110, width: 26, zIndex: 1 },
  flotantePastoRight: { height: 32, position: 'absolute', right: 12, top: 105, width: 36, zIndex: 1 },
  imgFlotante: { height: '100%', width: '100%' },
  progresionBox: {
    marginTop: 10,
    width: '100%',
  },
  progresionGlass: {
    borderRadius: 20,
    padding: 14,
  },
  progresionFila: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progresionTextoCol: {
    flex: 1,
  },
  progresionKicker: {
    color: C.tenue,
    fontFamily: 'Montserrat-Bold',
    fontSize: 11,
    letterSpacing: 1.1,
  },
  progresionTitulo: {
    color: C.texto,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 14,
  },
  progresionBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  progresionBadgeTexto: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 12,
  },
  seccionAccionContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
    width: '100%',
  },
  bloqueAccion: {
    width: '100%',
  },
  bannerCheckPro: {
    alignItems: 'center',
    borderRadius: 20,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    padding: 14,
  },
  bannerCheckIcono: {
    alignItems: 'center',
    backgroundColor: 'rgba(254, 240, 138, 0.4)',
    borderColor: 'rgba(234, 179, 8, 0.3)',
    borderRadius: 14,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  gemaMiniIcono: {
    height: 22,
    resizeMode: 'contain',
    width: 22,
  },
  bannerCheckTitulo: {
    color: C.texto,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 14,
  },
  bannerCheckSub: {
    color: C.tenue,
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  ctaContainer: {
    marginTop: 14,
    width: '100%',
  },
  botonGrandeCTA: {
    height: 56,
    width: '100%',
  },
  tarjetaDialPro: {
    alignItems: 'center',
    borderRadius: 26,
    padding: 20,
    width: '100%',
  },
  dialHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  dialHeaderTitulo: {
    color: C.texto,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 16,
  },
  dialHeaderMeta: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 12,
    marginTop: 3,
  },
  dialCentro: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  dialContenedor: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dialContenido: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  dialNumeroGrande: {
    color: C.texto,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 48,
    lineHeight: 52,
  },
  dialUnidadTexto: {
    color: C.tenue,
    fontFamily: 'Montserrat-Medium',
    fontSize: 13,
  },
  dialBadgePorcentaje: {
    borderRadius: 10,
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dialPorcentajeTexto: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 12,
  },
  stepperFila: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    width: '100%',
  },
  stepperBtn: {
    borderRadius: 27,
  },
  stepperBtnGlass: {
    alignItems: 'center',
    borderRadius: 27,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  stepperBtnDisabled: {
    opacity: 0.35,
  },
  stepperBtnGradiente: {
    alignItems: 'center',
    borderRadius: 27,
    elevation: 3,
    height: 54,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    width: 54,
  },
  stepperInfoTexto: {
    color: C.tenue,
    flex: 1,
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    paddingHorizontal: 12,
    textAlign: 'center',
  },
  cronoHeaderFila: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 10,
  },
  puntoEnfoqueLive: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  cronoEstadoTexto: {
    color: C.tenue,
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 12,
    letterSpacing: 0.8,
  },
  cronoNumeroGrande: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 42, lineHeight: 50,
    letterSpacing: 1.5,
  },
  cronoMetaSub: {
    color: C.tenue,
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    marginTop: 4,
  },
  cronoBotonera: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'center',
    marginTop: 14,
  },
  cronoSecundarioBtn: {
    borderRadius: 24,
  },
  cronoSecundarioGlass: {
    alignItems: 'center',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  cronoPrincipalBtn: {
    borderRadius: 32,
    elevation: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  cronoPrincipalGradiente: {
    alignItems: 'center',
    borderRadius: 32,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  celebracionOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 99,
  },
  celebracionBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(26, 19, 53, 0.55)',
  },
  tarjetaVictoriaContenedor: {
    width: '100%',
  },
  tarjetaVictoriaGlass: {
    alignItems: 'center',
    borderRadius: 28,
    padding: 24,
    width: '100%',
  },
  iconoVictoriaCirculo: {
    alignItems: 'center',
    borderRadius: 44,
    height: 88,
    justifyContent: 'center',
    marginBottom: 16,
    width: 88,
  },
  victoriaKicker: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 12,
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  victoriaTitulo: {
    color: C.texto,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 22,
    textAlign: 'center',
  },
  victoriaDescripcion: {
    color: C.tenue,
    fontFamily: 'Montserrat-Medium',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
    textAlign: 'center',
  },
  recompensaBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(254, 240, 138, 0.45)',
    borderColor: 'rgba(234, 179, 8, 0.4)',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  recompensaGemaIcono: {
    height: 22,
    width: 22,
  },
  recompensaTexto: {
    color: '#854D0E',
    fontFamily: 'Montserrat-Bold',
    fontSize: 14,
  },
  botonVictoriaContinuar: {
    marginTop: 20,
    width: '100%',
  },
});
