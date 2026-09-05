import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'r') as f:
    content = f.read()

old_jsx = """               {/* Bases grandes en la parte superior, más separadas */}
               <Image source={assetBase.fuente} style={{ position: 'absolute', top: -140, left: -90, width: 240, height: 240, opacity: 0.9, resizeMode: 'contain' }} />
               <Image source={assetBase.fuente} style={{ position: 'absolute', top: -110, right: -110, width: 260, height: 260, opacity: 0.9, resizeMode: 'contain', transform: [{ scaleX: -1 }] }} />"""

new_jsx = """               {/* Bases grandes en la parte superior, más separadas */}
               <Image source={assetBase.fuente} style={{ position: 'absolute', top: -60, left: -90, width: 240, height: 240, opacity: 0.9, resizeMode: 'contain' }} />
               <Image source={assetBase.fuente} style={{ position: 'absolute', top: -30, right: -110, width: 260, height: 260, opacity: 0.9, resizeMode: 'contain', transform: [{ scaleX: -1 }] }} />"""

content = content.replace(old_jsx, new_jsx)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'w') as f:
    f.write(content)
