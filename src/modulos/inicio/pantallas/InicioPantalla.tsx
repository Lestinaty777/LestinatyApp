import {
  addDays,
  format,
  getDay,
  isSameDay,
  isSameMonth,
  startOfMonth,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { BlurView } from 'expo-blur';
import { CalendarDays, Leaf, ListChecks } from 'lucide-react-native';
import { Bell, Calendar as PhosphorCalendar, CaretLeft, CaretRight, List } from 'phosphor-react-native';
import { useRef, useState } from 'react';
import { Animated, Image, Modal, Pressable, StyleSheet, useColorScheme, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Defs,
  FeBlend,
  FeColorMatrix,
  FeComposite,
  FeFlood,
  FeGaussianBlur,
  FeOffset,
  Filter,
  G,
  Path,
} from 'react-native-svg';

import { RecuadroGlass, Texto, biomas, colores, espaciado } from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';

const Bioma = biomas.inicio;
const colorIcono = '#76736D';
const diasSemana = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const anchoCalendario = 316;
const altoBarraNavegacion = 76;
const radioGlassInicio = 18;
const separacionBarraNavegacion = espaciado.sm;

function capitalizar(valor: string) {
  return valor.charAt(0).toUpperCase() + valor.slice(1);
}

function obtenerDiasMes(fecha: Date) {
  const inicioMes = startOfMonth(fecha);
  const indiceLunesPrimero = (getDay(inicioMes) + 6) % 7;
  const inicioGrid = addDays(inicioMes, -indiceLunesPrimero);

  return Array.from({ length: 42 }, (_, indice) => addDays(inicioGrid, indice));
}

type PosicionPopover = {
  left: number;
  top: number;
};

function hapticSeleccion() {
  hapticSeguro('seleccion');
}

function IconoBaseBioma({ color, size = 46 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={(size * 23) / 24} viewBox="0 0 24 23" fill="none">
      <G filter="url(#filter0_dii_3574_1908)">
        <Path
          d="M10.2267 2.29713C11.0492 1.90101 12.0074 1.90101 12.83 2.29713L17.2632 4.43204C18.0857 4.82816 18.6831 5.5773 18.8863 6.46738L19.9812 11.2645C20.1843 12.1546 19.9711 13.0887 19.4019 13.8025L16.334 17.6495C15.7648 18.3633 14.9015 18.779 13.9886 18.779H9.06809C8.15512 18.779 7.29183 18.3633 6.7226 17.6495L3.65474 13.8025C3.08551 13.0887 2.87229 12.1546 3.07545 11.2645L4.17036 6.46738C4.37351 5.5773 4.97093 4.82816 5.79349 4.43204L10.2267 2.29713Z"
          fill={color}
        />
        <Path
          d="M10.2267 2.29713C11.0492 1.90101 12.0074 1.90101 12.83 2.29713L17.2632 4.43204C18.0857 4.82816 18.6831 5.5773 18.8863 6.46738L19.9812 11.2645C20.1843 12.1546 19.9711 13.0887 19.4019 13.8025L16.334 17.6495C15.7648 18.3633 14.9015 18.779 13.9886 18.779H9.06809C8.15512 18.779 7.29183 18.3633 6.7226 17.6495L3.65474 13.8025C3.08551 13.0887 2.87229 12.1546 3.07545 11.2645L4.17036 6.46738C4.37351 5.5773 4.97093 4.82816 5.79349 4.43204L10.2267 2.29713Z"
          fill={color}
        />
      </G>
      <Defs>
        <Filter
          id="filter0_dii_3574_1908"
          x="0"
          y="0"
          width="23.0566"
          height="22.7791"
          filterUnits="userSpaceOnUse"
        >
          <FeFlood floodOpacity="0" result="BackgroundImageFix" />
          <FeColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <FeOffset dy="1" />
          <FeGaussianBlur stdDeviation="1.5" />
          <FeComposite in2="hardAlpha" operator="out" />
          <FeColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
          <FeBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_3574_1908" />
          <FeBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_3574_1908" result="shape" />
          <FeColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <FeOffset dx="-1" dy="1" />
          <FeComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <FeColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.2 0" />
          <FeBlend mode="normal" in2="shape" result="effect2_innerShadow_3574_1908" />
          <FeColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <FeOffset dy="-1" />
          <FeComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <FeColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
          <FeBlend mode="normal" in2="effect2_innerShadow_3574_1908" result="effect3_innerShadow_3574_1908" />
        </Filter>
      </Defs>
    </Svg>
  );
}

export function InicioPantalla() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const esquemaColor = useColorScheme();
  const fondoBioma = esquemaColor === 'dark' ? Bioma.DarkBg : Bioma.LightBg;
  const botonCalendarioRef = useRef<View>(null);
  const hoy = new Date();
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoy);
  const [mesVisible, setMesVisible] = useState(hoy);
  const [selectorAbierto, setSelectorAbierto] = useState(false);
  const [posicionPopover, setPosicionPopover] = useState<PosicionPopover>({ left: espaciado.lg, top: 92 });
  const progresoCalendario = useRef(new Animated.Value(0)).current;
  const fechaHoy = capitalizar(format(fechaSeleccionada, 'EEEE d \'de\' MMMM', { locale: es }));
  const diasMes = obtenerDiasMes(mesVisible);
  const opacidadCalendario = progresoCalendario.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const escalaCalendario = progresoCalendario.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1],
  });
  const desplazamientoCalendario = progresoCalendario.interpolate({
    inputRange: [0, 1],
    outputRange: [-8, 0],
  });
  function abrirCalendario() {
    hapticSeleccion();
    botonCalendarioRef.current?.measureInWindow((x, y, ancho, alto) => {
      const left = Math.min(Math.max(x, espaciado.md), width - anchoCalendario - espaciado.md);

      setPosicionPopover({
        left,
        top: y + alto + 12,
      });
      setSelectorAbierto(true);
      progresoCalendario.setValue(0);
      Animated.spring(progresoCalendario, {
        damping: 17,
        mass: 0.8,
        stiffness: 220,
        toValue: 1,
        useNativeDriver: true,
      }).start();
    });
  }

  function cerrarCalendario(conHaptic = true) {
    if (conHaptic) {
      hapticSeleccion();
    }

    Animated.timing(progresoCalendario, {
      duration: 150,
      toValue: 0,
      useNativeDriver: true,
    }).start(() => setSelectorAbierto(false));
  }

  function cambiarMes(direccion: 1 | -1) {
    hapticSeleccion();
    setMesVisible((fecha) => new Date(fecha.getFullYear(), fecha.getMonth() + direccion, 1));
  }

  function seleccionarFecha(fecha: Date) {
    hapticSeleccion();
    setFechaSeleccionada(fecha);
    setMesVisible(fecha);
    cerrarCalendario(false);
  }

  return (
    <SafeAreaView style={styles.raiz} edges={['left', 'right', 'top']}>
      <View style={styles.fondoBioma} pointerEvents="none">
        <Image source={fondoBioma} style={styles.imagenFondoBioma} resizeMode="cover" />
      </View>

      <View style={styles.barraSuperior}>
        <View style={styles.filaBarraSuperior}>
          <View style={styles.encabezado}>
            <Pressable
              ref={botonCalendarioRef}
              accessibilityLabel="Abrir calendario"
              onPress={abrirCalendario}
              style={({ pressed }) => [styles.botonIcono, styles.botonCalendario, pressed && styles.botonPresionado]}
            >
              <CalendarDays color={colorIcono} size={21} strokeWidth={2.1} />
            </Pressable>

            <View style={styles.textos}>
              <View style={styles.tituloFila}>
                <Texto style={styles.titulo}>Hoy</Texto>
                <Leaf color={Bioma.MasterColor} size={21} strokeWidth={2.4} />
              </View>
              <Texto style={styles.fecha}>{fechaHoy}</Texto>
            </View>
          </View>

          <View style={styles.acciones}>
            <Pressable
              accessibilityLabel="Abrir notificaciones"
              onPress={hapticSeleccion}
              style={({ pressed }) => [styles.botonIcono, styles.botonMini, pressed && styles.botonPresionado]}
            >
              <Bell color={colorIcono} size={19} />
            </Pressable>

            <Pressable
              accessibilityLabel="Abrir menu"
              onPress={hapticSeleccion}
              style={({ pressed }) => [styles.botonIcono, styles.botonMini, pressed && styles.botonPresionado]}
            >
              <List color={colorIcono} size={20} />
            </Pressable>
          </View>
        </View>

        <RecuadroGlass style={styles.resumenTareas}>
          <View style={styles.resumenTareasFila}>
            <View style={styles.resumenTareasIcono}>
              <ListChecks color={Bioma.MasterColor} size={14} strokeWidth={2.2} />
            </View>
            <Texto style={styles.resumenTareasTexto}>1 de 5 tareas</Texto>
          </View>

          <View style={styles.barraProgresoTareas}>
            <View style={styles.progresoTareas} />
          </View>
        </RecuadroGlass>
      </View>

      <RecuadroGlass style={[styles.panelInferior, { bottom: altoBarraNavegacion + separacionBarraNavegacion + espaciado.md + insets.bottom }]}>
        <RecuadroGlass style={styles.mensajeTareasHoy}>
          <View style={styles.mensajeTareasHoyIcono}>
            <IconoBaseBioma color={Bioma.MasterColor} size={46} />
            <View pointerEvents="none" style={styles.mensajeTareasHoyIconoCentro}>
              <PhosphorCalendar color={colores.superficie} size={18} weight="fill" />
            </View>
          </View>

          <View style={styles.mensajeTareasHoyTextos}>
            <Texto style={styles.mensajeTareasHoyTitulo}>Tareas de hoy</Texto>
            <Texto style={styles.mensajeTareasHoySubtitulo}>Organiza tu sendero diario</Texto>
          </View>

          <Pressable onPress={hapticSeleccion} style={({ pressed }) => [styles.botonComenzar, pressed && styles.botonComenzarPresionado]}>
            <Texto style={styles.botonComenzarTexto}>Comenzar</Texto>
            <CaretRight color={Bioma.MasterColor} size={13} />
          </Pressable>
        </RecuadroGlass>

        <View style={styles.gridWidgetsHoy}>
          <View style={styles.columnaWidgetsIzquierda}>
            <RecuadroGlass style={styles.widgetHoy} />
            <RecuadroGlass style={styles.widgetHoy} />
          </View>

          <RecuadroGlass style={[styles.widgetHoy, styles.widgetCamino]} />
        </View>
      </RecuadroGlass>

      <Modal transparent animationType="none" visible={selectorAbierto} onRequestClose={() => cerrarCalendario()}>
        <Pressable style={styles.overlayCalendario} onPress={() => cerrarCalendario()}>
          <Animated.View pointerEvents="none" style={[styles.overlayCalendarioFondo, { opacity: opacidadCalendario }]} />
          <Animated.View
            style={[
              styles.posicionPopoverCalendario,
              {
                left: posicionPopover.left,
                opacity: opacidadCalendario,
                top: posicionPopover.top,
                transform: [{ translateY: desplazamientoCalendario }, { scale: escalaCalendario }],
              },
            ]}
          >
            <Pressable onPress={(evento) => evento.stopPropagation()}>
              <BlurView intensity={14.4} tint="light" style={styles.blurCalendario}>
                <RecuadroGlass style={styles.popoverCalendario}>
                  <View style={styles.cabeceraCalendario}>
                    <Pressable
                      accessibilityLabel="Mes anterior"
                      onPress={() => cambiarMes(-1)}
                      style={({ pressed }) => [styles.botonIcono, styles.botonFlecha, pressed && styles.botonPresionado]}
                    >
                      <CaretLeft color={colorIcono} size={18} />
                    </Pressable>

                    <Texto style={styles.mesCalendario}>{capitalizar(format(mesVisible, 'MMMM yyyy', { locale: es }))}</Texto>

                    <Pressable
                      accessibilityLabel="Mes siguiente"
                      onPress={() => cambiarMes(1)}
                      style={({ pressed }) => [styles.botonIcono, styles.botonFlecha, pressed && styles.botonPresionado]}
                    >
                      <CaretRight color={colorIcono} size={18} />
                    </Pressable>
                  </View>

                  <View style={styles.diasSemana}>
                    {diasSemana.map((dia, indice) => (
                      <Texto key={`${dia}-${indice}`} style={styles.diaSemana}>
                        {dia}
                      </Texto>
                    ))}
                  </View>

                  <View style={styles.gridCalendario}>
                    {diasMes.map((fecha) => {
                      const seleccionado = isSameDay(fecha, fechaSeleccionada);
                      const actual = isSameDay(fecha, hoy);
                      const enMes = isSameMonth(fecha, mesVisible);
                      const key = format(fecha, 'yyyy-MM-dd');

                      return (
                        <Pressable
                          key={key}
                          accessibilityLabel={format(fecha, "d 'de' MMMM", { locale: es })}
                          onPress={() => seleccionarFecha(fecha)}
                          style={({ pressed }) => [styles.diaBoton, pressed && styles.diaPresionado]}
                        >
                          <View style={[styles.diaContenido, seleccionado && styles.diaSeleccionado]}>
                            <Texto
                              style={[
                                styles.diaTexto,
                                !enMes && styles.diaFueraMes,
                                actual && styles.diaActualTexto,
                                seleccionado && styles.diaSeleccionadoTexto,
                              ]}
                            >
                              {format(fecha, 'd')}
                            </Texto>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </RecuadroGlass>
              </BlurView>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  raiz: {
    backgroundColor: '#F2EADF',
    flex: 1,
  },
  barraSuperior: {
    paddingHorizontal: espaciado.lg,
    paddingTop: espaciado.md + 10,
    zIndex: 1,
  },
  filaBarraSuperior: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fondoBioma: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  imagenFondoBioma: {
    height: '100%',
    width: '100%',
  },
  panelInferior: {
    borderRadius: radioGlassInicio,
    bottom: altoBarraNavegacion + separacionBarraNavegacion + espaciado.md,
    height: '50%',
    left: espaciado.lg,
    padding: espaciado.md,
    position: 'absolute',
    right: espaciado.lg,
    zIndex: 1,
  },
  mensajeTareasHoy: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: radioGlassInicio,
    flexDirection: 'row',
    gap: espaciado.sm,
    minHeight: 58,
    justifyContent: 'center',
    paddingHorizontal: espaciado.md,
    width: '100%',
  },
  mensajeTareasHoyIcono: {
    alignItems: 'center',
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  mensajeTareasHoyIconoCentro: {
    alignItems: 'center',
    height: 46,
    justifyContent: 'center',
    left: -1,
    position: 'absolute',
    top: -2,
    width: 46,
  },
  mensajeTareasHoyTextos: {
    flex: 1,
  },
  mensajeTareasHoyTitulo: {
    color: colores.texto,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 14,
    lineHeight: 18,
  },
  mensajeTareasHoySubtitulo: {
    color: colores.textoSecundario,
    fontFamily: 'MontserratAlternates-SemiBold',
    fontSize: 10,
    lineHeight: 14,
  },
  botonComenzar: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.42)',
    borderColor: 'rgba(255, 255, 255, 0.62)',
    borderRadius: 10,
    borderWidth: 0.5,
    flexDirection: 'row',
    gap: 2,
    justifyContent: 'center',
    minHeight: 30,
    paddingHorizontal: espaciado.sm,
  },
  botonComenzarPresionado: {
    opacity: 0.72,
    transform: [{ translateY: 1 }],
  },
  botonComenzarTexto: {
    color: Bioma.MasterColor,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 10,
    lineHeight: 14,
  },
  gridWidgetsHoy: {
    flex: 1,
    flexDirection: 'row',
    gap: espaciado.md,
    marginTop: espaciado.md,
  },
  columnaWidgetsIzquierda: {
    flex: 1,
    gap: espaciado.md,
  },
  widgetHoy: {
    borderRadius: radioGlassInicio,
    flex: 1,
  },
  widgetCamino: {
    flex: 1,
  },
  encabezado: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: espaciado.sm,
  },
  acciones: {
    flexDirection: 'row',
    gap: espaciado.sm,
  },
  botonIcono: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    borderWidth: 0.5,
    justifyContent: 'center',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
  },
  botonCalendario: {
    height: 44,
    width: 44,
  },
  botonMini: {
    height: 38,
    width: 38,
  },
  botonFlecha: {
    height: 34,
    width: 34,
  },
  botonPresionado: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    transform: [{ translateY: 3 }],
  },
  textos: {
    gap: 4,
  },
  tituloFila: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: espaciado.xs,
  },
  titulo: {
    color: colores.texto,
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 26,
    lineHeight: 30,
  },
  fecha: {
    color: colores.textoSecundario,
    fontFamily: 'MontserratAlternates-SemiBold',
    fontSize: 12,
    lineHeight: 17,
  },
  resumenTareas: {
    borderRadius: radioGlassInicio,
    gap: 6,
    marginTop: espaciado.md,
    paddingHorizontal: espaciado.sm,
    paddingVertical: 7,
    width: 146,
  },
  resumenTareasFila: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: espaciado.xs,
  },
  resumenTareasIcono: {
    alignItems: 'center',
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  resumenTareasTexto: {
    color: colores.texto,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 11,
    lineHeight: 15,
  },
  barraProgresoTareas: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 999,
    height: 5,
    overflow: 'hidden',
    width: '100%',
  },
  progresoTareas: {
    backgroundColor: Bioma.MasterColor,
    borderRadius: 999,
    height: '100%',
    width: '20%',
  },
  overlayCalendario: {
    flex: 1,
  },
  overlayCalendarioFondo: {
    backgroundColor: 'rgba(22, 23, 27, 0.08)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  posicionPopoverCalendario: {
    position: 'absolute',
    width: anchoCalendario,
  },
  blurCalendario: {
    borderRadius: radioGlassInicio,
    overflow: 'hidden',
    width: anchoCalendario,
  },
  popoverCalendario: {
    borderRadius: radioGlassInicio,
    padding: espaciado.md,
    width: anchoCalendario,
  },
  cabeceraCalendario: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: espaciado.md,
  },
  mesCalendario: {
    color: colores.texto,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'center',
  },
  diasSemana: {
    flexDirection: 'row',
    marginBottom: espaciado.sm,
  },
  diaSemana: {
    color: colores.textoSecundario,
    flex: 1,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
  gridCalendario: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: espaciado.xs,
  },
  diaBoton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: `${100 / 7}%`,
  },
  diaContenido: {
    alignItems: 'center',
    borderRadius: 12,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  diaPresionado: {
    opacity: 0.72,
    transform: [{ translateY: 2 }],
  },
  diaSeleccionado: {
    backgroundColor: 'rgba(255, 255, 255, 0.42)',
    borderColor: 'rgba(82, 99, 58, 0.36)',
    borderTopWidth: 0.7,
    borderWidth: 0.4,
    shadowColor: Bioma.Paleta.primaryDark,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.42,
    shadowRadius: 9,
  },
  diaTexto: {
    color: colores.texto,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  diaFueraMes: {
    color: colores.tintaTenue,
    opacity: 0.55,
  },
  diaActualTexto: {
    color: Bioma.Paleta.primaryDark,
  },
  diaSeleccionadoTexto: {
    color: Bioma.Paleta.primaryDark,
  },
});
