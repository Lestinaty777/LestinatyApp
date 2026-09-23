import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { Texto, useTintarHex } from '../../../../diseno';
import { AuroraBoreal, type TemaAurora } from '../../../hoy/componentes/AuroraBoreal';
import { hapticSeguro } from '../../../../nucleo/dispositivo/haptics';
import { colorMasterMasCercano } from '../../../../diseno/componentes/MasterChanger';
import { MandalaNodo } from '../../../habitos/componentes/MandalaNodo';
import type { TrazoMandala } from '../../../habitos/mandalaNodo.tipos';

// No hay ColorMaster→TemaAurora exacto (7 buckets contra 5 temas
// disponibles) — se toma el tema más cercano en vez de agregar un tema
// nuevo sólo para esta pantalla.
const TEMA_POR_COLOR_MASTER: Record<number, TemaAurora> = {
  1: 'grafito', 2: 'verde', 3: 'amarillo', 4: 'rojo', 5: 'rojo', 6: 'morado', 7: 'morado',
};

// Ritual común a los 3 tipos de hábito, deliberadamente abstracto — sólo
// SVG, tipografía, luz, color y movimiento (sin ilustraciones de semilla,
// árbol ni vegetación). La mandala ya se dibujó en el compositor; acá sólo
// se colapsa en el orbe y se vuelve al mapa.
export function MasterNodeFinalization() {
  const params = useLocalSearchParams<{ color?: string; nodoDia?: string; paqueteId?: string; trazos?: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const esm = useTintarHex();
  const color = params.color || esm('#7FE3B0');
  const trazos: TrazoMandala[] = (() => {
    try {
      const parseado = params.trazos ? JSON.parse(params.trazos) : [];
      return Array.isArray(parseado) ? parseado : [];
    } catch {
      return [];
    }
  })();

  const tema = TEMA_POR_COLOR_MASTER[colorMasterMasCercano(color)];
  const escala = useSharedValue(1);
  const opacidadTexto = useSharedValue(0);

  useEffect(() => {
    hapticSeguro('confirmacion');
    const t1 = setTimeout(() => { opacidadTexto.value = withTiming(1, { duration: 500 }); }, 900);
    const t2 = setTimeout(() => {
      hapticSeguro('confirmacion');
      escala.value = withTiming(0.32, { duration: 900 });
      opacidadTexto.value = withDelay(200, withTiming(0, { duration: 500 }));
    }, 2300);
    const t3 = setTimeout(() => router.back(), 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const estiloMandala = useAnimatedStyle(() => ({ transform: [{ scale: escala.value }] }));
  const estiloTexto = useAnimatedStyle(() => ({ opacity: opacidadTexto.value }));

  return (
    <View style={styles.raiz}>
      <View style={StyleSheet.absoluteFill}><AuroraBoreal tema={tema} /></View>
      <Animated.View entering={FadeIn.duration(400)} style={[styles.centro, estiloMandala]}>
        <MandalaNodo animado={false} color={color} estado="creada" semilla={`nodo-${params.nodoDia ?? '1'}`} tamano={220} trazos={trazos} />
      </Animated.View>
      <Animated.View style={[styles.textoContenedor, estiloTexto]}>
        <Texto style={styles.texto}>{t('habitos.mandala.finalizacion.nodoCultivado')}</Texto>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { alignItems: 'center', backgroundColor: 'rgba(6,8,18,0.92)', flex: 1, justifyContent: 'center' },
  centro: { alignItems: 'center', justifyContent: 'center' },
  textoContenedor: { bottom: 96, position: 'absolute' },
  texto: { color: '#FFFFFF', fontFamily: 'MontserratAlternates-Bold', fontSize: 16, letterSpacing: 0.4 },
});
