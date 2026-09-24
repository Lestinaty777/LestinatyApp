import { useRef } from 'react';
import {
  Animated,
  NativeSyntheticEvent,
  StyleSheet,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from 'react-native';

import { Texto, colores } from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { useEscala } from '../../../diseno/tema/MasterColorContext';
import type { EscalaMaster } from '../../../diseno/tema/escalaEsmeralda';
import { ESCALA_ESMERALDA } from '../../../diseno/tema/escalaEsmeralda';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);
const coloresOtp = ['#3B6FD1', ESCALA_ESMERALDA.lima.l70, '#E5B82E', '#E47B25', '#D63E35', '#E1358C', '#7B3CE6'];

function hapticTecla() {
  hapticSeguro('accion');
}

type CampoOtpProps = {
  error?: string;
  escala: number;
  onBlur: () => void;
  onChange: (valor: string) => void;
  value: string;
};

export function CampoOtp({ error, escala, onBlur, onChange, value }: CampoOtpProps) {
  const styles = useEstilosStyles();
  const inputs = useRef<Array<TextInput | null>>([]);
  const progresosColor = useRef(Array.from({ length: 6 }, () => new Animated.Value(0))).current;
  const coloresActuales = useRef(Array.from({ length: 6 }, (_, indice) => coloresOtp[indice % coloresOtp.length])).current;
  const digitos = value.padEnd(6, ' ').slice(0, 6).split('');
  const anchoCasilla = Math.max(42, Math.min(50, 46 * escala));
  const altoCasilla = Math.max(50, 58 * escala);

  function animarCasilla(indice: number) {
    coloresActuales[indice] = coloresOtp[Math.floor(Math.random() * coloresOtp.length)];
    progresosColor[indice].setValue(1);

    Animated.sequence([
      Animated.timing(progresosColor[indice], {
        duration: 80,
        toValue: 1,
        useNativeDriver: false,
      }),
      Animated.spring(progresosColor[indice], {
        friction: 3,
        tension: 170,
        toValue: 0,
        useNativeDriver: false,
      }),
    ]).start();
  }

  function enfocar(indice: number) {
    inputs.current[indice]?.focus();
  }

  function actualizarDesde(indice: number, texto: string) {
    const nuevosDigitos = value.split('');
    const limpio = texto.replace(/\D/g, '').slice(0, 6 - indice);

    if (!limpio) {
      nuevosDigitos[indice] = '';
      onChange(nuevosDigitos.join('').slice(0, 6));
      return;
    }

    hapticTecla();

    limpio.split('').forEach((digito, posicion) => {
      const indiceDestino = indice + posicion;
      nuevosDigitos[indiceDestino] = digito;
      animarCasilla(indiceDestino);
    });

    const siguienteIndice = Math.min(indice + limpio.length, 5);
    onChange(nuevosDigitos.join('').slice(0, 6));

    if (indice + limpio.length < 6) {
      enfocar(siguienteIndice);
    } else {
      inputs.current[5]?.blur();
    }
  }

  function borrarHaciaAtras(indice: number, evento: NativeSyntheticEvent<TextInputKeyPressEventData>) {
    if (evento.nativeEvent.key !== 'Backspace') {
      return;
    }

    if (digitos[indice].trim()) {
      return;
    }

    const nuevosDigitos = value.split('');
    const indiceAnterior = Math.max(indice - 1, 0);
    nuevosDigitos[indiceAnterior] = '';
    hapticTecla();
    onChange(nuevosDigitos.join('').slice(0, 6));
    enfocar(indiceAnterior);
  }

  return (
    <View style={styles.raiz}>
      <View style={styles.fila}>
        {digitos.map((digito, indice) => {
          const colorAnimado = progresosColor[indice].interpolate({
            inputRange: [0, 1],
            outputRange: [colores.texto, coloresActuales[indice]],
          });
          const fondoAnimado = progresosColor[indice].interpolate({
            inputRange: [0, 1],
            outputRange: [colores.superficie, `${coloresActuales[indice]}24`],
          });
          const escalaAnimada = progresosColor[indice].interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.16],
          });

          return (
            <AnimatedTextInput
              key={indice}
              ref={(input) => {
                inputs.current[indice] = input as TextInput | null;
              }}
              autoCapitalize="none"
              keyboardAppearance="light"
              keyboardType="number-pad"
              maxLength={6}
              onBlur={onBlur}
              onChangeText={(texto) => actualizarDesde(indice, texto)}
              onKeyPress={(evento) => borrarHaciaAtras(indice, evento)}
              placeholderTextColor={colores.tintaTenue}
              selectTextOnFocus
              style={[
                styles.casilla,
                {
                  backgroundColor: fondoAnimado,
                  borderColor: error ? colores.error : colorAnimado,
                  color: colorAnimado,
                  fontSize: 22 * escala,
                  height: altoCasilla,
                  transform: [{ scale: escalaAnimada }],
                  width: anchoCasilla,
                },
              ]}
              textContentType="oneTimeCode"
              value={digito.trim()}
            />
          );
        })}
      </View>
      {error ? <Texto style={[styles.error, { fontSize: 12 * escala, lineHeight: 17 * escala }]}>{error}</Texto> : null}
    </View>
  );
}

const crearEstilosStyles = (esc: EscalaMaster) => StyleSheet.create({
  raiz: {
    gap: 8,
  },
  fila: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  casilla: {
    backgroundColor: colores.superficie,
    borderRadius: 10,
    borderWidth: 2,
    fontFamily: 'MontserratAlternates-Bold',
    padding: 0,
    textAlign: 'center',
    shadowColor: esc.musgo.l21,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 0,
  },
  error: {
    color: colores.error,
    fontFamily: 'MontserratAlternates-Medium',
    textAlign: 'center',
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
