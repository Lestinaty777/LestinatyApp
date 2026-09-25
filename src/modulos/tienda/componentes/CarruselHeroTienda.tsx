import { Image, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MasterButton, MasterGlass, MasterIcon, MasterKicker, Texto } from '../../../diseno';
import { useEscala } from '../../../diseno/tema/MasterColorContext';
import type { EscalaMaster } from '../../../diseno/tema/escalaEsmeralda';
import { useAssetsPaqueteTema } from '../../habitos/usePaqueteTema';

type CarruselHeroTiendaProps = {
  onIrAReferidos: () => void;
};

// Esmeralda y "Lestinaty Pro" (widgets) quedan ocultos por ahora — Horizon no
// se vende en esta entrega (su único beneficio real, widgets, no existe en
// iOS) y Esmeralda no tiene nada accionable acá todavía. Con un solo slide no
// hace falta scroll/paging — vuelve cuando haya más de una tarjeta real.
export function CarruselHeroTienda({ onIrAReferidos }: CarruselHeroTiendaProps) {
  const tema = useAssetsPaqueteTema();
  const esc = useEscala();
  const ch = useEstilosCh();
  const { t } = useTranslation();

  return (
    <View style={ch.contenedor}>
      <MasterGlass colorBase="#FEF08A" style={ch.tarjeta}>
        <View style={ch.fila}>
          <View style={ch.columnaTexto}>
            <MasterKicker icono={<MasterIcon name="trofeo" color={3} size={14} />} texto={t('tienda.hero.referralKicker')} />
            <Texto numberOfLines={1} style={ch.titulo}>{t('tienda.hero.referralTitle')}</Texto>
            <Texto numberOfLines={3} style={[ch.subtitulo, { color: '#713F12' }]}>
              {t('tienda.hero.referralDescription')}
            </Texto>

            <View style={ch.contenedorBoton}>
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

          {/* Sibling normal del flex row (no position:absolute) — así el
              texto nunca puede quedar debajo de la imagen, se reparten el
              ancho de verdad en vez de superponerse. */}
          <View style={ch.ilustracionContenedor}>
            <Image source={tema.arbol} style={ch.ilustracionArbol} />
          </View>
        </View>
      </MasterGlass>
    </View>
  );
}

const crearEstilosCh = (esc: EscalaMaster) => StyleSheet.create({
  contenedor: {
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  tarjeta: {
    borderRadius: 12,
    padding: 16,
    overflow: 'hidden',
    minHeight: 200,
  },
  fila: {
    flexDirection: 'row',
  },
  columnaTexto: {
    flex: 1,
    paddingRight: 10,
  },
  contenedorBoton: {
    width: 165,
    marginTop: 16,
  },
  titulo: {
    fontSize: 22,
    fontFamily: 'MontserratAlternates-Bold',
    color: esc.hoja.l19,
    marginTop: 10,
  },
  subtitulo: {
    color: esc.musgo.l54,
    fontFamily: 'Montserrat-Medium',
    fontSize: 11.5,
    marginTop: 4,
    lineHeight: 15.5,
  },
  ilustracionContenedor: {
    width: 120,
    height: 175,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  ilustracionArbol: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
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
