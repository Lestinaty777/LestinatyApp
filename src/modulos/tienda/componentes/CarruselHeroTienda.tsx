import { useState } from 'react';
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { MasterButton, MasterGlass, MasterIcon, MasterKicker, Texto } from '../../../diseno';
import { useEscala } from '../../../diseno/tema/MasterColorContext';
import type { EscalaMaster } from '../../../diseno/tema/escalaEsmeralda';
import { conAlfa } from '../../../diseno/tema/masterColor';
import { useAssetsPaqueteTema } from '../../habitos/usePaqueteTema';
import { capacidades } from '../../../plataforma/capacidades';

type CarruselHeroTiendaProps = {
  onIrAReferidos: () => void;
  onIrAPro?: () => void;
};

export function CarruselHeroTienda({
  onIrAReferidos,
  onIrAPro,
}: CarruselHeroTiendaProps) {
  const tema = useAssetsPaqueteTema();
  const esc = useEscala();
  const ch = useEstilosCh();
  const { t } = useTranslation();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const anchoTarjeta = width - 40; // paddingHorizontal: 20 en la pantalla
  const [slideActivo, setSlideActivo] = useState(0);
  // Slide 3 (Lestinaty Pro / widgets) no se ofrece donde no hay widgets — hoy, iOS.
  const totalSlides = capacidades.horizon ? 3 : 2;

  function alScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const offsetX = e.nativeEvent.contentOffset.x;
    const indice = Math.round(offsetX / anchoTarjeta);
    if (indice >= 0 && indice <= totalSlides - 1 && indice !== slideActivo) {
      setSlideActivo(indice);
    }
  }

  function irAPro() {
    if (onIrAPro) {
      onIrAPro();
    } else {
      router.push(capacidades.widgets ? '/habitos/widgets' : '/(principal)/hoy');
    }
  }

  return (
    <View style={ch.contenedor}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={alScroll}
        scrollEventThrottle={32}
        decelerationRate="fast"
        snapToInterval={anchoTarjeta + 12}
        nestedScrollEnabled={true}
        contentContainerStyle={[ch.scrollContenido, { paddingHorizontal: 20 }]}
      >
        {/* Slide 1: Árbol Destacado */}
        <View style={{ width: anchoTarjeta, marginRight: 12 }}>
          <MasterGlass style={ch.tarjeta}>
            <View style={{ flexDirection: 'row' }}>
              <View style={{ flex: 1, zIndex: 2 }}>
                <MasterKicker icono={<MasterIcon name="hoja" color={1} size={14} />} texto={t('tienda.hero.freeKicker')} />
                <Texto style={ch.titulo}>Esmeralda</Texto>
                <Texto style={ch.subtitulo}>{t('tienda.hero.esmeraldaDescription')}</Texto>
              </View>

              <View style={ch.ilustracionContenedor}>
                <Image
                  source={tema.arbol}
                  style={ch.ilustracionArbol}
                />
              </View>
            </View>
          </MasterGlass>
        </View>

        {/* Slide 2: Recompensa de Gemas por Referidos */}
        <View style={{ width: anchoTarjeta, marginRight: 12 }}>
          <MasterGlass colorBase="#FEF08A" style={ch.tarjeta}>
            <View style={{ flexDirection: 'row' }}>
              <View style={{ flex: 1, zIndex: 2 }}>
                <MasterKicker icono={<MasterIcon name="trofeo" color={3} size={14} />} texto={t('tienda.hero.referralKicker')} />
                <Texto style={ch.titulo}>{t('tienda.hero.referralTitle')}</Texto>
                <Texto style={[ch.subtitulo, { color: '#713F12' }]}>
                  {t('tienda.hero.referralDescription')}
                </Texto>

                <View style={{ width: 165, marginTop: 16 }}>
                  <MasterButton
                    color={esc.hoja.l61a}
                    onPress={onIrAReferidos}
                    iconoIzquierda={({ size }) => (
                      <Image
                        source={require('../../../../assets/icons/hoy/gemas.png')}
                        style={{ width: size, height: size, resizeMode: 'contain' }}
                      />
                    )}
                    iconoSize={16}
                  >
                    {t('tienda.hero.viewCode')}
                  </MasterButton>
                </View>
              </View>

              <View style={ch.ilustracionContenedor}>
                <Image
                  source={tema.arbol}
                  style={ch.ilustracionArbol}
                />
              </View>
            </View>
          </MasterGlass>
        </View>

        {/* Slide 3: Lestinaty Pro - Widgets en tu pantalla — oculto donde no hay widgets. */}
        {capacidades.horizon && (
        <View style={{ width: anchoTarjeta }}>
          <MasterGlass colorBase="#C084FC" style={ch.tarjeta}>
            <View style={{ flexDirection: 'row' }}>
              <View style={{ flex: 1, zIndex: 2 }}>
                <MasterKicker icono={<MasterIcon name="montana" color={7} size={14} />} texto={t('tienda.hero.proKicker')} />
                <Texto style={ch.titulo}>{t('tienda.hero.proTitle')}</Texto>
                <Texto style={[ch.subtitulo, { color: '#4C1D95' }]}>
                  {t('tienda.hero.proDescription')}
                </Texto>

                <View style={{ width: 155, marginTop: 16 }}>
                  <MasterButton
                    color="#6A29C2"
                    onPress={irAPro}
                    iconoIzquierda={({ size }) => (
                      <MasterIcon name="montana" color={7} size={size} />
                    )}
                    iconoSize={16}
                  >
                    {t('tienda.hero.viewWidgets')}
                  </MasterButton>
                </View>
              </View>

              <View style={ch.ilustracionContenedor}>
                <Image
                  source={require('../../../../assets/ilustraciones/mockup.png')}
                  style={ch.ilustracionArbol}
                />
              </View>
            </View>
          </MasterGlass>
        </View>
        )}
      </ScrollView>

      {/* Indicadores de diapositiva (dots) */}
      <View style={ch.filaIndicadores}>
        {Array.from({ length: totalSlides }, (_, idx) => (
          <View key={idx} style={[ch.dot, slideActivo === idx ? ch.dotActivo : ch.dotInactivo]} />
        ))}
      </View>
    </View>
  );
}

