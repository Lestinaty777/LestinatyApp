import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# Replace imports
content = content.replace("import { Book, Calendar, Sparkles, Store } from 'lucide-react-native';", "import { PixelIcon } from '../../../../diseno/iconos/PixelIcon';")

# Replace icons in JSX
# <Book color="#FFF" size={24} /> -> <PixelIcon name="libro" color="#FFF" size={24} />
content = content.replace("<Book color=\"#FFF\" size={24} />", '<PixelIcon name="libro" color="#FFF" size={24} />')
content = content.replace("<Calendar color=\"#FFF\" size={24} />", '<PixelIcon name="calendario" color="#FFF" size={24} />')
content = content.replace("<Sparkles color=\"#FFF\" size={24} />", '<PixelIcon name="destellos" color="#FFF" size={24} />')
content = content.replace("<Store color=\"#FFF\" size={24} />", '<PixelIcon name="tienda" color="#FFF" size={24} />')

# Also they had opacity or something? 
# In InicioPantalla.tsx:
# <Pressable style={styles.iconoNav}><Book color="#FFF" size={24} /></Pressable>

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)

