import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# Remove FondoGeometrico function
content = re.sub(r"function FondoGeometrico.+?<\/View>\n  \);\n}\n", "", content, flags=re.DOTALL)

# Update JSX of tarjetaCarrusel
old_card = """                  <Pressable key={asig.id} style={({pressed}) => [styles.tarjetaCarrusel, { overflow: 'hidden' }, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]} onPress={() => { hapticSeguro('seleccion'); setAsignatura(asig); setMenuAbierto(false); }}>
                    <FondoGeometrico idAsignatura={asig.id} color={asig.color} />
                    <View style={[styles.iconoCarrusel, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>"""

new_card = """                  <Pressable key={asig.id} style={({pressed}) => [styles.tarjetaCarrusel, { overflow: 'hidden', backgroundColor: asig.color, borderColor: 'rgba(255,255,255,0.2)' }, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]} onPress={() => { hapticSeguro('seleccion'); setAsignatura(asig); setMenuAbierto(false); }}>
                    <TexturaPixelArt />
                    <View style={styles.tarjetaBrilloCarrusel} />
                    <View style={{ position: 'absolute', right: -10, bottom: -10, opacity: 0.7 }}>
                       {asig.id === '1' && <PixelartIcon name="book-open" size={42} color="#FFFFFF" />}
                       {asig.id === '2' && <Beaker size={42} color="#FFFFFF" />}
                       {asig.id === '3' && <Users size={42} color="#FFFFFF" />}
                    </View>
                    <View style={[styles.iconoCarrusel, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>"""
content = content.replace(old_card, new_card)

# Add styles.tarjetaBrilloCarrusel
brillo_style = """  tarjetaBrilloCarrusel: {
    position: 'absolute',
    top: -20,
    left: -30,
    height: 150,
    width: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    transform: [{ rotate: '45deg' }],
  },"""
content = content.replace("  tarjetaBrillo: {", brillo_style + "\n  tarjetaBrillo: {")

# Remove background from tarjetaCarrusel to let inline color work cleanly
content = content.replace("backgroundColor: 'rgba(255, 255, 255, 0.4)',", "")


with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)
