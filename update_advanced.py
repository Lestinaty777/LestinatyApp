import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/arquitectura/tipos_sdui.ts', 'r') as f:
    tcode = f.read()

if "'spider-web'" not in tcode:
    tcode = tcode.replace("| 'segmented-donut';", "| 'segmented-donut'\n  | 'spider-web'\n  | 'speedometer';")
    with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/arquitectura/tipos_sdui.ts', 'w') as f:
        f.write(tcode)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/arquitectura/registroWidgets.ts', 'r') as f:
    rcode = f.read()
if "'spider-web'" not in rcode:
    rcode = rcode.replace("'segmented-donut': null", "'segmented-donut': null,\n  'spider-web': null,\n  'speedometer': null")
    with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/arquitectura/registroWidgets.ts', 'w') as f:
        f.write(rcode)


with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/AnalyticsMaster.tsx', 'r') as f:
    acode = f.read()

if "import { MotorArana }" not in acode:
    acode = acode.replace("import { MotorDonaSegmentada } from './motores/MotorDonaSegmentada';", "import { MotorDonaSegmentada } from './motores/MotorDonaSegmentada';\nimport { MotorArana } from './motores/MotorArana';\nimport { MotorVelocimetro } from './motores/MotorVelocimetro';")
    acode = acode.replace("WIDGET_REGISTRY['segmented-donut'] = MotorDonaSegmentada;", "WIDGET_REGISTRY['segmented-donut'] = MotorDonaSegmentada;\nWIDGET_REGISTRY['spider-web'] = MotorArana;\nWIDGET_REGISTRY['speedometer'] = MotorVelocimetro;")

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/AnalyticsMaster.tsx', 'w') as f:
    f.write(acode)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/salud/SaludAnalisis.tsx', 'r') as f:
    scode = f.read()

new_packs = """
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
"""

if "packArana" not in scode:
    scode = scode.replace("// --------------------------", new_packs + "\n// --------------------------")
    scode = scode.replace("<AnalyticsMaster pack={packSueno}", "<AnalyticsMaster pack={packArana} metrics={{ categorias: [{etiqueta: 'Fuerza', valor: 80}, {etiqueta: 'Cardio', valor: 65}, {etiqueta: 'Flex', valor: 40}, {etiqueta: 'Mente', valor: 90}, {etiqueta: 'Sueño', valor: 70}] }} colorCategoria={acento} />\n      <AnalyticsMaster pack={packGauge} metrics={{ score: 85 }} colorCategoria={acento} />\n      <AnalyticsMaster pack={packSueno}")

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/salud/SaludAnalisis.tsx', 'w') as f:
    f.write(scode)

