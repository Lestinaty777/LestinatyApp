import React, { useState, useEffect, useRef } from 'react';
import { View, Pressable, StyleSheet, Animated } from 'react-native';
import { Check } from 'lucide-react-native';
import { Texto, colores, generarPaleta, RecuadroGlass } from '../../../../../diseno';
import { WidgetAccionProps } from '../tipos';
import { hapticSeguro } from '../../../../../nucleo/dispositivo/haptics';

export type TareaChecklist = { id: string; texto: string };
export type ConfigChecklist = { tareas: TareaChecklist[]; };

function conAlpha(color: string, alpha: string) { return `${color}${alpha}`; }

export function WidgetChecklist({ color, config, estado, onEvento }: WidgetAccionProps<ConfigChecklist>) {
  const tareas = config.tareas.slice(0, 3);
  const [completadas, setCompletadas] = useState<Record<string, boolean>>({});
  const paleta = generarPaleta(color, tareas.length);

  const toggleTarea = (idTarea: string) => {
    if (estado === 'bloqueado' || estado === 'completado') return;
    const nuevoEstado = { ...completadas, [idTarea]: !completadas[idTarea] };
    setCompletadas(nuevoEstado);
    const todasHechas = tareas.every(t => nuevoEstado[t.id]);
    if (todasHechas) {
      hapticSeguro('confirmacion');
      onEvento({ tipo: 'completado', widgetId: 'checklist-asistida', datos: { completadas: nuevoEstado } });
    } else {
      hapticSeguro('seleccion');
      onEvento({ tipo: 'avance', widgetId: 'checklist-asistida', datos: { completadas: nuevoEstado } });
    }
  };

  const widgetBloqueado = estado === 'bloqueado';
  const widgetCompletado = estado === 'completado' || tareas.every(t => completadas[t.id]);
  const cantCompletadas = tareas.filter(t => completadas[t.id] || widgetCompletado).length;

  const progreso = cantCompletadas / tareas.length;
  const progresoAnimado = useRef(new Animated.Value(progreso)).current;

  useEffect(() => {
    Animated.spring(progresoAnimado, {
      toValue: progreso,
      useNativeDriver: false,
      friction: 7,
      tension: 40
    }).start();
  }, [progreso, progresoAnimado]);

  const heightInterpolado = progresoAnimado.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  return (
    <RecuadroGlass blur intensity={30} style={[styles.contenedor, { borderColor: widgetCompletado ? color : conAlpha(color, '30') }]}>
      
      {/* Ilustración Vertical (Termómetro / Tubo) */}
      <View style={styles.ilustracionVertical}>
        <View style={styles.tuboFondo}>
          <Animated.View style={[styles.tuboLiquido, { height: heightInterpolado, backgroundColor: color }]} />
        </View>
      </View>

      {/* Derecha: Checklists Stacked */}
      <View style={styles.derecha}>
        {tareas.map((tarea, index) => {
          const colorFila = paleta[index];
          const isHecha = completadas[tarea.id] || widgetCompletado;
          
          return (
            <Pressable 
              key={tarea.id}
              onPress={() => toggleTarea(tarea.id)}
              style={[
                styles.fila, 
                { 
                  borderColor: isHecha ? colorFila : conAlpha(colorFila, '30'),
                  backgroundColor: isHecha ? conAlpha(colorFila, '15') : 'rgba(0,0,0,0.02)',
                  opacity: widgetBloqueado ? 0.4 : 1
                }
              ]}
            >
              <View style={[styles.checkbox, { borderColor: isHecha ? colorFila : conAlpha(colorFila, '50'), backgroundColor: isHecha ? colorFila : 'transparent' }]}>
                {isHecha && <Check color={colores.fondo} size={10} strokeWidth={3} />}
              </View>
              <Texto style={[styles.texto, { color: isHecha ? colores.textoSecundario : colores.texto, textDecorationLine: isHecha ? 'line-through' : 'none' }]} numberOfLines={1}>
                {tarea.texto}
              </Texto>
            </Pressable>
          );
        })}
      </View>

    </RecuadroGlass>
  );
}

const styles = StyleSheet.create({
  contenedor: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 20, borderWidth: 1, gap: 16 },
  ilustracionVertical: { 
    alignSelf: 'stretch', // Para que estire la misma altura que las 3 tareas
    width: 24, 
    alignItems: 'center', 
    justifyContent: 'center',
    paddingVertical: 4
  },
  tuboFondo: {
    flex: 1,
    width: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    overflow: 'hidden',
    justifyContent: 'flex-end' // Para que el líquido crezca desde abajo
  },
  tuboLiquido: {
    width: '100%',
    borderRadius: 4
  },
  derecha: { flex: 1, gap: 8 },
  fila: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, borderWidth: 1 },
  checkbox: { width: 18, height: 18, borderRadius: 6, borderWidth: 2, marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  texto: { flex: 1, fontFamily: 'MontserratAlternates-SemiBold', fontSize: 12 }
});
