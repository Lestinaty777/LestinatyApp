import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# 1. Update GemaMorada component with saturated colors and stroke
old_gema = r"const GemaMorada = \(\{ focused, size = 20 \}: \{ focused: boolean, size\?: number \}\) => \(\n\s*<Svg height=\{size\} viewBox=\"0 0 24 24\" width=\{size\}>\n\s*<Polygon\n\s*fill=\{focused \? '#734AB3' : '#76736D'\}\n\s*points=\"12,2 19\.8,5\.7 21\.7,14\.1 16\.3,20\.8 7\.7,20\.8 2\.3,14\.1 4\.2,5\.7\"\n\s*\/>\n\s*<Polygon\n\s*fill=\{focused \? '#D4B5FF' : 'rgba\(255,255,255,0\.4\)'\}\n\s*points=\"12,7\.1 15\.6,8\.8 16\.5,12\.7 14,15\.8 10,15\.8 7\.5,12\.7 8\.4,8\.8\"\n\s*\/>\n\s*<\/Svg>\n\);"

new_gema = """const GemaMorada = ({ focused, size = 20 }: { focused: boolean, size?: number }) => (
  <Svg height={size} viewBox="0 0 24 24" width={size}>
    <Polygon
      fill={focused ? '#A100FF' : '#76736D'}
      stroke={focused ? '#A100FF' : '#76736D'}
      strokeWidth="1.7"
      strokeLinejoin="round"
      points="12,2 19.8,5.7 21.7,14.1 16.3,20.8 7.7,20.8 2.3,14.1 4.2,5.7"
    />
    <Polygon
      fill={focused ? '#E6B8FF' : 'rgba(255,255,255,0.4)'}
      points="12,7.1 15.6,8.8 16.5,12.7 14,15.8 10,15.8 7.5,12.7 8.4,8.8"
    />
  </Svg>
);"""
content = re.sub(old_gema, new_gema, content)

# 2. Update the pill button colors in navbar
content = content.replace("backgroundColor: 'rgba(115, 74, 179, 0.1)'", "backgroundColor: 'rgba(161, 0, 255, 0.1)'")
content = content.replace("activeMenu === 'store' ? '#734AB3' : '#76736D'", "activeMenu === 'store' ? '#A100FF' : '#76736D'")

# 3. Fix the 3D Badge in PanelTienda so the gem isn't camouflaged
# The badge was: backgroundColor: '#734AB3'. We change it to #111111.
old_badge = r"<View style=\{\{ position: 'absolute', top: 4, left: 0, right: 0, bottom: -4, backgroundColor: oscurecer\('#734AB3', 0\.6\), borderRadius: 8 \}\} \/>\n\s*<View style=\{\{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#734AB3', borderRadius: 8, justifyContent: 'center', alignItems: 'center' \}\}>"
new_badge = """<View style={{ position: 'absolute', top: 4, left: 0, right: 0, bottom: -4, backgroundColor: '#000000', borderRadius: 8 }} />
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#111111', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>"""
content = re.sub(old_badge, new_badge, content)


with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)
