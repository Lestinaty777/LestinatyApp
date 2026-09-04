import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# Remove padding from tarjetaAsignatura
content = content.replace("    height: 100,\n    padding: 20,\n    borderRadius: 24,", "    height: 100,\n    borderRadius: 24,")

# Wrap the content in a View with padding: 20
old_content = """          <View style={[styles.tarjetaAsignatura, { backgroundColor: biomas.inicio.MasterColor }]}>
            <TexturaPixelArt />
            <View style={styles.tarjetaBrillo} />
            <PixelartIcon name="book-open" color="#FFFFFF" size={42} style={[styles.tarjetaIconoFondo, { opacity: 0.15 }]} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <PixelartIcon name="book-open" size={26} color="#FFFFFF" />
              <Texto style={[styles.tituloAsignatura, { marginBottom: 0 }]}>Anatomía I</Texto>
            </View>
            <Texto style={styles.descAsignatura}>Sistema óseo, cráneo y articulaciones superiores.</Texto>
          </View>"""
          
new_content = """          <View style={[styles.tarjetaAsignatura, { backgroundColor: biomas.inicio.MasterColor }]}>
            <TexturaPixelArt />
            <View style={styles.tarjetaBrillo} />
            <PixelartIcon name="book-open" color="#FFFFFF" size={42} style={[styles.tarjetaIconoFondo, { opacity: 0.15 }]} />
            <View style={{ padding: 20, flex: 1, justifyContent: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <PixelartIcon name="book-open" size={26} color="#FFFFFF" />
                <Texto style={[styles.tituloAsignatura, { marginBottom: 0 }]}>Anatomía I</Texto>
              </View>
              <Texto style={styles.descAsignatura}>Sistema óseo, cráneo y articulaciones superiores.</Texto>
            </View>
          </View>"""
content = content.replace(old_content, new_content)

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)

