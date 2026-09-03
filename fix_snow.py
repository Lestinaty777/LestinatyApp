import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'r') as f:
    content = f.read()

content = content.replace("{categoriaId === 'rutinas' ? <NieveRutinasSkia alto={altoContenido} ancho={anchoEscena} /> : null}", "{/* Snow removed to prevent canvaskit error */}")
content = content.replace("import { NieveRutinasSkia } from './NieveRutinasSkia';", "")

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'w') as f:
    f.write(content)

