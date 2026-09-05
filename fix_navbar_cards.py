import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# Fix layout to stack icon above text, giving more room for text
content = content.replace(
    """  tarjetaCarrusel: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 16,
    width: 140,
    height: 100,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    flexDirection: 'row',
  },""",
    """  tarjetaCarrusel: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 16,
    width: 120,
    height: 90,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },"""
)

# Fix icon margin since it's top-to-bottom now
content = content.replace(
    """  iconoCarrusel: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },""",
    """  iconoCarrusel: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },"""
)

# Text size
content = content.replace(
    """  textoCarruselTitulo: {
    fontSize: 12,
    fontFamily: 'MontserratAlternates-Bold',
    color: '#34312E',
  },""",
    """  textoCarruselTitulo: {
    fontSize: 11,
    fontFamily: 'MontserratAlternates-Bold',
    color: '#34312E',
  },"""
)

content = content.replace(
    """  textoCarruselDesc: {
    fontSize: 9,
    fontFamily: 'MontserratAlternates-Medium',
    color: '#555',
    marginTop: 2,
  },""",
    """  textoCarruselDesc: {
    fontSize: 8.5,
    fontFamily: 'MontserratAlternates-Medium',
    color: '#666',
    marginTop: 1,
  },"""
)

# Remove numberOfLines={1} from desc, and fix the component layout
old_card_jsx = """                  <Pressable key={asig.id} style={({pressed}) => [styles.tarjetaCarrusel, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]} onPress={() => { hapticSeguro('seleccion'); setAsignatura(asig); setMenuAbierto(false); }}>
                    <View style={[styles.iconoCarrusel, { backgroundColor: asig.color }]}>
                      <asig.Icono />
                    </View>
                    <View style={{ flex: 1, justifyContent: 'center' }}>
                      <Texto style={styles.textoCarruselTitulo}>{asig.titulo}</Texto>
                      <Texto style={styles.textoCarruselDesc} numberOfLines={1}>Cambiar materia</Texto>
                    </View>
                  </Pressable>"""

new_card_jsx = """                  <Pressable key={asig.id} style={({pressed}) => [styles.tarjetaCarrusel, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]} onPress={() => { hapticSeguro('seleccion'); setAsignatura(asig); setMenuAbierto(false); }}>
                    <View style={[styles.iconoCarrusel, { backgroundColor: asig.color }]}>
                      <asig.Icono size={16} />
                    </View>
                    <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                      <Texto style={styles.textoCarruselTitulo}>{asig.titulo}</Texto>
                      <Texto style={styles.textoCarruselDesc}>Explorar sendero</Texto>
                    </View>
                  </Pressable>"""

content = content.replace(old_card_jsx, new_card_jsx)


with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)
