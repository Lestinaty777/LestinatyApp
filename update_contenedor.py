import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'r') as f:
    content = f.read()

# 1. Clean the bases.
old_bases = r"\{/\* Bases laterales controladas \*/\}.+?<Image source=\{assetBase\.fuente\} style=\{\{ position: 'absolute', top: 850.+?/>"
content = re.sub(old_bases, "", content, flags=re.DOTALL)

# 2. Add volteado support
old_image = r"<Image resizeMode=\"contain\" source=\{asset\.fuente\} style=\{styles\.decoracionBiomaImagen\} />"
new_image = "<Image resizeMode=\"contain\" source={asset.fuente} style={[styles.decoracionBiomaImagen, decoracion.volteado && { transform: [{ scaleX: -1 }] }]} />"
content = content.replace(old_image, new_image)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'w') as f:
    f.write(content)
