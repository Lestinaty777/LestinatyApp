import re

with open('/home/arch-i7/Proyects/app/src/diseno/componentes/Nodo.tsx', 'r') as f:
    nodo_code = f.read()

old_cara_superior = """        {/* CARA SUPERIOR ANIMADA */}
        <Animated.View style={[styles.capaAbsoluta, caraSuperiorStyle]}>
          <Svg width={size} height={(size * 23) / 24} viewBox="-0.47 -1.16 24 23" fill="none">
            {/* Fondo de la cara */}
            <Path d={PATH_BASE} fill={colorFinal} />
            {/* Brillo de cristal */}
            <Path d={PATH_BRILLO} fill="#FFFFFF" fillOpacity="0.4" />
          </Svg>
          
          {/* Icono centrado absoluto */}
          <View style={styles.iconoCentrado}>
            <Icono color="#FFFFFF" size={size * 0.4} strokeWidth={2.5} />
          </View>
        </Animated.View>"""

new_cara_superior = """        {/* CARA SUPERIOR ANIMADA */}
        <Animated.View style={[styles.capaAbsoluta, caraSuperiorStyle]}>
          <View style={{ width: size, height: (size * 23) / 24 }}>
            <Svg width="100%" height="100%" viewBox="-0.47 -1.16 24 23" fill="none" style={{ position: 'absolute' }}>
              {/* Fondo de la cara */}
              <Path d={PATH_BASE} fill={colorFinal} />
              {/* Brillo de cristal */}
              <Path d={PATH_BRILLO} fill="#FFFFFF" fillOpacity="0.4" />
            </Svg>
            
            {/* Icono centrado absoluto */}
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
              <Icono color="#FFFFFF" size={size * 0.4} strokeWidth={2.5} />
            </View>
          </View>
        </Animated.View>"""

nodo_code = nodo_code.replace(old_cara_superior, new_cara_superior)

with open('/home/arch-i7/Proyects/app/src/diseno/componentes/Nodo.tsx', 'w') as f:
    f.write(nodo_code)

