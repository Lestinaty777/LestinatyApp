import Svg, { Circle } from 'react-native-svg';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useIsFocused, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, StyleSheet, View, useWindowDimensions, Pressable, Image } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { BotonTab } from '../../../nucleo/navegacion/BarraTabs';
import { PixelartIcon } from '../../../diseno/iconos/PixelartIcon';
import Animated, { useSharedValue, useAnimatedStyle, useAnimatedProps, withTiming, Easing, withSpring, withRepeat } from 'react-native-reanimated';
import { BookOpen } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Trophy, Leaf, Sun, Moon, ChevronDown } from 'lucide-react-native';
import { ContenedorMapaSenderos } from '../../senderos/componentes/mapa/ContenedorMapaSenderos';
import { AmbienteLluviaMapa } from '../componentes/mapa/AmbienteLluviaMapa';
import { MasterChip, MasterGlass, MasterIcon, MasterIconBg, MasterProgressbar, Texto, colores, RecuadroGlass, buscarIcono } from '../../../diseno';
import { colorMasterMasCercano, MasterChanger } from '../../../diseno/componentes/MasterChanger';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { fechaLocalHoy } from '../../../nucleo/dispositivo/fechaLocal';
import { TarjetaHabitoCompacta } from '../../habitos/componentes/TarjetaHabitoCompacta';
import { TonoDelHabito } from '../../habitos/componentes/TonoDelHabito';
import { WidgetRegistrarProgreso } from '../../habitos/componentes/WidgetRegistrarProgreso';
import { useSenderoHabito } from '../../habitos/hooks/useSenderoHabito';
import { usarRitualMandala, VIGENCIA_ENCARGO_MS } from '../../habitos/estado/ritualMandala.estado';
import { ModalNivelesSendero } from '../componentes/niveles/ModalNivelesSendero';
import { buscarIconoHabito } from '../../habitos/iconosHabitos';
import { obtenerDetallesHabitosHoy, obtenerHabitosActivos } from '../../habitos/habitos.servicio';
import { EstadoVacioSenderos } from '../componentes/EstadoVacioSenderos';
import type { HabitoResumen } from '../../habitos/tipos';
import { useSaldoGemas } from '../../tienda/useSaldoGemas';
import { coloresSelectorCategoria, type ModuloCategoriaMapa } from '../datos/modulosCategorias';
import { MAPAS_NIVELES } from '../Mapas';
import { useEscala } from '../../../diseno/tema/MasterColorContext';
import type { EscalaMaster } from '../../../diseno/tema/escalaEsmeralda';
import { conAlfa } from '../../../diseno/tema/masterColor';

const DIAS_SEMANA_COMPLETA = [1, 2, 3, 4, 5, 6, 7];
const TAMANO_ICONO_CATEGORIA = 64;
const ALTURA_NAVBAR_BASE = 88;
const PEEK_SIGUIENTE_TARJETA = 32;
const TOTAL_NODOS_PROGRESION = MAPAS_NIVELES.reduce((total, mapa) => total + mapa.cantidadNodos, 0);

type AsignaturaVisible = ModuloCategoriaMapa & { habitoReal: HabitoResumen };

const CLAVES_HABITOS = { titulo: 'senderos.map.categories.habits', subtitulo: 'senderos.map.categories.habitsSubtitle' };
const ICONO_HABITOS = 'hoy/habitos';


// Panel "tus hábitos" del menú del libro — réplica del mockup de referencia.
const crearEstilosCp = (esc: EscalaMaster) => StyleSheet.create({
  headerGlass: { alignItems: 'center', borderRadius: 22, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18, padding: 16 },
  // habitos.png ya incluye su propio fondo verde — solo se dimensiona, sin View/color detrás.
  iconoLibro: { height: 64, width: 64 },
  etiqueta: { color: esc.musgo.l49, fontFamily: 'Montserrat-Bold', fontSize: 10, letterSpacing: 1.4 },
  contador: { color: esc.hoja.l19, fontFamily: 'MontserratAlternates-Bold', fontSize: 24, lineHeight: 29, marginTop: 1 },
  pendientes: { color: esc.musgo.l49, fontFamily: 'Montserrat-Medium', fontSize: 12, marginTop: 1 },
  etiquetaHoy: { color: esc.musgo.l49, fontFamily: 'Montserrat-Bold', fontSize: 10, letterSpacing: 1.2, marginBottom: 4 },
  textoHoy: { color: esc.hoja.l19, fontFamily: 'MontserratAlternates-Bold', fontSize: 14 },
});

const estilosPorEscalaCp = new WeakMap<EscalaMaster, ReturnType<typeof crearEstilosCp>>();

