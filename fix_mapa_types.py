import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'r') as f:
    content = f.read()

old_jsx = """             <>
               <Image source={assetBase.fuente} style={{ position: 'absolute', top: 10, left: -100, width: 200, height: 200, opacity: 0.9, resizeMode: 'contain' }} pointerEvents="none" />
               <Image source={assetBase.fuente} style={{ position: 'absolute', top: 180, right: -100, width: 220, height: 220, opacity: 0.9, resizeMode: 'contain', transform: [{ scaleX: -1 }] }} pointerEvents="none" />
               <Image source={assetBase.fuente} style={{ position: 'absolute', top: 400, left: -120, width: 240, height: 240, opacity: 0.9, resizeMode: 'contain' }} pointerEvents="none" />
               <Image source={assetBase.fuente} style={{ position: 'absolute', top: 650, right: -120, width: 220, height: 220, opacity: 0.9, resizeMode: 'contain', transform: [{ scaleX: -1 }] }} pointerEvents="none" />
               <Image source={assetBase.fuente} style={{ position: 'absolute', top: 850, left: -100, width: 200, height: 200, opacity: 0.9, resizeMode: 'contain' }} pointerEvents="none" />
             </>"""

new_jsx = """             <View pointerEvents="none" style={StyleSheet.absoluteFill}>
               <Image source={assetBase.fuente} style={{ position: 'absolute', top: 10, left: -100, width: 200, height: 200, opacity: 0.9, resizeMode: 'contain' }} />
               <Image source={assetBase.fuente} style={{ position: 'absolute', top: 180, right: -100, width: 220, height: 220, opacity: 0.9, resizeMode: 'contain', transform: [{ scaleX: -1 }] }} />
               <Image source={assetBase.fuente} style={{ position: 'absolute', top: 400, left: -120, width: 240, height: 240, opacity: 0.9, resizeMode: 'contain' }} />
               <Image source={assetBase.fuente} style={{ position: 'absolute', top: 650, right: -120, width: 220, height: 220, opacity: 0.9, resizeMode: 'contain', transform: [{ scaleX: -1 }] }} />
               <Image source={assetBase.fuente} style={{ position: 'absolute', top: 850, left: -100, width: 200, height: 200, opacity: 0.9, resizeMode: 'contain' }} />
             </View>"""

content = content.replace(old_jsx, new_jsx)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'w') as f:
    f.write(content)
