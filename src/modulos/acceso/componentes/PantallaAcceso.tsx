import { ComponentProps, PropsWithChildren, ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  ImageSourcePropType,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';
import { Link } from 'expo-router';

import { colores, espaciado } from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';

const imagenesConstruccion = [
  require('../../../../assets/construcciones/1.png'),
  require('../../../../assets/construcciones/2.png'),
  require('../../../../assets/construcciones/3.png'),
  require('../../../../assets/construcciones/4.png'),
  require('../../../../assets/construcciones/5.png'),
  require('../../../../assets/construcciones/6.png'),
  require('../../../../assets/construcciones/7.png'),
] satisfies ImageSourcePropType[];

const logo = require('../../../../assets/marca/lestinaty.png');

const temasAcceso = [
  { principal: '#3B6FD1', lip: '#1E3E80', texto: '#2A54A6' },
  { principal: '#5FC13E', lip: '#2C6B1A', texto: '#3B7A22' },
  { principal: '#E5B82E', lip: '#8C6610', texto: '#9A7412' },
  { principal: '#E47B25', lip: '#8A3F10', texto: '#A84F16' },
  { principal: '#D63E35', lip: '#7E211C', texto: '#9E2E28' },
  { principal: '#E1358C', lip: '#86164E', texto: '#A91E68' },
  { principal: '#7B3CE6', lip: '#3F1A92', texto: '#5A28B6' },
] as const;

function hapticSeleccion() {
  hapticSeguro('seleccion');
}

function hapticAccion() {
  hapticSeguro('confirmacion');
}

type TemaAcceso = (typeof temasAcceso)[number];

type TemaAccesoContextoValor = {
  opacidadesTema: Animated.Value[];
  tema: TemaAcceso;
};

const TemaAccesoContexto = createContext<TemaAccesoContextoValor>({
  opacidadesTema: [],
  tema: temasAcceso[1],
});

type PantallaAccesoProps = PropsWithChildren<{
  botonInferior?: ReactNode;
  subtitulo: string;
  titulo: string;
  topPanel?: `${number}%` | number;
}>;

function limitar(valor: number, minimo: number, maximo: number) {
  return Math.min(Math.max(valor, minimo), maximo);
}

export function calcularEscalaAcceso(height: number, width: number) {
  const escalaPorAlto = (height * 0.5) / 430;
  const escalaPorAncho = width / 390;

  return limitar(Math.min(escalaPorAlto, escalaPorAncho), 0.72, 1);
}

function TituloAcceso({ children, escala }: PropsWithChildren<{ escala: number }>) {
  const { opacidadesTema } = usarTemaAcceso();
  const estiloTitulo = {
    fontSize: 31 * escala,
    lineHeight: 38 * escala,
  };

  return (
    <View style={[styles.tituloMarco, { minHeight: 38 * escala }]}>
      <Text style={[styles.titulo, estiloTitulo, styles.tituloMedida]}>{children}</Text>
      {temasAcceso.map((tema, indice) => (
        <Animated.Text
          key={`titulo-${tema.texto}`}
          accessible={false}
          style={[
            styles.titulo,
            styles.tituloCapa,
            estiloTitulo,
            {
              color: tema.texto,
              opacity: opacidadesTema[indice],
            },
          ]}
        >
          {children}
        </Animated.Text>
      ))}
    </View>
  );
}

export function PantallaAcceso({ botonInferior, children, subtitulo, titulo, topPanel }: PantallaAccesoProps) {
  const [imagenActual, setImagenActual] = useState(0);
  const imagenActualRef = useRef(0);
  const animacionCambioActiva = useRef(false);
  const animacionCambio = useRef<Animated.CompositeAnimation | null>(null);
  const opacidadesImagenes = useRef(imagenesConstruccion.map((_, indice) => new Animated.Value(indice === 0 ? 1 : 0))).current;
  const opacidadesTema = useRef(temasAcceso.map((_, indice) => new Animated.Value(indice === 0 ? 1 : 0))).current;
  const progresoNubeLenta = useRef(new Animated.Value(0)).current;
  const progresoNubeRapida = useRef(new Animated.Value(0)).current;
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const escala = calcularEscalaAcceso(height, width);
  const tema = temasAcceso[imagenActual];
  const topPanelCalculado = topPanel ?? (botonInferior ? '34%' : '50%');
  const desplazamientoNubeLenta = progresoNubeLenta.interpolate({
    inputRange: [0, 1],
    outputRange: [-130, 130],
  });
  const desplazamientoNubeRapida = progresoNubeRapida.interpolate({
    inputRange: [0, 1],
    outputRange: [150, -150],
  });

  useEffect(() => {
    const intervalo = setInterval(() => {
      if (animacionCambioActiva.current) {
        return;
      }

      const actual =
        imagenActualRef.current >= 0 && imagenActualRef.current < imagenesConstruccion.length ? imagenActualRef.current : 0;
      const siguiente = (actual + 1) % imagenesConstruccion.length;
      const opacidadActual = opacidadesImagenes[actual];
      const opacidadSiguiente = opacidadesImagenes[siguiente];
      const opacidadTemaActual = opacidadesTema[actual];
      const opacidadTemaSiguiente = opacidadesTema[siguiente];

      if (!opacidadActual || !opacidadSiguiente || !opacidadTemaActual || !opacidadTemaSiguiente) {
        imagenActualRef.current = 0;
        return;
      }

      animacionCambioActiva.current = true;
      opacidadSiguiente.setValue(0);
      opacidadTemaSiguiente.setValue(0);

      animacionCambio.current = Animated.parallel([
        Animated.timing(opacidadSiguiente, {
          duration: 850,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(opacidadActual, {
          duration: 850,
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.timing(opacidadTemaSiguiente, {
          duration: 850,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(opacidadTemaActual, {
          duration: 850,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]);

      animacionCambio.current.start(({ finished }) => {
        animacionCambioActiva.current = false;
        animacionCambio.current = null;

        if (!finished) {
          return;
        }

        imagenActualRef.current = siguiente;
        setImagenActual(siguiente);
        opacidadesImagenes.forEach((opacidad, indice) => {
          opacidad.setValue(indice === siguiente ? 1 : 0);
        });
        opacidadesTema.forEach((opacidad, indice) => {
          opacidad.setValue(indice === siguiente ? 1 : 0);
        });
      });
    }, 3000);

    return () => {
      clearInterval(intervalo);
      animacionCambio.current?.stop();
    };
  }, [opacidadesImagenes, opacidadesTema]);

  useEffect(() => {
    const nubeLenta = Animated.loop(
      Animated.sequence([
        Animated.timing(progresoNubeLenta, {
          duration: 12000,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(progresoNubeLenta, {
          duration: 12000,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    const nubeRapida = Animated.loop(
      Animated.sequence([
        Animated.timing(progresoNubeRapida, {
          duration: 8200,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(progresoNubeRapida, {
          duration: 8200,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    nubeLenta.start();
    nubeRapida.start();

    return () => {
      nubeLenta.stop();
      nubeRapida.stop();
    };
  }, [progresoNubeLenta, progresoNubeRapida]);

  return (
    <TemaAccesoContexto.Provider value={{ opacidadesTema, tema }}>
    <SafeAreaView style={styles.raiz} edges={['left', 'right', 'top', 'bottom']}>
      {imagenesConstruccion.map((imagen, indice) => (
        <Animated.Image
          key={indice}
          source={imagen}
          style={[styles.fondo, { opacity: opacidadesImagenes[indice] }]}
          resizeMode="cover"
        />
      ))}

      <View pointerEvents="none" style={styles.velo} />
      <View pointerEvents="none" style={[styles.neblinaInferior, { top: topPanelCalculado }]}>
        <View style={styles.neblinaBase} />
        <Animated.View
          style={[
            styles.grupoNube,
            styles.grupoNubeSuperior,
            {
              transform: [{ translateX: desplazamientoNubeLenta }],
            },
          ]}
        >
          <View style={[styles.bolaNube, styles.bolaGrande]} />
          <View style={[styles.bolaNube, styles.bolaMedia, styles.bolaSuperiorCentro]} />
          <View style={[styles.bolaNube, styles.bolaChica, styles.bolaSuperiorDerecha]} />
        </Animated.View>
        <Animated.View
          style={[
            styles.grupoNube,
            styles.grupoNubeMedia,
            {
              transform: [{ translateX: desplazamientoNubeRapida }],
            },
          ]}
        >
          <View style={[styles.bolaNube, styles.bolaExtraGrande]} />
          <View style={[styles.bolaNube, styles.bolaGrande, styles.bolaMediaCentro]} />
          <View style={[styles.bolaNube, styles.bolaMedia, styles.bolaMediaDerecha]} />
        </Animated.View>
        <Animated.View
          style={[
            styles.grupoNube,
            styles.grupoNubeBaja,
            {
              transform: [{ translateX: desplazamientoNubeLenta }],
            },
          ]}
        >
          <View style={[styles.bolaNube, styles.bolaExtraGrande]} />
          <View style={[styles.bolaNube, styles.bolaGrande, styles.bolaBajaCentro]} />
          <View style={[styles.bolaNube, styles.bolaMedia, styles.bolaBajaDerecha]} />
        </Animated.View>
      </View>
      <Image source={logo} style={styles.logo} resizeMode="contain" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.top}
        style={[styles.panelInferior, { top: topPanelCalculado }]}
      >
        <TouchableWithoutFeedback accessible={false} onPress={Keyboard.dismiss}>
          <ScrollView
            bounces={false}
            contentContainerStyle={[
              styles.contenido,
              botonInferior ? styles.contenidoConBotonInferior : null,
              {
                paddingBottom: espaciado.xl * escala + insets.bottom + 18,
                paddingHorizontal: espaciado.xl * escala,
                paddingTop: espaciado.md * escala,
              },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.centroContenedor, botonInferior ? styles.centroContenedorActivo : null]}>
              <TituloAcceso escala={escala}>{titulo}</TituloAcceso>
              <Text
                style={[
                  styles.subtitulo,
                  {
                    fontSize: 15 * escala,
                    lineHeight: 20 * escala,
                    marginTop: espaciado.xs * escala,
                  },
                ]}
              >
                {subtitulo}
              </Text>
              <View style={[styles.formulario, { gap: 12 * escala, marginTop: espaciado.lg * escala }]}>
                {children}
              </View>
            </View>
            {botonInferior ? (
              <View style={[styles.pieContenedor, { gap: 10 * escala, marginTop: espaciado.md * escala }]}>
                {botonInferior}
              </View>
            ) : null}
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </TemaAccesoContexto.Provider>
  );
}

export function usarTemaAcceso() {
  return useContext(TemaAccesoContexto);
}

type BotonAccesoProps = PropsWithChildren<{
  disabled?: boolean;
  height?: number;
  iconoSize?: number;
  onPress?: () => void;
  paddingHorizontal?: number;
  textStyle?: TextStyle | TextStyle[];
}>;

export function BotonAcceso({
  height = 52,
  paddingHorizontal = espaciado.lg,
  textStyle,
  ...props
}: BotonAccesoProps) {
  const { opacidadesTema } = usarTemaAcceso();
  const lipHeight = Math.max(4, height * 0.12);
  const manejarPress = () => {
    hapticAccion();
    props.onPress?.();
  };

  return (
    <Pressable
      disabled={props.disabled}
      onPress={manejarPress}
      style={({ pressed }) => [
        styles.botonAccesoMarco,
        {
          height: height + lipHeight,
        },
        props.disabled && styles.botonDeshabilitado,
      ]}
    >
      {({ pressed }) => (
        <>
          {temasAcceso.map((tema, indice) => (
            <Animated.View
              key={`lip-${tema.principal}`}
              style={[
                styles.botonAccesoLip,
                {
                  backgroundColor: tema.lip,
                  height,
                  opacity: opacidadesTema[indice],
                },
              ]}
            />
          ))}
          <Animated.View
            style={[
              styles.botonAcceso,
              {
                minHeight: height,
                paddingHorizontal,
                transform: [{ translateY: pressed ? 6 : 0 }],
              },
            ]}
          >
            {temasAcceso.map((tema, indice) => (
              <Animated.View
                key={`principal-${tema.principal}`}
                style={[
                  styles.botonAccesoFondo,
                  {
                    backgroundColor: tema.principal,
                    opacity: opacidadesTema[indice],
                  },
                ]}
              />
            ))}
            <Text style={[estilosAcceso.textoBoton, textStyle]}>{props.children}</Text>
            <ChevronRight color={colores.superficie} size={props.iconoSize ?? 21} strokeWidth={2.8} />
          </Animated.View>
        </>
      )}
    </Pressable>
  );
}

export function EnlaceAcceso({ style, ...props }: ComponentProps<typeof Link>) {
  const { tema } = usarTemaAcceso();
  const manejarPress: NonNullable<ComponentProps<typeof Link>['onPress']> = (evento) => {
    hapticSeleccion();
    props.onPress?.(evento);
  };

  return <Link {...props} onPress={manejarPress} style={[estilosAcceso.enlace, { color: tema.texto }, style]} />;
}

export function AccionAcceso({
  children,
  disabled = false,
  onPress,
  style,
}: PropsWithChildren<{ disabled?: boolean; onPress?: () => void; style?: TextStyle }>) {
  const { tema } = usarTemaAcceso();
  const manejarPress = () => {
    hapticSeleccion();
    onPress?.();
  };

  return (
    <Pressable disabled={disabled} onPress={manejarPress}>
      {({ pressed }) => (
        <Text style={[estilosAcceso.enlace, { color: tema.texto, opacity: pressed || disabled ? 0.55 : 1 }, style]}>
          {children}
        </Text>
      )}
    </Pressable>
  );
}

export const estilosAcceso = StyleSheet.create({
  textoBoton: {
    flex: 1,
    color: colores.superficie,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 18,
    textAlign: 'center',
    textTransform: 'lowercase',
  },
  enlace: {
    color: colores.primarioTexto,
    fontFamily: 'MontserratUnderline-Bold',
  },
  enlaces: {
    color: '#898F8B',
    fontFamily: 'MontserratAlternates-SemiBold',
    fontSize: 13,
    marginTop: espaciado.sm,
    textAlign: 'center',
  },
  error: {
    color: colores.error,
    fontFamily: 'MontserratAlternates-SemiBold',
    fontSize: 13,
    textAlign: 'center',
  },
  exito: {
    color: '#187A22',
    fontFamily: 'MontserratAlternates-SemiBold',
    fontSize: 14,
    textAlign: 'center',
  },
});

const styles = StyleSheet.create({
  raiz: {
    backgroundColor: colores.fondoCalido,
    flex: 1,
  },
  fondo: {
    height: '100%',
    left: 0,
    position: 'absolute',
    top: 0,
    width: '100%',
  },
  velo: {
    backgroundColor: 'rgba(241, 218, 203, 0.08)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  neblinaInferior: {
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: '50%',
  },
  neblinaBase: {
    backgroundColor: 'rgba(241, 218, 203, 0.22)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  grupoNube: {
    height: 180,
    position: 'absolute',
    width: 520,
  },
  grupoNubeSuperior: {
    left: -120,
    opacity: 0.86,
    top: -36,
  },
  grupoNubeMedia: {
    left: -84,
    opacity: 0.78,
    top: 86,
  },
  grupoNubeBaja: {
    bottom: -74,
    left: -150,
    opacity: 0.88,
  },
  bolaNube: {
    backgroundColor: 'rgba(255, 250, 244, 0.82)',
    position: 'absolute',
  },
  bolaExtraGrande: {
    borderRadius: 120,
    height: 168,
    left: 18,
    top: 28,
    width: 260,
  },
  bolaGrande: {
    borderRadius: 100,
    height: 132,
    left: 0,
    top: 46,
    width: 216,
  },
  bolaMedia: {
    borderRadius: 82,
    height: 104,
    width: 170,
  },
  bolaChica: {
    borderRadius: 70,
    height: 84,
    width: 136,
  },
  bolaSuperiorCentro: {
    left: 134,
    top: 20,
  },
  bolaSuperiorDerecha: {
    left: 280,
    top: 58,
  },
  bolaMediaCentro: {
    left: 184,
    top: 0,
  },
  bolaMediaDerecha: {
    left: 318,
    top: 58,
  },
  bolaBajaCentro: {
    left: 150,
    top: 8,
  },
  bolaBajaDerecha: {
    left: 316,
    top: 46,
  },
  logo: {
    height: 40,
    left: espaciado.lg,
    position: 'absolute',
    top: espaciado.xl,
    width: 152,
  },
  panelInferior: {
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: '50%',
  },
  contenido: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingBottom: espaciado.xl,
    paddingHorizontal: espaciado.xl,
    paddingTop: espaciado.lg,
  },
  contenidoConBotonInferior: {
    justifyContent: 'space-between',
  },
  centroContenedor: {
    width: '100%',
  },
  centroContenedorActivo: {
    flex: 1,
    justifyContent: 'center',
  },
  pieContenedor: {
    width: '100%',
  },
  tituloMarco: {
    position: 'relative',
  },
  titulo: {
    color: colores.primarioTexto,
    fontFamily: 'Montserrat-Bold',
    fontSize: 31,
    letterSpacing: 0,
    lineHeight: 38,
    textAlign: 'center',
  },
  tituloCapa: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  tituloMedida: {
    opacity: 0,
  },
  subtitulo: {
    color: '#666B69',
    fontFamily: 'MontserratAlternates-Medium',
    fontSize: 15,
    lineHeight: 20,
    marginTop: espaciado.xs,
    textAlign: 'center',
  },
  formulario: {
    gap: 12,
    marginTop: espaciado.lg,
  },
  botonAccesoMarco: {
    position: 'relative',
  },
  botonAccesoLip: {
    borderRadius: 12,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  botonAcceso: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    gap: espaciado.sm,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  botonAccesoFondo: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  botonDeshabilitado: {
    opacity: 0.48,
  },
});
