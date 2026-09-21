import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, ArrowRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { MasterButton, MasterGlass, MasterIcon, Rebote, Texto } from '../../../diseno';
import { AuroraBoreal } from '../../hoy/componentes/AuroraBoreal';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { useEscala } from '../../../diseno/tema/MasterColorContext';
import type { EscalaMaster } from '../../../diseno/tema/escalaEsmeralda';
import { ESCALA_ESMERALDA } from '../../../diseno/tema/escalaEsmeralda';
import { conAlfa } from '../../../diseno/tema/masterColor';
import { useAssetsPaqueteTema } from '../../habitos/usePaqueteTema';

type EstadoVacioSenderosProps = {
  alCrearHabito: () => void;
};

const C = {
  texto: '#1A1335',
  tenue: ESCALA_ESMERALDA.musgo.l51,
  verde: ESCALA_ESMERALDA.jade.l50,
  verdeOscuro: ESCALA_ESMERALDA.hoja.l19,
};


export function EstadoVacioSenderos({ alCrearHabito }: EstadoVacioSenderosProps) {
  const tema = useAssetsPaqueteTema();
  const esc = useEscala();
  const styles = useEstilosStyles();
  const { t } = useTranslation();
  return (
    <View style={styles.contenedor}>
      {/* Aurora boreal etérea de fondo, idéntica al Slide 5 del Onboarding */}
      <View pointerEvents="none" style={styles.aurora}>
        <AuroraBoreal tema="verde" />
      </View>

      <View style={styles.contenidoCentral}>
        {/* Panel translúcido MasterGlass estilo Slide 5 del Onboarding */}
        <MasterGlass blur style={styles.panel}>
          {/* Ilustración de héroe (Arbusto Esmeralda con sombra) */}
          <View style={styles.hero}>
            <View style={styles.heroImagenContenedor}>
              <Image
                resizeMode="contain"
                source={tema.arbusto}
                style={styles.heroImagen}
              />
            </View>

            {/* Título y subtítulo con tipografía oficial */}
            <Texto style={styles.titulo}>{t('senderos.emptyState.title')}</Texto>
            <Texto style={styles.subtitulo}>{t('senderos.emptyState.description')}</Texto>

            {/* Separador de línea con degradado sutil verde */}
            <LinearGradient
              colors={[conAlfa(esc.jade.l50, 0), conAlfa(esc.jade.l50, 0.32), conAlfa(esc.jade.l50, 0)]}
              end={{ x: 1, y: 0 }}
              start={{ x: 0, y: 0 }}
              style={styles.separador}
            />
          </View>

          {/* Tarjeta interna informativa con badge y beneficios */}
          <View style={styles.cajaDetalles}>
            <View style={styles.filaBeneficio}>
              <View style={styles.iconoBeneficioContenedor}>
                <MasterIcon alTema name="idea" size={18} />
              </View>
              <View style={styles.textoBeneficioContenedor}>
                <Texto style={styles.tituloBeneficio}>{t('senderos.emptyState.growTree')}</Texto>
                <Texto style={styles.descBeneficio}>{t('senderos.emptyState.growTreeDescription')}</Texto>
              </View>
            </View>

            <View style={styles.divisorInterno} />

            <View style={styles.filaBeneficio}>
              <View style={styles.iconoBeneficioContenedor}>
                <MasterIcon alTema name="flor" size={18} />
              </View>
              <View style={styles.textoBeneficioContenedor}>
                <Texto style={styles.tituloBeneficio}>{t('senderos.emptyState.unlockRewards')}</Texto>
                <Texto style={styles.descBeneficio}>{t('senderos.emptyState.unlockRewardsDescription')}</Texto>
              </View>
            </View>
          </View>

          {/* Botón de acción principal estilo MasterButton verde */}
          <View style={styles.botonContenedor}>
            <MasterButton
              color={C.verde}
              iconoDerecha={({ size }) => <ArrowRight color="#FFFFFF" size={size} strokeWidth={2.8} />}
              onPress={() => {
                hapticSeguro('accion');
                alCrearHabito();
              }}
              style={styles.boton}
            >
              {t('senderos.emptyState.createHabit')}
            </MasterButton>
          </View>

          {/* Fila inferior con enlace secundario de exploración o inicio */}
          <View style={styles.filaAccionSecundaria}>
            <MasterIcon alTema name="brujula" size={15} />
            <Texto style={styles.textoSecundario}>{t('senderos.emptyState.ready')}</Texto>
            <Rebote
              accessibilityLabel={t('senderos.emptyState.goToCreation')}
              onPress={() => {
                hapticSeguro('seleccion');
                alCrearHabito();
              }}
            >
              <Texto style={styles.enlaceDestacado}>{t('senderos.emptyState.startHere')}</Texto>
            </Rebote>
          </View>
        </MasterGlass>
      </View>
    </View>
  );
}

const crearEstilosStyles = (esc: EscalaMaster) => StyleSheet.create({
  contenedor: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
  },
  aurora: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  contenidoCentral: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    width: '100%',
  },
  panel: {
    alignItems: 'center',
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    maxWidth: 390,
    paddingHorizontal: 22,
    paddingVertical: 26,
    width: '100%',
    shadowColor: esc.hoja.l22,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },
  hero: {
    alignItems: 'center',
    gap: 6,
    width: '100%',
  },
  heroImagenContenedor: {
    alignItems: 'center',
    height: 85,
    justifyContent: 'center',
    marginBottom: -4,
    width: 110,
  },
  heroImagen: {
    height: 72,
    width: 72,
  },
  titulo: {
    color: C.texto,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 23,
    letterSpacing: -0.4,
    textAlign: 'center',
    width: '100%',
  },
  subtitulo: {
    color: C.tenue,
    fontFamily: 'Montserrat-Medium',
    fontSize: 13,
    lineHeight: 18.5,
    marginTop: 2,
    textAlign: 'center',
    width: '100%',
  },
  separador: {
    alignSelf: 'center',
    borderRadius: 1,
    height: 1.5,
    marginVertical: 12,
    width: 64,
  },
  cajaDetalles: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderColor: conAlfa(esc.jade.l50, 0.14),
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    marginVertical: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    width: '100%',
  },
  filaBeneficio: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  iconoBeneficioContenedor: {
    alignItems: 'center',
    backgroundColor: conAlfa(esc.jade.l50, 0.08),
    borderColor: conAlfa(esc.jade.l50, 0.18),
    borderRadius: 12,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  textoBeneficioContenedor: {
    flex: 1,
  },
  tituloBeneficio: {
    color: C.texto,
    fontFamily: 'Montserrat-Bold',
    fontSize: 12.5,
    marginBottom: 1,
  },
  descBeneficio: {
    color: C.tenue,
    fontFamily: 'Montserrat-Medium',
    fontSize: 11,
    lineHeight: 15,
  },
  divisorInterno: {
    backgroundColor: conAlfa(esc.jade.l50, 0.09),
    height: 1,
    width: '100%',
  },
  botonContenedor: {
    marginTop: 14,
    width: '100%',
  },
  boton: {
    height: 52,
    width: '100%',
  },
  filaAccionSecundaria: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    marginTop: 14,
  },
  textoSecundario: {
    color: C.tenue,
    fontFamily: 'Montserrat-Medium',
    fontSize: 12.5,
  },
  enlaceDestacado: {
    color: C.verde,
    fontFamily: 'Montserrat-Bold',
    fontSize: 12.5,
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
