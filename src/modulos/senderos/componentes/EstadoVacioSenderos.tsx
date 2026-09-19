import React, { useEffect } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Plus, Sparkles, Compass, MapPin } from 'lucide-react-native';

import { MasterButton, MasterGlass, MasterIcon, Texto } from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';

type EstadoVacioSenderosProps = {
  alCrearHabito: () => void;
};

// Isla flotante isométrica con pedestal de bienvenida
const BIOMA_ISLA = require('../../../../assets/ilustraciones/senderos/biomas/arboles/cerezo-01.png');
const BROTE_ESPERA = require('../../../../assets/ilustraciones/senderos/biomas/arboles/pasto2.png');

export function EstadoVacioSenderos({ alCrearHabito }: EstadoVacioSenderosProps) {
  // Animación suave de flotación de la isla (bucle infinito respiratorio)
  const flotacionY = useSharedValue(0);
  const rotacionSutil = useSharedValue(0);
  const brilloEscala = useSharedValue(0.95);
  const broteFlotacion = useSharedValue(0);

  useEffect(() => {
    flotacionY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2800, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 2800, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    rotacionSutil.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
        withTiming(-1.2, { duration: 3200, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    brilloEscala.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.9, { duration: 2400, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    broteFlotacion.value = withRepeat(
      withSequence(
        withDelay(300, withTiming(-5, { duration: 2200, easing: Easing.inOut(Easing.quad) })),
        withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
  }, [broteFlotacion, brilloEscala, flotacionY, rotacionSutil]);

  const estiloFlotacion = useAnimatedStyle(() => ({
    transform: [
      { translateY: flotacionY.value },
      { rotate: `${rotacionSutil.value}deg` },
    ],
  }));

  const estiloSombra = useAnimatedStyle(() => {
    const escala = 1 - (flotacionY.value / -8) * 0.18;
    const opacidad = 0.28 - (flotacionY.value / -8) * 0.1;
    return {
      opacity: opacidad,
      transform: [{ scale: escala }],
    };
  });

  const estiloBrilloAura = useAnimatedStyle(() => ({
    transform: [{ scale: brilloEscala.value }],
    opacity: 0.45 + (brilloEscala.value - 0.95) * 0.5,
  }));

  const estiloBroteFlotante = useAnimatedStyle(() => ({
    transform: [{ translateY: broteFlotacion.value }],
  }));

  return (
    <View style={styles.contenedor}>
      {/* Halo de luz místico en el fondo */}
      <Animated.View pointerEvents="none" style={[styles.auraFondo, estiloBrilloAura]} />

      {/* Escena 3D Isométrica flotante */}
      <View style={styles.escenaIsla}>
        {/* Sombra proyectada en el suelo debajo de la isla */}
        <Animated.View style={[styles.sombraSuelo, estiloSombra]} />

        {/* Isla voxel flotando suavemente */}
        <Animated.View style={[styles.islaFlotante, estiloFlotacion]}>
          <Image
            resizeMode="contain"
            source={BIOMA_ISLA}
            style={styles.imagenIsla}
          />

          {/* Insignia flotante de "Comienza aquí" sobre la isla */}
          <Animated.View style={[styles.broteAcompanante, estiloBroteFlotante]}>
            <MasterGlass blur compacto style={styles.chipComienza}>
              <Sparkles color="#F59E0B" size={13} strokeWidth={2.4} />
              <Texto style={styles.textoChipComienza}>Tu primer bioma</Texto>
            </MasterGlass>
          </Animated.View>
        </Animated.View>
      </View>

      {/* Tarjeta de cristal con mensaje evocador y llamada a la acción */}
      <View style={styles.tarjetaAccion}>
        <MasterGlass blur style={styles.glassMensaje}>
          {/* Tag temático superior */}
          <View style={styles.tagSuperior}>
            <View style={styles.iconoTag}>
              <Compass color="#145C37" size={13} strokeWidth={2.5} />
            </View>
            <Texto style={styles.textoTag}>MUNDO EN REPOSO</Texto>
          </View>

          {/* Título y narrativa */}
          <Texto style={styles.titulo}>Tu sendero aún duerme</Texto>
          <Texto style={styles.descripcion}>
            Cada hábito que cultivas genera un árbol y abre una ruta de días con recompensas y gemas. Planta tu primer hábito para despertar el mapa.
          </Texto>

          {/* Mini-pasos ilustrativos */}
          <View style={styles.filaPasos}>
            <View style={styles.itemPaso}>
              <View style={[styles.nodoPaso, { backgroundColor: 'rgba(20,92,55,0.08)' }]}>
                <Texto style={styles.numeroPaso}>1</Texto>
              </View>
              <Texto style={styles.textoPaso}>Crea un hábito</Texto>
            </View>

            <View style={styles.lineaPaso} />

            <View style={styles.itemPaso}>
              <View style={[styles.nodoPaso, { backgroundColor: 'rgba(20,92,55,0.08)' }]}>
                <Texto style={styles.numeroPaso}>2</Texto>
              </View>
              <Texto style={styles.textoPaso}>Desbloquea días</Texto>
            </View>

            <View style={styles.lineaPaso} />

            <View style={styles.itemPaso}>
              <View style={[styles.nodoPaso, { backgroundColor: 'rgba(20,92,55,0.08)' }]}>
                <Texto style={styles.numeroPaso}>3</Texto>
              </View>
              <Texto style={styles.textoPaso}>Hazlo crecer</Texto>
            </View>
          </View>

          {/* Botón principal prominente estilo Duolingo / MasterButton */}
          <View style={styles.botonContenedor}>
            <MasterButton
              color="#22C55E"
              colorSombra="#15803D"
              iconoIzquierda={Plus}
              iconoSize={20}
              onPress={() => {
                hapticSeguro('accion');
                alCrearHabito();
              }}
              style={styles.masterBoton}
              textStyle={styles.textoBoton}
            >
              Plantar primer hábito
            </MasterButton>
          </View>
        </MasterGlass>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    width: '100%',
  },
  auraFondo: {
    backgroundColor: 'rgba(34, 197, 94, 0.14)',
    borderRadius: 180,
    height: 300,
    position: 'absolute',
    top: '12%',
    width: 300,
  },
  escenaIsla: {
    alignItems: 'center',
    height: 220,
    justifyContent: 'center',
    marginBottom: 6,
    width: '100%',
  },
  sombraSuelo: {
    backgroundColor: '#0F3820',
    borderRadius: 65,
    bottom: 12,
    height: 24,
    position: 'absolute',
    width: 140,
  },
  islaFlotante: {
    alignItems: 'center',
    height: 200,
    justifyContent: 'center',
    position: 'relative',
    width: 220,
  },
  imagenIsla: {
    height: 190,
    width: 190,
  },
  broteAcompanante: {
    bottom: 24,
    position: 'absolute',
    right: 6,
  },
  chipComienza: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    shadowColor: '#000000',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  textoChipComienza: {
    color: '#92400E',
    fontFamily: 'Montserrat-Bold',
    fontSize: 10.5,
    letterSpacing: 0.2,
  },
  tarjetaAccion: {
    maxWidth: 380,
    width: '100%',
  },
  glassMensaje: {
    alignItems: 'center',
    borderColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 24,
    borderWidth: 1.5,
    paddingHorizontal: 22,
    paddingVertical: 20,
    shadowColor: '#0D3D22',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
  },
  tagSuperior: {
    alignItems: 'center',
    backgroundColor: 'rgba(20, 92, 55, 0.08)',
    borderColor: 'rgba(20, 92, 55, 0.18)',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  iconoTag: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoTag: {
    color: '#145C37',
    fontFamily: 'Montserrat-Bold',
    fontSize: 9.5,
    letterSpacing: 1.2,
  },
  titulo: {
    color: '#12331F',
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 21,
    letterSpacing: -0.3,
    marginBottom: 6,
    textAlign: 'center',
  },
  descripcion: {
    color: '#4A7F5D',
    fontFamily: 'Montserrat-Medium',
    fontSize: 13,
    lineHeight: 18.5,
    marginBottom: 16,
    textAlign: 'center',
  },
  filaPasos: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 18,
    width: '100%',
  },
  itemPaso: {
    alignItems: 'center',
    gap: 4,
  },
  nodoPaso: {
    alignItems: 'center',
    borderColor: 'rgba(20, 92, 55, 0.2)',
    borderRadius: 12,
    borderWidth: 1,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  numeroPaso: {
    color: '#145C37',
    fontFamily: 'Montserrat-Bold',
    fontSize: 11,
  },
  textoPaso: {
    color: '#4A7F5D',
    fontFamily: 'Montserrat-Medium',
    fontSize: 10,
  },
  lineaPaso: {
    backgroundColor: 'rgba(20, 92, 55, 0.15)',
    flex: 1,
    height: 1.5,
    marginBottom: 16,
    marginHorizontal: 8,
  },
  botonContenedor: {
    width: '100%',
  },
  masterBoton: {
    height: 52,
    width: '100%',
  },
  textoBoton: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 15.5,
    letterSpacing: 0.3,
  },
});
