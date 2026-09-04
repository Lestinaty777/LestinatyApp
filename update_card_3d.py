import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# Add oscurecer helper
oscurecer_code = """function oscurecer(color: string, factor = 0.7) {
  const hex = color.replace('#', '');
  const canal = (inicio: number) => Math.round(parseInt(hex.slice(inicio, inicio + 2), 16) * factor).toString(16).padStart(2, '0');
  return `#${canal(0)}${canal(2)}${canal(4)}`;
}

export function InicioPantalla() {"""
content = content.replace("export function InicioPantalla() {", oscurecer_code)

# Change card markup to add 3D styles and an icon
card_old = """        {/* Tarjeta de Asignatura / Tema actual */}
        <View style={[styles.tarjetaAsignatura, { backgroundColor: biomas.inicio.MasterColor }]}>
          <Texto style={styles.tituloAsignatura}>Anatomía I</Texto>
          <Texto style={styles.descAsignatura}>Sistema óseo, cráneo y articulaciones superiores.</Texto>
        </View>"""
card_new = """        {/* Tarjeta de Asignatura (3D Node Style) */}
        <View style={styles.tarjetaContenedor}>
          <View style={[styles.tarjetaAsignaturaBase, { backgroundColor: oscurecer(biomas.inicio.MasterColor, 0.6) }]} />
          <View style={[styles.tarjetaAsignatura, { backgroundColor: biomas.inicio.MasterColor }]}>
            <View style={styles.tarjetaBrillo} />
            <Book color="#FFFFFF" size={42} opacity={0.15} style={styles.tarjetaIconoFondo} />
            <Texto style={styles.tituloAsignatura}>Anatomía I</Texto>
            <Texto style={styles.descAsignatura}>Sistema óseo, cráneo y articulaciones superiores.</Texto>
          </View>
        </View>"""
content = content.replace(card_old, card_new)

# Update styles
styles_old = """  tarjetaAsignatura: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  tituloAsignatura: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 22,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  descAsignatura: {
    fontFamily: 'MontserratAlternates-Medium',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
  },"""
styles_new = """  tarjetaContenedor: {
    marginHorizontal: 20,
    marginTop: 20,
    position: 'relative',
    height: 100, // Fijar altura para posicionar bien la base 3D
  },
  tarjetaAsignaturaBase: {
    position: 'absolute',
    top: 6,
    left: 0,
    right: 0,
    height: 100,
    borderRadius: 26,
  },
  tarjetaAsignatura: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    padding: 20,
    borderRadius: 24,
    overflow: 'hidden',
    justifyContent: 'center',
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.35)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.2)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 0, 0, 0.15)',
  },
  tarjetaBrillo: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transform: [{ scaleX: 2 }],
  },
  tarjetaIconoFondo: {
    position: 'absolute',
    right: -5,
    bottom: -10,
    transform: [{ rotate: '-15deg' }],
  },
  tituloAsignatura: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 22,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: 4,
  },
  descAsignatura: {
    fontFamily: 'MontserratAlternates-Medium',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },"""
content = content.replace(styles_old, styles_new)

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)

