import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# Add import
import_stmt = "import Book from '../../../../assets/icons/react-pixel-icons/src/icons/Book';\n"
content = content.replace("import { PixelIcon } from '../../../diseno/iconos/PixelIcon';", import_stmt + "import { PixelIcon } from '../../../diseno/iconos/PixelIcon';")

# Replace title structure
old_title = "<Texto style={styles.tituloAsignatura}>Anatomía I</Texto>"
new_title = """<View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <Book size={26} color="#FFFFFF" />
              <Texto style={[styles.tituloAsignatura, { marginBottom: 0 }]}>Anatomía I</Texto>
            </View>"""
content = content.replace(old_title, new_title)

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)

