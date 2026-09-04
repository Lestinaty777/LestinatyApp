import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# Remove the View with TexturaPixelArt from inside tarjetaAsignaturaBase
old_base = """<View style={[styles.tarjetaAsignaturaBase, { backgroundColor: oscurecer(biomas.inicio.MasterColor, 0.6) }]}>
            <View style={{...StyleSheet.absoluteFill as any, overflow: 'hidden', borderRadius: 26}}>
               <TexturaPixelArt />
            </View>
          </View>"""
new_base = """<View style={[styles.tarjetaAsignaturaBase, { backgroundColor: oscurecer(biomas.inicio.MasterColor, 0.5) }]} />"""
content = content.replace(old_base, new_base)

# Maybe add a real shadow to tarjetaContenedor
if 'shadowColor' not in content.split('tarjetaContenedor:')[1].split('tarjetaAsignaturaBase:')[0]:
    styles_cont = """  tarjetaContenedor: {
    marginHorizontal: 20,
    marginTop: 20,
    position: 'relative',
    height: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },"""
    content = re.sub(r'  tarjetaContenedor: \{.*?  \},', styles_cont, content, flags=re.DOTALL)

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)

