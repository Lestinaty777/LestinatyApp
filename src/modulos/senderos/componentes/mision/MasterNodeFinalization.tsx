import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, withSpring, Easing, withSequence } from 'react-native-reanimated';

import { Texto, useTintarHex } from '../../../../diseno';
import { AuroraBoreal } from '../../../hoy/componentes/AuroraBoreal';
import { hapticSeguro } from '../../../../nucleo/dispositivo/haptics';
import { useEscala } from '../../../../diseno/tema/MasterColorContext';
import { MandalaNodo } from '../../../habitos/componentes/MandalaNodo';
import type { TrazoMandala } from '../../../habitos/mandalaNodo.tipos';
import { temaAuroraDesdeColor } from './temaAuroraMision';

// Ritual de finalización cinematográfico (inspirado en gachas).
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

  const tema = temaAuroraDesdeColor(color);
  const esc = useEscala();
  
  // Variables cinemáticas
  const escala = useSharedValue(0.01);
  const rotacion = useSharedValue(0);
  const opacidadTexto = useSharedValue(0);
  const opacidadFlash = useSharedValue(1);

  useEffect(() => {
    // 1. Explosión de aparición
    // Destello inicial que se disipa lentamente revelando el orbe
    opacidadFlash.value = withTiming(0, { duration: 1200, easing: Easing.out(Easing.cubic) });
    
    // El orbe brota gigante, gira y rebota
    escala.value = withSpring(1, { damping: 14, stiffness: 100, mass: 0.8 });
    rotacion.value = withTiming(Math.PI * 2, { duration: 3000, easing: Easing.out(Easing.cubic) });
    hapticSeguro('confirmacion');

    // 2. Aparece el texto
    const t1 = setTimeout(() => { 
      opacidadTexto.value = withTiming(1, { duration: 600 }); 
    }, 1200);

    // 3. Colapso gravitacional (contracción rápida hacia el mapa)
    const t2 = setTimeout(() => {
      hapticSeguro('confirmacion');
      
      // Micro destello al contraerse
      opacidadFlash.value = withSequence(
        withTiming(0.4, { duration: 150 }),
        withTiming(0, { duration: 400 })
      );

      // Succionado hacia adentro
      escala.value = withSpring(0.28, { damping: 18, stiffness: 220, mass: 0.6 });
      // Giro salvaje mientras se colapsa
      rotacion.value = withTiming(rotacion.value + Math.PI * 1.5, { duration: 800, easing: Easing.out(Easing.cubic) });
      
      opacidadTexto.value = withTiming(0, { duration: 300 });
    }, 3200);

    // 4. Salida al mapa
    const t3 = setTimeout(() => router.back(), 4200);
    
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const estiloMandala = useAnimatedStyle(() => ({ 
    transform: [
      { scale: escala.value },
      { rotate: `${rotacion.value}rad` }
    ] 
  }));
  const estiloTexto = useAnimatedStyle(() => ({ opacity: opacidadTexto.value }));
  const estiloFlash = useAnimatedStyle(() => ({ opacity: opacidadFlash.value }));

  return (
    <View style={[styles.raiz, { backgroundColor: esc.hoja.l97 }]}>
      <View style={StyleSheet.absoluteFill}><AuroraBoreal tema={tema} /></View>
      
      <Animated.View style={[styles.centro, estiloMandala]}>
        {/* Aumentado a 250 para dar más impacto inicial al aparecer */}
        <MandalaNodo animado={false} color={color} estado="creada" semilla={`nodo-${params.nodoDia ?? '1'}`} tamano={250} trazos={trazos} />
      </Animated.View>

      <Animated.View style={[styles.textoContenedor, estiloTexto]}>
        <Texto style={[styles.texto, { color: esc.hoja.l22 }]}>{t('habitos.mandala.finalizacion.nodoCultivado')}</Texto>
      </Animated.View>

      {/* Capa de luz deslumbrante estilo gacha */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF' }, estiloFlash]} />
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  centro: { alignItems: 'center', justifyContent: 'center' },
  textoContenedor: { bottom: 96, position: 'absolute' },
  texto: { fontFamily: 'MontserratAlternates-Bold', fontSize: 16, letterSpacing: 0.4 },
});
