import React, { useState, useEffect, useRef } from 'react';
import { View, Pressable, StyleSheet, Animated, Easing } from 'react-native';
import { Play, Square, Pause } from 'lucide-react-native';
import { Texto, RecuadroGlass, colores } from '../../../../../diseno';
import { WidgetAccionProps } from '../tipos';
import { hapticSeguro } from '../../../../../nucleo/dispositivo/haptics';

export type ConfigFoco = { duracionMinutos: number; titulo?: string; subtitulo?: string; };

function conAlpha(color: string, alpha: string) { return `${color}${alpha}`; }

export function WidgetFoco({ color, config, estado, onEvento }: WidgetAccionProps<ConfigFoco>) {
  const [segundosRestantes, setSegundosRestantes] = useState(config.duracionMinutos * 60);
  const [activo, setActivo] = useState(false);

  // Animación de "respiración" para el orbe central
  const animacionRespiracion = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let intervalo: ReturnType<typeof setInterval>;
    if (activo && segundosRestantes > 0) {
      intervalo = setInterval(() => {
        setSegundosRestantes(prev => prev - 1);
      }, 1000);
    } else if (segundosRestantes === 0 && activo) {
      setActivo(false);
      hapticSeguro('confirmacion');
      onEvento({ tipo: 'completado', widgetId: 'foco' });
    }
    return () => clearInterval(intervalo);
  }, [activo, segundosRestantes, onEvento]);

  useEffect(() => {
    if (activo) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animacionRespiracion, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(animacionRespiracion, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
        ])
      ).start();
    } else {
      animacionRespiracion.stopAnimation();
      Animated.timing(animacionRespiracion, { toValue: 0, duration: 500, useNativeDriver: true }).start();
    }
  }, [activo, animacionRespiracion]);

  const toggleTimer = () => {
    if (estado === 'bloqueado' || estado === 'completado') return;
    hapticSeguro('seleccion');
    setActivo(!activo);
  };

  const detenerYReiniciar = () => {
    if (estado === 'bloqueado' || estado === 'completado') return;
    hapticSeguro('seleccion');
    setActivo(false);
    setSegundosRestantes(config.duracionMinutos * 60);
  };

  const bloqueado = estado === 'bloqueado';
  const completado = estado === 'completado';

  const m = Math.floor(segundosRestantes / 60);
  const s = segundosRestantes % 60;
  const textoTiempo = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  const orbScale = animacionRespiracion.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });
  const orbOpacity = animacionRespiracion.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.4] });

  return (
    <RecuadroGlass blur intensity={40} style={[styles.contenedorWrapper, { borderColor: completado ? color : conAlpha(color, '30') }]}>
      
      {(config.titulo || config.subtitulo) && (
        <View style={styles.cabeceraTexto}>
          {config.titulo && <Texto style={styles.titulo}>{config.titulo}</Texto>}
          {config.subtitulo && <Texto style={styles.subtitulo}>{config.subtitulo}</Texto>}
        </View>
      )}

      <View style={styles.escenarioFoco}>
        {/* Orbe de luz pulsante */}
        <View style={styles.orbeContenedor}>
          <Animated.View style={[
            styles.orbeBrillo, 
            { 
              backgroundColor: completado ? 'transparent' : color, 
              transform: [{ scale: orbScale }],
              opacity: orbOpacity 
            }
          ]} />
          <View style={[styles.orbeSolido, { backgroundColor: completado ? color : 'rgba(0,0,0,0.3)', borderColor: completado ? color : conAlpha(color, '50') }]}>
            <Texto style={[styles.textoReloj, { color: completado ? '#FFF' : colores.texto }]}>
              {completado ? '00:00' : textoTiempo}
            </Texto>
          </View>
        </View>

        {/* Controles */}
        {!completado && (
          <View style={styles.controlesFila}>
            {segundosRestantes < config.duracionMinutos * 60 && (
              <Pressable onPress={detenerYReiniciar} style={styles.botonSecundario}>
                <Square color={colores.textoSecundario} size={18} fill="rgba(0,0,0,0.2)" />
              </Pressable>
            )}
            
            <Pressable 
              onPress={toggleTimer} 
              style={[styles.botonPrimario, { backgroundColor: color, opacity: bloqueado ? 0.3 : 1 }]}
            >
              {activo ? <Pause color="#FFF" size={24} fill="#FFF" /> : <Play color="#FFF" size={24} fill="#FFF" style={{ marginLeft: 4 }} />}
            </Pressable>
          </View>
        )}
      </View>

    </RecuadroGlass>
  );
}

const styles = StyleSheet.create({
  contenedorWrapper: { padding: 20, borderRadius: 32, borderWidth: 1, gap: 16 },
  cabeceraTexto: { alignItems: 'center', paddingHorizontal: 8 },
  titulo: { fontFamily: 'MontserratAlternates-Bold', fontSize: 16, color: colores.texto, textAlign: 'center', letterSpacing: 0.5 },
  subtitulo: { fontFamily: 'MontserratAlternates-Medium', fontSize: 12, color: colores.textoSecundario, marginTop: 4, textAlign: 'center' },
  
  escenarioFoco: { alignItems: 'center', gap: 24, marginVertical: 16 },
  orbeContenedor: { position: 'relative', width: 140, height: 140, alignItems: 'center', justifyContent: 'center' },
  orbeBrillo: { position: 'absolute', width: 140, height: 140, borderRadius: 70 },
  orbeSolido: { width: 110, height: 110, borderRadius: 55, borderWidth: 2, alignItems: 'center', justifyContent: 'center', elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
  textoReloj: { fontFamily: 'MontserratAlternates-Bold', fontSize: 26, letterSpacing: 1 },
  
  controlesFila: { flexDirection: 'row', alignItems: 'center', gap: 16, height: 60 },
  botonPrimario: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  botonSecundario: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.03)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' }
});
