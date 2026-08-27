import re

with open('/home/arch-i7/Proyects/app/src/diseno/componentes/Nodo.tsx', 'r') as f:
    content = f.read()

# 1. Update text alignment in styles
content = content.replace(
    "    color: colores.texto,\n    marginBottom: 2,\n  },",
    "    color: colores.texto,\n    marginBottom: 2,\n    alignSelf: 'flex-start',\n    textAlign: 'left',\n  },"
)
content = content.replace(
    "    color: colores.textoSecundario,\n    textAlign: 'center',\n    marginBottom: 8,\n  },",
    "    color: colores.textoSecundario,\n    textAlign: 'left',\n    alignSelf: 'flex-start',\n    marginBottom: 8,\n  },"
)

# 2. Update Button style (rectangular shape)
old_button_style = """  tooltipBoton: {
    paddingHorizontal: 26,
    paddingVertical: 8,
    borderRadius: 999,
    width: '100%',
    alignItems: 'center',
  },"""
new_button_style = """  tooltipBoton: {
    paddingHorizontal: 26,
    paddingVertical: 10,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },"""
content = content.replace(old_button_style, new_button_style)

# 3. Update the JSX Logic for Button vs Progress Bar
old_jsx_logic = """            {progresoTooltip !== undefined && (
               <View style={{ width: '100%', marginBottom: 10, paddingHorizontal: 8 }}>
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
            </Pressable>"""

new_jsx_logic = """            {estado === 'activo' && (progresoTooltip ?? 0) > 0 ? (
               <View style={{ width: '100%', marginBottom: 4, marginTop: 4 }}>
                 <BarraProgresoLiquida porcentaje={progresoTooltip} color={masterColor} />
               </View>
            ) : (
               <Pressable 
                 style={({ pressed }) => [
                   styles.tooltipBoton, 
                   { 
                     backgroundColor: colorBase, 
                     opacity: pressed ? 0.9 : 1,
                     transform: [{ scale: pressed ? 0.97 : 1 }]
                   }
                 ]} 
                 onPress={() => hapticSeguro()}
               >
                 <Texto style={styles.tooltipBotonTexto}>
                   {estado === 'completado' ? 'REVISAR' : estado === 'desactivado' ? 'BLOQUEADO' : 'EMPEZAR'}
                 </Texto>
               </Pressable>
            )}"""

content = content.replace(old_jsx_logic, new_jsx_logic)

with open('/home/arch-i7/Proyects/app/src/diseno/componentes/Nodo.tsx', 'w') as f:
    f.write(content)

