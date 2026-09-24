import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { MasterChanger } from '../../../../diseno/componentes/MasterChanger';
import { Texto } from '../../../../diseno';
import type { InfoCofre } from '../../datos/mapaEjercicio.mock';
import { hapticSeguro } from '../../../../nucleo/dispositivo/haptics';
import { calcularTinteCofre } from './cofreTinte';

// OJO: el nombre de archivo es engañoso — cofre.png es el cofre CERRADO
// (disponible/bloqueado) y cofre-cerrado.png es el cofre ABIERTO (reclamado).
// Verificado visualmente; no invertir esto de nuevo.
const ASSET_CERRADO = require('../../../../../assets/ilustraciones/senderos/biomas/cofres/cofre.png');
const ASSET_ABIERTO = require('../../../../../assets/ilustraciones/senderos/biomas/cofres/cofre-cerrado.png');

type Props = {
  /**
   * Bloqueo REAL del nodo (día aún no alcanzable) — nunca `cofre.estadoCofre
   * === 'bloqueado'`, que sólo dice "el premio todavía no es reclamable".
   * Un cofre final/intermedio ES el nodo del día: si ese día ya es el
   * actual (activo/esperando) hay que poder tocarlo para HACER la misión,
   * aunque el cofre en sí siga sin reclamarse — si se usara
   * `cofre.estadoCofre` acá, el día quedaría en un candado sin salida
   * (nunca se puede completar porque nunca se puede tocar).
   */
  bloqueado: boolean;
  cofre: InfoCofre;
  /** Color "seguro para UI" (ya clampeado por colorSeguroUi) — se usa para el badge de "¡Abrir!". */
  color: string;
  /**
   * master_pack_color crudo del paquete, sin clampear — el cofre se tiñe con
   * este para no perder vivacidad en paquetes muy claros u oscuros. Si se
   * omite, cae a `color` (más apagado en esos casos límite).
   */
  colorPaquete?: string;
  seleccionado: boolean;
  onPress: () => void;
  escalaEscena?: number;
};

export function NodoCofreSendero({ bloqueado, cofre, color, colorPaquete, seleccionado, onPress, escalaEscena = 1 }: Props) {
  const escala = useSharedValue(1);
  const rotacion = useSharedValue(0);

  // Animación de rebote y sacudida suave cuando está listo para abrir
  useEffect(() => {
    if (cofre.estadoCofre === 'disponible') {
      rotacion.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 110 }),
          withTiming(4, { duration: 110 }),
          withTiming(-2, { duration: 80 }),
          withTiming(0, { duration: 80 }),
          withTiming(0, { duration: 1600 }),
        ),
        -1,
        false,
      );
    } else {
      rotacion.value = 0;
    }
  }, [cofre.estadoCofre, rotacion]);

  const animEstilo = useAnimatedStyle(() => ({
    transform: [
      { scale: escala.value * escalaEscena },
      { rotate: `${rotacion.value}deg` },
    ],
  }));

  const esReclamado = cofre.estadoCofre === 'reclamado';
  const esDisponible = cofre.estadoCofre === 'disponible';
  const fuente = esReclamado ? ASSET_ABIERTO : ASSET_CERRADO;
  const tinte = calcularTinteCofre(colorPaquete ?? color, esReclamado);

  return (
    <View style={styles.raiz}>
      <Pressable
        accessibilityLabel={
          bloqueado
            ? 'Cofre bloqueado'
            : esReclamado
              ? 'Cofre ya reclamado'
              : esDisponible
                ? 'Cofre disponible para reclamar'
                : 'Completa este día para desbloquear el cofre'
        }
        accessibilityRole="button"
        disabled={bloqueado}
        onPress={() => {
          if (bloqueado) return;
          hapticSeguro('seleccion');
          onPress();
        }}
        onPressIn={() => {
          escala.value = withTiming(0.88, { duration: 90 });
        }}
        onPressOut={() => {
          escala.value = withSpring(1, { damping: 9, stiffness: 240 });
        }}
        style={styles.boton}
      >
        <Animated.View style={[styles.shell, animEstilo]}>
          <MasterChanger
            alto={76}
            ancho={76}
            fit="contain"
            fuente={fuente}
            hueDestino={tinte.hueDestino}
            hueOrigen={tinte.hueOrigen}
            oscurecido={bloqueado ? 0.6 : undefined}
            saturacion={tinte.saturacion}
            soloPixelesVerdes
          />
          {esDisponible && (
            <View style={[styles.badgeAbrir, { backgroundColor: color }]}>
              <Texto style={styles.badgeTexto}>¡Abrir!</Texto>
            </View>
          )}
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: {
    alignItems: 'center',
    height: 96,
    width: 84,
  },
  boton: {
    alignItems: 'center',
    height: 84,
    justifyContent: 'center',
    position: 'absolute',
    top: 6,
    width: 84,
  },
  shell: {
    alignItems: 'center',
    height: 76,
    justifyContent: 'center',
    width: 76,
  },
  badgeAbrir: {
    borderRadius: 8,
    bottom: -6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  badgeTexto: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 9,
    letterSpacing: 0.5,
  },
});
