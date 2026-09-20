import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Texto } from '../componentes/Texto';
import { useTonoMaster } from '../tema/MasterColorContext';

type MasterKickerProps = {
  icono?: ReactNode;
  texto: string;
};

// Badge compacto de "mastery" — usa un LinearGradient estático en vez de
// MasterGlass para evitar el useState(tamano) + onLayout + re-render que ese
// componente dispara. Es un badge pequeño y fijo: no necesita medirse.
export function MasterKicker({ icono, texto }: MasterKickerProps) {
  const { degradados: g } = useTonoMaster();
  return (
    <LinearGradient
      colors={[g.mastery.suave, g.mastery.profunda]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={s.raiz}
    >
      <View style={s.contenido}>
        {icono}
        <Texto style={s.texto}>{texto}</Texto>
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  raiz: {
    alignSelf: 'flex-start',
    borderRadius: 12,
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
  },
});
