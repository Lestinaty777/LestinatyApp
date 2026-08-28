import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/arquitectura/tipos_sdui.ts', 'r') as f:
    tcode = f.read()

if "'bar-chart'" not in tcode:
    tcode = tcode.replace("| 'radar-clock';", "| 'radar-clock'\n  | 'bar-chart'\n  | 'segmented-donut';")
    with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/arquitectura/tipos_sdui.ts', 'w') as f:
        f.write(tcode)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/arquitectura/registroWidgets.ts', 'r') as f:
    rcode = f.read()
if "'bar-chart'" not in rcode:
    rcode = rcode.replace("'radar-clock': null", "'radar-clock': null,\n  'bar-chart': null,\n  'segmented-donut': null")
    with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/arquitectura/registroWidgets.ts', 'w') as f:
        f.write(rcode)


with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/AnalyticsMaster.tsx', 'r') as f:
    acode = f.read()

if "import { MotorBarras }" not in acode:
    acode = acode.replace("import { MotorRelojRadar } from './motores/MotorRelojRadar';", "import { MotorRelojRadar } from './motores/MotorRelojRadar';\nimport { MotorBarras } from './motores/MotorBarras';\nimport { MotorDonaSegmentada } from './motores/MotorDonaSegmentada';")
    acode = acode.replace("WIDGET_REGISTRY['radar-clock'] = MotorRelojRadar;", "WIDGET_REGISTRY['radar-clock'] = MotorRelojRadar;\nWIDGET_REGISTRY['bar-chart'] = MotorBarras;\nWIDGET_REGISTRY['segmented-donut'] = MotorDonaSegmentada;")

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/AnalyticsMaster.tsx', 'w') as f:
    f.write(acode)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/salud/SaludAnalisis.tsx', 'r') as f:
    scode = f.read()

new_packs = """
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
  value_label: '', unit: 'g', icon: 'pie-chart', color_override: '#34d399', 
  microcopy: { onTrack: 'Buena carga de proteína 💪', behind: '', done: '' }
};
"""

if "packBarras" not in scode:
    scode = scode.replace("// --------------------------", new_packs + "\n// --------------------------")
    scode = scode.replace("<AnalyticsMaster pack={packSueno}", "<AnalyticsMaster pack={packBarras} metrics={{ barras: [{etiqueta: 'L', valor: 4.2}, {etiqueta: 'M', valor: 3.8}, {etiqueta: 'M', valor: 5.1}, {etiqueta: 'J', valor: 2.9}] }} colorCategoria={acento} />\n      <AnalyticsMaster pack={packDona} metrics={{ total: 200, segmentos: [{etiqueta: 'Proteína', valor: 90, color: '#34d399'}, {etiqueta: 'Carbos', valor: 70, color: '#facc15'}, {etiqueta: 'Grasas', valor: 40, color: '#fb923c'}] }} colorCategoria={acento} />\n      <AnalyticsMaster pack={packSueno}")

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/salud/SaludAnalisis.tsx', 'w') as f:
    f.write(scode)