function useEstilosCp() {
  const esc = useEscala();
  let valor = estilosPorEscalaCp.get(esc);
  if (!valor) {
    valor = crearEstilosCp(esc);
    estilosPorEscalaCp.set(esc, valor);
  }
  return valor;
}

export function MapaSenderosPantalla() {
  const esc = useEscala();
  const cp = useEstilosCp();
  const styles = useEstilosStyles();
  const { t } = useTranslation();
  const router = useRouter();
  const parametros = useLocalSearchParams<{ habitoId?: string | string[] }>();
  const habitoIdParametro = Array.isArray(parametros.habitoId) ? parametros.habitoId[0] : parametros.habitoId;

  const [activeMenu, setActiveMenu] = React.useState<'none' | 'courses'>('none');
  const animMenuState = useSharedValue(0);

  const handleToggleMenu = (menu: 'courses') => {
    hapticSeguro('seleccion');
    if (activeMenu === menu) {
      setActiveMenu('none');
    } else {
      setActiveMenu(menu);
    }
  };

  const consultaHabitos = useQuery({ queryKey: ['habitos', 'activos'], queryFn: () => obtenerHabitosActivos() });
  const consultaDetallesHoy = useQuery({ queryKey: ['habitos', 'detalles-hoy'], queryFn: () => obtenerDetallesHabitosHoy() });
  const { data: saldoGemas } = useSaldoGemas();
  const habitosReales = consultaHabitos.data ?? [];
  const detallesPorHabito = React.useMemo(() => new Map((consultaDetallesHoy.data ?? []).map((detalle) => [detalle.habitoId, detalle])), [consultaDetallesHoy.data]);
  const habitosCompletadosHoy = habitosReales.filter((habito) => habito.completado).length;
  const asignaturasHabitos: AsignaturaVisible[] = React.useMemo(() => habitosReales.map((habito) => ({
    categoriaId: 'habitos', color: habito.color, descripcion: habito.descripcion?.trim() || 'Tu progreso diario hacia el próximo nivel.',
    habitoReal: habito, icono: 'actividad', id: habito.id, subcategoriaId: habito.id, titulo: habito.titulo,
  })), [habitosReales]);

  const ASIGNATURAS: readonly AsignaturaVisible[] = asignaturasHabitos;
  const [asignaturaId, setAsignaturaId] = React.useState<string | undefined>(habitoIdParametro);
  const asignatura = ASIGNATURAS.find((item) => item.id === asignaturaId) ?? ASIGNATURAS[0];

  // Preselecciona el hábito indicado por navegación (ej. "Comenzar" desde Hábitos) en cuanto llegan sus datos reales.
  React.useEffect(() => {
    if (habitoIdParametro && asignaturasHabitos.some((item) => item.id === habitoIdParametro)) {
      setAsignaturaId(habitoIdParametro);
    }
  }, [habitoIdParametro, asignaturasHabitos]);

  // Si la selección actual ya no existe en la lista activa (primera carga, categoría recién cambiada, hábito eliminado), cae al primero disponible.
  React.useEffect(() => {
    if (!asignatura && ASIGNATURAS.length > 0) setAsignaturaId(ASIGNATURAS[0].id);
  }, [ASIGNATURAS, asignatura]);

  const idHabitoSeleccionado = asignatura?.habitoReal?.id;
  const [nivelSeleccionado, setNivelSeleccionado] = React.useState<number | undefined>(undefined);
  const [modalNivelesVisible, setModalNivelesVisible] = React.useState(false);
  React.useEffect(() => {
    setNivelSeleccionado(undefined);
    setModalNivelesVisible(false);
  }, [idHabitoSeleccionado]);
  const sendero = useSenderoHabito(idHabitoSeleccionado, nivelSeleccionado);
  const nivelVisible = sendero.nivelVisible;
  const enFoco = useIsFocused();
  const encargoRitual = usarRitualMandala((estado) => estado.encargo);
  const [ritualActivo, setRitualActivo] = React.useState(false);
  const encargarRitual = usarRitualMandala((estado) => estado.encargar);
  const limpiarEncargoRitual = usarRitualMandala((estado) => estado.limpiar);
  // Registro hecho desde el propio mapa (widget inline): misma vía que al
  // volver de una pantalla de misión, el ritual se abre sobre el pedestal.
  const { mandalaPendiente, setMandalaPendiente } = sendero;
  React.useEffect(() => {
    if (!mandalaPendiente) return;
    encargarRitual(mandalaPendiente);
    setMandalaPendiente(null);
  }, [encargarRitual, mandalaPendiente, setMandalaPendiente]);
  const encargoMandalaVigente = encargoRitual && Date.now() - encargoRitual.creadoEn < VIGENCIA_ENCARGO_MS
    ? { registroId: encargoRitual.mandala.registroId }
    : null;
  // Un encargo que no se llegó a abrir se limpia al caducar: si no, retendría
  // la lluvia hasta el próximo repintado de la pantalla.
  React.useEffect(() => {
    if (!encargoRitual) return;
    const restante = VIGENCIA_ENCARGO_MS - (Date.now() - encargoRitual.creadoEn);
    const plazo = setTimeout(limpiarEncargoRitual, Math.max(0, restante));
    return () => clearTimeout(plazo);
  }, [encargoRitual, limpiarEncargoRitual]);
  // Si el día registrado cerró el nivel, el mapa ya saltó al siguiente pero
  // la mandala pendiente es del nivel anterior: se vuelve a ese nivel para
  // que el ritual se abra sobre su pedestal (si no, el encargo caducaría).
  const nivelEncargo = encargoMandalaVigente && enFoco ? encargoRitual?.mandala.nivel : undefined;
  React.useEffect(() => {
    if (nivelEncargo !== undefined && nivelEncargo !== nivelVisible) setNivelSeleccionado(nivelEncargo);
  }, [nivelEncargo, nivelVisible]);
  const mapaNivelVisible = MAPAS_NIVELES[nivelVisible - 1] ?? MAPAS_NIVELES[0];

  const abrirModalNiveles = () => {
    if (sendero.registrando || sendero.celebracion) return;
    hapticSeguro('seleccion');
    setModalNivelesVisible(true);
  };

  React.useEffect(() => {
    const isAnyOpen = activeMenu !== 'none';
    animMenuState.value = withTiming(isAnyOpen ? 1 : 0, { duration: 180, easing: Easing.out(Easing.cubic) });
  }, [activeMenu]);

  const alturaPanelMenu = 260;

  const animContenidoEstilos = useAnimatedStyle(() => ({
    opacity: animMenuState.value,
    transform: [
      { translateY: -20 * (1 - animMenuState.value) }
    ]
  }));



  const insets = useSafeAreaInsets();
  const { height, width: windowWidth } = useWindowDimensions();
  const alturaMapa = height * 0.8;

  

  return (
    <View style={styles.raiz}>
      <SafeAreaView edges={['top']} style={styles.contenedorPrincipal}>
        
        {/* Barra de Navegación Superior */}
        <View style={{ zIndex: 10 }}>
          <View style={styles.navbarContenedor}>
            <MasterGlass blur style={styles.navbarGlass}>
            <View style={styles.navbarFila}>
              <MasterIconBg fuente={buscarIcono(ICONO_HABITOS)!.fuente} hue={buscarIcono(ICONO_HABITOS)!.hue} size={TAMANO_ICONO_CATEGORIA} />

              <View style={styles.navInfo}>
                <Texto numberOfLines={1} style={[styles.tituloAsignatura, { color: oscurecer(coloresSelectorCategoria.habitos, 0.4) }]}>{t(CLAVES_HABITOS.titulo)}</Texto>
                <Texto numberOfLines={2} style={[styles.descAsignatura, { color: oscurecer(coloresSelectorCategoria.habitos, 0.6) }]}>{t(CLAVES_HABITOS.subtitulo)}</Texto>
              </View>

              <Pressable accessibilityLabel={t('senderos.map.accessibility.viewHabits')} onPress={() => handleToggleMenu('courses')}>
                <MasterGlass blur compacto style={styles.botonCristal}>
                  <View style={[styles.botonPildora, activeMenu === 'courses' && { backgroundColor: aclarar(coloresSelectorCategoria.habitos, 0.84) }]}>
                    <BookOpen color={activeMenu === 'courses' ? oscurecer(coloresSelectorCategoria.habitos, 0.4) : '#53505B'} size={22} strokeWidth={2.35} />
                    <Texto style={{ fontSize: 14, fontFamily: 'Montserrat-Bold', color: activeMenu === 'courses' ? oscurecer(coloresSelectorCategoria.habitos, 0.4) : '#53505B', marginTop: -2 }}>{ASIGNATURAS.length}</Texto>
                  </View>
                </MasterGlass>
              </Pressable>
              <View accessibilityLabel={t('senderos.map.accessibility.viewGems')}>
                <MasterGlass blur compacto style={styles.botonCristal}>
                  <View style={styles.botonPildora}>
                    <Image resizeMode="contain" source={require('../../../../assets/icons/hoy/gemas.png')} style={{ height: 23, width: 23 }} />
                    <Texto style={{ fontSize: 14, fontFamily: 'Montserrat-Bold', color: '#53505B', marginTop: -2 }}>{saldoGemas ?? 0}</Texto>
                  </View>
                </MasterGlass>
              </View>
            </View>

            </MasterGlass>
            {activeMenu !== 'none' && (
              <MasterGlass style={[styles.panelDesplegable, { height: alturaPanelMenu }]}>
            <Animated.View pointerEvents="auto" style={[styles.contenidoDesplegable, animContenidoEstilos]}>
              {activeMenu === 'courses' && (() => {
                const habitosPendientesHoy = Math.max(0, habitosReales.length - habitosCompletadosHoy);
                const fraccionHoy = habitosReales.length > 0 ? habitosCompletadosHoy / habitosReales.length : 0;
                const anchoCarta = 260; // Ancho fijo para nuevo layout de row
                return (
                  <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 5, paddingBottom: 5 }}>
                    <MasterGlass blur style={cp.headerGlass}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                        <MasterIcon name="raiz/habitos" size={64} />
                        <View>
                          <Texto style={cp.etiqueta}>{t('senderos.map.habitsPanel.title')}</Texto>
                          <Texto style={cp.contador}>{t('senderos.map.habitsPanel.count', { count: ASIGNATURAS.length, suffix: ASIGNATURAS.length === 1 ? '' : t('senderos.map.habitsPanel.pluralSuffix') })}</Texto>
                          <Texto style={cp.pendientes}>{t('senderos.map.habitsPanel.pending', { count: habitosPendientesHoy })}</Texto>
                        </View>
                      </View>
                      <View style={{ alignItems: 'center' }}>
                        <Texto style={cp.etiquetaHoy}>{t('senderos.map.habitsPanel.today')}</Texto>
                        <View style={{ alignItems: 'center', height: 56, justifyContent: 'center', width: 56 }}>
                          <Svg height={56} style={{ position: 'absolute' }} width={56}>
                            <Circle cx="28" cy="28" fill="none" r={22} stroke={conAlfa(esc.jade.l34, .15)} strokeWidth={5} />
                            <Circle cx="28" cy="28" fill="none" r={22} rotation="-90" stroke={esc.jade.l34} strokeDasharray={`${2 * Math.PI * 22} ${2 * Math.PI * 22}`} strokeDashoffset={2 * Math.PI * 22 * (1 - fraccionHoy)} strokeLinecap="round" strokeWidth={5} origin="28,28" />
                          </Svg>
                          <Texto style={cp.textoHoy}>{habitosCompletadosHoy}/{habitosReales.length}</Texto>
                        </View>
                      </View>
                    </MasterGlass>
                    
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 14, paddingBottom: 6 }}
                      style={{ flex: 1, overflow: 'visible' }}
                      decelerationRate="fast"
                      snapToInterval={anchoCarta + 14}
                    >
                      {asignaturasHabitos.map((asig) => {
                        const detalle = detallesPorHabito.get(asig.habitoReal!.id);
                        const icono = buscarIconoHabito(asig.habitoReal!.iconoLucide);
                        return (
                          <TonoDelHabito colorPaquete={asig.habitoReal!.colorPaquete} key={asig.id} paqueteId={asig.habitoReal!.paqueteId}>
                          <TarjetaHabitoCompacta
                            alto={92}
                            ancho={anchoCarta}
                            diasCompletados={detalle?.diasCompletadosSemana ?? []}
                            diasProgramados={detalle?.diasProgramados ?? DIAS_SEMANA_COMPLETA}
                            icono={icono ?? buscarIconoHabito('idea')!}
                            meta={asig.habitoReal!.meta}
                            nivel={detalle?.nivel ?? 1}
                            onPress={() => { hapticSeguro('seleccion'); setAsignaturaId(asig.id); setActiveMenu('none'); }}
                            racha={detalle?.racha ?? 0}
                            titulo={asig.titulo}
                            valorHoy={asig.habitoReal!.valorHoy}
                          />
                          </TonoDelHabito>
                        );
                      })}
                    </ScrollView>
                  </View>
                );
              })()}
            </Animated.View>
            </MasterGlass>
            )}
          </View>
        </View>

        {/* Barra del hábito seleccionado — info normal, o se convierte en el widget de registro / celebración de nivel */}
        {asignatura && (() => {
          // El color efectivo viene del MasterPackColor del paquete asignado
          // (ya clampeado a un rango seguro en obtenerProgresoNivelHabito) —
          // asignatura.color es solo el fallback mientras esa consulta carga.
          const colorEfectivo = sendero.consulta.data?.habito.color ?? asignatura.color;
          const colorTexto = oscurecer(colorEfectivo, 0.5);
          const iconoHabito = buscarIconoHabito(asignatura.habitoReal.iconoLucide);
          const nodosPrevios = MAPAS_NIVELES.slice(0, nivelVisible - 1).reduce((total, mapa) => total + mapa.cantidadNodos, 0);
          const nodosNivelCompletados = Math.min(sendero.seccionVisible?.diasCompletados ?? 0, mapaNivelVisible.cantidadNodos);
          const porcentajeProgresion = Math.round(Math.min(100, ((nodosPrevios + nodosNivelCompletados) / TOTAL_NODOS_PROGRESION) * 100));
          const contenidoTarjeta = (
            <RecuadroGlass blur degradado={{ inicio: aclarar(colorEfectivo, 0.86), fin: aclarar(colorEfectivo, 0.5) }} style={styles.tarjetaAsignatura}>
              <View style={{ alignItems: 'center', flexDirection: 'row', flex: 1, gap: 12, padding: 14, paddingRight: sendero.registrando ? 14 : 82 }}>
                {!sendero.celebracion && !sendero.registrando && (
                  iconoHabito ? (
                    <MasterIconBg
                      colorBordeInicio={aclarar(colorEfectivo, 0.7)}
                      colorBordeFin={oscurecer(colorEfectivo, 0.75)}
                      degradadoInicio={aclarar(colorEfectivo, 0.93)}
                      degradadoFin={aclarar(colorEfectivo, 0.72)}
                      size={48}
                      tinte={colorEfectivo}
                    >
                      <MasterChanger ancho={41} alto={41} colorDestino={colorMasterMasCercano(colorEfectivo)} fuente={iconoHabito.fuente} />
                    </MasterIconBg>
                  ) : null
                )}
                <View style={{ flex: 1, minWidth: 0 }}>
                  {sendero.celebracion ? (
                    <View style={{ alignItems: 'center', flexDirection: 'row', gap: 8 }}>
                      <Trophy color={esc.jade.l34} size={22} />
                      <Texto numberOfLines={1} style={{ color: esc.jade.l34, fontFamily: 'MontserratAlternates-Bold', fontSize: 16 }}>{t('senderos.map.levelCelebration', { gems: sendero.celebracion.gemas > 0 ? t('senderos.map.gemsReward', { gems: sendero.celebracion.gemas }) : '', level: sendero.celebracion.nivel })}</Texto>
                    </View>
                  ) : sendero.registrando && asignatura.habitoReal && sendero.consulta.data ? (
                    <WidgetRegistrarProgreso
                      colorBase={colorEfectivo}
                      guardando={sendero.registrar.isPending}
                      meta={sendero.consulta.data.habito.meta}
                      onCerrar={() => sendero.setRegistrando(false)}
                      onGuardar={(valor) => sendero.registrar.mutate({ habitoId: asignatura.habitoReal!.id, fechaLocal: fechaLocalHoy(), valor })}
                      tipoMeta={sendero.consulta.data.habito.tipoMeta}
                      titulo={sendero.consulta.data.habito.titulo}
                      unidad={sendero.consulta.data.habito.unidad}
                      valorInicial={sendero.consulta.data.habito.valorHoy}
                    />
                  ) : (
                    <>
                      <Texto numberOfLines={1} style={{ color: colorTexto, fontFamily: 'MontserratAlternates-Bold', fontSize: 16 }}>{asignatura.titulo}</Texto>
                      {sendero.consulta.data ? (
                        <View style={styles.progresoNivelContenedor}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Texto style={[styles.progresoNivelPorcentaje, { color: colorTexto }]}>{porcentajeProgresion}%</Texto>
                            <View style={{ flex: 1 }}>
                              <MasterProgressbar altura={9} porcentaje={porcentajeProgresion} colorBase={colorEfectivo} />
                            </View>
                          </View>
                        </View>
                      ) : null}
                    </>
                  )}
                </View>
                {!sendero.celebracion && !sendero.registrando && sendero.consulta.data && (
                  <Pressable
                    accessibilityLabel={t('senderos.levels.modalTitle')}
                    accessibilityRole="button"
                    hitSlop={8}
                    onPress={abrirModalNiveles}
                    style={styles.insigniaNivelContenedor}
                  >
                    <MasterGlass 
                      blur
                      compacto 
                      style={{ paddingHorizontal: 8, paddingVertical: 5, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                    >
                      <MasterIcon alTema name={`nivel${nivelVisible}`} size={22} />
                      <ChevronDown color={colorTexto} size={14} strokeWidth={2.5} />
                    </MasterGlass>
                  </Pressable>
                )}
              </View>
            </RecuadroGlass>
          );

          const colorPaqueteHabito = sendero.consulta.data?.habito.colorPaquete ?? asignatura.habitoReal.colorPaquete;
          const paqueteIdHabito = sendero.consulta.data?.habito.paqueteId ?? asignatura.habitoReal.paqueteId;

          return (
            <TonoDelHabito colorPaquete={colorPaqueteHabito} paqueteId={paqueteIdHabito}>
              <View style={styles.tarjetaContenedor}>
                {!sendero.celebracion && !sendero.registrando ? (
                  <Pressable
                    accessibilityLabel={t('senderos.levels.modalTitle')}
                    accessibilityRole="button"
                    onPress={abrirModalNiveles}
                    style={{ flex: 1 }}
                  >
                    {contenidoTarjeta}
                  </Pressable>
                ) : (
                  contenidoTarjeta
                )}
              </View>
            </TonoDelHabito>
          );
        })()}

        {/* Modal de niveles del sendero desplegable al tocar la tarjeta o insignia */}
        {asignatura && sendero.consulta.data && sendero.resumen && (
          <ModalNivelesSendero
            colorEfectivo={sendero.consulta.data?.habito.color ?? asignatura.color}
            colorPaquete={sendero.consulta.data.habito.color}
            iconoHabito={buscarIconoHabito(asignatura.habitoReal.iconoLucide)}
            nivelSeleccionado={nivelVisible}
            onCerrar={() => setModalNivelesVisible(false)}
            onSeleccionar={(nivel) => setNivelSeleccionado(nivel)}
            paqueteId={sendero.consulta.data.habito.paqueteId}
            secciones={sendero.resumen.secciones}
            tituloHabito={asignatura.titulo}
            visible={modalNivelesVisible}
          />
        )}

        {/* Contenedor del Mapa / Estado Vacío (ocupa el espacio entre navbar y barra de navegación inferior) */}
        <TonoDelHabito colorPaquete={sendero.consulta.data?.habito.colorPaquete} paqueteId={sendero.consulta.data?.habito.paqueteId}>
        <View style={[styles.capaMapa, !asignatura && styles.capaMapaVacia]}>
          {asignatura ? (
            sendero.consulta.isLoading || sendero.consultaResumen.isLoading ? (
              <View style={styles.centroMapa}><ActivityIndicator color={colores.tintaTenue} style={styles.spinnerCarga} /><Texto style={styles.subMapa}>{t('senderos.map.loadingTrail')}</Texto></View>
            ) : sendero.consulta.isError || !sendero.consulta.data || sendero.consultaResumen.isError || !sendero.resumen ? (
              <View style={styles.centroMapa}><Texto style={styles.subMapa}>{t('senderos.map.trailError')}</Texto></View>
            ) : (
              <>
              <ContenedorMapaSenderos
                key={`${asignatura.id}-${nivelVisible}-${sendero.ciclo}`}
                altura={alturaMapa}
                categoriaId="habitos"
                color={sendero.consulta.data.habito.color}
                colorPaquete={sendero.consulta.data.habito.colorPaquete}
                enfocado
                infoHabito={{ meta: sendero.consulta.data.habito.meta, tipoMeta: sendero.consulta.data.habito.tipoMeta, unidad: sendero.consulta.data.habito.unidad }}
                nodos={sendero.nodos}
                encargoMandala={enFoco ? encargoMandalaVigente : null}
                onEncargoConsumido={limpiarEncargoRitual}
                onRitualActivo={setRitualActivo}
                onCompletarNodo={(nodo, indice) => {
                  const puedeAvanzar = !sendero.soloLectura && Boolean(sendero.seccionVisible?.puedeAvanzarHoy) && nodo.estado === 'activo';
                  if (!puedeAvanzar) return;
                  hapticSeguro('accion');
                  const diaNumero = nodo.titulo.replace(/[^0-9]/g, '') || String(indice + 1);
                  const tipoMetaHabito = sendero.consulta.data?.habito.tipoMeta;
                  const rutaMision = tipoMetaHabito === 'check' ? '/senderos/mision-check'
                    : tipoMetaHabito === 'duracion' ? '/senderos/mision-duracion'
                      : '/senderos/mision-cantidad';
                  router.push({
                    pathname: rutaMision,
                    params: {
                      habitoId: asignatura.habitoReal!.id,
                      diaGlobal: diaNumero,
                      nivel: String(nivelVisible),
                      color: sendero.consulta.data?.habito.color ?? asignatura.color,
                    },
                  });
                }}
                onReclamarCofre={async (cofre) => {
                  const resultado = await sendero.reclamarCofre.mutateAsync({
                    ciclo: sendero.ciclo,
                    habitoId: asignatura.habitoReal!.id,
                    nivel: nivelVisible,
                    nodoDia: cofre.nodoDia,
                    tipo: cofre.tipo,
                  });
                  return { gemas: resultado.gemas };
                }}
                subcategoriaId={asignatura.habitoReal.id}
                paqueteId={sendero.consulta.data.habito.paqueteId}
                nivel={nivelVisible}
                progresoPastoTemprano={(() => {
                  const nivel = nivelVisible;
                  if (nivel >= 4 || !sendero.seccionVisible || sendero.seccionVisible.diasRequeridos <= 0) return 1;
                  return Math.min(1, ((nivel - 1) + sendero.seccionVisible.diasCompletados / sendero.seccionVisible.diasRequeridos) / 3);
                })()}
              />
              {/* Ya completé hoy este hábito y sigo viendo su mapa: llueve
                  hasta el próximo día programado (no "hasta mañana" — un
                  hábito no diario sigue lloviendo en los días intermedios,
                  ver spec). Se apaga sola al cambiar de hábito, por el propio
                  ciclo de montaje del componente — pero las pestañas de
                  expo-router NO desmontan la pantalla al perder el foco (solo
                  dejan de ser visibles), así que sin `enFoco` acá el sonido en
                  loop seguía sonando en otras pestañas. La lluvia espera a que
                  termine la mandala del día: no empieza mientras hay un ritual
                  pendiente de abrirse o en curso. */}
              {enFoco && sendero.seccionVisible && !sendero.seccionVisible.puedeAvanzarHoy && sendero.seccionVisible.diasCompletados > 0 && !ritualActivo && !encargoMandalaVigente && (
                <AmbienteLluviaMapa alto={alturaMapa} />
              )}
              </>
            )
          ) : (
            <View style={[styles.centroMapa, { paddingBottom: insets.bottom + 96 }]}>
              {consultaHabitos.isLoading ? (
                <><ActivityIndicator color={colores.tintaTenue} style={styles.spinnerCarga} /><Texto style={styles.subMapa}>{t('senderos.map.loadingHabits')}</Texto></>
              ) : (
                <EstadoVacioSenderos
                  alCrearHabito={() => {
                    router.push({
                      pathname: '/(principal)/hoy',
                      params: { abrirCreacion: '1' },
                    });
                  }}
                />
              )}
            </View>
          )}
        </View>
        </TonoDelHabito>
      </SafeAreaView>
    </View>
  );
}




