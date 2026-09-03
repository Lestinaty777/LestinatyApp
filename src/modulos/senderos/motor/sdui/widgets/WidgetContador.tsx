import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Svg, { Polygon, Line, Circle } from 'react-native-svg';
import { Minus, Plus } from 'lucide-react-native';
import { Texto, RecuadroGlass, colores } from '../../../../../diseno';
import { WidgetAccionProps } from '../tipos';
import { hapticSeguro } from '../../../../../nucleo/dispositivo/haptics';

export type ConfigContador = { meta: number; unidad: string; titulo?: string; subtitulo?: string; };

function conAlpha(color: string, alpha: string) { return `${color}${alpha}`; }

export function WidgetContador({ color, config, estado, onEvento }: WidgetAccionProps<ConfigContador>) {
  const [cuenta, setCuenta] = useState(0);

  const incrementar = () => {
    if (estado === 'bloqueado' || estado === 'completado') return;
    hapticSeguro('seleccion');
    const nueva = cuenta + 1;
    setCuenta(nueva);
    
    if (nueva >= config.meta) {
      hapticSeguro('confirmacion');
      onEvento({ tipo: 'completado', widgetId: 'contador', datos: { valor: nueva } });
    } else {
      onEvento({ tipo: 'avance', widgetId: 'contador', datos: { valor: nueva } });
    }
  };

  const decrementar = () => {
    if (estado === 'bloqueado' || cuenta <= 0) return;
    hapticSeguro('seleccion');
    setCuenta(cuenta - 1);
  };

  const bloqueado = estado === 'bloqueado';
  const completado = estado === 'completado' || cuenta >= config.meta;

  const cx = 32; const cy = 32; const r = 24;
  const ladosActuales = cuenta; 
  
  const obtenerPunto = (i: number, totalLados: number) => {
    const anguloOffset = totalLados % 2 === 0 ? 360 / (totalLados * 2) : 0; 
    const angleDeg = (i * (360 / totalLados)) - 90 + anguloOffset;
    const angleRad = angleDeg * (Math.PI / 180);
    return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
  };

  const vertices = Array.from({ length: Math.max(3, ladosActuales) }).map((_, i) => obtenerPunto(i, ladosActuales));
  const puntosSvgString = vertices.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <RecuadroGlass blur intensity={30} style={[styles.contenedorWrapper, { borderColor: conAlpha(color, '30') }]}>
      
      {/* Cabecera (Opcional) */}
      {(config.titulo || config.subtitulo) && (
        <View style={styles.cabeceraTexto}>
          {config.titulo && <Texto style={styles.titulo}>{config.titulo}</Texto>}
          {config.subtitulo && <Texto style={styles.subtitulo}>{config.subtitulo}</Texto>}
        </View>
      )}

      <View style={styles.contenedorFila}>
        {/* Ilustración Izquierda: Evolución Geométrica */}
        <View style={styles.ilustracion}>
          <Svg width="64" height="64" viewBox="0 0 64 64">
            {ladosActuales === 0 && <Circle cx={cx} cy={cy} r="6" fill="rgba(0,0,0,0.05)" stroke="rgba(0,0,0,0.1)" strokeWidth="2" />}
            {ladosActuales === 1 && <Circle cx={cx} cy={cy} r="6" fill={color} stroke={color} strokeWidth="2" />}
            {ladosActuales === 2 && (
              <>
                <Line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke={color} strokeWidth="4" strokeLinecap="round" />
                <Circle cx={cx} cy={cy - r} r="4" fill="#FFF" />
                <Circle cx={cx} cy={cy + r} r="4" fill="#FFF" />
              </>
            )}
            {ladosActuales >= 3 && (
              <>
                <Polygon points={puntosSvgString} fill={completado ? conAlpha(color, '40') : conAlpha(color, '10')} stroke={color} strokeWidth="3" strokeLinejoin="round" />
                {vertices.map((p, i) => <Circle key={i} cx={p.x} cy={p.y} r="3" fill="#FFF" />)}
              </>
            )}
          </Svg>
        </View>

        {/* Texto Centro */}
        <View style={styles.centro}>
          <Texto style={[styles.numeroGigante, { color: completado ? color : colores.texto }]}>{cuenta}</Texto>
          <Texto style={styles.unidadTexto}>de {config.meta} {config.unidad}</Texto>
        </View>

        {/* Acción Derecha */}
        <View style={styles.controles}>
          <Pressable onPress={decrementar} style={[styles.botonChico, { opacity: bloqueado ? 0.3 : 1 }]}>
            <Minus color={colores.textoSecundario} size={16} />
          </Pressable>
          <Pressable onPress={incrementar} style={[styles.botonGrande, { backgroundColor: conAlpha(color, '15'), borderColor: color, opacity: bloqueado ? 0.3 : 1 }]}>
            <Plus color={color} size={24} />
          </Pressable>
        </View>
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
  ilustracion: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  centro: { flex: 1, justifyContent: 'center' },
  numeroGigante: { fontFamily: 'MontserratAlternates-Bold', fontSize: 32, lineHeight: 40 },
  unidadTexto: { fontFamily: 'MontserratAlternates-Medium', fontSize: 12, color: colores.textoSecundario },
  controles: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  botonChico: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', backgroundColor: 'rgba(0,0,0,0.05)' },
  botonGrande: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1 }
});
