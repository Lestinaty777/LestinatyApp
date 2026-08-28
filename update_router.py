import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/AnalisisSenderos.tsx', 'r') as f:
    acode = f.read()

# Add imports
if "import { SaludAnalisis }" not in acode:
    acode = acode.replace("import { RutinasAnalisis } from './analisis/rutinas/RutinasAnalisis';", "import { RutinasAnalisis } from './analisis/rutinas/RutinasAnalisis';\nimport { SaludAnalisis } from './analisis/salud/SaludAnalisis';\nimport { saludMockData } from './analisis/salud/datosMock';")

# Replace logic
old_render = """      {categoriaId === 'rutinas' ? (
        <RutinasAnalisis datos={rutinasMockData} acento={categoria.acento} itemsCargados={itemsCargados} senderoFiltro={senderoFiltro} />
      ) : ("""
new_render = """      {categoriaId === 'rutinas' ? (
        <RutinasAnalisis datos={rutinasMockData} acento={categoria.acento} itemsCargados={itemsCargados} senderoFiltro={senderoFiltro} />
      ) : categoriaId === 'salud' ? (
        <SaludAnalisis datos={saludMockData} acento={categoria.acento} itemsCargados={itemsCargados} senderoFiltro={senderoFiltro} />
      ) : ("""
acode = acode.replace(old_render, new_render)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/AnalisisSenderos.tsx', 'w') as f:
    f.write(acode)

