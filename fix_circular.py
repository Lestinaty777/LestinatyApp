with open('/home/arch-i7/Proyects/app/src/diseno/componentes/Nodo.tsx', 'r') as f:
    content = f.read()

# Replace the problematic import
old_import = "import { Texto, colores } from '../index';"
new_import = "import { Texto } from './Texto';\nimport { colores } from '../fundamentos/colores';"

content = content.replace(old_import, new_import)

with open('/home/arch-i7/Proyects/app/src/diseno/componentes/Nodo.tsx', 'w') as f:
    f.write(content)
