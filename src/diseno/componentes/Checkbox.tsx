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
}>;

export function Checkbox({ checked, children, onChange }: CheckboxProps) {
  function alternar() {
    hapticSeguro('toggle');
    onChange(!checked);
  }

  return (
    <Pressable onPress={alternar} style={styles.raiz}>
      <View style={[styles.caja, checked && styles.cajaActiva]}>
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
    borderColor: colores.borde,
    borderRadius: bordes.sm,
    borderWidth: 1.5,
    height: 19,
    justifyContent: 'center',
    marginTop: 1,
    width: 19,
  },
  cajaActiva: {
    backgroundColor: colores.texto,
    borderColor: colores.texto,
  },
  texto: {
    color: colores.textoSecundario,
    flex: 1,
    fontFamily: 'MontserratAlternates-Medium',
    fontSize: 13,
    lineHeight: 19,
  },
});