const crearEstilosCh = (esc: EscalaMaster) => StyleSheet.create({
  contenedor: {
    marginBottom: 16,
  },
  scrollContenido: {
    gap: 0,
  },
  tarjeta: {
    borderRadius: 12,
    padding: 16,
    overflow: 'hidden',
    minHeight: 200,
  },
  titulo: {
    fontSize: 22,
    fontFamily: 'MontserratAlternates-Bold',
    color: esc.hoja.l19,
    marginTop: 10,
    maxWidth: '70%',
  },
  subtitulo: {
    color: esc.musgo.l54,
    fontFamily: 'Montserrat-Medium',
    fontSize: 11.5,
    marginTop: 4,
    lineHeight: 15.5,
    maxWidth: '70%',
  },
  ilustracionContenedor: {
    width: 175,
    height: 175,
    position: 'absolute',
    right: -15,
    top: -5,
    zIndex: 1,
  },
  ilustracionArbol: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  filaIndicadores: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActivo: {
    width: 20,
    backgroundColor: esc.hoja.l61a,
  },
  dotInactivo: {
    width: 6,
    backgroundColor: conAlfa(esc.hoja.l61a, 0.28),
  },
});

const estilosPorEscalaCh = new WeakMap<EscalaMaster, ReturnType<typeof crearEstilosCh>>();

function useEstilosCh() {
  const esc = useEscala();
  let valor = estilosPorEscalaCh.get(esc);
  if (!valor) {
    valor = crearEstilosCh(esc);
    estilosPorEscalaCh.set(esc, valor);
  }
  return valor;
}
