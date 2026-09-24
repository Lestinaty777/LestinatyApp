import { StyleSheet, View } from 'react-native';

import { MasterSand, Texto } from '../../../../diseno';
import { MasterIcon } from '../../../../diseno/iconos/MasterIcon';
import { useEscala } from '../../../../diseno/tema/MasterColorContext';
import { hueYSaturacionDeHex } from '../../../../diseno/componentes/MasterChanger';
import type { HitoMision } from './hitosMision';

type TimelineHitosMisionProps = {
  color: string;
  hitos: HitoMision[];
};

// Un ícono de /UI por hito (nunca insignias): 3 hojas crecientes y una
// maceta para el último — mismo lenguaje del arbusto del anillo. El badge
// detrás es un MasterSand circular (mismo hundido/lleno del anillo grande);
// el ícono vive siempre sobre una monedita clara para no perder contraste
// cuando el fondo pasa a ser el color saturado del hábito.
const ICONOS_HITO = ['hoja', 'hoja2', 'hoja3', 'maceta'];

export function TimelineHitosMision({ color, hitos }: TimelineHitosMisionProps) {
  const esc = useEscala();
  const hueHabito = hueYSaturacionDeHex(color).hue;

  return (
    <View style={styles.raiz}>
      <View style={[styles.lineaFondo, { backgroundColor: esc.hoja.l85 }]} />
      <View style={styles.fila}>
        {hitos.map((hito, indice) => (
          <View key={hito.valor} style={styles.hito}>
            <MasterSand color={color} forma="circulo" porcentaje={hito.alcanzado ? 100 : 0} tamano={44}>
              <View style={[styles.moneda, { backgroundColor: hito.alcanzado ? 'rgba(255,255,255,0.94)' : 'rgba(255,255,255,0.55)' }]}>
                <View style={!hito.alcanzado && styles.iconoApagado}>
                  <MasterIcon hueDestino={hueHabito} name={ICONOS_HITO[indice] ?? 'hoja'} size={18} />
                </View>
              </View>
            </MasterSand>
            <Texto style={[styles.etiqueta, { color: hito.alcanzado ? color : esc.musgo.l42 }]}>{hito.etiqueta}</Texto>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { justifyContent: 'center', width: '100%' },
  lineaFondo: { borderRadius: 2, height: 3, left: 22, position: 'absolute', right: 22, top: 22 },
  fila: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  hito: { alignItems: 'center', gap: 8 },
  moneda: { alignItems: 'center', borderRadius: 15, height: 30, justifyContent: 'center', width: 30 },
  iconoApagado: { opacity: 0.5 },
  etiqueta: { fontFamily: 'Montserrat-SemiBold', fontSize: 11 },
});
