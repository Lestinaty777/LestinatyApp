import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Texto } from '../componentes/Texto';
import { MasterGlass } from './MasterGlass';

type MasterKickerProps = {
  icono?: ReactNode;
  texto: string;
};

export function MasterKicker({ icono, texto }: MasterKickerProps) {
  return (
    <View style={s.raiz}>
      <MasterGlass mastery style={StyleSheet.absoluteFill} />
      <View style={s.contenido}>
        {icono}
        <Texto style={s.texto}>{texto}</Texto>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  raiz: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    overflow: 'hidden',
  },
  contenido: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  texto: {
    color: '#FFF',
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 10,
  }
});
