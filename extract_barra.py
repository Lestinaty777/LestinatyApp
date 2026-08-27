import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/CompartidosSenderos.tsx', 'r') as f:
    content = f.read()

# Extract Burbuja and BarraProgresoLiquida
start_burbuja = content.find('function Burbuja(')
end_barra = content.find('const Bioma = biomas.inicio;')

if start_burbuja != -1 and end_barra != -1:
    extracted_code = content[start_burbuja:end_barra]
    
    # Save to src/diseno/componentes/BarraProgresoLiquida.tsx
    barra_file_content = """import React from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

""" + extracted_code.replace('function Burbuja(', 'export function Burbuja(').replace('function BarraProgresoLiquida(', 'export function BarraProgresoLiquida(')

    with open('/home/arch-i7/Proyects/app/src/diseno/componentes/BarraProgresoLiquida.tsx', 'w') as bf:
        bf.write(barra_file_content)
    
    # Remove from CompartidosSenderos.tsx
    content = content[:start_burbuja] + content[end_barra:]
    
    # Add import to CompartidosSenderos.tsx
    # We already have import { RecuadroGlass, Texto... } from '../../../diseno';
    # And maybe BarraProgresoLiquida from diseno? Let's add it to diseno/componentes/index.ts
    
    # Let's just write CompartidosSenderos.tsx back
    with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/CompartidosSenderos.tsx', 'w') as f:
        f.write(content)

# Update diseno/componentes/index.ts
with open('/home/arch-i7/Proyects/app/src/diseno/componentes/index.ts', 'r') as f:
    index_content = f.read()

if "export * from './BarraProgresoLiquida';" not in index_content:
    index_content += "\nexport * from './BarraProgresoLiquida';\n"
    with open('/home/arch-i7/Proyects/app/src/diseno/componentes/index.ts', 'w') as f:
        f.write(index_content)
