import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'r') as f:
    content = f.read()

# Fix Svg import to include Rect
content = content.replace("import Svg, { Path } from 'react-native-svg';", "import Svg, { Path, Rect } from 'react-native-svg';")

# Replace etiqueta render
etiqueta_old = """              {esSeleccionado ? (
                <View style={[styles.etiqueta, { transform: [{ scale: escalaEscena }] }]}>
                  <Texto numberOfLines={1} style={styles.etiquetaTitulo}>{nodo.titulo}</Texto>
                  <Texto style={[styles.etiquetaMeta, { color }]}>{nodo.subtitulo}</Texto>
                </View>
              ) : null}"""
etiqueta_new = """              {esSeleccionado ? (
                <View style={[styles.etiqueta, { transform: [{ scale: escalaEscena }] }]}>
                  <View style={styles.tooltipFlechita} />
                  <View style={styles.tooltipCaja}>
                    <Texto numberOfLines={1} style={styles.etiquetaTitulo}>{nodo.titulo}</Texto>
                    <Texto style={[styles.etiquetaMeta, { color }]}>{nodo.subtitulo}</Texto>
                    <View style={styles.tooltipPixelesMarco}>
                       <Svg width={24} height={24}>
                          <Rect x={16} y={16} width={8} height={8} fill="rgba(0,0,0,0.08)" />
                          <Rect x={8} y={16} width={8} height={8} fill="rgba(0,0,0,0.05)" />
                          <Rect x={16} y={8} width={8} height={8} fill="rgba(0,0,0,0.05)" />
                       </Svg>
                    </View>
                  </View>
                </View>
              ) : null}"""
content = content.replace(etiqueta_old, etiqueta_new)

# Replace styling
styles_old = """  etiqueta: {
    alignItems: 'center',
    left: -50,
    position: 'absolute',
    top: 66,
    width: 172,
  },
  etiquetaMeta: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 9,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  etiquetaTitulo: {
    color: '#E8E8E8',
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 13,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },"""
styles_new = """  etiqueta: {
    alignItems: 'center',
    left: -70,
    position: 'absolute',
    top: 66,
    width: 212,
  },
  tooltipCaja: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  tooltipFlechita: {
    width: 16,
    height: 16,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
    marginBottom: -8, // Se mete dentro de la caja para unirse
    zIndex: 1,
  },
  tooltipPixelesMarco: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
  },
  etiquetaMeta: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 10,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  etiquetaTitulo: {
    color: '#1A1A1A',
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 14,
    textAlign: 'center',
  },"""
content = content.replace(styles_old, styles_new)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'w') as f:
    f.write(content)

