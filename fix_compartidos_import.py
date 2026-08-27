with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/CompartidosSenderos.tsx', 'r') as f:
    content = f.read()

if 'BarraProgresoLiquida' not in content[:1000]: # Check top imports
    content = content.replace("import { RecuadroGlass, Texto, biomas, colores, espaciado } from '../../../diseno';", "import { RecuadroGlass, Texto, biomas, colores, espaciado } from '../../../diseno';\nimport { BarraProgresoLiquida } from '../../../diseno/componentes';")

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/CompartidosSenderos.tsx', 'w') as f:
    f.write(content)
