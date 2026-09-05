import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'r') as f:
    content = f.read()

# Add the base image asset import
content = content.replace("import { obtenerAssetBioma } from '../../algoritmo/registroBiomas';", "import { obtenerAssetBioma, registroBiomas } from '../../algoritmo/registroBiomas';")

# Add the base image to the JSX
old_jsx = """      <View style={[styles.escenaPerspectiva, { height: altoContenido, width: anchoEscena }]}>
        {mapa.hojas.map((hojas, indice) => {"""

new_jsx = """      <View style={[styles.escenaPerspectiva, { height: altoContenido, width: anchoEscena }]}>
        
        {/* Bases Isométricas decorativas a los lados */}
        {(() => {
           const assetBase = obtenerAssetBioma(categoriaId, 'base');
           if (!assetBase) return null;
           return (
             <>
               <Image source={assetBase.fuente} style={{ position: 'absolute', top: 50, left: -160, width: 400, height: 400, opacity: 0.8, resizeMode: 'contain' }} pointerEvents="none" />
               <Image source={assetBase.fuente} style={{ position: 'absolute', top: 250, right: -160, width: 400, height: 400, opacity: 0.8, resizeMode: 'contain', transform: [{ scaleX: -1 }] }} pointerEvents="none" />
               <Image source={assetBase.fuente} style={{ position: 'absolute', top: 500, left: -180, width: 400, height: 400, opacity: 0.8, resizeMode: 'contain' }} pointerEvents="none" />
               <Image source={assetBase.fuente} style={{ position: 'absolute', top: 750, right: -180, width: 400, height: 400, opacity: 0.8, resizeMode: 'contain', transform: [{ scaleX: -1 }] }} pointerEvents="none" />
             </>
           );
        })()}

        {mapa.hojas.map((hojas, indice) => {"""

content = content.replace(old_jsx, new_jsx)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'w') as f:
    f.write(content)
