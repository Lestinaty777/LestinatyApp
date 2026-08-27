import re

# 1. Update SenderosPantalla.tsx
with open('/home/arch-i7/Proyects/app/src/modulos/senderos/pantallas/SenderosPantalla.tsx', 'r') as f:
    senderos_code = f.read()

# Remove the hacky View with translateX
senderos_code = senderos_code.replace(
    '<View style={{ transform: [{ translateX: -1.5 }] }}>\n        <Icono color="#FFFFFF" size={iconoSize} strokeWidth={2.5} />\n      </View>',
    '<View style={StyleSheet.absoluteFillObject}><View style={{flex: 1, alignItems: "center", justifyContent: "center"}}><Icono color="#FFFFFF" size={iconoSize} strokeWidth={2.5} /></View></View>'
)

# And if it didn't match perfectly, let's just use regex to remove it and ensure the Icon is perfectly wrapped:
senderos_code = re.sub(
    r'<View style=\{\{ transform: \[\{ translateX: -1\.5 \}\] \}\}>\s*<Icono (.*?) />\s*</View>',
    r'<View style={{position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center"}}><Icono \1 /></View>',
    senderos_code
)

# Update viewBox
senderos_code = senderos_code.replace('viewBox="0 0 24 23"', 'viewBox="-0.47 -1.16 24 23"')

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/pantallas/SenderosPantalla.tsx', 'w') as f:
    f.write(senderos_code)


# 2. Update Nodo.tsx
with open('/home/arch-i7/Proyects/app/src/diseno/componentes/Nodo.tsx', 'r') as f:
    nodo_code = f.read()

# Update viewBox
nodo_code = nodo_code.replace('viewBox="0 0 24 23"', 'viewBox="-0.47 -1.16 24 23"')

# Remove translateX hack from mini icon
nodo_code = re.sub(
    r'<View style=\{\{ transform: \[\{ translateX: -1\.5 \}\] \}\}>\s*<Icono color="#FFFFFF" size=\{16\} strokeWidth=\{2\.5\} />\s*</View>',
    r'<View style={{position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center"}}><Icono color="#FFFFFF" size={16} strokeWidth={2.5} /></View>',
    nodo_code
)

# Remove translateX hack from main icon
old_main_icon = """          {/* Icono centrado con corrección visual de -1.5px */}
          <View style={[styles.iconoCentrado, { transform: [{ translateX: -1.5 }] }]}>
            <Icono color="#FFFFFF" size={size * 0.4} strokeWidth={2.5} />
          </View>"""
new_main_icon = """          {/* Icono centrado absoluto */}
          <View style={styles.iconoCentrado}>
            <Icono color="#FFFFFF" size={size * 0.4} strokeWidth={2.5} />
          </View>"""
nodo_code = nodo_code.replace(old_main_icon, new_main_icon)

with open('/home/arch-i7/Proyects/app/src/diseno/componentes/Nodo.tsx', 'w') as f:
    f.write(nodo_code)

