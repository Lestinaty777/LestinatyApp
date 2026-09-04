import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# Replace the state logic to include asignaturaActiva
state_logic = """
  const [menuAbierto, setMenuAbierto] = React.useState(false);
  const animMenu = useSharedValue(0);
  
  const ASIGNATURAS = [
    { id: '1', titulo: 'Anatomía I', color: biomas.inicio.MasterColor, categoriaId: 'salud' as any, desc: 'Sistema óseo, cráneo y articulaciones superiores.', Icono: () => <PixelartIcon name="book-open" size={24} color="#FFFFFF" />, IconoGrande: () => <PixelartIcon name="book-open" size={26} color="#FFFFFF" />, IconoFondo: () => <PixelartIcon name="book-open" size={42} color="#FFFFFF" style={[styles.tarjetaIconoFondo, { opacity: 0.15 }]} /> },
    { id: '2', titulo: 'Farmacología', color: '#B34A4A', categoriaId: 'habitos' as any, desc: 'Mecanismos de acción y farmacocinética básica.', Icono: () => <Beaker color="#FFFFFF" size={24} />, IconoGrande: () => <Beaker color="#FFFFFF" size={26} />, IconoFondo: () => <Beaker color="#FFFFFF" size={42} style={[styles.tarjetaIconoFondo, { opacity: 0.15 }]} /> },
    { id: '3', titulo: 'Ciencias Sociales', color: '#4A8BB3', categoriaId: 'rutinas' as any, desc: 'Sociología, psicología y comportamiento humano.', Icono: () => <Users color="#FFFFFF" size={24} />, IconoGrande: () => <Users color="#FFFFFF" size={26} />, IconoFondo: () => <Users color="#FFFFFF" size={42} style={[styles.tarjetaIconoFondo, { opacity: 0.15 }]} /> },
  ];
  const [asignatura, setAsignatura] = React.useState(ASIGNATURAS[0]);

  React.useEffect(() => {
    animMenu.value = withSpring(menuAbierto ? 1 : 0, { damping: 15, stiffness: 120 });
  }, [menuAbierto]);

  const animMenuEstilos = useAnimatedStyle(() => ({
    opacity: animMenu.value,
    transform: [
      { translateY: -20 * (1 - animMenu.value) },
      { scale: 0.95 + 0.05 * animMenu.value }
    ],
  }));
"""
content = re.sub(r'  const \[menuAbierto, setMenuAbierto\].*?  \}\)\);\n', state_logic, content, flags=re.DOTALL)

# Update the Dropdown to map ASIGNATURAS
old_dropdown = """            <RecuadroGlass blur intensity={60} style={styles.menuDesplegableInterior}>
              {[
                { id: '1', titulo: 'Anatomía I', color: biomas.inicio.MasterColor, Icono: () => <PixelartIcon name="book-open" size={24} color="#FFFFFF" /> },
                { id: '2', titulo: 'Farmacología', color: '#B34A4A', Icono: () => <Beaker color="#FFFFFF" size={24} /> },
                { id: '3', titulo: 'Ciencias Sociales', color: '#4A8BB3', Icono: () => <Users color="#FFFFFF" size={24} /> },
              ].map(asig => (
                <Pressable key={asig.id} style={styles.opcionMenu} onPress={() => { hapticSeguro('seleccion'); setMenuAbierto(false); }}>"""
new_dropdown = """            <RecuadroGlass blur intensity={60} style={styles.menuDesplegableInterior}>
              {ASIGNATURAS.map(asig => (
                <Pressable key={asig.id} style={styles.opcionMenu} onPress={() => { hapticSeguro('seleccion'); setAsignatura(asig); setMenuAbierto(false); }}>"""
content = content.replace(old_dropdown, new_dropdown)

# Update the Card to use state
old_card = """        <View style={styles.tarjetaContenedor}>
          <View style={[styles.tarjetaAsignaturaBase, { backgroundColor: oscurecer(biomas.inicio.MasterColor, 0.6) }]}>
            <View style={{...StyleSheet.absoluteFill as any, overflow: 'hidden', borderRadius: 24}}>
               <TexturaPixelArt />
            </View>
          </View>
          <View style={[styles.tarjetaAsignatura, { backgroundColor: biomas.inicio.MasterColor }]}>
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
          </View>
        </View>"""
        
new_card = """        <View style={styles.tarjetaContenedor}>
          <View style={[styles.tarjetaAsignaturaBase, { backgroundColor: oscurecer(asignatura.color, 0.6) }]}>
            <View style={{...StyleSheet.absoluteFill as any, overflow: 'hidden', borderRadius: 24}}>
               <TexturaPixelArt />
            </View>
          </View>
          <View style={[styles.tarjetaAsignatura, { backgroundColor: asignatura.color }]}>
            <TexturaPixelArt />
            <View style={styles.tarjetaBrillo} />
            <asignatura.IconoFondo />
            <View style={{ padding: 20, flex: 1, justifyContent: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <asignatura.IconoGrande />
                <Texto style={[styles.tituloAsignatura, { marginBottom: 0 }]}>{asignatura.titulo}</Texto>
              </View>
              <Texto style={styles.descAsignatura}>{asignatura.desc}</Texto>
            </View>
          </View>
        </View>"""
content = content.replace(old_card, new_card)

# Update ContenedorMapaSenderos props
old_map = """          <ContenedorMapaSenderos
            altura={alturaMapa}
            categoriaId="rutinas"
            color={biomas.inicio.MasterColor}
            enfocado={true}
            subcategoriaId="manana"
          />"""
new_map = """          <ContenedorMapaSenderos
            altura={alturaMapa}
            categoriaId={asignatura.categoriaId}
            color={asignatura.color}
            enfocado={true}
            subcategoriaId="manana"
          />"""
content = content.replace(old_map, new_map)

# Fix margins to reduce space
# navbarContenedor -> marginBottom from 20 to 5
content = content.replace("marginBottom: 20,\n    justifyContent: 'center',", "marginBottom: 5,\n    justifyContent: 'center',")
# tarjetaContenedor -> marginTop from 20 to 10
content = content.replace("  tarjetaContenedor: {\n    marginHorizontal: 20,\n    marginTop: 20,\n", "  tarjetaContenedor: {\n    marginHorizontal: 20,\n    marginTop: 5,\n")

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)

