import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/motor/sdui/RenderizadorAccion.tsx', 'r') as f:
    rcode = f.read()

if "CapaCompletado" not in rcode:
    rcode = rcode.replace("import { Text, View } from 'react-native';", "import { Text, View } from 'react-native';\nimport { CapaCompletado } from './widgets/CapaCompletado';")
    
    # We wrap <Definicion.Componente> inside a View and add CapaCompletado
    viejo_return = "<Definicion.Componente\n        color={color}\n        config={widget.config}\n        estado={estado}\n        onEvento={onEvento}\n      />"
    nuevo_return = """<View style={{ position: 'relative' }}>
      <Definicion.Componente
        color={color}
        config={widget.config}
        estado={estado}
        onEvento={onEvento}
      />
      <CapaCompletado color={color} activo={estado === 'completado'} />
    </View>"""
    
    rcode = rcode.replace(viejo_return, nuevo_return)
    
    with open('/home/arch-i7/Proyects/app/src/modulos/senderos/motor/sdui/RenderizadorAccion.tsx', 'w') as f:
        f.write(rcode)

