import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'r') as f:
    content = f.read()

# Import Pressable
content = content.replace("useWindowDimensions, View", "useWindowDimensions, View, Pressable")

# Add oscurecer helper
oscurecer_code = """function oscurecer(color: string, factor = 0.7) {
  const hex = color.replace('#', '');
  const canal = (inicio: number) => Math.round(parseInt(hex.slice(inicio, inicio + 2), 16) * factor).toString(16).padStart(2, '0');
  return `#${canal(0)}${canal(2)}${canal(4)}`;
}

export function ContenedorMapaSenderos"""
content = content.replace("export function ContenedorMapaSenderos", oscurecer_code)

# Replace tooltip rendering
tooltip_old = """              {esSeleccionado ? (
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
tooltip_new = """              {esSeleccionado ? (
                <View style={[styles.etiqueta, { transform: [{ scale: escalaEscena }] }]}>
                  <View style={[styles.tooltipFlechita, { backgroundColor: oscurecer(color, 0.75) }]} />
                  <View style={[styles.tooltipCaja, { backgroundColor: oscurecer(color, 0.75) }]}>
                    <Texto numberOfLines={1} style={styles.etiquetaTitulo}>{nodo.titulo}</Texto>
                    <Texto style={styles.etiquetaMeta}>{nodo.subtitulo || 'Sin descripción adicional.'}</Texto>
                    
                    <Pressable 
                      disabled={estadoVisual === 'bloqueado'} 
                      onPress={() => completarNodo(indice)}
                      style={[styles.botonComenzar, { backgroundColor: estadoVisual === 'bloqueado' ? 'rgba(0,0,0,0.15)' : color }]}
                    >
                       <Texto style={[styles.textoBoton, { color: estadoVisual === 'bloqueado' ? 'rgba(255,255,255,0.4)' : '#FFFFFF' }]}>
                         {estadoVisual === 'bloqueado' ? 'Bloqueado' : estadoVisual === 'completado' ? 'Repasar' : 'Comenzar'}
                       </Texto>
                    </Pressable>

                    <View style={styles.tooltipPixelesMarco}>
                       <Svg width={24} height={24}>
                          <Rect x={16} y={16} width={8} height={8} fill="rgba(0,0,0,0.15)" />
                          <Rect x={8} y={16} width={8} height={8} fill="rgba(0,0,0,0.1)" />
                          <Rect x={16} y={8} width={8} height={8} fill="rgba(0,0,0,0.1)" />
                       </Svg>
                    </View>
                  </View>
                </View>
              ) : null}"""
content = content.replace(tooltip_old, tooltip_new)

# Update styles
styles_old = """  tooltipCaja: {
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
    marginBottom: -8, 
    zIndex: 1,
  },
  tooltipPixelesMarco: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
  },
  etiqueta: {
    alignItems: 'center',
    left: -70,
    position: 'absolute',
    top: 66,
    width: 212,
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
styles_new = """  tooltipCaja: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  tooltipFlechita: {
    width: 20,
    height: 20,
    transform: [{ rotate: '45deg' }],
    marginBottom: -10, 
    zIndex: 1,
  },
  tooltipPixelesMarco: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
  },
  botonComenzar: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  textoBoton: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 13,
  },
  etiqueta: {
    alignItems: 'center',
    left: -80,
    position: 'absolute',
    top: 76,
    width: 232,
    zIndex: 10,
  },
  etiquetaMeta: {
    fontFamily: 'MontserratAlternates-Medium',
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    textAlign: 'center',
  },
  etiquetaTitulo: {
    color: '#FFFFFF',
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 18,
    textAlign: 'center',
  },"""
content = content.replace(styles_old, styles_new)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'w') as f:
    f.write(content)

