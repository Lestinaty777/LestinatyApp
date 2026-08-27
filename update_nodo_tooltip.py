import re

# 1. Update Nodo.tsx
with open('/home/arch-i7/Proyects/app/src/diseno/componentes/Nodo.tsx', 'r') as f:
    nodo_code = f.read()

# Add new props
nodo_code = nodo_code.replace('variacion?: number;', 'variacion?: number;\n  isSelected?: boolean;\n  tituloTooltip?: string;\n  descripcionTooltip?: string;')

old_nodo_destructure = """export function Nodo({
  Icono,
  masterColor,
  onPress,
  size = 60,
  variacion = 0,
}: NodoProps) {"""

new_nodo_destructure = """import { Texto, colores } from '../index'; // Needed for Text in tooltip

export function Nodo({
  Icono,
  masterColor,
  onPress,
  size = 60,
  variacion = 0,
  isSelected = false,
  tituloTooltip = 'Misión',
  descripcionTooltip = 'Haz clic aquí para comenzar esta etapa del recorrido.',
}: NodoProps) {"""

nodo_code = nodo_code.replace(old_nodo_destructure, new_nodo_destructure)

old_return = """  return (
    <Pressable
      onPressIn={() => {
        isPressed.value = 1;
        hapticSeguro();
      }}
      onPressOut={() => {
        isPressed.value = 0;
      }}
      onPress={onPress}
      style={[styles.contenedor, { width: size, height: size + desplazamientoY }]}
    >
      {/* SOMBRA / BASE 3D (Estatica en el fondo, desplazada hacia abajo) */}
      <View style={[styles.capaAbsoluta, { top: desplazamientoY }]}>
        <Svg width={size} height={(size * 23) / 24} viewBox="0 0 24 23" fill="none">
          <Path d={PATH_BASE} fill={colorSombra} />
        </Svg>
      </View>

      {/* CARA SUPERIOR ANIMADA */}
      <Animated.View style={[styles.capaAbsoluta, caraSuperiorStyle]}>
        <Svg width={size} height={(size * 23) / 24} viewBox="0 0 24 23" fill="none">
          {/* Fondo de la cara */}
          <Path d={PATH_BASE} fill={colorFinal} />
          {/* Brillo de cristal */}
          <Path d={PATH_BRILLO} fill="#FFFFFF" fillOpacity="0.4" />
        </Svg>
        
        {/* Icono centrado */}
        <View style={styles.iconoCentrado}>
          <Icono color="#FFFFFF" size={size * 0.4} strokeWidth={2.5} />
        </View>
      </Animated.View>
    </Pressable>
  );"""

new_return = """  return (
    <View style={[styles.wrapperGlobal, { zIndex: isSelected ? 100 : 1, width: size, height: size + desplazamientoY }]}>
      
      {isSelected && (
        <View style={styles.tooltipPosicionador}>
          <View style={styles.tooltipCaja}>
            <Texto style={styles.tooltipTitulo}>{tituloTooltip}</Texto>
            <Texto style={styles.tooltipDesc}>{descripcionTooltip}</Texto>
            <Pressable 
              style={({ pressed }) => [styles.tooltipBoton, { backgroundColor: masterColor, opacity: pressed ? 0.8 : 1 }]} 
              onPress={() => hapticSeguro()}
            >
              <Texto style={styles.tooltipBotonTexto}>EMPEZAR</Texto>
            </Pressable>
          </View>
          <View style={styles.tooltipFlechaWrapper}>
            <View style={styles.tooltipFlecha} />
          </View>
        </View>
      )}

      <Pressable
        onPressIn={() => {
          isPressed.value = 1;
          hapticSeguro();
        }}
        onPressOut={() => {
          isPressed.value = 0;
        }}
        onPress={onPress}
        style={styles.contenedorAbsoluto}
      >
        {/* SOMBRA / BASE 3D (Estatica en el fondo, desplazada hacia abajo) */}
        <View style={[styles.capaAbsoluta, { top: desplazamientoY }]}>
          <Svg width={size} height={(size * 23) / 24} viewBox="0 0 24 23" fill="none">
            <Path d={PATH_BASE} fill={colorSombra} />
          </Svg>
        </View>

        {/* CARA SUPERIOR ANIMADA */}
        <Animated.View style={[styles.capaAbsoluta, caraSuperiorStyle]}>
          <Svg width={size} height={(size * 23) / 24} viewBox="0 0 24 23" fill="none">
            {/* Fondo de la cara */}
            <Path d={PATH_BASE} fill={colorFinal} />
            {/* Brillo de cristal */}
            <Path d={PATH_BRILLO} fill="#FFFFFF" fillOpacity="0.4" />
          </Svg>
          
          {/* Icono centrado */}
          <View style={styles.iconoCentrado}>
            <Icono color="#FFFFFF" size={size * 0.4} strokeWidth={2.5} />
          </View>
        </Animated.View>
      </Pressable>
    </View>
  );"""

