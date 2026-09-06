import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# 1. Add Polygon to Svg imports
content = content.replace("import Svg, { Rect, Defs, Pattern, Path } from 'react-native-svg';", "import Svg, { Rect, Defs, Pattern, Path, Polygon } from 'react-native-svg';")

# 2. Add GemaMorada component before InicioPantalla
gema_code = """
const GemaMorada = ({ focused, size = 20 }: { focused: boolean, size?: number }) => (
  <Svg height={size} viewBox="0 0 24 24" width={size}>
    <Polygon
      fill={focused ? '#734AB3' : '#76736D'}
      points="12,2 19.8,5.7 21.7,14.1 16.3,20.8 7.7,20.8 2.3,14.1 4.2,5.7"
    />
    <Polygon
      fill={focused ? '#D4B5FF' : 'rgba(255,255,255,0.4)'}
      points="12,7.1 15.6,8.8 16.5,12.7 14,15.8 10,15.8 7.5,12.7 8.4,8.8"
    />
  </Svg>
);

export function InicioPantalla() {"""
content = content.replace("export function InicioPantalla() {", gema_code)

# 3. Replace <Store /> with <GemaMorada /> in the navbar button
old_btn = r"<Store color=\{activeMenu === 'store' \? '#4CAF50' : '#76736D'\} size=\{20\} fill=\{activeMenu === 'store' \? '#4CAF50' : 'transparent'\} \/>"
new_btn = "<GemaMorada focused={activeMenu === 'store'} size={20} />"
content = re.sub(old_btn, new_btn, content)

# 4. Fix colors in the store button text & bg
content = content.replace("activeMenu === 'store' && { backgroundColor: 'rgba(76, 175, 80, 0.1)' }", "activeMenu === 'store' && { backgroundColor: 'rgba(115, 74, 179, 0.1)' }")
content = content.replace("color: activeMenu === 'store' ? '#4CAF50' : '#76736D'", "color: activeMenu === 'store' ? '#734AB3' : '#76736D'")

# 5. Fix colors in PanelTienda Header
content = content.replace("oscurecer('#4CAF50', 0.6)", "oscurecer('#734AB3', 0.6)")
content = content.replace("backgroundColor: '#4CAF50'", "backgroundColor: '#734AB3'")
old_store_icon_tienda = r"<Store color=\"#FFFFFF\" size=\{24\} fill=\"#FFFFFF\" \/>"
new_store_icon_tienda = "<GemaMorada focused={true} size={24} />"
content = re.sub(old_store_icon_tienda, new_store_icon_tienda, content)


with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)
