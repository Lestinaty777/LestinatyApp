import React from 'react';
import { ScrollView, View } from 'react-native';
import { SaludEstadisticas } from './tipos';
import { AnalyticsMaster } from '../AnalyticsMaster';
import { ContentPack } from '../arquitectura/tipos_sdui';
import { Texto, colores } from '../../../../../diseno';
import { useEscala } from '../../../../../diseno/tema/MasterColorContext';
import { ESCALA_ESMERALDA } from '../../../../../diseno/tema/escalaEsmeralda';

// --- MOCK CONTENT PACKS ---
const packAgua: ContentPack = {
  id: 'pack-agua-1', goal_id: 'salud-general', habit_id: 'tomar-agua',
  widget_id: 'progress-cylinder',
  title: 'Hidratación Diaria', subtitle: 'Tu consumo de líquidos',
  value_label: 'de 2.5 L (Meta)', unit: 'L', icon: 'droplet',
  color_override: '#3b82f6', // Override azul
  microcopy: { onTrack: 'Vas muy bien, sigue hidratándote 💧', behind: '', done: '' }
};

const packCafe: ContentPack = {
  id: 'pack-cafe-1', goal_id: 'reducir-ansiedad', habit_id: 'limitar-cafe',
  widget_id: 'progress-cylinder',
  title: 'Límite de Cafeína', subtitle: 'Para dormir mejor hoy',
  value_label: 'de 3 Tazas (Máximo)', unit: 'Tazas', icon: 'coffee',
  color_override: '#d97706', // Override naranja/marrón
  microcopy: { onTrack: '¡Aún estás en el límite saludable! ☕', behind: '', done: '' }
};

const packBascula: ContentPack = {
  id: 'pack-bascula-1', goal_id: 'bajar-peso', habit_id: 'pesar-diario',
  widget_id: 'trend-line',
  title: 'Tendencia de Báscula', subtitle: 'Tu evolución corporal',
  value_label: '', unit: 'kg', icon: 'scale', color_override: null,
  microcopy: { onTrack: '', behind: '', done: '' }
};

const packFinanzas: ContentPack = {
  id: 'pack-fin-1', goal_id: 'ahorro', habit_id: 'control-gastos',
  widget_id: 'trend-line',
  title: 'Fondo de Emergencia', subtitle: 'Tu capital disponible',
  value_label: '', unit: '$', icon: 'trending-up', color_override: ESCALA_ESMERALDA.menta.l67,
  microcopy: { onTrack: '', behind: '', done: '' }
};

const packSueno: ContentPack = {
  id: 'pack-sueno-1', goal_id: 'descanso', habit_id: 'dormir-bien',
  widget_id: 'traffic-light',
  title: 'Calidad de Sueño', subtitle: 'Descanso profundo',
  value_label: '', unit: 'h', icon: 'moon', color_override: null,
  microcopy: { onTrack: '', behind: '', done: '' }
};


const packHeatmap: ContentPack = {
  id: 'pack-heat-1', goal_id: 'habitos', habit_id: 'leer',
  widget_id: 'consistency-grid',
  title: 'Consistencia Mensual', subtitle: 'Hábito de Lectura',
  value_label: '', unit: '', icon: 'grid', color_override: '#ec4899', // Pink
  microcopy: { onTrack: '', behind: '', done: '' }
};

const packAnillo: ContentPack = {
  id: 'pack-ring-1', goal_id: 'fitness', habit_id: 'calorias',
  widget_id: 'progress-ring',
  title: 'Quema Activa', subtitle: 'Movimiento del día',
  value_label: 'kcal quemadas', unit: 'kcal', icon: 'target', color_override: '#ef4444', // Red
  microcopy: { onTrack: '¡A un paso de cerrar tu anillo! 🔥', behind: '', done: '' }
};


const packReloj: ContentPack = {
  id: 'pack-clock-1', goal_id: 'productividad', habit_id: 'trabajo-profundo',
  widget_id: 'radar-clock',
  title: 'Pico de Enfoque', subtitle: 'Tu mejor momento',
  value_label: 'Mayor eficiencia a las', unit: 'Productivo', icon: 'clock', color_override: '#8b5cf6', // Violet
  microcopy: { onTrack: 'Intenta programar reuniones fuera de esta hora 🧠', behind: '', done: '' }
};


const packBarras: ContentPack = {
  id: 'pack-bar-1', goal_id: 'productividad', habit_id: 'pantalla',
  widget_id: 'bar-chart',
  title: 'Tiempo en Pantalla', subtitle: 'Horas frente al celular',
  value_label: '', unit: 'h', icon: 'activity', color_override: '#f59e0b', // Amber
  microcopy: { onTrack: 'Has bajado 20% tu uso semanal 👇', behind: '', done: '' }
};

