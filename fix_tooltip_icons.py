import re

# --- 1. Modify Nodo.tsx spacing ---
with open('/home/arch-i7/Proyects/app/src/diseno/componentes/Nodo.tsx', 'r') as f:
    nodo_code = f.read()

# Decrease the marginBottom of the flex-row wrapping the icon and text
nodo_code = nodo_code.replace("flexDirection: 'row', width: '100%', alignItems: 'center', marginBottom: 12", "flexDirection: 'row', width: '100%', alignItems: 'center', marginBottom: 6")

# The Icon in the tooltip already uses `<Icono color="#FFFFFF" size={18} strokeWidth={2.5} />` inside a `<View style={{ width: 44... justifyContent: 'center' }}>`
# Let's ensure it is perfectly centered over the heptagon.
# The Svg is absolute, the View is relative. It should already be perfectly centered, but let's add `position: 'absolute'` just in case for the Icon or wrap it nicely.
# Actually, the previous code was:
"""
                <Svg width={44} height={(44 * 23) / 24} viewBox="0 0 24 23" fill="none" style={{ position: 'absolute' }}>
                  <Path d={PATH_BASE} fill={colorFinal} />
                  <Path d={PATH_BRILLO} fill="#FFFFFF" fillOpacity="0.4" />
                </Svg>
                <Icono color="#FFFFFF" size={18} strokeWidth={2.5} />
"""
# This already centers it because the View is `alignItems: 'center', justifyContent: 'center'`. We'll just tweak size={16} to make it slightly smaller and fit perfectly.
nodo_code = nodo_code.replace('<Icono color="#FFFFFF" size={18} strokeWidth={2.5} />', '<Icono color="#FFFFFF" size={16} strokeWidth={2.5} />')

with open('/home/arch-i7/Proyects/app/src/diseno/componentes/Nodo.tsx', 'w') as f:
    f.write(nodo_code)

# --- 2. Modify MapaCompartido.tsx for unique icons ---
with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/MapaCompartido.tsx', 'r') as f:
    mapa_code = f.read()

# Update imports
old_imports = "import { Compass, Flame, Leaf, PiggyBank, Target, Users } from 'lucide-react-native';"
new_imports = "import { Compass, Flame, Leaf, PiggyBank, Target, Users, BookOpen, Zap, Star, Trophy, Activity, Flag } from 'lucide-react-native';\nimport type { LucideIcon } from 'lucide-react-native';"
mapa_code = mapa_code.replace(old_imports, new_imports)

# Add icono_lucide to NodoDef
mapa_code = mapa_code.replace(
    "subtitulo: string;\n}", 
    "subtitulo: string;\n  icono_lucide: LucideIcon;\n}"
)

# Update map generator
old_mock_gen = """  const subtitulos = [
    'Estudia la teoría inicial.', 'Pon a prueba tus dedos.', 'Ejercicios rápidos de reflejos.',
    'Revisa lo aprendido ayer.', 'Nuevas técnicas complejas.', 'Simulador de velocidad.',
    'Únete a la escuadra aquí.', 'Teoría de nivel medio.', 'Práctica de ritmo.',
    'Lee sobre el flujo.', 'Un maratón de 10 minutos.', '¡Reclama tu trofeo!'
  ];"""

new_mock_gen = """  const subtitulos = [
    'Estudia la teoría inicial.', 'Pon a prueba tus dedos.', 'Ejercicios rápidos de reflejos.',
    'Revisa lo aprendido ayer.', 'Nuevas técnicas complejas.', 'Simulador de velocidad.',
    'Únete a la escuadra aquí.', 'Teoría de nivel medio.', 'Práctica de ritmo.',
    'Lee sobre el flujo.', 'Un maratón de 10 minutos.', '¡Reclama tu trofeo!'
  ];
  
  const iconosNodos = [
    BookOpen, Target, Zap, 
    Activity, Star, Compass, 
    Users, PiggyBank, Leaf, 
    Flag, Flame, Trophy
  ];"""
mapa_code = mapa_code.replace(old_mock_gen, new_mock_gen)

old_return_mock = """    titulo: titulos[i],
    subtitulo: subtitulos[i],
  };"""

new_return_mock = """    titulo: titulos[i],
    subtitulo: subtitulos[i],
    icono_lucide: iconosNodos[i],
  };"""
mapa_code = mapa_code.replace(old_return_mock, new_return_mock)

# Update the rendering of Nodo
old_nodo_render = """                <Nodo 
                  Icono={nodo.tipo === 'meta' ? Flame : Compass}"""

new_nodo_render = """                <Nodo 
                  Icono={nodo.icono_lucide}"""
mapa_code = mapa_code.replace(old_nodo_render, new_nodo_render)


with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/MapaCompartido.tsx', 'w') as f:
    f.write(mapa_code)
