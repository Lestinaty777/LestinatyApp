import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, ArrowRight } from 'lucide-react-native';

import { MasterButton, MasterGlass, MasterIcon, Rebote, Texto } from '../../../diseno';
import { AuroraBoreal } from '../../hoy/componentes/AuroraBoreal';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';

type EstadoVacioSenderosProps = {
  alCrearHabito: () => void;
};

const C = {
  texto: '#1A1335',
  tenue: '#648170',
  verde: '#25884C',
  verdeOscuro: '#12331F',
};

const ARBUSTO_HERO = require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Esmeralda/arbusto.png');

export function EstadoVacioSenderos({ alCrearHabito }: EstadoVacioSenderosProps) {
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
                source={ARBUSTO_HERO}
                style={styles.heroImagen}
              />
            </View>

            {/* Título y subtítulo con tipografía oficial */}
            <Texto style={styles.titulo}>Tu jardín te espera</Texto>
            <Texto style={styles.subtitulo}>
              Comienza creando tu primer hábito para ver nacer tu sendero y recorrer sus días.
            </Texto>

            {/* Separador de línea con degradado sutil verde */}
            <LinearGradient
              colors={['rgba(37,136,76,0)', 'rgba(37,136,76,0.32)', 'rgba(37,136,76,0)']}
              end={{ x: 1, y: 0 }}
              start={{ x: 0, y: 0 }}
              style={styles.separador}
            />
          </View>

          {/* Tarjeta interna informativa con badge y beneficios */}
          <View style={styles.cajaDetalles}>
            <View style={styles.filaBeneficio}>
              <View style={styles.iconoBeneficioContenedor}>
                <MasterIcon color={2} name="idea" size={18} />
              </View>
              <View style={styles.textoBeneficioContenedor}>
                <Texto style={styles.tituloBeneficio}>Genera tu propio árbol</Texto>
                <Texto style={styles.descBeneficio}>Cada hábito tiene su especie viva y evoluciona con tu constancia.</Texto>
              </View>
            </View>

            <View style={styles.divisorInterno} />

            <View style={styles.filaBeneficio}>
              <View style={styles.iconoBeneficioContenedor}>
                <MasterIcon color={2} name="flor" size={18} />
              </View>
              <View style={styles.textoBeneficioContenedor}>
                <Texto style={styles.tituloBeneficio}>Desbloquea recompensas</Texto>
                <Texto style={styles.descBeneficio}>Gana gemas y sube de nivel conforme completas tus metas diarias.</Texto>
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
              Crear nuevo hábito
            </MasterButton>
          </View>

          {/* Fila inferior con enlace secundario de exploración o inicio */}
          <View style={styles.filaAccionSecundaria}>
            <MasterIcon color={2} name="brujula" size={15} />
            <Texto style={styles.textoSecundario}>¿Listo para empezar tu viaje? </Texto>
            <Rebote
              accessibilityLabel="Ir a creación"
              onPress={() => {
                hapticSeguro('seleccion');
                alCrearHabito();
              }}
            >
              <Texto style={styles.enlaceDestacado}>Comenzar acá</Texto>
            </Rebote>
          </View>
        </MasterGlass>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    shadowColor: '#0D3D22',
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
    borderColor: 'rgba(37, 136, 76, 0.14)',
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
    backgroundColor: 'rgba(37, 136, 76, 0.08)',
    borderColor: 'rgba(37, 136, 76, 0.18)',
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
    backgroundColor: 'rgba(37, 136, 76, 0.09)',
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
