import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# Re-add TexturaPixelArt to the base
old_base = """<View style={[styles.tarjetaAsignaturaBase, { backgroundColor: oscurecer(biomas.inicio.MasterColor, 0.5) }]} />"""
new_base = """<View style={[styles.tarjetaAsignaturaBase, { backgroundColor: oscurecer(biomas.inicio.MasterColor, 0.6) }]}>
            <View style={{...StyleSheet.absoluteFill as any, overflow: 'hidden', borderRadius: 24}}>
               <TexturaPixelArt />
            </View>
          </View>"""
content = content.replace(old_base, new_base)

# Fix the base styles
old_styles = """  tarjetaAsignaturaBase: {
    position: 'absolute',
    top: 6,
    left: 0,
    right: 0,
    height: 100,
    borderRadius: 26,
  },"""
new_styles = """  tarjetaAsignaturaBase: {
    position: 'absolute',
    top: 6,
    left: 0,
    right: 0,
    height: 100,
    borderRadius: 24,
  },"""
content = content.replace(old_styles, new_styles)

# Remove drop shadow from tarjetaContenedor since the user wants the retro look
content = re.sub(r'    shadowColor: \'#000\',\n    shadowOffset: \{ width: 0, height: 12 \},\n    shadowOpacity: 0.15,\n    shadowRadius: 16,\n    elevation: 8,\n', '', content)

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)

