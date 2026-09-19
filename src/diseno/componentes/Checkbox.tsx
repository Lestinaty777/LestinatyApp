import { Check } from 'lucide-react-native';
import { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { bordes } from '../fundamentos/bordes';
import { colores } from '../fundamentos/colores';
import { espaciado } from '../fundamentos/espaciado';
import { hapticSeguro } from '../../nucleo/dispositivo/haptics';

type CheckboxProps = PropsWithChildren<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Color del borde sin marcar y del relleno marcado — por defecto el
   * neutro del sistema (`colores.borde`/`colores.texto`), pensado para
   * superficies blancas. Se puede sobreescribir cuando el fondo real (ej. un
   * degradado de color) le deja muy poco contraste al tono neutro. */
  colorActivo?: string;
  colorBorde?: string;
}>;

export function Checkbox({ checked, children, colorActivo = colores.texto, colorBorde = colores.borde, onChange }: CheckboxProps) {
  function alternar() {
    hapticSeguro('toggle');
    onChange(!checked);
  }

  return (
    <Pressable onPress={alternar} style={styles.raiz}>
      <View style={[styles.caja, { borderColor: colorBorde }, checked && { backgroundColor: colorActivo, borderColor: colorActivo }]}>
        {checked ? <Check color={colores.superficie} size={13} strokeWidth={3} /> : null}
      </View>
      <Text style={styles.texto}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  raiz: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: espaciado.sm,
  },
  caja: {
    alignItems: 'center',
    borderRadius: bordes.sm,
    borderWidth: 1.5,
    height: 19,
    justifyContent: 'center',
    marginTop: 1,
    width: 19,
  },
  texto: {
    color: colores.textoSecundario,
    flex: 1,
    fontFamily: 'MontserratAlternates-Medium',
    fontSize: 13,
    lineHeight: 19,
  },
});
