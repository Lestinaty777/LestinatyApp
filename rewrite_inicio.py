import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# Fix imports
content = content.replace("import { StyleSheet, View, useWindowDimensions, Pressable } from 'react-native';", "import { StyleSheet, View, useWindowDimensions, Pressable } from 'react-native';\nimport { BotonTab, IconoTab } from '../../../nucleo/navegacion/BarraTabs';\nimport { BlurView } from 'expo-blur';\nimport { PixelartIcon } from '../../../diseno/iconos/PixelartIcon';\nimport Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, withSpring } from 'react-native-reanimated';\nimport { Beaker, Users } from 'lucide-react-native';")

# Add state hook for menuAbierto
state_logic = """
  const [menuAbierto, setMenuAbierto] = React.useState(false);
  const animMenu = useSharedValue(0);
  
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
content = content.replace("export function InicioPantalla() {", "export function InicioPantalla() {" + state_logic)

# Replace the NavBar (regex to handle indentation)
navbar_pattern = re.compile(r'\{\/\* Barra de Navegación Superior \*\/\}.*?<\/RecuadroGlass>', re.DOTALL)

new_navbar = """{/* Barra de Navegación Superior */}
        <View style={{ zIndex: 10 }}>
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
              {[
                { id: '1', titulo: 'Anatomía I', color: biomas.inicio.MasterColor, Icono: () => <PixelartIcon name="book-open" size={24} color="#FFFFFF" /> },
                { id: '2', titulo: 'Farmacología', color: '#B34A4A', Icono: () => <Beaker color="#FFFFFF" size={24} /> },
                { id: '3', titulo: 'Ciencias Sociales', color: '#4A8BB3', Icono: () => <Users color="#FFFFFF" size={24} /> },
              ].map(asig => (
                <Pressable key={asig.id} style={styles.opcionMenu} onPress={() => { hapticSeguro('seleccion'); setMenuAbierto(false); }}>
                  <View style={[styles.iconoOpcionMenu, { backgroundColor: asig.color }]}>
                    <asig.Icono />
                  </View>
                  <Texto style={styles.textoOpcionMenu}>{asig.titulo}</Texto>
                </Pressable>
              ))}
            </RecuadroGlass>
          </Animated.View>
        </View>"""
content = navbar_pattern.sub(new_navbar, content)

# Remove BotonAccion
botonaccion_pattern = re.compile(r'const BotonAccion.*?<\/Pressable>\n  \);', re.DOTALL)
content = botonaccion_pattern.sub('', content)

# Add FondoTabsGlass
fondo_comp = """
function oscurecer(color: string, factor = 0.7) {
  const hex = color.replace('#', '');
  const canal = (inicio: number) => Math.round(parseInt(hex.slice(inicio, inicio + 2), 16) * factor).toString(16).padStart(2, '0');
  return `#${canal(0)}${canal(2)}${canal(4)}`;
}

function FondoTabsGlass() {
  return (
    <BlurView intensity={24} tint="light" style={styles.fondoTabs}>
      <View style={styles.fondoTabsTinte} />
      <View pointerEvents="none" style={styles.fondoTabsBrilloLateral} />
      <View pointerEvents="none" style={styles.fondoTabsBorde} />
    </BlurView>
  );
}

"""
content = content.replace("const styles = StyleSheet.create({", fondo_comp + "const styles = StyleSheet.create({")

# Add styles
styles_str = """  fondoTabs: {
    borderRadius: 15,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    overflow: 'hidden',
  },
  fondoTabsTinte: {
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  fondoTabsBrilloLateral: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 999,
    bottom: 12,
    left: 8,
    position: 'absolute',
    top: 12,
    width: 3,
  },
  fondoTabsBorde: {
    borderColor: 'rgba(255, 255, 255, 0.62)',
    borderRadius: 15,
    borderTopWidth: 0.8,
    borderWidth: 0.45,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  navbarContenedor: {
    height: 62,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    justifyContent: 'center',
  },
  navbarFila: {
    flexDirection: 'row',
    height: '100%',
  },
  menuDesplegable: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  menuDesplegableInterior: {
    borderRadius: 18,
    padding: 12,
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  opcionMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  iconoOpcionMenu: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textoOpcionMenu: {
    fontSize: 16,
    fontFamily: 'MontserratAlternates-SemiBold',
    color: '#34312E',
  },
"""
content = content.replace("  navbarSuperior: {", styles_str + "  navbarSuperior: {")

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)