nodo_code = nodo_code.replace(old_return, new_return)

new_styles = """
  wrapperGlobal: {
    position: 'relative',
    alignItems: 'center',
  },
  contenedorAbsoluto: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  tooltipPosicionador: {
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
    backgroundColor: '#FFFFFF',
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
  },
  tooltipTitulo: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 16,
    color: colores.texto,
    marginBottom: 4,
  },
  tooltipDesc: {
    fontFamily: 'MontserratAlternates-SemiBold',
    fontSize: 11,
    color: colores.textoSecundario,
    textAlign: 'center',
    marginBottom: 14,
  },
  tooltipBoton: {
    paddingHorizontal: 26,
    paddingVertical: 10,
    borderRadius: 999,
    width: '100%',
    alignItems: 'center',
  },
  tooltipBotonTexto: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },"""

nodo_code = nodo_code.replace('contenedor:', new_styles + '\n  contenedor:')

with open('/home/arch-i7/Proyects/app/src/diseno/componentes/Nodo.tsx', 'w') as f:
    f.write(nodo_code)


# 2. Update MapaCompartido.tsx
with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/MapaCompartido.tsx', 'r') as f:
    mapa_code = f.read()

# Pass isSelected and tituloTooltip to Nodo
old_nodo_mapa = """                <Nodo 
                  Icono={nodo.tipo === 'meta' ? Flame : Compass}
                  masterColor={masterColor}
                  variacion={variacion}
                  size={70}
                  onPress={() => setNodoSeleccionado(nodo.id === nodoSeleccionado ? null : nodo.id)}
                />"""

new_nodo_mapa = """                <Nodo 
                  Icono={nodo.tipo === 'meta' ? Flame : Compass}
                  masterColor={masterColor}
                  variacion={variacion}
                  size={70}
                  isSelected={nodoSeleccionado === nodo.id}
                  tituloTooltip={`Misión ${nodo.nivel + 1}`}
                  onPress={() => setNodoSeleccionado(nodo.id === nodoSeleccionado ? null : nodo.id)}
                />"""

mapa_code = mapa_code.replace(old_nodo_mapa, new_nodo_mapa)

# Remove the old global tooltip
# It starts with {/* TOOLTIP / POPOVER DEL NODO SELECCIONADO */} and ends with 
#           </Animated.View>
#          )}
# We can just regex replace it or use string splitting
old_tooltip_block = """          {/* TOOLTIP / POPOVER DEL NODO SELECCIONADO */}
          {nodoSeleccionado && coordsDict[nodoSeleccionado] && (
            <Animated.View 
              style={[
                styles.tooltipWrapper, 
                { 
                  left: coordsDict[nodoSeleccionado].x - 100, // centrar (width 200)
                  top: coordsDict[nodoSeleccionado].y - 120, // arriba del nodo
                }
              ]}
            >
              <View style={styles.tooltipCaja}>
                <Texto style={styles.tooltipTitulo}>Misión {nodoSeleccionado}</Texto>
                <Texto style={styles.tooltipDesc}>Haz clic aquí para comenzar esta etapa del recorrido.</Texto>
                <Pressable style={[styles.tooltipBoton, { backgroundColor: masterColor }]} onPress={() => hapticSeguro()}>
                  <Texto style={styles.tooltipBotonTexto}>EMPEZAR</Texto>
                </Pressable>
              </View>
              {/* Triangulito (flecha hacia abajo) */}
              <View style={styles.tooltipFlecha} />
            </Animated.View>
          )}"""

mapa_code = mapa_code.replace(old_tooltip_block, '')

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/MapaCompartido.tsx', 'w') as f:
    f.write(mapa_code)

