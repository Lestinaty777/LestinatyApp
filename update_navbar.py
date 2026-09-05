import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# 1. Update the state and animation logic
old_logic = """  const [menuAbierto, setMenuAbierto] = React.useState(false);
  const animMenu = useSharedValue(0);
  
  const ASIGNATURAS = ["""

new_logic = """  const [menuAbierto, setMenuAbierto] = React.useState(false);
  const animMenu = useSharedValue(0);
  
  const ASIGNATURAS = ["""
# wait, actually let's just replace animMenu logic
old_anim = """  React.useEffect(() => {
    animMenu.value = withSpring(menuAbierto ? 1 : 0, { damping: 15, stiffness: 120 });
  }, [menuAbierto]);

  const animMenuEstilos = useAnimatedStyle(() => ({
    opacity: animMenu.value,
    transform: [
      { translateY: -20 * (1 - animMenu.value) },
      { scale: 0.95 + 0.05 * animMenu.value }
    ],
  }));"""

new_anim = """  React.useEffect(() => {
    animMenu.value = withSpring(menuAbierto ? 1 : 0, { damping: 16, stiffness: 100 });
  }, [menuAbierto]);

  const animNavbarEstilos = useAnimatedStyle(() => ({
    height: 62 + 130 * animMenu.value,
  }));

  const animContenidoEstilos = useAnimatedStyle(() => ({
    opacity: animMenu.value,
    transform: [
      { translateY: -10 * (1 - animMenu.value) },
    ],
  }));"""
content = content.replace(old_anim, new_anim)

# 2. Update the JSX for the navbar
old_jsx = """        <View style={{ zIndex: 10 }}>
          <View style={styles.navbarContenedor}>
            <FondoTabsGlass />
            <View style={styles.navbarFila}>
              <BotonTab onPress={() => setMenuAbierto(!menuAbierto)}><IconoTab nombre="top_book" focused={menuAbierto} /></BotonTab>
              <BotonTab><IconoTab nombre="top_calendar" focused={false} /></BotonTab>
              <BotonTab><IconoTab nombre="top_sparkle" focused={false} /></BotonTab>
              <BotonTab><IconoTab nombre="top_store" focused={false} /></BotonTab>
            </View>
          </View>

          {/* Menú Desplegable de Asignaturas */}
          <Animated.View pointerEvents={menuAbierto ? 'auto' : 'none'} style={[styles.menuDesplegable, animMenuEstilos]}>
            <RecuadroGlass blur intensity={60} style={styles.menuDesplegableInterior}>
              {ASIGNATURAS.map(asig => (
                <Pressable key={asig.id} style={styles.opcionMenu} onPress={() => { hapticSeguro('seleccion'); setAsignatura(asig); setMenuAbierto(false); }}>
                  <View style={[styles.iconoOpcionMenu, { backgroundColor: asig.color }]}>
                    <asig.Icono />
                  </View>
                  <Texto style={styles.textoOpcionMenu}>{asig.titulo}</Texto>
                </Pressable>
              ))}
            </RecuadroGlass>
          </Animated.View>
        </View>"""

new_jsx = """        <View style={{ zIndex: 10 }}>
          <Animated.View style={[styles.navbarContenedor, animNavbarEstilos, { overflow: 'hidden' }]}>
            <FondoTabsGlass />
            <View style={styles.navbarFila}>
              <BotonTab onPress={() => setMenuAbierto(!menuAbierto)}><IconoTab nombre="top_book" focused={menuAbierto} /></BotonTab>
              <BotonTab><IconoTab nombre="top_calendar" focused={false} /></BotonTab>
              <BotonTab><IconoTab nombre="top_sparkle" focused={false} /></BotonTab>
              <BotonTab><IconoTab nombre="top_store" focused={false} /></BotonTab>
            </View>

            <Animated.View pointerEvents={menuAbierto ? 'auto' : 'none'} style={[{ flex: 1 }, animContenidoEstilos]}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carruselSenderos} style={{ flex: 1 }}>
                {ASIGNATURAS.map(asig => (
                  <Pressable key={asig.id} style={({pressed}) => [styles.tarjetaCarrusel, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]} onPress={() => { hapticSeguro('seleccion'); setAsignatura(asig); setMenuAbierto(false); }}>
                    <View style={[styles.iconoCarrusel, { backgroundColor: asig.color }]}>
                      <asig.Icono />
                    </View>
                    <View style={{ flex: 1, justifyContent: 'center' }}>
                      <Texto style={styles.textoCarruselTitulo}>{asig.titulo}</Texto>
                      <Texto style={styles.textoCarruselDesc} numberOfLines={1}>Cambiar materia</Texto>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </Animated.View>
          </Animated.View>
        </View>"""
content = content.replace(old_jsx, new_jsx)

# 3. Add styles
old_styles = """  navbarContenedor: {
    height: 62,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 5,
  },"""
new_styles = """  navbarContenedor: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 5,
    borderRadius: 20,
  },
  carruselSenderos: {
    paddingHorizontal: 15,
    gap: 12,
    alignItems: 'center',
  },
  tarjetaCarrusel: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 16,
    width: 140,
    height: 100,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  iconoCarrusel: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  textoCarruselTitulo: {
    fontSize: 12,
    fontFamily: 'MontserratAlternates-Bold',
    color: '#34312E',
  },
  textoCarruselDesc: {
    fontSize: 9,
    fontFamily: 'MontserratAlternates-Medium',
    color: '#555',
    marginTop: 2,
  },"""

content = content.replace(old_styles, new_styles)

# Remove old menuDesplegable styles
content = re.sub(r'  menuDesplegable: \{.*?\},\n', '', content, flags=re.DOTALL)
content = re.sub(r'  menuDesplegableInterior: \{.*?\},\n', '', content, flags=re.DOTALL)
content = re.sub(r'  opcionMenu: \{.*?\},\n', '', content, flags=re.DOTALL)
content = re.sub(r'  iconoOpcionMenu: \{.*?\},\n', '', content, flags=re.DOTALL)
content = re.sub(r'  textoOpcionMenu: \{.*?\},\n', '', content, flags=re.DOTALL)

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)

