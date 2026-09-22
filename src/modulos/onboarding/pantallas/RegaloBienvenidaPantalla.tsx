import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';

import { MasterText, Texto } from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { AuroraBoreal } from '../../hoy/componentes/AuroraBoreal';
import { obtenerAssetsPaquete } from '../../senderos/algoritmo/registroPaquetesArbol';
import { otorgarSemillaBienvenida } from '../../tienda/gemas.servicio';
import { CLAVE_ABRIR_CREACION_HABITO, CLAVE_REGALO_BIENVENIDA } from '../onboarding.servicio';
import { CarruselArbolRegalo } from '../componentes/CarruselArbolRegalo';
import { useEscala } from '../../../diseno/tema/MasterColorContext';
import { ESCALA_ESMERALDA } from '../../../diseno/tema/escalaEsmeralda';
import { conAlfa } from '../../../diseno/tema/masterColor';

const C = { tenue: ESCALA_ESMERALDA.musgo.l51, verde: ESCALA_ESMERALDA.jade.l50 };

// Mezcla hacia blanco/negro — mismo patrón ya usado en MapaSenderosPantalla.tsx
// (oscurecer/aclarar) para derivar tonos claros/oscuros de un color base.
function aclarar(color: string, factor: number) {
  const hex = color.replace('#', '');
  const canal = (inicio: number) => {
    const valor = parseInt(hex.slice(inicio, inicio + 2), 16);
    return Math.round(valor + (255 - valor) * factor).toString(16).padStart(2, '0');
  };
  return `#${canal(0)}${canal(2)}${canal(4)}`;
}
function oscurecer(color: string, factor: number) {
  const hex = color.replace('#', '');
  const canal = (inicio: number) => Math.round(parseInt(hex.slice(inicio, inicio + 2), 16) * factor).toString(16).padStart(2, '0');
  return `#${canal(0)}${canal(2)}${canal(4)}`;
}

// Deliberadamente 'siente' el mismo lenguaje visual que el slide 1 del
// carrusel de introducción (mismo tamaño de título, mismo fondo) aunque sigue
// siendo su propia pantalla — no una página literal de ese carrusel.
//
// El texto (título, fila de arbustos, subtítulo) nunca se desmonta ni se
// anima al cambiar de árbol: queda siempre a la vista y lo único que cambia
// es su color. Solo las etapas del árbol (en CarruselArbolRegalo) tienen la
// animación en cadena al asentarse en una página nueva.

