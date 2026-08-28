import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/AnalisisSenderos.tsx', 'r') as f:
    acode = f.read()

# Add ZoomIn import if missing
if 'ZoomIn' not in acode:
    acode = acode.replace("FadeInDown }", "FadeInDown, ZoomIn }")

old_map = """        {categorias.map(({ acento, Icono, id, categoria: etiqueta }) => {"""
new_map = """        {categorias.map(({ acento, Icono, id, categoria: etiqueta }, index) => {"""
acode = acode.replace(old_map, new_map)

old_press = """            <Pressable accessibilityLabel={`Analiticas de ${etiqueta}`} key={id} onPress={() => seleccionarCategoria(id)} style={({ pressed }) => [styles.botonCategoria, activa && { backgroundColor: acento, borderColor: acento }, pressed && styles.botonCategoriaPresionado]}>
              <Icono color={activa ? '#FFFFFF' : acento} size={16} strokeWidth={2.5} />
              {activa && <View style={styles.indicadorCategoriaActivo} />}
            </Pressable>"""

new_press = """            <Reanimated.View key={id} entering={ZoomIn.delay(index * 60).springify()} style={{ flex: 1, minWidth: 0, aspectRatio: 1 }}>
              <Pressable accessibilityLabel={`Analiticas de ${etiqueta}`} onPress={() => seleccionarCategoria(id)} style={({ pressed }) => [styles.botonCategoria, activa && { backgroundColor: acento, borderColor: acento }, pressed && styles.botonCategoriaPresionado, { flex: 1 }]}>
                <Icono color={activa ? '#FFFFFF' : acento} size={16} strokeWidth={2.5} />
                {activa && <View style={styles.indicadorCategoriaActivo} />}
              </Pressable>
            </Reanimated.View>"""

acode = acode.replace(old_press, new_press)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/AnalisisSenderos.tsx', 'w') as f:
    f.write(acode)

