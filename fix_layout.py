import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/rutinas/RutinasAnalisis.tsx', 'r') as f:
    acode = f.read()

# 1. Change panelMitad to width 48%
acode = acode.replace("panelMitad: { flex: 1, minWidth: 0, padding: 16, borderRadius: 24, borderWidth: 1 },", "panelMitad: { width: '48%', padding: 14, borderRadius: 24, borderWidth: 1 },")
acode = acode.replace("panelMitad: { flex: 1, padding: 16, borderRadius: 24, borderWidth: 1 },", "panelMitad: { width: '48%', padding: 14, borderRadius: 24, borderWidth: 1 },")
# Just to be safe, replace all panelMitad definition
styles_spot = "  filaDoble: { flexDirection: 'row', gap: 12, marginTop: 12 },"
new_styles = "  filaDoble: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },\n  panelMitad: { width: '48%', padding: 14, borderRadius: 24, borderWidth: 1 },"
acode = re.sub(r'  filaDoble:.*', new_styles, acode)
acode = re.sub(r'  panelMitad:.*', '', acode) # remove original panelMitad

# 2. Add adjustsFontSizeToFit to Hora Pico text
old_hora = "<Texto style={[styles.numeroGigante, { color: colores.texto }]}>6:42<Texto style={{ fontSize: 16, color: colores.textoSecundario }}> AM</Texto></Texto>"
new_hora = "<Texto style={[styles.numeroGigante, { color: colores.texto }]} numberOfLines={1} adjustsFontSizeToFit>6:42<Texto style={{ fontSize: 16, color: colores.textoSecundario }}> AM</Texto></Texto>"
acode = acode.replace(old_hora, new_hora)

# 3. Add adjustsFontSizeToFit to the other big numbers just in case
old_racha = "<Texto style={[styles.numeroGigante, { fontSize: 24, lineHeight: 28 }]}>28<Texto style={{ fontSize: 12, color: colores.textoSecundario }}> d</Texto></Texto>"
new_racha = "<Texto style={[styles.numeroGigante, { fontSize: 24, lineHeight: 28 }]} numberOfLines={1} adjustsFontSizeToFit>28<Texto style={{ fontSize: 12, color: colores.textoSecundario }}> d</Texto></Texto>"
acode = acode.replace(old_racha, new_racha)

# 4. Donut text
old_donut = "<Texto style={[styles.numeroGigante, { fontSize: 18, lineHeight: 22 }]}>68%</Texto>"
new_donut = "<Texto style={[styles.numeroGigante, { fontSize: 18, lineHeight: 22 }]} numberOfLines={1} adjustsFontSizeToFit>68%</Texto>"
acode = acode.replace(old_donut, new_donut)


with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/rutinas/RutinasAnalisis.tsx', 'w') as f:
    f.write(acode)

