import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Texto, useTintarHex } from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import type { InfoMandalaNodo } from '../mandalaNodo.tipos';
import { MandalaNodo } from './MandalaNodo';

type OrbeMandalaNodoProps = {
  escalaEscena?: number;
  mandala: InfoMandalaNodo;
  onPress: () => void;
  seleccionado: boolean;
};

// Reemplaza al nodo terminado en su misma posición del mapa — mismo
// contenedor/tamaño que NodoCofreSendero. Si la mandala sigue `pendiente`
// (la app se cerró a medio compositor), muestra el fallback reproducible
// generado por MandalaNodo desde la semilla, con una afordancia para
// retomarla.
export function OrbeMandalaNodo({ escalaEscena = 1, mandala, onPress, seleccionado }: OrbeMandalaNodoProps) {
  const { t } = useTranslation();
  const esm = useTintarHex();
  const pendiente = mandala.estado === 'pendiente';
  // mandala.color es un snapshot ya fijado en servidor casi siempre — este
  // fallback sólo cubre el caso borde de un hábito sin color propio.
  const color = mandala.color ?? esm('#7FE3B0');

  return (
    <View style={[styles.raiz, { transform: [{ scale: escalaEscena }] }]}>
      <Pressable
        accessibilityLabel={pendiente
          ? t('habitos.mandala.pendienteAccesibilidad', { dia: mandala.nodoDia })
          : t('habitos.mandala.creadaAccesibilidad', { dia: mandala.nodoDia })}
        accessibilityRole="button"
        onPress={() => { hapticSeguro('seleccion'); onPress(); }}
        style={[styles.boton, seleccionado && styles.botonSeleccionado]}
      >
        <MandalaNodo animado color={color} estado={mandala.estado} semilla={mandala.semilla} tamano={72} trazos={mandala.trazos} />
        {pendiente && (
          <View style={[styles.badge, { backgroundColor: color }]}>
            <Texto style={styles.badgeTexto}>{t('habitos.mandala.badgeTerminar')}</Texto>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { alignItems: 'center', height: 96, width: 84 },
  boton: { alignItems: 'center', height: 84, justifyContent: 'center', position: 'absolute', top: 6, width: 84 },
  botonSeleccionado: { opacity: 0.92 },
  badge: {
    borderRadius: 8,
    bottom: -6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  badgeTexto: { color: '#FFFFFF', fontFamily: 'Montserrat-Bold', fontSize: 9, letterSpacing: 0.5 },
});
