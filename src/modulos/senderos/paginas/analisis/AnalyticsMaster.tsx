import React from 'react';
import { View } from 'react-native';
import { ContentPack, UserMetric } from './arquitectura/tipos_sdui';
import { WIDGET_REGISTRY } from './arquitectura/registroWidgets';
import { MotorCilindro } from './motores/MotorCilindro';
import { MotorLineaTendencia } from './motores/MotorLineaTendencia';
import { MotorSemaforoBarras } from './motores/MotorSemaforoBarras';
import { MotorHeatmap } from './motores/MotorHeatmap';
import { MotorAnillo } from './motores/MotorAnillo';
import { MotorRelojRadar } from './motores/MotorRelojRadar';
import { MotorBarras } from './motores/MotorBarras';
import { MotorDonaSegmentada } from './motores/MotorDonaSegmentada';
import { MotorArana } from './motores/MotorArana';
import { MotorVelocimetro } from './motores/MotorVelocimetro';

// Temporalmente inyectamos manualmente para el mockup
WIDGET_REGISTRY['progress-cylinder'] = MotorCilindro;
WIDGET_REGISTRY['trend-line'] = MotorLineaTendencia;
WIDGET_REGISTRY['traffic-light'] = MotorSemaforoBarras;
WIDGET_REGISTRY['consistency-grid'] = MotorHeatmap;
WIDGET_REGISTRY['progress-ring'] = MotorAnillo;
WIDGET_REGISTRY['radar-clock'] = MotorRelojRadar;
WIDGET_REGISTRY['bar-chart'] = MotorBarras;
WIDGET_REGISTRY['segmented-donut'] = MotorDonaSegmentada;
WIDGET_REGISTRY['spider-web'] = MotorArana;
WIDGET_REGISTRY['speedometer'] = MotorVelocimetro;

interface Props {
  pack: ContentPack;
  metrics: any; // Mock format for now
  colorCategoria: string;
}

export function AnalyticsMaster({ pack, metrics, colorCategoria }: Props) {
  const MotorVisual = WIDGET_REGISTRY[pack.widget_id];
  if (!MotorVisual) return null;

  const acentoFinal = pack.color_override || colorCategoria;

  return (
    <View style={{ marginBottom: 12 }}>
      <MotorVisual pack={pack} data={metrics} acento={acentoFinal} />
    </View>
  );
}
