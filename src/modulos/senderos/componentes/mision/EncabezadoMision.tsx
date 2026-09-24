import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

import { Rebote, Texto } from '../../../../diseno';
import { useEscala } from '../../../../diseno/tema/MasterColorContext';
import { AuroraBoreal } from '../../../hoy/componentes/AuroraBoreal';
import { temaAuroraDesdeColor } from './temaAuroraMision';

type EncabezadoMisionProps = {
  color: string;
  titulo: string | undefined;
};

// Cabecera común a las 3 pantallas de misión (check/cantidad/duración):
// volver con chevron a la izquierda + AuroraBoreal siempre visible, teñida
// del color real del paquete (nunca Monument Valley acá, sólo nuestro
// sistema de siempre).
export function EncabezadoMision({ color, titulo }: EncabezadoMisionProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const esc = useEscala();
  const { t } = useTranslation();

  return (
    <View style={styles.raiz}>
      <View style={[styles.aurora, { height: insets.top + 170 }]} pointerEvents="none">
        <AuroraBoreal tema={temaAuroraDesdeColor(color)} />
      </View>
      <View style={[styles.fila, { paddingTop: insets.top + 12 }]}>
        <Rebote accessibilityLabel={t('senderos.mision.volver')} estilo={styles.volverBtn} onPress={() => router.back()}>
          <ChevronLeft color={esc.hoja.l22} size={24} strokeWidth={2.4} />
        </Rebote>
        <Texto numberOfLines={1} style={[styles.titulo, { color: esc.hoja.l22 }]}>{titulo}</Texto>
        <View style={styles.espaciador} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { width: '100%' },
  aurora: { left: 0, position: 'absolute', right: 0, top: 0 },
  fila: { alignItems: 'center', flexDirection: 'row', gap: 4, paddingHorizontal: 8 },
  volverBtn: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  titulo: { flex: 1, fontFamily: 'MontserratAlternates-Bold', fontSize: 17, textAlign: 'center' },
  espaciador: { width: 40 },
});
