import re

# --- 1. NODO.TSX: Tooltip always below ---
with open('/home/arch-i7/Proyects/app/src/diseno/componentes/Nodo.tsx', 'r') as f:
    nodo_code = f.read()

# Remove invertirTooltip prop
nodo_code = nodo_code.replace("  invertirTooltip?: boolean;\n", "")
nodo_code = nodo_code.replace("  invertirTooltip = false,\n", "")

# Change tooltip render to ALWAYS be below (top: 100%)
old_tooltip = """        {isSelected && (
          <View style={[styles.tooltipPosicionador, invertirTooltip ? { top: '100%', marginTop: 14 } : { bottom: '100%', marginBottom: 14 }]}>
            {invertirTooltip && <View style={[styles.tooltipFlecha, { marginBottom: -10, marginTop: 0 }]} />}
            
            <View style={[styles.tooltipCaja, { transform: [{ translateX: tooltipOffset }] }]}>"""

new_tooltip = """        {isSelected && (
          <View style={[styles.tooltipPosicionador, { top: '100%', marginTop: 14 }]}>
            <View style={[styles.tooltipFlecha, { marginBottom: -10, marginTop: 0 }]} />
            
            <View style={[styles.tooltipCaja, { transform: [{ translateX: tooltipOffset }] }]}>"""
nodo_code = nodo_code.replace(old_tooltip, new_tooltip)

old_tooltip_end = """               </Pressable>
            )}
          </View>
          {!invertirTooltip && <View style={styles.tooltipFlecha} />}
        </View>
      )}"""
new_tooltip_end = """               </Pressable>
            )}
          </View>
        </View>
      )}"""
nodo_code = nodo_code.replace(old_tooltip_end, new_tooltip_end)

with open('/home/arch-i7/Proyects/app/src/diseno/componentes/Nodo.tsx', 'w') as f:
    f.write(nodo_code)

# --- 2. MAPACOMPARTIDO.TSX: Bigger Nodes ---
with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/MapaCompartido.tsx', 'r') as f:
    mapa_code = f.read()

# Change size=70 to size=90
mapa_code = mapa_code.replace("size={70}", "size={90}")

# Change node wrapper positioning
mapa_code = mapa_code.replace("left: CENTER_X + nodo.offsetX - 35,", "left: CENTER_X + nodo.offsetX - 45,")
mapa_code = mapa_code.replace("top: i * ALTURA_PISO + MAPA_PADDING_TOP - 35,", "top: i * ALTURA_PISO + MAPA_PADDING_TOP - 45,")

# Change GAP and ALTURA_PISO
# Need to find ALTURA_PISO
mapa_code = re.sub(r'const ALTURA_PISO = \d+;', 'const ALTURA_PISO = 160;', mapa_code)
mapa_code = re.sub(r'const GAP = \d+;', 'const GAP = 52;', mapa_code)

# Remove invertirTooltip prop passing
mapa_code = mapa_code.replace("invertirTooltip={nodo.nivel === 0} // Invert the first node to avoid top header collision\n", "")

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/MapaCompartido.tsx', 'w') as f:
    f.write(mapa_code)

# --- 3, 4, 5. COMPARTIDOSSENDEROS.TSX: Header style, No Modal, Grayish background ---
with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/CompartidosSenderos.tsx', 'r') as f:
    comp_code = f.read()

old_modal = """      <Modal visible={mostrarMapa} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setMostrarMapa(false)}>
        {senderoActivo && (
          <View style={{ flex: 1, backgroundColor: colores.fondo }}>
            {/* ENCABEZADO FLOTANTE DEL MAPA */}
            <View style={{ position: 'absolute', top: 20, left: 20, right: 20, zIndex: 100 }}>
              <RecuadroGlass style={styles.mapaHeaderWrapper}>
                <View style={[styles.miniLibro, { backgroundColor: senderoActivo.acento }]}>
                  <View style={styles.miniLibroBisel}>
                    {/* El icono usa el mismo mapeo */}
                    {React.createElement(iconosCategoria[senderoActivo.categoriaId] || Compass, { color: '#FFF', size: 18 })}
                  </View>
                </View>
                <View style={styles.mapaHeaderInfo}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Texto style={styles.mapaHeaderTitulo} numberOfLines={1}>{senderoActivo.titulo}</Texto>
                    <Pressable onPress={() => setMostrarMapa(false)} style={styles.mapaHeaderCerrar}>
                      <Texto style={styles.mapaHeaderCerrarTexto}>Cerrar</Texto>
                    </Pressable>
                  </View>
                  <Texto style={styles.mapaHeaderSub} numberOfLines={1}>{senderoActivo.descripcion}</Texto>
                  <View style={{ marginTop: 6 }}>
                    <BarraProgresoLiquida porcentaje={senderoActivo.progresoPorcentaje} color={senderoActivo.acento} />
                  </View>
                </View>
              </RecuadroGlass>
            </View>
            
            <MapaCompartido masterColor={senderoActivo.acento} />
          </View>
        )}
      </Modal>"""

# We replace RecuadroGlass with a solid View to match user saying "recuadro fijo de color saturado"
new_modal = """      {mostrarMapa && senderoActivo && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 1000, backgroundColor: '#EFEFF4' }]}>
          {/* ENCABEZADO FLOTANTE DEL MAPA */}
          <View style={{ position: 'absolute', top: 20, left: 20, right: 20, zIndex: 100 }}>
            <View style={[styles.mapaHeaderWrapper, { backgroundColor: senderoActivo.acento, borderColor: senderoActivo.acento, shadowOpacity: 0.25 }]}>
              <View style={[styles.miniLibro, { backgroundColor: '#FFFFFF' }]}>
                <View style={[styles.miniLibroBisel, { borderColor: senderoActivo.acento + '40' }]}>
                  {React.createElement(iconosCategoria[senderoActivo.categoriaId] || Compass, { color: senderoActivo.acento, size: 22 })}
                </View>
              </View>
              <View style={styles.mapaHeaderInfo}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Texto style={[styles.mapaHeaderTitulo, { color: '#FFFFFF' }]} numberOfLines={1}>{senderoActivo.titulo}</Texto>
                  <Pressable onPress={() => setMostrarMapa(false)} style={[styles.mapaHeaderCerrar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Texto style={[styles.mapaHeaderCerrarTexto, { color: '#FFFFFF' }]}>Cerrar</Texto>
                  </Pressable>
                </View>
                <Texto style={[styles.mapaHeaderSub, { color: 'rgba(255,255,255,0.85)' }]} numberOfLines={1}>{senderoActivo.descripcion}</Texto>
                <View style={{ marginTop: 6 }}>
                  <BarraProgresoLiquida porcentaje={senderoActivo.progresoPorcentaje} color="#FFFFFF" />
                </View>
              </View>
            </View>
          </View>
          
          <MapaCompartido masterColor={senderoActivo.acento} />
        </View>
      )}"""

comp_code = comp_code.replace(old_modal, new_modal)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/CompartidosSenderos.tsx', 'w') as f:
    f.write(comp_code)

