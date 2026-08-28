import re

# 1. Update SaludAnalisis.tsx routing
with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/salud/SaludAnalisis.tsx', 'r') as f:
    acode = f.read()

if "import { WidgetHidratacion }" not in acode:
    acode = acode.replace("import { WidgetFisico } from './widgets/WidgetFisico';", "import { WidgetFisico } from './widgets/WidgetFisico';\nimport { WidgetHidratacion } from './widgets/WidgetHidratacion';\nimport { WidgetSueno } from './widgets/WidgetSueno';")

routing_spot = "  if (senderoFiltro?.meta === 'fisico') {\n    return <WidgetFisico acento={acento} />;\n  }"
new_routing = """  if (senderoFiltro?.meta === 'fisico') return <WidgetFisico acento={acento} />;
  if (senderoFiltro?.meta === 'hidratacion') return <WidgetHidratacion acento={acento} />;
  if (senderoFiltro?.meta === 'sueno') return <WidgetSueno acento={acento} />;"""
acode = acode.replace(routing_spot, new_routing)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/salud/SaludAnalisis.tsx', 'w') as f:
    f.write(acode)

# 2. Update AnalisisSenderos.tsx mock data to include Hidratacion
with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/AnalisisSenderos.tsx', 'r') as f:
    scode = f.read()

old_salud_mock = "{ etiqueta: '10 min', progreso: 54, titulo: 'Meditacion diaria', meta: 'sueno' }"
new_salud_mock = "{ etiqueta: '3 Litros', progreso: 90, titulo: 'Tomar Agua', meta: 'hidratacion' }"
scode = scode.replace(old_salud_mock, new_salud_mock)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/AnalisisSenderos.tsx', 'w') as f:
    f.write(scode)

