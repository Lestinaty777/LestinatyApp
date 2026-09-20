import { Eye, EyeOff, Lock } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleProp, StyleSheet, TextInputProps, TextStyle, View, ViewStyle } from 'react-native';

import { colores } from '../fundamentos/colores';
import { espaciado } from '../fundamentos/espaciado';
import { CampoTexto } from './CampoTexto';
import { hapticSeguro } from '../../nucleo/dispositivo/haptics';
import { useEscala } from '../tema/MasterColorContext';
import type { EscalaMaster } from '../tema/escalaEsmeralda';

type CampoContrasenaProps = Omit<TextInputProps, 'secureTextEntry'> & {
  campoStyle?: StyleProp<ViewStyle>;
  contenedorStyle?: StyleProp<ViewStyle>;
  error?: string;
  iconoSize?: number;
  mostrarMedidor?: boolean;
  style?: StyleProp<TextStyle>;
  variante?: 'normal' | 'flotante';
};

function calcularFuerzaContrasena(valor: string) {
  if (!valor) {
    return 0;
  }

  let fuerza = 0;
  if (valor.length >= 8) fuerza += 1;
  if (/[A-Z]/.test(valor) && /[a-z]/.test(valor)) fuerza += 1;
  if (/\d/.test(valor)) fuerza += 1;
  if (/[^A-Za-z0-9]/.test(valor)) fuerza += 1;

  return Math.min(fuerza, 3);
}

export function CampoContrasena({
  campoStyle,
  contenedorStyle,
  error,
  iconoSize = 20,
  mostrarMedidor = false,
  style,
  value,
  variante = 'normal',
  ...props
}: CampoContrasenaProps) {
  const styles = useEstilosStyles();
  const [visible, setVisible] = useState(false);
  const valor = typeof value === 'string' ? value : '';
  const fuerza = useMemo(() => calcularFuerzaContrasena(valor), [valor]);
  const alternarVisibilidad = () => {
    hapticSeguro('toggle');
    setVisible((estado) => !estado);
  };

  return (
    <View style={[styles.raiz, contenedorStyle]}>
      <CampoTexto
        {...props}
        autoComplete={props.autoComplete ?? 'password'}
        campoStyle={campoStyle}
        contenedorStyle={styles.campoSinMargen}
        error={error}
        iconoIzquierda={Lock}
        iconoSize={iconoSize}
        rightSlot={
          <Pressable
            accessibilityLabel={visible ? 'Ocultar contrasena' : 'Mostrar contrasena'}
            onPress={alternarVisibilidad}
            style={styles.botonOjo}
          >
            {visible ? (
              <EyeOff color={colores.tintaTenue} size={iconoSize} strokeWidth={2.2} />
            ) : (
              <Eye color={colores.tintaTenue} size={iconoSize} strokeWidth={2.2} />
            )}
          </Pressable>
        }
        secureTextEntry={!visible}
        style={style}
        value={value}
        variante={variante}
      />
      {mostrarMedidor && valor ? (
        <View style={styles.medidor}>
          {[1, 2, 3].map((nivel) => (
            <View
              key={nivel}
              style={[
                styles.segmento,
                nivel <= fuerza && fuerza === 1 ? styles.debil : null,
                nivel <= fuerza && fuerza === 2 ? styles.media : null,
                nivel <= fuerza && fuerza >= 3 ? styles.fuerte : null,
              ]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const crearEstilosStyles = (esc: EscalaMaster) => StyleSheet.create({
  raiz: {
    gap: espaciado.xs,
  },
  campoSinMargen: {
    gap: 0,
  },
  botonOjo: {
    alignItems: 'center',
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  medidor: {
    flexDirection: 'row',
    gap: espaciado.xs,
    paddingHorizontal: espaciado.xs,
  },
  segmento: {
    backgroundColor: 'rgba(166, 168, 174, 0.32)',
    borderRadius: 999,
    flex: 1,
    height: 5,
  },
  debil: {
    backgroundColor: '#FF2D2D',
  },
  media: {
    backgroundColor: '#FFC400',
  },
  fuerte: {
    backgroundColor: esc.lima.l80,
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
