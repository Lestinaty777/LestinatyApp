import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'r') as f:
    content = f.read()

old_jsx = """      <TouchableWithoutFeedback onPress={() => setSeleccionado('')}>
      <View style={[styles.escenaPerspectiva, { height: altoContenido, width: anchoEscena }]}>
        
        {/* Bases Isométricas decorativas a los lados */}
        {(() => {
           const assetBase = obtenerAssetBioma(categoriaId, 'base');
           if (!assetBase) return null;
           return (
             <View pointerEvents="none" style={StyleSheet.absoluteFill}>
               {/* Bases grandes en la parte superior, detrás de la tarjeta */}
               <Image source={assetBase.fuente} style={{ position: 'absolute', top: -240, left: -50, width: 280, height: 280, opacity: 0.9, resizeMode: 'contain' }} />
               <Image source={assetBase.fuente} style={{ position: 'absolute', top: -210, right: -80, width: 320, height: 320, opacity: 0.9, resizeMode: 'contain', transform: [{ scaleX: -1 }] }} />
               
               {/* Bases laterales controladas */}
               <Image source={assetBase.fuente} style={{ position: 'absolute', top: 90, left: -100, width: 200, height: 200, opacity: 0.9, resizeMode: 'contain' }} />
               <Image source={assetBase.fuente} style={{ position: 'absolute', top: 220, right: -100, width: 220, height: 220, opacity: 0.9, resizeMode: 'contain', transform: [{ scaleX: -1 }] }} />
               <Image source={assetBase.fuente} style={{ position: 'absolute', top: 400, left: -120, width: 240, height: 240, opacity: 0.9, resizeMode: 'contain' }} />
               <Image source={assetBase.fuente} style={{ position: 'absolute', top: 650, right: -120, width: 220, height: 220, opacity: 0.9, resizeMode: 'contain', transform: [{ scaleX: -1 }] }} />
               <Image source={assetBase.fuente} style={{ position: 'absolute', top: 850, left: -100, width: 200, height: 200, opacity: 0.9, resizeMode: 'contain' }} />
             </View>
           );
        })()}

        {mapa.hojas.map((hojas, indice) => {"""

new_jsx = """      <TouchableWithoutFeedback onPress={() => setSeleccionado('')}>
      <View style={{ height: altoContenido, width: anchoEscena }}>
        
        {/* Bases Isométricas decorativas a los lados (FUERA de la perspectiva 3D para evitar aplastamiento) */}
        {(() => {
           const assetBase = obtenerAssetBioma(categoriaId, 'base');
           if (!assetBase) return null;
           return (
             <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 0 }]}>
               {/* Bases grandes en la parte superior, más separadas */}
               <Image source={assetBase.fuente} style={{ position: 'absolute', top: -220, left: -140, width: 320, height: 320, opacity: 0.9, resizeMode: 'contain' }} />
               <Image source={assetBase.fuente} style={{ position: 'absolute', top: -190, right: -170, width: 360, height: 360, opacity: 0.9, resizeMode: 'contain', transform: [{ scaleX: -1 }] }} />
               
               {/* Bases laterales controladas */}
               <Image source={assetBase.fuente} style={{ position: 'absolute', top: 90, left: -100, width: 200, height: 200, opacity: 0.9, resizeMode: 'contain' }} />
               <Image source={assetBase.fuente} style={{ position: 'absolute', top: 220, right: -100, width: 220, height: 220, opacity: 0.9, resizeMode: 'contain', transform: [{ scaleX: -1 }] }} />
               <Image source={assetBase.fuente} style={{ position: 'absolute', top: 400, left: -120, width: 240, height: 240, opacity: 0.9, resizeMode: 'contain' }} />
               <Image source={assetBase.fuente} style={{ position: 'absolute', top: 650, right: -120, width: 220, height: 220, opacity: 0.9, resizeMode: 'contain', transform: [{ scaleX: -1 }] }} />
               <Image source={assetBase.fuente} style={{ position: 'absolute', top: 850, left: -100, width: 200, height: 200, opacity: 0.9, resizeMode: 'contain' }} />
             </View>
           );
        })()}

        <View style={[styles.escenaPerspectiva, StyleSheet.absoluteFill, { zIndex: 1 }]}>
        {mapa.hojas.map((hojas, indice) => {"""

content = content.replace(old_jsx, new_jsx)

# Find closing tags to match the new View wrapper
old_end = """        {mapa.nodos.map((nodo, indice) => {
          if (categoriaId !== 'rutinas' && !hojasVisiblesPorNodo[indice]) return null;
          return (
            <NodoMapaSendero
              key={nodo.id}
              color={temaMapa.acento}
              enfocado={enfocado}
              estado={indice === 0 ? 'actual' : 'bloqueado'}
              icono={nodo.icono as any}
              nodo={nodo}
              seleccionado={seleccionado === nodo.id}
              onSeleccionar={() => seleccionarNodo(nodo.id, indice)}
            />
          );
        })}
      </View>
      </TouchableWithoutFeedback>
    </ScrollView>
  );
}"""

new_end = """        {mapa.nodos.map((nodo, indice) => {
          if (categoriaId !== 'rutinas' && !hojasVisiblesPorNodo[indice]) return null;
          return (
            <NodoMapaSendero
              key={nodo.id}
              color={temaMapa.acento}
              enfocado={enfocado}
              estado={indice === 0 ? 'actual' : 'bloqueado'}
              icono={nodo.icono as any}
              nodo={nodo}
              seleccionado={seleccionado === nodo.id}
              onSeleccionar={() => seleccionarNodo(nodo.id, indice)}
            />
          );
        })}
        </View>
      </View>
      </TouchableWithoutFeedback>
    </ScrollView>
  );
}"""

content = content.replace(old_end, new_end)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'w') as f:
    f.write(content)
