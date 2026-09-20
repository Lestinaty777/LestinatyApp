import type { ImageSourcePropType } from 'react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { MasterGlass, MasterIconBg, MasterChip, MasterIcon, Texto } from '../../../diseno';
import { useEscala } from '../../../diseno/tema/MasterColorContext';
import type { EscalaMaster } from '../../../diseno/tema/escalaEsmeralda';

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
  const tc = useEstilosTc();
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
                  icono={<MasterIcon name="racha" alTema size={14} />}
                />
                <MasterChip 
                  texto={`Nv ${nivel}`}
                  icono={<MasterIcon name={`nivel${nivel}`} alTema size={14} />}
                />
              </View>
            </View>
          </View>
        </MasterGlass>
      )}
    </Pressable>
  );
}

const crearEstilosTc = (esc: EscalaMaster) => StyleSheet.create({
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
    color: esc.hoja.l19, 
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

const estilosPorEscalaTc = new WeakMap<EscalaMaster, ReturnType<typeof crearEstilosTc>>();

function useEstilosTc() {
  const esc = useEscala();
  let valor = estilosPorEscalaTc.get(esc);
  if (!valor) {
    valor = crearEstilosTc(esc);
    estilosPorEscalaTc.set(esc, valor);
  }
  return valor;
}
