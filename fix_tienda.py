import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# 1. Expandir importaciones
content = content.replace("import { Book, Calendar, Sparkles, Store, Flame, Zap } from 'lucide-react-native';", "import { Book, Calendar, Sparkles, Store, Flame, Zap, Shield, Terminal, Hexagon } from 'lucide-react-native';")

# 2. Actualizar activeMenu (si no soporta store, aunque el type dice 'none' | 'courses' | 'calendar')
content = content.replace("React.useState<'none' | 'courses' | 'calendar'>('none')", "React.useState<'none' | 'courses' | 'calendar' | 'sparkle' | 'store'>('none')")
content = content.replace("handleToggleMenu = (menu: 'courses' | 'calendar')", "handleToggleMenu = (menu: 'courses' | 'calendar' | 'sparkle' | 'store')")

# 3. Ajustar altura animada para store
content = content.replace("if (activeMenu === 'calendar') targetH = 430;", "if (activeMenu === 'calendar') targetH = 430;\n    if (activeMenu === 'store') targetH = 260;")

# 4. Modificar el BotonTab de la Tienda
old_store_btn = r"<BotonTab><IconoTab nombre=\"top_store\" focused=\{false\} \/><\/BotonTab>"
new_store_btn = """<BotonTab onPress={() => handleToggleMenu('store')}>
                <View style={[{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 6 }, activeMenu === 'store' && { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
                  <Store color={activeMenu === 'store' ? '#4CAF50' : '#76736D'} size={20} fill={activeMenu === 'store' ? '#4CAF50' : 'transparent'} />
                  <Texto style={{ fontSize: 14, fontFamily: 'Montserrat-Bold', color: activeMenu === 'store' ? '#4CAF50' : '#76736D', marginTop: -2 }}>1,250</Texto>
                </View>
              </BotonTab>"""
content = re.sub(old_store_btn, new_store_btn, content)

# 5. Renderizar PanelTienda
old_render = r"\{activeMenu === 'calendar' && <PanelRacha \/>\}"
new_render = "{activeMenu === 'calendar' && <PanelRacha />}\n              {activeMenu === 'store' && <PanelTienda />}"
content = re.sub(old_render, new_render, content)

# 6. Añadir Componente PanelTienda
panel_tienda_code = """

function PanelTienda() {
  const articulos = [
    { id: 1, titulo: 'Tema: Matrix', desc: 'Esquema de color negro y verde hacker.', precio: 500, color: '#2E7D32', Icono: Terminal },
    { id: 2, titulo: 'Escudo', desc: 'Congela y salva tu racha por 24 horas.', precio: 200, color: '#B34A4A', Icono: Shield },
    { id: 3, titulo: 'Hexágonos', desc: 'Textura de panal para tus boletos.', precio: 800, color: '#734AB3', Icono: Hexagon },
  ];

  return (
    <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 5, paddingBottom: 15 }}>
      {/* Background Texture */}
      <View style={[StyleSheet.absoluteFill, { opacity: 0.1 }]} pointerEvents="none">
        <TexturaPixelArt />
      </View>
      
      {/* CABECERA */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 42, height: 42 }}>
            <View style={{ position: 'absolute', top: 4, left: 0, right: 0, bottom: -4, backgroundColor: oscurecer('#4CAF50', 0.6), borderRadius: 8 }} />
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#4CAF50', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
              <Store color="#FFFFFF" size={24} fill="#FFFFFF" />
            </View>
          </View>
          <View>
            <Texto style={{ fontSize: 9, color: 'rgba(0,0,0,0.5)', fontFamily: 'Montserrat-Bold', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 0 }}>SUMINISTROS</Texto>
            <Texto style={{ fontSize: 22, fontFamily: 'Montserrat-Bold', color: '#111111' }}>Almacén</Texto>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Texto style={{ fontSize: 8, color: 'rgba(0,0,0,0.5)', fontFamily: 'Montserrat-Bold', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 }}>FONDOS (CRÉDITOS)</Texto>
          <View style={{ backgroundColor: '#111111', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderBottomWidth: 2, borderBottomColor: '#000000', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Hexagon size={10} color="#FFD700" fill="#FFD700" />
            <Texto style={{ fontSize: 13, fontFamily: 'Montserrat-Bold', color: '#FFD700' }}>1,250</Texto>
          </View>
        </View>
      </View>

      {/* CARRUSEL DE PRODUCTOS */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 15, paddingBottom: 15 }} style={{ flex: 1, overflow: 'visible' }}>
        {articulos.map(art => (
          <Pressable key={art.id} style={({ pressed }) => [{ width: 140, height: 130 }, pressed && { transform: [{ translateY: 3 }] }]}>
            {({ pressed }) => (
              <>
                {/* Sombra 3D del producto */}
                <View style={{ position: 'absolute', top: 4, left: 0, right: 0, bottom: -4, backgroundColor: oscurecer(art.color, 0.5), borderRadius: 12 }} />
                
                {/* Carta Frontal */}
                <View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: art.color, borderRadius: 12, padding: 12, overflow: 'hidden' }]}>
                  {/* Máquina de Vending Brillo / Textura */}
                  <View style={{ position: 'absolute', top: -20, right: -20, width: 60, height: 60, backgroundColor: 'rgba(255,255,255,0.1)', transform: [{ rotate: '45deg' }] }} />
                  
                  <View style={{ marginBottom: auto }}>
                     <art.Icono color="#FFF" size={24} />
                  </View>
                  
                  <View style={{ marginTop: 'auto' }}>
                    <Texto style={{ fontSize: 12, fontFamily: 'Montserrat-Bold', color: '#FFFFFF', marginBottom: 2 }} numberOfLines={1}>{art.titulo}</Texto>
                    <Texto style={{ fontSize: 9, fontFamily: 'Montserrat-Medium', color: 'rgba(255,255,255,0.7)' }} numberOfLines={2}>{art.desc}</Texto>
                  </View>
                </View>
                
                {/* Etiqueta de Precio Brutalista */}
                <View style={{ position: 'absolute', top: -8, right: -8, backgroundColor: '#111111', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6, borderBottomWidth: 3, borderBottomColor: '#000000', flexDirection: 'row', alignItems: 'center', gap: 4, transform: [{ rotate: '5deg' }] }}>
                  <Hexagon size={10} color="#FFD700" fill="#FFD700" />
                  <Texto style={{ fontSize: 11, fontFamily: 'Montserrat-Bold', color: '#FFD700' }}>{art.precio}</Texto>
                </View>
              </>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
"""
content += panel_tienda_code

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)
