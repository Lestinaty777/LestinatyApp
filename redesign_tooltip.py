import re

with open('/home/arch-i7/Proyects/app/src/diseno/componentes/Nodo.tsx', 'r') as f:
    content = f.read()

# 1. Replace RecuadroGlass with a normal View in the Tooltip
old_tooltip = """        <View style={styles.tooltipPosicionador}>
          <RecuadroGlass style={styles.tooltipCaja}>
            <Texto style={styles.tooltipTitulo}>{tituloTooltip}</Texto>
            <Texto style={styles.tooltipDesc}>{descripcionTooltip}</Texto>
            
            {progresoTooltip !== undefined && (
               <View style={{ width: '100%', marginBottom: 12 }}>
                 <BarraProgresoLiquida porcentaje={progresoTooltip} color={masterColor} />
               </View>
            )}

            <Pressable 
              style={({ pressed }) => [styles.tooltipBoton, { backgroundColor: masterColor, opacity: pressed ? 0.8 : 1 }]} 
              onPress={() => hapticSeguro()}
            >
              <Texto style={styles.tooltipBotonTexto}>
                {estado === 'completado' ? 'REVISAR' : estado === 'desactivado' ? 'BLOQUEADO' : 'EMPEZAR'}
              </Texto>
            </Pressable>
          </RecuadroGlass>
          <View style={styles.tooltipFlechaWrapper}>
            <View style={[styles.tooltipFlecha, { backgroundColor: 'rgba(255,255,255,0.7)' }]} />
          </View>
        </View>"""

new_tooltip = """        <View style={styles.tooltipPosicionador}>
          <View style={styles.tooltipCaja}>
            <Texto style={styles.tooltipTitulo}>{tituloTooltip}</Texto>
            <Texto style={styles.tooltipDesc}>{descripcionTooltip}</Texto>
            
            {progresoTooltip !== undefined && (
               <View style={{ width: '100%', marginBottom: 16, paddingHorizontal: 4 }}>
                 <BarraProgresoLiquida porcentaje={progresoTooltip} color={masterColor} />
               </View>
            )}

            <Pressable 
              style={({ pressed }) => [styles.tooltipBoton, { backgroundColor: masterColor, opacity: pressed ? 0.8 : 1 }]} 
              onPress={() => hapticSeguro()}
            >
              <Texto style={styles.tooltipBotonTexto}>
                {estado === 'completado' ? 'REVISAR' : estado === 'desactivado' ? 'BLOQUEADO' : 'EMPEZAR'}
              </Texto>
            </Pressable>
          </View>
          <View style={styles.tooltipFlecha} />
        </View>"""

content = content.replace(old_tooltip, new_tooltip)

# 2. Update styles to create a seamless solid white bubble
old_styles = """  tooltipPosicionador: {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    transform: [{ translateX: '-50%' }], // Forzar centrado absoluto usando strings
    alignItems: 'center',
    marginBottom: 8,
    width: 220,
    zIndex: 200,
  },
  tooltipCaja: {
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    zIndex: 2,
  },
  tooltipFlechaWrapper: {
    width: 20,
    height: 10,
    overflow: 'hidden',
    alignItems: 'center',
    marginTop: -2,
    zIndex: 1,
  },
  tooltipFlecha: {
    width: 16,
    height: 16,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
    marginTop: -8, // Mueve el centro del cuadrado hacia arriba
  },"""

new_styles = """  tooltipPosicionador: {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    transform: [{ translateX: '-50%' }],
    alignItems: 'center',
    marginBottom: 14, // Espacio desde el nodo
    width: 240, // Un poco mas ancho para respirar
    zIndex: 200,
    // La sombra va en el contenedor padre para que abrace la caja y la flecha unificadamente
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  tooltipCaja: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    width: '100%',
    zIndex: 2,
  },
  tooltipFlechaWrapper: { // Ya no lo usamos
  },
  tooltipFlecha: {
    width: 20,
    height: 20,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
    marginTop: -10, // Mitad de su tamaño para que se fusione perfectamente con la caja
    zIndex: 1,
  },"""

content = content.replace(old_styles, new_styles)

with open('/home/arch-i7/Proyects/app/src/diseno/componentes/Nodo.tsx', 'w') as f:
    f.write(content)

