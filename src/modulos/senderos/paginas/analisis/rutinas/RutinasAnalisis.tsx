import React, { useState } from 'react';
import { EstadoWidgetAccion, EventoWidgetAccion, WidgetAccionPack } from '../../../motor/sdui/tipos';
import { ScrollView, View } from 'react-native';
import { RenderizadorAccion } from '../../../motor/sdui/RenderizadorAccion';
import { Texto, colores } from '../../../../../diseno';

const mockContador: WidgetAccionPack = { id: 'contador', rol: 'principal', config: { titulo: 'Mantente Hidratado', subtitulo: 'Bebe agua durante el día', meta: 10, unidad: 'Vasos' } };
const mockCronometro: WidgetAccionPack = { id: 'cronometro', rol: 'principal', config: { titulo: 'Lectura Profunda', subtitulo: 'Modo enfoque activado', duracionSegundos: 15 } };
const mockRegistro: WidgetAccionPack = { id: 'registro', rol: 'principal', config: { titulo: 'Peso Corporal', subtitulo: 'Registra tu peso matutino', placeholder: '0.0', tipoEntrada: 'numero', unidad: 'kg', min: 40, max: 150 } };
const mockChecklist: WidgetAccionPack = { id: 'checklist-asistida', rol: 'principal', config: { titulo: 'Rutina de Mañana', subtitulo: 'Completa los 3 pasos clave', tareas: [{id: '1', texto: 'Hacer la cama'}, {id: '2', texto: 'Meditar'}, {id: '3', texto: 'Escribir metas'}] } };
const mockEscala: WidgetAccionPack = { id: 'escala', rol: 'principal', config: { titulo: 'Nivel de Energía', subtitulo: '¿Cómo te sientes al despertar?', min: 1, max: 5, etiquetas: ['Agotado', 'Excelente'] } };
const mockDecision: WidgetAccionPack = { id: 'decision', rol: 'principal', config: { titulo: 'Resistencia', subtitulo: '¿Evitaste el azúcar hoy?', opciones: ['Sí, lo logré', 'Caí en tentación'] } };


const mockFoco: WidgetAccionPack = { id: 'foco', rol: 'principal', config: { titulo: 'Trabajo Profundo', subtitulo: 'Cero distracciones', duracionMinutos: 1 } };
const mockKanban: WidgetAccionPack = { id: 'kanban', rol: 'principal', config: { titulo: 'Proyecto Mini', subtitulo: 'Toca las tarjetas para avanzarlas', tareas: ['Investigar', 'Diseñar UI', 'Programar'] } };


export type RutinasAnalisisProps = {
  datos: any;
  acento: string;
  itemsCargados: number;
  senderoFiltro: any;
};

export function RutinasAnalisis({ acento }: RutinasAnalisisProps) {

  const [estados, setEstados] = useState<Record<string, EstadoWidgetAccion>>({});

  const manejarEvento = (evento: EventoWidgetAccion) => {
    console.log('Evento de Widget disparado:', evento);
    if (evento.tipo === 'completado') {
      setEstados(prev => ({ ...prev, [evento.widgetId]: 'completado' }));
    }
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
      <View style={{ marginBottom: 24, alignItems: 'center' }}>
        <Texto style={{ color: colores.textoSecundario, fontFamily: 'MontserratAlternates-Medium', fontSize: 12, textAlign: 'center' }}>
          Demostrador de Widgets de Acción (Ejecución){'\n'}Estos componentes enviarán eventos al completarse.
        </Texto>
      </View>
      <View style={{ gap: 24 }}>
        <View><Texto style={{ color: acento, fontFamily: 'MontserratAlternates-Bold', fontSize: 14, marginBottom: 8 }}>1. Widget Contador</Texto><RenderizadorAccion widget={mockContador} estado={estados[mockContador.id] || "activo"} color={acento} onEvento={manejarEvento} /></View>
        <View><Texto style={{ color: acento, fontFamily: 'MontserratAlternates-Bold', fontSize: 14, marginBottom: 8 }}>2. Widget Cronómetro (15s)</Texto><RenderizadorAccion widget={mockCronometro} estado={estados[mockCronometro.id] || "activo"} color={acento} onEvento={manejarEvento} /></View>
        <View><Texto style={{ color: acento, fontFamily: 'MontserratAlternates-Bold', fontSize: 14, marginBottom: 8 }}>3. Widget Registro Numérico</Texto><RenderizadorAccion widget={mockRegistro} estado={estados[mockRegistro.id] || "activo"} color={acento} onEvento={manejarEvento} /></View>
        <View><Texto style={{ color: acento, fontFamily: 'MontserratAlternates-Bold', fontSize: 14, marginBottom: 8 }}>4. Widget Checklist Asistida</Texto><RenderizadorAccion widget={mockChecklist} estado={estados[mockChecklist.id] || "activo"} color={acento} onEvento={manejarEvento} /></View>
        <View><Texto style={{ color: acento, fontFamily: 'MontserratAlternates-Bold', fontSize: 14, marginBottom: 8 }}>5. Widget Escala</Texto><RenderizadorAccion widget={mockEscala} estado={estados[mockEscala.id] || "activo"} color={acento} onEvento={manejarEvento} /></View>
        <View><Texto style={{ color: acento, fontFamily: 'MontserratAlternates-Bold', fontSize: 14, marginBottom: 8 }}>6. Widget Decisión</Texto><RenderizadorAccion widget={mockDecision} estado={estados[mockDecision.id] || "activo"} color={acento} onEvento={manejarEvento} /></View>
        <View><Texto style={{ color: acento, fontFamily: 'MontserratAlternates-Bold', fontSize: 14, marginBottom: 8 }}>7. Widget Kanban</Texto><RenderizadorAccion widget={mockKanban} estado={estados[mockKanban.id] || "activo"} color={acento} onEvento={manejarEvento} /></View>

                <View><Texto style={{ color: acento, fontFamily: 'MontserratAlternates-Bold', fontSize: 14, marginBottom: 8 }}>8. Widget Modo Foco</Texto><RenderizadorAccion widget={mockFoco} estado={estados[mockFoco.id] || "activo"} color={acento} onEvento={manejarEvento} /></View>
      </View>
    </ScrollView>
  );
}
