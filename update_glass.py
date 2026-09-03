import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# Add RecuadroGlass import
if "RecuadroGlass" not in content:
    content = content.replace("import { Texto, colores } from '../../../diseno';", "import { Texto, colores, RecuadroGlass } from '../../../diseno';")

# Replace View with RecuadroGlass
content = content.replace('<View style={styles.navbarSuperior}>', '<RecuadroGlass blur intensity={40} style={styles.navbarSuperior}>')
content = content.replace('</View>\n        \n        {/* Espacio que empuja el mapa', '</RecuadroGlass>\n        \n        {/* Espacio que empuja el mapa')

# Update styles
styles_old = """  navbarSuperior: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 20,
    // Sombra sutil para que resalte del gris claro
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },"""
styles_new = """  navbarSuperior: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 14,
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },"""
content = content.replace(styles_old, styles_new)

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)

