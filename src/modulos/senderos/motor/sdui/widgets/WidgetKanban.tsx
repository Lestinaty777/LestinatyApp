import React, { useState, useEffect, useRef } from 'react';
import { View, Pressable, StyleSheet, Animated } from 'react-native';
import { Texto, RecuadroGlass, colores, generarPaleta } from '../../../../../diseno';
import { WidgetAccionProps } from '../tipos';
import { hapticSeguro } from '../../../../../nucleo/dispositivo/haptics';

export type ConfigKanban = { tareas: string[]; titulo?: string; subtitulo?: string; };

function conAlpha(color: string, alpha: string) { return `${color}${alpha}`; }

// Componente para una sola burbuja/partícula
function Particula({ delay, left }: { delay: number, left: string }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1500, delay, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true })
      ])
    ).start();
  }, []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [15, -15] });
  const opacity = anim.interpolate({ inputRange: [0, 0.3, 0.8, 1], outputRange: [0, 0.8, 0.8, 0] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });

  return (
    <Animated.View style={{
      position: 'absolute',
      left: left as any,
      bottom: 0,
      width: 4, height: 4, borderRadius: 2, backgroundColor: '#FFF',
      transform: [{ translateY }, { scale }],
      opacity
    }} />
  );
}

function FilaTarea({ tarea, pos, color, alMover }: { tarea: string, pos: number, color: string, alMover: (nuevaPos: number) => void }) {
  const isTerminada = pos === 2;
  const isHaciendo = pos === 1;
  const fases = ['HACER', 'HACIENDO', 'LISTO'];

  const paleta = generarPaleta(color, 3);
  const posAnimada = useRef(new Animated.Value(pos)).current;

  useEffect(() => {
    Animated.spring(posAnimada, {
      toValue: pos,
      useNativeDriver: false,
      friction: 6,
      tension: 40
    }).start();
  }, [pos]);

  const leftInterpolado = posAnimada.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['0%', '33.333%', '66.666%']
  });

  const colorInterpolado = posAnimada.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [paleta[0], paleta[1], paleta[2]]
  });

  return (
    <View style={styles.filaTarea}>
      <View style={styles.cabeceraTarea}>
        <Texto style={[
          styles.textoTarea, 
          { 
            color: isTerminada ? colores.textoSecundario : colores.texto,
            textDecorationLine: isTerminada ? 'line-through' : 'none' 
          }
        ]}>
          {tarea}
        </Texto>
      </View>

      <View style={styles.rielContenedor}>
        
        <Animated.View style={[
          styles.pastillaActiva, 
          { 
            left: leftInterpolado, 
            backgroundColor: colorInterpolado,
            borderColor: colorInterpolado
          }
        ]}>
          {/* Si está en HACIENDO, mostramos partículas dentro de la pastilla */}
          {isHaciendo && (
            <View style={styles.contenedorParticulas}>
              <Particula delay={0} left="20%" />
              <Particula delay={600} left="50%" />
              <Particula delay={300} left="80%" />
            </View>
          )}
        </Animated.View>

        <View style={styles.botonesTrack}>
          {fases.map((labelFase, iFase) => {
            const isActivo = pos === iFase;
            return (
              <Pressable 
                key={iFase}
                onPress={() => alMover(iFase)}
                style={styles.segmentoClickable}
              >
                <Texto style={[
                  styles.textoSegmento, 
                  { 
                    color: isActivo ? '#FFFFFF' : colores.textoSecundario,
                    opacity: isActivo ? 1 : 0.5
                  }
                ]}>
                  {labelFase}
                </Texto>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export function WidgetKanban({ color, config, estado, onEvento }: WidgetAccionProps<ConfigKanban>) {
  const [posiciones, setPosiciones] = useState<number[]>(config.tareas.map(() => 0));

  const setFase = (indexTarea: number, nuevaFase: number) => {
    if (estado === 'bloqueado' || estado === 'completado') return;
    if (posiciones[indexTarea] === nuevaFase) return; 

    const nuevasPos = [...posiciones];
    nuevasPos[indexTarea] = nuevaFase;
    setPosiciones(nuevasPos);

    const todasTerminadas = nuevasPos.every(p => p === 2);
    
    if (todasTerminadas) {
      hapticSeguro('confirmacion');
      onEvento({ tipo: 'completado', widgetId: 'kanban', datos: { posiciones: nuevasPos } });
    } else {
      hapticSeguro('seleccion');
      onEvento({ tipo: 'avance', widgetId: 'kanban', datos: { posiciones: nuevasPos } });
    }
  };

  const completado = estado === 'completado' || posiciones.every(p => p === 2);

  return (
    <RecuadroGlass blur intensity={30} style={[styles.contenedorWrapper, { borderColor: completado ? color : conAlpha(color, '30') }]}>
      
      {(config.titulo || config.subtitulo) && (
        <View style={styles.cabeceraTexto}>
          {config.titulo && <Texto style={styles.titulo}>{config.titulo}</Texto>}
          {config.subtitulo && <Texto style={styles.subtitulo}>{config.subtitulo}</Texto>}
        </View>
      )}

      <View style={styles.listaTareas}>
        {config.tareas.map((tarea, i) => (
          <FilaTarea 
            key={i} 
            tarea={tarea} 
            pos={posiciones[i]} 
            color={color} 
            alMover={(nueva) => setFase(i, nueva)} 
          />
        ))}
      </View>
    </RecuadroGlass>
  );
}

const styles = StyleSheet.create({
  contenedorWrapper: { padding: 12, borderRadius: 20, borderWidth: 1, gap: 12 },
  cabeceraTexto: { paddingHorizontal: 8, paddingTop: 4 },
  titulo: { fontFamily: 'MontserratAlternates-Bold', fontSize: 14, color: colores.texto },
  subtitulo: { fontFamily: 'MontserratAlternates-Medium', fontSize: 11, color: colores.textoSecundario, marginTop: 2 },
  listaTareas: { gap: 8 },
  filaTarea: { gap: 4 },
  cabeceraTarea: { paddingHorizontal: 4 },
  textoTarea: { fontFamily: 'MontserratAlternates-SemiBold', fontSize: 12 },
  rielContenedor: { 
    height: 28, 
    backgroundColor: 'rgba(0,0,0,0.03)', 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: 'rgba(0,0,0,0.05)',
    position: 'relative'
  },
  botonesTrack: {
    flexDirection: 'row',
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    zIndex: 2,
  },
  segmentoClickable: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  textoSegmento: { fontFamily: 'MontserratAlternates-Bold', fontSize: 9, letterSpacing: 0.5 },
  pastillaActiva: {
    position: 'absolute',
    top: -1, 
    bottom: -1,
    width: '33.333%',
    borderRadius: 16,
    borderWidth: 1,
    zIndex: 1,
    overflow: 'hidden'
  },
  contenedorParticulas: {
    ...StyleSheet.absoluteFill as any,
    opacity: 0.7
  }
});
