import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'r') as f:
    content = f.read()

# Replace the text content to override the "10 min" subtitulo with a real description
text_old = "<Texto style={styles.etiquetaMeta}>{nodo.subtitulo || 'Sin descripción adicional.'}</Texto>"
text_new = "<Texto style={styles.etiquetaMeta}>{'Una lección clave diseñada para poner a prueba tus conocimientos y avanzar al siguiente nivel.'}</Texto>"
content = content.replace(text_old, text_new)

# Update pixel art marco
pixel_old = """                    <View style={styles.tooltipPixelesMarco}>
                       <Svg width={24} height={24}>
                          <Rect x={16} y={16} width={8} height={8} fill="rgba(0,0,0,0.15)" />
                          <Rect x={8} y={16} width={8} height={8} fill="rgba(0,0,0,0.1)" />
                          <Rect x={16} y={8} width={8} height={8} fill="rgba(0,0,0,0.1)" />
                       </Svg>
                    </View>"""
pixel_new = """                    <View style={styles.tooltipPixelesMarco}>
                       <Svg width={48} height={48}>
                          <Rect x={32} y={32} width={16} height={16} fill="rgba(255,255,255,0.2)" />
                          <Rect x={16} y={32} width={16} height={16} fill="rgba(255,255,255,0.1)" />
                          <Rect x={32} y={16} width={16} height={16} fill="rgba(255,255,255,0.1)" />
                          <Rect x={0} y={32} width={16} height={16} fill="rgba(255,255,255,0.05)" />
                          <Rect x={32} y={0} width={16} height={16} fill="rgba(255,255,255,0.05)" />
                       </Svg>
                    </View>"""
content = content.replace(pixel_old, pixel_new)

# Update styles for align left and bigger font
styles_old_box = """  tooltipCaja: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    alignItems: 'center',
    width: '100%',"""
styles_new_box = """  tooltipCaja: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: 'flex-start',
    width: '100%',"""
content = content.replace(styles_old_box, styles_new_box)

styles_old_meta = """  etiquetaMeta: {
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
styles_new_meta = """  etiquetaMeta: {
    fontFamily: 'MontserratAlternates-Medium',
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 6,
    textAlign: 'left',
    lineHeight: 18,
  },
  etiquetaTitulo: {
    color: '#FFFFFF',
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 24,
    textAlign: 'left',
  },"""
content = content.replace(styles_old_meta, styles_new_meta)

# Fix label width so description fits nicely
content = content.replace("width: 232,", "width: 260,")
content = content.replace("left: -80,", "left: -94,")

# Pixel marco positioning
content = content.replace("width: 24,\n    height: 24,", "width: 48,\n    height: 48,")

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'w') as f:
    f.write(content)

