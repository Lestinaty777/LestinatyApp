import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'r') as f:
    content = f.read()

old_jsx = """             <View pointerEvents="none" style={StyleSheet.absoluteFill}>
               <Image source={assetBase.fuente} style={{ position: 'absolute', top: 10, left: -100, width: 200, height: 200, opacity: 0.9, resizeMode: 'contain' }} />
               <Image source={assetBase.fuente} style={{ position: 'absolute', top: 180, right: -100, width: 220, height: 220, opacity: 0.9, resizeMode: 'contain', transform: [{ scaleX: -1 }] }} />"""

new_jsx = """             <View pointerEvents="none" style={StyleSheet.absoluteFill}>
               {/* Bases grandes en la parte superior, detrás de la tarjeta */}
               <Image source={assetBase.fuente} style={{ position: 'absolute', top: -150, left: -50, width: 280, height: 280, opacity: 0.9, resizeMode: 'contain' }} />
               <Image source={assetBase.fuente} style={{ position: 'absolute', top: -120, right: -80, width: 320, height: 320, opacity: 0.9, resizeMode: 'contain', transform: [{ scaleX: -1 }] }} />
               
               {/* Bases laterales controladas */}
               <Image source={assetBase.fuente} style={{ position: 'absolute', top: 90, left: -100, width: 200, height: 200, opacity: 0.9, resizeMode: 'contain' }} />
               <Image source={assetBase.fuente} style={{ position: 'absolute', top: 220, right: -100, width: 220, height: 220, opacity: 0.9, resizeMode: 'contain', transform: [{ scaleX: -1 }] }} />"""

content = content.replace(old_jsx, new_jsx)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'w') as f:
    f.write(content)
