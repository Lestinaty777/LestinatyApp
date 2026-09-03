import React, { useState, useEffect } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Svg, { Circle, Rect, Path, G } from 'react-native-svg';
import { Play, Pause, Square } from 'lucide-react-native';
import { Texto, RecuadroGlass, colores } from '../../../../../diseno';
import { reproducirExito } from '../../../../../nucleo/dispositivo/audio';
import { WidgetAccionProps } from '../tipos';
import { hapticSeguro } from '../../../../../nucleo/dispositivo/haptics';

export type ConfigCronometro = { duracionSegundos: number; titulo?: string; subtitulo?: string; };

function conAlpha(color: string, alpha: string) { return `${color}${alpha}`; }

export function WidgetCronometro({ color, config, estado, onEvento }: WidgetAccionProps<ConfigCronometro>) {
  const [restante, setRestante] = useState(config.duracionSegundos);
  const [corriendo, setCorriendo] = useState(false);

  useEffect(() => {
    let intervalo: ReturnType<typeof setInterval>;
    if (corriendo && restante > 0) {
      intervalo = setInterval(() => setRestante((prev) => prev - 1), 1000);
    } else if (restante === 0 && corriendo) {
      setCorriendo(false);
      hapticSeguro('confirmacion');
      reproducirExito();
      onEvento({ tipo: 'completado', widgetId: 'cronometro', datos: { completado: true } });
    }
    return () => clearInterval(intervalo);
  }, [corriendo, restante]);

  const toggleTimer = () => {
    if (estado === 'bloqueado' || estado === 'completado') return;
    hapticSeguro('seleccion');
    setCorriendo(!corriendo);
  };

  const mins = Math.floor(restante / 60).toString().padStart(2, '0');
  const secs = (restante % 60).toString().padStart(2, '0');
  const completado = estado === 'completado' || restante === 0;

  const cx = 32; const cy = 36; const R = 22;
  const C = 2 * Math.PI * R;
  const progreso = 1 - (restante / config.duracionSegundos);
  const offset = C - (progreso * C);

  return (
    <RecuadroGlass blur intensity={30} style={[styles.contenedorWrapper, { borderColor: completado ? color : conAlpha(color, '30') }]}>
      
      {/* Cabecera (Opcional) para que haga match con el contador */}
      {(config.titulo || config.subtitulo) && (
        <View style={styles.cabeceraTexto}>
          {config.titulo && <Texto style={styles.titulo}>{config.titulo}</Texto>}
          {config.subtitulo && <Texto style={styles.subtitulo}>{config.subtitulo}</Texto>}
        </View>
      )}

      <View style={styles.contenedorFila}>
        
        {/* Ilustración Izquierda: Cronómetro Clásico */}
        <View style={styles.relojContenedor}>
          <Svg width="64" height="64" viewBox="0 0 64 64">
            
            {/* El "Pulsador / Corona" superior clásico */}
            <Rect x="26" y="2" width="12" height="6" rx="2" fill="#8C8C8C" />
            <Rect x="30" y="8" width="4" height="4" fill="#666666" />
            
            {/* Botón lateral (Reset/Lap) a 45 grados */}
            <G transform="rotate(45 32 36)">
              <Rect x="30" y="6" width="4" height="6" rx="1" fill="#666666" />
            </G>
            
            {/* Cuerpo del reloj */}
            <Circle cx={cx} cy={cy} r="26" fill="rgba(0,0,0,0.02)" stroke="rgba(0,0,0,0.1)" strokeWidth="2" />
            
            {/* Pista de fondo del progreso */}
            <Circle cx={cx} cy={cy} r={R} fill="none" stroke={conAlpha(color, "30")} strokeWidth="6" />
            
            {/* Anillo de progreso animado (Rotado -90 para empezar desde arriba) */}
            <Circle 
              cx={cx} cy={cy} r={R} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={offset} 
              transform={`rotate(-90 ${cx} ${cy})`}
            />

            {/* Manecilla interna estática (para darle más toque mecánico) */}
            {!completado && (
              <Path d={`M${cx} ${cy} L${cx} ${cy - 12}`} stroke="#8C8C8C" strokeWidth="2" strokeLinecap="round" />
            )}
            <Circle cx={cx} cy={cy} r="3" fill="#AAAAAA" />
          </Svg>
        </View>

        {/* Texto Centro */}
        <View style={styles.centro}>
          <Texto style={[styles.numero, { color: completado ? color : colores.texto }]}>{mins}:{secs}</Texto>
          <Texto style={styles.textoRestante}>restante</Texto>
        </View>

        {/* Acción Derecha */}
        <Pressable onPress={toggleTimer} style={[styles.boton, { backgroundColor: completado ? 'rgba(0,0,0,0.05)' : conAlpha(color, '20') }]}>
          {completado ? <Square color={color} fill={color} size={20} /> : corriendo ? <Pause color={color} size={20} /> : <Play color={color} fill={color} size={20} />}
        </Pressable>

      </View>
    </RecuadroGlass>
  );
}

const styles = StyleSheet.create({
  contenedorWrapper: { padding: 16, borderRadius: 24, borderWidth: 1, gap: 8 },
  cabeceraTexto: { paddingHorizontal: 8, paddingTop: 4 },
  titulo: { fontFamily: 'MontserratAlternates-Bold', fontSize: 14, color: colores.texto },
  subtitulo: { fontFamily: 'MontserratAlternates-Medium', fontSize: 11, color: colores.textoSecundario, marginTop: 2 },
  contenedorFila: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  relojContenedor: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  centro: { flex: 1, justifyContent: 'center' },
  numero: { fontFamily: 'MontserratAlternates-Bold', fontSize: 32, fontVariant: ['tabular-nums'] },
  textoRestante: { fontFamily: 'MontserratAlternates-SemiBold', fontSize: 12, color: colores.textoSecundario },
  boton: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' }
});
