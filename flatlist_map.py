import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/MapaCompartido.tsx', 'r') as f:
    content = f.read()

# Add FlatList to imports
if 'FlatList' not in content:
    content = content.replace("ScrollView, Pressable, Dimensions", "ScrollView, FlatList, Pressable, Dimensions")

# We need to replace the ScrollView and its children with a FlatList.
# Let's find the ScrollView block.
old_scroll_block = re.search(r'(<ScrollView\s+ref=\{scrollViewRef\}.*?<\/ScrollView>)', content, re.DOTALL)

if old_scroll_block:
    old_scroll_jsx = old_scroll_block.group(1)
    
    # We will replace this entire ScrollView with a FlatList
    new_flatlist_jsx = """<FlatList
        ref={scrollViewRef as any}
        data={LAYOUT_MAPA}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: MAPA_PADDING_TOP, paddingBottom: MAPA_PADDING_BOTTOM }}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews={true}
        renderItem={({ item: nodo, index: i }) => {
          const { x, y } = coordsDict[nodo.id];
          const variacion = 0;

          if (nodo.tipo === 'tablero') {
            return (
              <View 
                style={[
                  styles.nodoWrapper,
                  {
                    height: ALTURA_PISO,
                    width: '100%',
                    position: 'relative',
                  }
                ]}
              >
                <View style={{ position: 'absolute', left: CENTER_X + nodo.offsetX - 45, top: -45 }}>
                  {/* Mock de tablero */}
                  <View style={{ width: 90, height: 90, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }}>
                    <Users color={masterColor} size={24} />
                  </View>
                </View>
              </View>
            );
          }

          // Calcular si el tooltip se sale de la pantalla
          const TOOLTIP_WIDTH = 280;
          const MARGIN_EDGE = 16;
          const leftEdge = x - (TOOLTIP_WIDTH / 2);
          const rightEdge = x + (TOOLTIP_WIDTH / 2);
          
          let tooltipOffset = 0;
          if (leftEdge < MARGIN_EDGE) {
            tooltipOffset = MARGIN_EDGE - leftEdge;
          } else if (rightEdge > SCREEN_WIDTH - MARGIN_EDGE) {
            tooltipOffset = (SCREEN_WIDTH - MARGIN_EDGE) - rightEdge;
          }

          return (
            <View 
              style={[
                styles.nodoWrapper,
                {
                  height: ALTURA_PISO,
                  width: '100%',
                  position: 'relative',
                }
              ]}
            >
              <View style={{ position: 'absolute', left: CENTER_X + nodo.offsetX - 45, top: -45 }}>
                <Nodo 
                  Icono={nodo.icono_lucide}
                  masterColor={masterColor}
                  variacion={variacion}
                  size={90}
                  isSelected={nodoSeleccionado === nodo.id}
                  tituloTooltip={nodo.titulo}
                  descripcionTooltip={nodo.subtitulo}
                  estado={nodo.nivel < 2 ? 'completado' : nodo.nivel === 2 ? 'activo' : 'desactivado'}
                  progresoTooltip={nodo.nivel === 2 ? 65 : nodo.nivel < 2 ? 100 : 0}
                  tooltipOffset={tooltipOffset}
                  onPress={() => handleNodoPress(nodo.id, y)}
                />
              </View>
            </View>
          );
        }}
      />"""
    
    content = content.replace(old_scroll_jsx, new_flatlist_jsx)

# We must adjust `handleNodoPress` because FlatList scrollTo requires offset, wait, FlatList can use scrollToOffset.
# Let's fix handleNodoPress:
old_handle = "scrollViewRef.current?.scrollTo({ y: Math.max(0, targetY), animated: true });"
new_handle = "scrollViewRef.current?.scrollToOffset({ offset: Math.max(0, targetY), animated: true });"
content = content.replace(old_handle, new_handle)

# And fix the useRef type
old_ref = "const scrollViewRef = useRef<ScrollView>(null);"
new_ref = "const scrollViewRef = useRef<FlatList>(null);"
content = content.replace(old_ref, new_ref)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/MapaCompartido.tsx', 'w') as f:
    f.write(content)