function oscurecer(color: string, factor = 0.7) {
  const hex = color.replace('#', '');
  const canal = (inicio: number) => Math.round(parseInt(hex.slice(inicio, inicio + 2), 16) * factor).toString(16).padStart(2, '0');
  return `#${canal(0)}${canal(2)}${canal(4)}`;
}

// Mezcla hacia blanco — genera el mismo tipo de degradado pastel-a-medio que ya usan las tarjetas de hábito, a partir de cualquier color de categoría.
function aclarar(color: string, factor = 0.7) {
  const hex = color.replace('#', '');
  const canal = (inicio: number) => { const valor = parseInt(hex.slice(inicio, inicio + 2), 16); return Math.round(valor + (255 - valor) * factor).toString(16).padStart(2, '0'); };
  return `#${canal(0)}${canal(2)}${canal(4)}`;
}

const crearEstilosStyles = (esc: EscalaMaster) => StyleSheet.create({
  raiz: {
    backgroundColor: '#EAEAEA',
    flex: 1,
    position: 'relative',
  },
  contenedorPrincipal: {
    flex: 1,
  },
  navbarContenedor: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
    position: 'relative',
  },
  navbarGlass: { height: ALTURA_NAVBAR_BASE },
  panelDesplegable: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: ALTURA_NAVBAR_BASE + 8,
    zIndex: 1,
  },
  contenidoDesplegable: { flex: 1 },
  badgeCategoriaActivo: {
    transform: [{ scale: 0.94 }],
  },
  navInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  botonPildora: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 6,
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  botonCristal: { borderRadius: 12 },
  tooltipCategorias: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  tooltipCategoriasTitulo: {
    color: 'rgba(17,17,17,.48)',
    fontFamily: 'Montserrat-Bold',
    fontSize: 8,
    letterSpacing: 1.15,
    marginBottom: 8,
  },
  tooltipCategoriasFila: {
    flexDirection: 'row',
    gap: 8,
  },
  tooltipCategoriaOpcion: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,.62)',
    borderRadius: 12,
    flex: 1,
    gap: 3,
    minHeight: 70,
    justifyContent: 'center',
    paddingVertical: 7,
  },
  tooltipCategoriaOpcionActiva: {
    backgroundColor: 'rgba(17,17,17,.07)',
  },
  tooltipCategoriaOpcionPresionada: {
    opacity: .68,
  },
  tooltipCategoriaIcono: {
    height: 32,
    resizeMode: 'contain',
    width: 32,
  },
  tooltipCategoriaTexto: {
    color: '#252525',
    fontFamily: 'Montserrat-Bold',
    fontSize: 10,
  },
  carruselSenderos: {
    paddingHorizontal: 15,
    gap: 12,
    alignItems: 'center',
  },
  tarjetaCarrusel: {
    
    borderRadius: 16,
    width: 120,
    height: 90,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  iconoCarrusel: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  textoCarruselTitulo: {
    fontSize: 11,
    fontFamily: 'MontserratAlternates-Bold',
    color: '#FFFFFF',
    lineHeight: 13,
  },
  textoCarruselDesc: {
    fontSize: 8.5,
    fontFamily: 'MontserratAlternates-Medium',
    color: '#FFFFFF',
    marginTop: 1,
  },
  navbarFila: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    height: ALTURA_NAVBAR_BASE,
    paddingHorizontal: 14,
  },
  navbarSuperior: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 14,
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  // Flotante de verdad: position absolute + zIndex propio, para que no vaya
  // pegada a la navbar (ambas eran hermanas en el flujo normal, con márgenes
  // idénticos que las hacían leer como una sola pieza) ni se empuje cuando la
  // navbar se expande (su dropdown anima su propia altura). zIndex 5 la deja
  // por encima del mapa (sin zIndex propio) pero debajo de la navbar (10),
  // así su dropdown la sigue tapando con naturalidad al abrirse.
  tarjetaContenedor: {
    left: 20,
    right: 20,
    top: ALTURA_NAVBAR_BASE + 54,
    position: 'absolute',
    height: 92,
    zIndex: 5,
    shadowColor: esc.hoja.l22,
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 6,
  },
  tarjetaAsignatura: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
    height: 92,
  },
  progresoNivelContenedor: {
    gap: 4,
    marginTop: 5,
  },
  progresoNivelEtiqueta: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progresoNivelTexto: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 9,
  },
  progresoNivelPorcentaje: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 10,
  },
  insigniaNivelContenedor: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 1,
    position: 'absolute',
    right: 10,
    top: 10,
  },
  insigniaNivel: {
    marginHorizontal: 1,
  },
  botonNivelPrueba: {
    alignItems: 'center',
    height: 22,
    justifyContent: 'center',
    width: 18,
  },
  botonNivelPruebaDeshabilitado: {
    opacity: 0.28,
  },
  tarjetaBrilloCarrusel: {
    position: 'absolute',
    top: -62,
    left: -50,
    height: 280,
    width: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    transform: [{ rotate: '45deg' }],
  },
  tituloAsignatura: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 17,
    color: esc.jade.l34,
    lineHeight: 20,
    marginBottom: 0,
  },
  descAsignatura: {
    fontFamily: 'MontserratAlternates-Medium',
    fontSize: 13,
    color: esc.musgo.l49,
    lineHeight: 16,
  },
  espacioFlexible: {
    flex: 1, // Toma todo el espacio restante hasta empujar la capaMapa
  },
  botonAccion: {
    padding: 8, // Aumenta el area táctil
  },
  botonAccionPresionado: {
    opacity: 0.5,
    transform: [{ scale: 0.9 }],
  },
  capaMapa: {
    height: '80%', // Forzamos el 80% de altura estricto
    overflow: 'hidden',
  },
  capaMapaVacia: {
    flex: 1,
    height: '100%',
  },
  centroMapa: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 0,
  },
  subMapa: {
    color: 'rgba(0,0,0,0.45)',
    fontFamily: 'Montserrat-Medium',
    fontSize: 13,
    textAlign: 'center',
  },
  spinnerCarga: {
    marginBottom: 10,
  },
  tituloMapa: {
    color: '#111111',
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
  },
});

const estilosPorEscalaStyles = new WeakMap<EscalaMaster, ReturnType<typeof crearEstilosStyles>>();

function useEstilosStyles() {
  const esc = useEscala();
  let valor = estilosPorEscalaStyles.get(esc);
  if (!valor) {
    valor = crearEstilosStyles(esc);
    estilosPorEscalaStyles.set(esc, valor);
  }
  return valor;
}


