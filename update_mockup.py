import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/AnalyticsMaster.tsx', 'r') as f:
    acode = f.read()

if "import { MotorLineaTendencia }" not in acode:
    acode = acode.replace("import { MotorCilindro } from './motores/MotorCilindro';", "import { MotorCilindro } from './motores/MotorCilindro';\nimport { MotorLineaTendencia } from './motores/MotorLineaTendencia';\nimport { MotorSemaforoBarras } from './motores/MotorSemaforoBarras';")
    acode = acode.replace("WIDGET_REGISTRY['progress-cylinder'] = MotorCilindro;", "WIDGET_REGISTRY['progress-cylinder'] = MotorCilindro;\nWIDGET_REGISTRY['trend-line'] = MotorLineaTendencia;\nWIDGET_REGISTRY['traffic-light'] = MotorSemaforoBarras;")

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/AnalyticsMaster.tsx', 'w') as f:
    f.write(acode)


with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/salud/SaludAnalisis.tsx', 'r') as f:
    scode = f.read()

new_packs = """
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
  value_label: '', unit: '$', icon: 'trending-up', color_override: '#10b981',
  microcopy: { onTrack: '', behind: '', done: '' }
};

const packSueno: ContentPack = {
  id: 'pack-sueno-1', goal_id: 'descanso', habit_id: 'dormir-bien',
  widget_id: 'traffic-light',
  title: 'Calidad de Sueño', subtitle: 'Descanso profundo',
  value_label: '', unit: 'h', icon: 'moon', color_override: null,
  microcopy: { onTrack: '', behind: '', done: '' }
};
"""

if "packBascula" not in scode:
    scode = scode.replace("// --------------------------", new_packs + "\n// --------------------------")
    scode = scode.replace("metrics={{ hoy: 2, semana: [] }} \n        colorCategoria={acento} \n      />", "metrics={{ hoy: 2, semana: [] }} \n        colorCategoria={acento} \n      />\n\n      <AnalyticsMaster pack={packBascula} metrics={{ historico: [82.5, 81.8, 81.2, 80.5, 79.8, 79.0, 78.2], inicio: 82.5, actual: 78.2, meta: 75.0 }} colorCategoria={acento} />\n      <AnalyticsMaster pack={packFinanzas} metrics={{ historico: [1200, 1350, 1300, 1500, 1800, 1950, 2100], inicio: 1200, actual: 2100, meta: 3000 }} colorCategoria={acento} />\n      <AnalyticsMaster pack={packSueno} metrics={{ semana: [8, 6.5, 4, 7, 8, 5, 8] }} colorCategoria={acento} />")

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/salud/SaludAnalisis.tsx', 'w') as f:
    f.write(scode)