const packDona: ContentPack = {
  id: 'pack-dona-1', goal_id: 'nutricion', habit_id: 'macros',
  widget_id: 'segmented-donut',
  title: 'Macros Diarios', subtitle: 'Distribución calórica',
  value_label: '', unit: 'g', icon: 'pie-chart', color_override: ESCALA_ESMERALDA.menta.l76, 
  microcopy: { onTrack: 'Buena carga de proteína 💪', behind: '', done: '' }
};


const packArana: ContentPack = {
  id: 'pack-spider-1', goal_id: 'balance', habit_id: 'vida',
  widget_id: 'spider-web',
  title: 'Balance de Vida', subtitle: 'Tu perfil RPG',
  value_label: '', unit: '', icon: 'network', color_override: '#0ea5e9', // Sky blue
  microcopy: { onTrack: '', behind: '', done: '' }
};

const packGauge: ContentPack = {
  id: 'pack-gauge-1', goal_id: 'recuperacion', habit_id: 'estres',
  widget_id: 'speedometer',
  title: 'Nivel de Energía', subtitle: 'Batería corporal actual',
  value_label: '', unit: '% Carga', icon: 'battery', color_override: '#eab308', // Yellow
  microcopy: { onTrack: 'Estás listo para un entrenamiento intenso ⚡', behind: '', done: '' }
};

// --------------------------

export function SaludAnalisis({ acento }: { acento: string; datos: SaludEstadisticas; itemsCargados: number; senderoFiltro?: any }) {
  const esc = useEscala();
  
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={{ padding: 12, alignItems: 'center' }}>
        <Texto style={{ color: colores.textoSecundario, fontFamily: 'MontserratAlternates-Medium', fontSize: 12, textAlign: 'center' }}>
          Demostración SDUI (Server-Driven UI){'\n'}El mismo motor dibujando 2 objetivos distintos
        </Texto>
      </View>

      <AnalyticsMaster 
        pack={packAgua} 
        metrics={{ hoy: 1.8, semana: [] }} 
        colorCategoria={acento} 
      />

      <AnalyticsMaster 
        pack={packCafe} 
        metrics={{ hoy: 2, semana: [] }} 
        colorCategoria={acento} 
      />

      <AnalyticsMaster pack={packBascula} metrics={{ historico: [82.5, 81.8, 81.2, 80.5, 79.8, 79.0, 78.2], inicio: 82.5, actual: 78.2, meta: 75.0 }} colorCategoria={acento} />
      <AnalyticsMaster pack={packFinanzas} metrics={{ historico: [1200, 1350, 1300, 1500, 1800, 1950, 2100], inicio: 1200, actual: 2100, meta: 3000 }} colorCategoria={acento} />
      <AnalyticsMaster pack={packHeatmap} metrics={{ matriz: [0,0,1,3,4,0,0, 1,2,4,4,3,1,0, 0,1,1,2,4,4,3, 0,0,1,2,3,4,4] }} colorCategoria={acento} />
      <AnalyticsMaster pack={packAnillo} metrics={{ actual: 450, meta: 600 }} colorCategoria={acento} />
      <AnalyticsMaster pack={packReloj} metrics={{ horaPico: 14 }} colorCategoria={acento} />
      <AnalyticsMaster pack={packBarras} metrics={{ barras: [{etiqueta: 'L', valor: 4.2}, {etiqueta: 'M', valor: 3.8}, {etiqueta: 'M', valor: 5.1}, {etiqueta: 'J', valor: 2.9}] }} colorCategoria={acento} />
      <AnalyticsMaster pack={packDona} metrics={{ total: 200, segmentos: [{etiqueta: 'Proteína', valor: 90, color: esc.menta.l76}, {etiqueta: 'Carbos', valor: 70, color: '#facc15'}, {etiqueta: 'Grasas', valor: 40, color: '#fb923c'}] }} colorCategoria={acento} />
      <AnalyticsMaster pack={packArana} metrics={{ categorias: [{etiqueta: 'Fuerza', valor: 80}, {etiqueta: 'Cardio', valor: 65}, {etiqueta: 'Flex', valor: 40}, {etiqueta: 'Mente', valor: 90}, {etiqueta: 'Sueño', valor: 70}] }} colorCategoria={acento} />
      <AnalyticsMaster pack={packGauge} metrics={{ score: 85 }} colorCategoria={acento} />
      <AnalyticsMaster pack={packSueno} metrics={{ semana: [8, 6.5, 4, 7, 8, 5, 8] }} colorCategoria={acento} />
    </ScrollView>
  );
}
