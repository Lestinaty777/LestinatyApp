import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/rutinas/RutinasAnalisis.tsx', 'r') as f:
    rcode = f.read()

# Add useState import
rcode = rcode.replace("import React from 'react';", "import React, { useState } from 'react';\nimport { EstadoWidgetAccion } from '../../../../motor/sdui/tipos';")

# Add state hook inside RutinasAnalisis
state_hook = """  const [estados, setEstados] = useState<Record<string, EstadoWidgetAccion>>({});

  const manejarEvento = (evento: EventoWidgetAccion) => {
    console.log('Evento de Widget disparado:', evento);
    if (evento.tipo === 'completado') {
      setEstados(prev => ({ ...prev, [evento.widgetId]: 'completado' }));
    }
  };
"""
rcode = re.sub(r'  const manejarEvento = .*?};\n', state_hook, rcode, flags=re.DOTALL)

# Replace hardcoded estado="activo" with dynamic estado
rcode = rcode.replace('estado="activo" color={acento} onEvento={manejarEvento}', 'estado={estados.contador || "activo"} color={acento} onEvento={manejarEvento}')
rcode = rcode.replace('estado={estados.contador || "activo"} color={acento} onEvento={manejarEvento}', 'estado={estados[mockContador.id] || "activo"} color={acento} onEvento={manejarEvento}', 1)
rcode = rcode.replace('estado="activo" color={acento} onEvento={manejarEvento}', 'estado={estados[mockCronometro.id] || "activo"} color={acento} onEvento={manejarEvento}', 1)
rcode = rcode.replace('estado="activo" color={acento} onEvento={manejarEvento}', 'estado={estados[mockRegistro.id] || "activo"} color={acento} onEvento={manejarEvento}', 1)
rcode = rcode.replace('estado="activo" color={acento} onEvento={manejarEvento}', 'estado={estados[mockChecklist.id] || "activo"} color={acento} onEvento={manejarEvento}', 1)
rcode = rcode.replace('estado="activo" color={acento} onEvento={manejarEvento}', 'estado={estados[mockEscala.id] || "activo"} color={acento} onEvento={manejarEvento}', 1)
rcode = rcode.replace('estado="activo" color={acento} onEvento={manejarEvento}', 'estado={estados[mockDecision.id] || "activo"} color={acento} onEvento={manejarEvento}', 1)
rcode = rcode.replace('estado="activo" color={acento} onEvento={manejarEvento}', 'estado={estados[mockKanban.id] || "activo"} color={acento} onEvento={manejarEvento}', 1)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/rutinas/RutinasAnalisis.tsx', 'w') as f:
    f.write(rcode)
