import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'r') as f:
    content = f.read()

# 1. Remove numberOfLines={1} from the Title
content = content.replace("<Texto numberOfLines={1} style={styles.etiquetaTitulo}>{nodo.titulo}</Texto>", "<Texto style={styles.etiquetaTitulo}>{nodo.titulo}</Texto>")

# 2. Shorten subtitle by ~40%
old_sub = "{'Una lección clave diseñada para poner a prueba tus conocimientos y avanzar al siguiente nivel.'}"
new_sub = "{'Lección clave para poner a prueba tus habilidades y avanzar.'}"
content = content.replace(old_sub, new_sub)

# 3. Wider tooltip
content = content.replace("width: 260,", "width: 310,\n    left: -110,")

# 4. Restore the Pixel Art from update_tooltip_style2.py
pixel_old_regex = re.compile(r'<View style=\{styles.tooltipPixelesMarco\}>.*?</View>', re.DOTALL)
pixel_new = """<View style={styles.tooltipPixelesMarco}>
                       <Svg width={48} height={48}>
                          <Rect x={32} y={32} width={16} height={16} fill="rgba(255,255,255,0.2)" />
                          <Rect x={16} y={32} width={16} height={16} fill="rgba(255,255,255,0.1)" />
                          <Rect x={32} y={16} width={16} height={16} fill="rgba(255,255,255,0.1)" />
                          <Rect x={0} y={32} width={16} height={16} fill="rgba(255,255,255,0.05)" />
                          <Rect x={32} y={0} width={16} height={16} fill="rgba(255,255,255,0.05)" />
                       </Svg>
                    </View>"""
content = re.sub(pixel_old_regex, pixel_new, content)

# 5. Make sure the container for pixel frame matches the new size (48x48)
content = re.sub(r'  tooltipPixelesMarco: \{.*?\},', '''  tooltipPixelesMarco: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 48,
    height: 48,
  },''', content, flags=re.DOTALL)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'w') as f:
    f.write(content)