export function RegaloBienvenidaPantalla() {
  const { t } = useTranslation();
  const esc = useEscala();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  // Misma fórmula que el slide 1 del carrusel de introducción.
  const tamanoTitulo = Math.min(48, Math.max(40, Math.round((width - 32) * 0.116)));
  const altoTitulo = tamanoTitulo + 8;
  const tamanoAccento = Math.min(38, Math.max(30, Math.round(tamanoTitulo * 0.8)));
  const altoAccento = tamanoAccento + 7;

  const mutacionReclamar = useMutation({
    mutationFn: otorgarSemillaBienvenida,
    onError: (error: Error) => {
      Alert.alert(t('onboarding.regaloBienvenida.alerts.claimErrorTitle'), error.message || t('onboarding.regaloBienvenida.alerts.claimErrorDefault'));
    },
    onSuccess: () => {
      hapticSeguro('confirmacion');
      // La pregunta se hace ACÁ (antes de liberar el gate) — una vez que
      // CLAVE_REGALO_BIENVENIDA pasa a false, _layout.tsx desmonta esta
      // pantalla de inmediato para mostrar los tabs.
      Alert.alert(t('onboarding.regaloBienvenida.alerts.successTitle'), t('onboarding.regaloBienvenida.alerts.successMessage'), [
        {
          onPress: () => queryClient.setQueryData(CLAVE_REGALO_BIENVENIDA, false),
          style: 'cancel',
          text: t('onboarding.regaloBienvenida.alerts.explore'),
        },
        {
          onPress: () => {
            queryClient.setQueryData(CLAVE_ABRIR_CREACION_HABITO, true);
            queryClient.setQueryData(CLAVE_REGALO_BIENVENIDA, false);
          },
          text: t('onboarding.regaloBienvenida.alerts.createHabit'),
        },
      ]);
    },
  });

  return (
    <LinearGradient colors={[esc.hoja.l99, esc.hoja.l95, esc.hoja.l93]} end={{ x: 0, y: 1 }} start={{ x: 0, y: 0 }} style={s.raiz}>
      <View pointerEvents="none" style={[s.aurora, { top: insets.top }]}>
        <AuroraBoreal tema="verde" />
      </View>

      <View style={[s.contenido, { paddingTop: insets.top + 16 }]}>
        <CarruselArbolRegalo
          confirmando={mutacionReclamar.isPending}
          fondo={(paqueteActual) => {
            const colorFondo = aclarar(paqueteActual?.masterPackColor ?? C.verde, 0.88);
            return (
              <Animated.View
                entering={FadeIn.duration(360)}
                key={`fondo-${paqueteActual?.id}`}
                pointerEvents="none"
                style={[s.fondoTinte, { backgroundColor: colorFondo }]}
              />
            );
          }}
          contenidoInferior={(paqueteActual, colorActivo) => {
            const assets = paqueteActual ? obtenerAssetsPaquete(paqueteActual.id) : undefined;
            const colorTitulo = oscurecer(colorActivo, 0.5);
            // Más claro que el título ("ligeramente oscuro, no tantísimo") —
            // tres variantes cercanas del mismo tono para el degradado.
            const degradadoAccento = [oscurecer(colorActivo, 0.78), oscurecer(colorActivo, 0.7), oscurecer(colorActivo, 0.62)] as const;

            // El texto nunca se desmonta ni se anima al cambiar de árbol —
            // queda siempre a la vista. Su color sí sigue el swipe en vivo:
            // `colorActivo` es la mezcla continua que calcula
            // CarruselArbolRegalo a partir de la posición cruda del scroll
            // (no de `paqueteActual`, que solo cambia al asentarse).
            return (
                <View style={s.textos}>
                  <Texto style={[s.titulo, { color: colorTitulo, fontSize: tamanoTitulo, lineHeight: altoTitulo }]}>{t('onboarding.regaloBienvenida.title')}</Texto>

                  <View style={s.tituloFila}>
                    {assets && (
                      <Image resizeMode="contain" source={assets.arbusto} style={[s.arbusto, { height: altoAccento, width: altoAccento }]} />
                    )}
                    <MasterText
                      coloresGradiente={degradadoAccento}
                      gradiente
                      style={[s.tituloGradiente, { fontSize: tamanoAccento, lineHeight: altoAccento }]}
                      variante="titulo"
                    >
                      {t('onboarding.regaloBienvenida.accent')}
                    </MasterText>
                    {assets && (
                      <Image resizeMode="contain" source={assets.arbusto} style={[s.arbusto, { height: altoAccento, width: altoAccento }]} />
                    )}
                  </View>

                  <LinearGradient
                    colors={[conAlfa(esc.jade.l50, 0), conAlfa(esc.jade.l50, 0.32), conAlfa(esc.jade.l50, 0)]}
                    end={{ x: 1, y: 0 }}
                    start={{ x: 0, y: 0 }}
                    style={s.separador}
                  />

                  <Texto style={s.subtitulo}>
                    {t('onboarding.regaloBienvenida.subtitle')}
                  </Texto>
                </View>
            );
          }}
          onConfirmar={(paqueteId) => mutacionReclamar.mutate(paqueteId)}
          paddingBottomPie={insets.bottom + 18}
        />
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  raiz: { flex: 1 },
  fondoTinte: { bottom: 0, left: 0, opacity: 0.85, position: 'absolute', right: 0, top: 0 },
  aurora: { left: 0, position: 'absolute', right: 0 },
  contenido: { flex: 1 },
  textos: { alignItems: 'center', gap: 4, paddingHorizontal: 20, paddingTop: 4 },
  titulo: { fontFamily: 'MontserratAlternates-Bold', textAlign: 'center' },
  tituloFila: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'center' },
  tituloGradiente: { fontFamily: 'MontserratAlternates-Bold' },
  arbusto: {},
  separador: { height: 2, marginVertical: 6, width: '60%' },
  subtitulo: {
    color: C.tenue,
    fontFamily: 'Montserrat-Medium',
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 330,
    textAlign: 'center',
  },
});
