import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/salud/SaludAnalisis.tsx', 'r') as f:
    acode = f.read()

# 1. Add WidgetFisico import
if "import { WidgetFisico }" not in acode:
    acode = acode.replace("import { SaludEstadisticas } from './tipos';", "import { SaludEstadisticas } from './tipos';\nimport { WidgetFisico } from './widgets/WidgetFisico';")

# 2. Add routing logic for 'fisico'
routing_spot = "  // VISTA INDIVIDUAL (Micro: Deltas y Macros)"
new_routing = """  if (senderoFiltro?.meta === 'fisico') {
    return <WidgetFisico acento={acento} />;
  }

  // VISTA INDIVIDUAL (Fallback or specific to nutrition later)"""
acode = acode.replace(routing_spot, new_routing)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/salud/SaludAnalisis.tsx', 'w') as f:
    f.write(acode)

