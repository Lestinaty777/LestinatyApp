import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/AnalyticsMaster.tsx', 'r') as f:
    acode = f.read()

if "import { MotorHeatmap }" not in acode:
    acode = acode.replace("import { MotorSemaforoBarras } from './motores/MotorSemaforoBarras';", "import { MotorSemaforoBarras } from './motores/MotorSemaforoBarras';\nimport { MotorHeatmap } from './motores/MotorHeatmap';\nimport { MotorAnillo } from './motores/MotorAnillo';")
    acode = acode.replace("WIDGET_REGISTRY['traffic-light'] = MotorSemaforoBarras;", "WIDGET_REGISTRY['traffic-light'] = MotorSemaforoBarras;\nWIDGET_REGISTRY['consistency-grid'] = MotorHeatmap;\nWIDGET_REGISTRY['progress-ring'] = MotorAnillo;")

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/AnalyticsMaster.tsx', 'w') as f:
    f.write(acode)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/salud/SaludAnalisis.tsx', 'r') as f:
    scode = f.read()

new_packs = """
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
"""

if "packHeatmap" not in scode:
    scode = scode.replace("// --------------------------", new_packs + "\n// --------------------------")
    scode = scode.replace("<AnalyticsMaster pack={packSueno}", "<AnalyticsMaster pack={packHeatmap} metrics={{ matriz: [0,0,1,3,4,0,0, 1,2,4,4,3,1,0, 0,1,1,2,4,4,3, 0,0,1,2,3,4,4] }} colorCategoria={acento} />\n      <AnalyticsMaster pack={packAnillo} metrics={{ actual: 450, meta: 600 }} colorCategoria={acento} />\n      <AnalyticsMaster pack={packSueno}")

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/salud/SaludAnalisis.tsx', 'w') as f:
    f.write(scode)

