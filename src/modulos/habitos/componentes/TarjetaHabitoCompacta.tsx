import type { ImageSourcePropType } from 'react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { MasterGlass, MasterIconBg, MasterChip, MasterIcon, Texto } from '../../../diseno';

export type TarjetaHabitoCompactaProps = {
  alto?: number;
  ancho?: number;
  diasCompletados?: number[];
  diasProgramados: number[];
  icono: { fuente: ImageSourcePropType };
  meta: number;
  nivel?: number;
  onPress: () => void;
  racha?: number;
  titulo: string;
  valorHoy?: number;
};

export function TarjetaHabitoCompacta({
  alto = 92, ancho = 260, icono, nivel = 1, onPress, racha = 0, titulo
}: TarjetaHabitoCompactaProps) {
  return (
    <Pressable onPress={onPress} style={{ height: alto, width: ancho }}>
      {({ pressed }) => (
        <MasterGlass blur intensity={40} style={[tc.raiz, { transform: [{ translateY: pressed ? 2 : 0 }] }]}>
          <View style={tc.filaPrincipal}>
            <MasterIconBg fuente={icono.fuente} size={64} />
            <View style={tc.columnaTextos}>
              <Texto numberOfLines={1} style={tc.titulo}>{titulo}</Texto>
              <View style={tc.chipsFila}>
                <MasterChip 
                  texto={`${racha} d`}
                  icono={<MasterIcon name="racha" color={2} size={14} />}
                />
                <MasterChip 
                  texto={`Nv ${nivel}`}
                  icono={<MasterIcon name={`nivel${nivel}`} color={2} size={14} />}
                />
              </View>
            </View>
          </View>
        </MasterGlass>
      )}
    </Pressable>
  );
}

const tc = StyleSheet.create({
  raiz: { 
    borderRadius: 16, 
    flex: 1, 
    overflow: 'hidden', 
    paddingHorizontal: 14, 
    paddingVertical: 12,
    justifyContent: 'center'
  },
  filaPrincipal: { 
    alignItems: 'center', 
    flexDirection: 'row', 
    gap: 14
  },
  columnaTextos: { 
    flex: 1, 
    justifyContent: 'center' 
  },
  titulo: { 
    color: '#12331F', 
    fontFamily: 'MontserratAlternates-Bold', 
    fontSize: 15, 
    marginBottom: 8 
  },
  chipsFila: { 
    alignItems: 'center', 
    flexDirection: 'row', 
    gap: 6 
  }
});
