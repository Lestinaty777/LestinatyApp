import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/arquitectura/tipos_sdui.ts', 'r') as f:
    tcode = f.read()

if "'radar-clock'" not in tcode:
    tcode = tcode.replace("| 'traffic-light';", "| 'traffic-light'\n  | 'radar-clock';")
    with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/arquitectura/tipos_sdui.ts', 'w') as f:
        f.write(tcode)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/AnalyticsMaster.tsx', 'r') as f:
    acode = f.read()

if "import { MotorRelojRadar }" not in acode:
    acode = acode.replace("import { MotorAnillo } from './motores/MotorAnillo';", "import { MotorAnillo } from './motores/MotorAnillo';\nimport { MotorRelojRadar } from './motores/MotorRelojRadar';")
    acode = acode.replace("WIDGET_REGISTRY['progress-ring'] = MotorAnillo;", "WIDGET_REGISTRY['progress-ring'] = MotorAnillo;\nWIDGET_REGISTRY['radar-clock'] = MotorRelojRadar;")

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/AnalyticsMaster.tsx', 'w') as f:
    f.write(acode)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/salud/SaludAnalisis.tsx', 'r') as f:
    scode = f.read()

new_packs = """
const packReloj: ContentPack = {
  id: 'pack-clock-1', goal_id: 'productividad', habit_id: 'trabajo-profundo',
  widget_id: 'radar-clock',
  title: 'Pico de Enfoque', subtitle: 'Tu mejor momento',
  value_label: 'Mayor eficiencia a las', unit: 'Productivo', icon: 'clock', color_override: '#8b5cf6', // Violet
  microcopy: { onTrack: 'Intenta programar reuniones fuera de esta hora 🧠', behind: '', done: '' }
};
"""

if "packReloj" not in scode:
    scode = scode.replace("// --------------------------", new_packs + "\n// --------------------------")
    scode = scode.replace("<AnalyticsMaster pack={packSueno}", "<AnalyticsMaster pack={packReloj} metrics={{ horaPico: 14 }} colorCategoria={acento} />\n      <AnalyticsMaster pack={packSueno}")

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/salud/SaludAnalisis.tsx', 'w') as f:
    f.write(scode)

