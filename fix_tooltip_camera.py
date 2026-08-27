import re

# 1. NODO.TSX: Add dynamic inversion
with open('/home/arch-i7/Proyects/app/src/diseno/componentes/Nodo.tsx', 'r') as f:
    nodo_code = f.read()

# Add invertirTooltip to props
nodo_code = nodo_code.replace("  tooltipOffset?: number;\n}", "  tooltipOffset?: number;\n  invertirTooltip?: boolean;\n}")
nodo_code = nodo_code.replace("  tooltipOffset = 0,\n}: NodoProps) {", "  tooltipOffset = 0,\n  invertirTooltip = False,\n}: NodoProps) {".replace('False', 'false'))

# Update tooltip JSX
old_tooltip_jsx = """        {/* TOOLTIP GIGANTE (Renderizado condicional) */}
        {isSelected && (
          <View style={styles.tooltipPosicionador}>
            <View style={[styles.tooltipCaja, { transform: [{ translateX: tooltipOffset }] }]}>
              
              <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center', marginBottom: 6 }}>"""

new_tooltip_jsx = """        {/* TOOLTIP GIGANTE (Renderizado condicional) */}
        {isSelected && (
          <View style={[styles.tooltipPosicionador, invertirTooltip ? { top: '100%', marginTop: 14 } : { bottom: '100%', marginBottom: 14 }]}>
            {invertirTooltip && <View style={[styles.tooltipFlecha, { marginBottom: -10, marginTop: 0 }]} />}
            
            <View style={[styles.tooltipCaja, { transform: [{ translateX: tooltipOffset }] }]}>
              
              <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center', marginBottom: 6 }}>"""
nodo_code = nodo_code.replace(old_tooltip_jsx, new_tooltip_jsx)

old_tooltip_end = """               </Pressable>
            )}
          </View>
          <View style={styles.tooltipFlecha} />
        </View>
      )}"""

new_tooltip_end = """               </Pressable>
            )}
          </View>
          {!invertirTooltip && <View style={styles.tooltipFlecha} />}
        </View>
      )}"""
nodo_code = nodo_code.replace(old_tooltip_end, new_tooltip_end)

# Remove bottom and marginBottom from style
nodo_code = nodo_code.replace("    bottom: '100%',\n", "")
nodo_code = nodo_code.replace("    marginBottom: 14,\n", "")

with open('/home/arch-i7/Proyects/app/src/diseno/componentes/Nodo.tsx', 'w') as f:
    f.write(nodo_code)


# 2. MAPACOMPARTIDO.TSX: Add Scroll View ref and Auto Scroll
with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/MapaCompartido.tsx', 'r') as f:
    mapa_code = f.read()

# Add useRef, Dimensions import
old_imports = "import { View, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';"
if "Dimensions" not in mapa_code:
    mapa_code = mapa_code.replace("import { View, StyleSheet, ScrollView, Pressable } from 'react-native';", "import { View, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';")

# Wait, check if useRef is imported
if "useRef" not in mapa_code:
    mapa_code = mapa_code.replace("import React, { useState, useMemo } from 'react';", "import React, { useState, useMemo, useRef } from 'react';")

# Add scrollViewRef and handleNodoPress
old_state = "  const [nodoSeleccionado, setNodoSeleccionado] = useState<string | null>(null);"
new_state = """  const [nodoSeleccionado, setNodoSeleccionado] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const { height: windowHeight } = Dimensions.get('window');

  const handleNodoPress = (nodoId: string, yPos: number) => {
    if (nodoSeleccionado === nodoId) {
      setNodoSeleccionado(null);
    } else {
      setNodoSeleccionado(nodoId);
      // Auto Scroll to center the node
      const targetY = yPos - (windowHeight / 2) + 120; // 120 extra offset so tooltip fits well
      scrollViewRef.current?.scrollTo({ y: Math.max(0, targetY), animated: true });
    }
  };"""
mapa_code = mapa_code.replace(old_state, new_state)

# Pass ref to ScrollView
mapa_code = mapa_code.replace("<ScrollView \n        contentContainerStyle={{ height: totalHeight }}", "<ScrollView \n        ref={scrollViewRef}\n        contentContainerStyle={{ height: totalHeight }}")

# In node render loop:
old_nodo_render = """                      progresoTooltip={nodo.nivel === 2 ? 65 : nodo.nivel < 2 ? 100 : 0}
                      tooltipOffset={tooltipOffset}
                      onPress={() => setNodoSeleccionado(nodo.id === nodoSeleccionado ? null : nodo.id)}
                    />"""

new_nodo_render = """                      progresoTooltip={nodo.nivel === 2 ? 65 : nodo.nivel < 2 ? 100 : 0}
                      tooltipOffset={tooltipOffset}
                      invertirTooltip={nodo.nivel === 0} // Invert the first node to avoid top header collision
                      onPress={() => handleNodoPress(nodo.id, y)}
                    />"""
mapa_code = mapa_code.replace(old_nodo_render, new_nodo_render)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/MapaCompartido.tsx', 'w') as f:
    f.write(mapa_code)
