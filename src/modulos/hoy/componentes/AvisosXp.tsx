import { useQuery } from '@tanstack/react-query';
import { ArrowUp, Sparkles } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Texto } from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { usarEstadoAcceso } from '../../acceso/acceso.estado';
import { detectarGananciaXp, duracionAvisoXp, type GananciaXp } from '../gananciaXp';
import { CLAVE_RESUMEN_HOY } from '../refrescarResumenHoy';
import { obtenerResumenHoy } from '../resumenHoy.servicio';

// Aviso flotante "+10 XP" y celebración "¡Nivel 5!". Se monta una sola vez, en
// la raíz de la app, y observa el XP total: cuando sube, muestra la diferencia.
// Así funciona igual desde cualquier pantalla (Hábitos, Tareas, la sesión de
// una rutina, el mapa de un sendero…) sin que cada una tenga que avisar.
// No intercepta toques (pointerEvents="none").
export function AvisosXp() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const usuarioId = usarEstadoAcceso((estado) => estado.usuario?.id ?? null);
  const { data } = useQuery({ enabled: usuarioId !== null, queryKey: CLAVE_RESUMEN_HOY, queryFn: obtenerResumenHoy });
  const xpActual = usuarioId !== null ? data?.xpTotal : undefined;

  const xpAnterior = useRef<number | undefined>(undefined);
  const usuarioAnterior = useRef<string | null>(null);
  const [aviso, setAviso] = useState<(GananciaXp & { clave: number }) | null>(null);

  useEffect(() => {
    // Otra cuenta (o sesión cerrada): su XP no se compara con el de la anterior.
    if (usuarioAnterior.current !== usuarioId) {
      usuarioAnterior.current = usuarioId;
      xpAnterior.current = undefined;
      setAviso(null);
    }
    const ganancia = detectarGananciaXp(xpAnterior.current, xpActual);
    if (xpActual !== undefined) xpAnterior.current = xpActual;
    if (!ganancia) return;
    hapticSeguro(ganancia.subioNivel ? 'confirmacion' : 'seleccion');
    setAviso({ ...ganancia, clave: Date.now() });
  }, [usuarioId, xpActual]);

  useEffect(() => {
    if (!aviso) return;
    const temporizador = setTimeout(() => setAviso(null), duracionAvisoXp(aviso));
    return () => clearTimeout(temporizador);
  }, [aviso]);

  if (!aviso) return null;
  return (
    <View pointerEvents="none" style={[estilos.capa, { top: insets.top + 10 }]}>
      <Animated.View
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
        entering={FadeInUp.duration(240)}
        exiting={FadeOutUp.duration(280)}
        key={aviso.clave}
        style={[estilos.aviso, aviso.subioNivel && estilos.avisoNivel]}
      >
        {aviso.subioNivel ? (
          <>
            <View style={estilos.insignia}><ArrowUp color="#1A1335" size={18} strokeWidth={3} /></View>
            <View>
              <Texto style={estilos.nivelTitulo}>{t('hoy.nivelNuevo', { nivel: aviso.nivelNuevo })}</Texto>
              <Texto style={estilos.nivelTexto}>{t('hoy.xpGanado', { xp: aviso.xpGanado })}</Texto>
            </View>
          </>
        ) : (
          <>
            <Sparkles color="#FFFFFF" size={15} />
            <Texto style={estilos.xpTexto}>{t('hoy.xpGanado', { xp: aviso.xpGanado })}</Texto>
          </>
        )}
      </Animated.View>
    </View>
  );
}

const estilos = StyleSheet.create({
  capa: { alignItems: 'center', left: 0, position: 'absolute', right: 0, zIndex: 50 },
  aviso: {
    alignItems: 'center', backgroundColor: '#1A1335', borderRadius: 20, elevation: 6, flexDirection: 'row', gap: 6, paddingHorizontal: 14, paddingVertical: 8,
    shadowColor: '#1A1335', shadowOffset: { height: 4, width: 0 }, shadowOpacity: 0.22, shadowRadius: 10,
  },
  avisoNivel: { borderRadius: 22, gap: 12, paddingHorizontal: 18, paddingVertical: 12 },
  xpTexto: { color: '#FFFFFF', fontFamily: 'Montserrat-Bold', fontSize: 14 },
  insignia: { alignItems: 'center', backgroundColor: '#FACC15', borderRadius: 18, height: 36, justifyContent: 'center', width: 36 },
  nivelTitulo: { color: '#FFFFFF', fontFamily: 'MontserratAlternates-Bold', fontSize: 18, lineHeight: 23 },
  nivelTexto: { color: 'rgba(255,255,255,0.78)', fontFamily: 'Montserrat-Medium', fontSize: 12 },
});
