import React, { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Check, Edit2 } from 'lucide-react-native';
import { Texto, RecuadroGlass, colores } from '../../../../../diseno';
import { WidgetAccionProps } from '../tipos';
import { hapticSeguro } from '../../../../../nucleo/dispositivo/haptics';

export type ConfigRegistro = { placeholder: string; tipoEntrada: 'numero' | 'texto'; unidad?: string; };

function conAlpha(color: string, alpha: string) { return `${color}${alpha}`; }

export function WidgetRegistro({ color, config, estado, onEvento }: WidgetAccionProps<ConfigRegistro>) {
  const [valor, setValor] = useState('');
  
  const enviar = () => {
    if (estado === 'bloqueado' || !valor.trim()) return;
    hapticSeguro('confirmacion');
    onEvento({ tipo: 'registro', widgetId: 'registro', datos: { valor: config.tipoEntrada === 'numero' ? parseFloat(valor) : valor } });
    onEvento({ tipo: 'completado', widgetId: 'registro' });
  };

  const bloqueado = estado === 'bloqueado';
  const completado = estado === 'completado';

  return (
    <RecuadroGlass blur intensity={30} style={[styles.contenedor, { borderColor: completado ? color : conAlpha(color, '30') }]}>
      
      {/* Ilustración Izquierda */}
      <View style={styles.ilustracion}>
        <Svg width="64" height="64" viewBox="0 0 64 64">
          <Circle cx="32" cy="32" r="28" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="6" />
          {completado && <Circle cx="32" cy="32" r="28" fill="none" stroke={color} strokeWidth="6" strokeDasharray="176" strokeDashoffset="0" />}
        </Svg>
        <View style={styles.iconoCentro}>
          {completado ? <Check color={color} size={20} /> : <Edit2 color={color} size={20} />}
        </View>
      </View>

      {/* Centro: Input */}
      <View style={styles.centro}>
        <View style={styles.inputFila}>
          <TextInput
            style={[styles.input, { color: colores.texto }]}
            keyboardAppearance="light"
            placeholder={config.placeholder}
            placeholderTextColor={colores.textoSecundario}
            keyboardType={config.tipoEntrada === 'numero' ? 'decimal-pad' : 'default'}
            value={valor}
            onChangeText={setValor}
            editable={!bloqueado && !completado}
          />
          {config.unidad && <Texto style={styles.unidad}>{config.unidad}</Texto>}
        </View>
      </View>
      
      {/* Derecha: Acción */}
      <Pressable 
        onPress={enviar} 
        style={[styles.BotonSubmit, { backgroundColor: completado ? color : conAlpha(color, '20'), opacity: (bloqueado || !valor.trim()) && !completado ? 0.3 : 1 }]}
      >
        <Check color={completado ? '#000' : color} size={20} />
      </Pressable>
      
    </RecuadroGlass>
  );
}

const styles = StyleSheet.create({
  contenedor: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 24, borderWidth: 1, gap: 16 },
  ilustracion: { position: 'relative', width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  iconoCentro: { position: 'absolute' },
  centro: { flex: 1, justifyContent: 'center' },
  inputFila: { flexDirection: 'row', alignItems: 'baseline', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.1)', paddingBottom: 4 },
  input: { flex: 1, fontFamily: 'MontserratAlternates-SemiBold', fontSize: 24, padding: 0 },
  unidad: { fontFamily: 'MontserratAlternates-Medium', fontSize: 14, color: colores.textoSecundario, marginLeft: 8 },
  BotonSubmit: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' }
});
