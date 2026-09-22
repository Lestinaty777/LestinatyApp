import { useEffect, useRef } from 'react';
import { AccessibilityInfo, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import type { SeccionSenderoHabito } from '../../../habitos/senderoHabito.tipos';
import { anchoTarjetaNivel, TarjetaNivelSendero } from './TarjetaNivelSendero';
import { indiceScrollParaNivel } from './carruselNiveles.modelo';

const SEPARACION = 12;

type Props = {
  secciones: SeccionSenderoHabito[];
  nivelSeleccionado: number;
  paqueteId: string;
  colorPaquete: string;
  onSeleccionar: (nivel: number) => void;
};

export function CarruselNivelesSendero({ secciones, nivelSeleccionado, paqueteId, colorPaquete, onSeleccionar }: Props) {
  const { width } = useWindowDimensions();
  const ancho = anchoTarjetaNivel(width);
  const scrollRef = useRef<ScrollView>(null);
  const movimientoReducidoRef = useRef(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled?.().then((activo) => { movimientoReducidoRef.current = activo; });
  }, []);

  useEffect(() => {
    const indice = indiceScrollParaNivel(nivelSeleccionado, secciones.length);
    scrollRef.current?.scrollTo({ animated: !movimientoReducidoRef.current, x: indice * (ancho + SEPARACION) });
  }, [nivelSeleccionado, secciones.length, ancho]);

  return (
    <ScrollView
      contentContainerStyle={s.contenido}
      decelerationRate="fast"
      horizontal
      ref={scrollRef}
      showsHorizontalScrollIndicator={false}
      snapToAlignment="start"
      snapToInterval={ancho + SEPARACION}
    >
      {secciones.map((seccion) => (
        <TarjetaNivelSendero
          colorPaquete={colorPaquete}
          key={`${seccion.nivel}-${seccion.ciclo}`}
          onSeleccionar={onSeleccionar}
          paqueteId={paqueteId}
          seccion={seccion}
          seleccionado={seccion.nivel === nivelSeleccionado}
        />
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  contenido: { gap: SEPARACION, paddingHorizontal: 20 },
});
