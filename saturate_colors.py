import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/rutinas/RutinasAnalisis.tsx', 'r') as f:
    acode = f.read()

# 1. Gauge: Remove Gradient, use solid accent
old_gauge_defs = """<Defs>
                  <LinearGradient id="gauge" x1="0%" y1="0%" x2="100%" y2="0%">
                    <Stop offset="0%" stopColor={conAlpha(acento, '40')} />
                    <Stop offset="100%" stopColor={acento} />
                  </LinearGradient>
                </Defs>"""
acode = acode.replace(old_gauge_defs, "")

old_gauge_path = """<AnimatedPath d="M 20 100 A 70 70 0 0 1 180 100" fill="none" stroke="url(#gauge)" strokeWidth={14} strokeLinecap="round" strokeDasharray="219.91" strokeDashoffset="14.66" animatedProps={svgProps} />"""
new_gauge_path = """<AnimatedPath d="M 20 100 A 70 70 0 0 1 180 100" fill="none" stroke={acento} strokeWidth={14} strokeLinecap="round" strokeDasharray="219.91" strokeDashoffset="14.66" animatedProps={svgProps} />"""
acode = acode.replace(old_gauge_path, new_gauge_path)

# 2. Friccion: Change non-critical from conAlpha(acento, '60') to a neutral white-gray
old_fric = "backgroundColor: b.critico ? acento : conAlpha(acento, '60')"
new_fric = "backgroundColor: b.critico ? acento : 'rgba(255,255,255,0.15)'"
acode = acode.replace(old_fric, new_fric)

# 3. Eficiencia: Change Estimado from conAlpha(acento, '60') to neutral white-gray
# Wait, the code has:
# <View style={[styles.barraRelleno, { backgroundColor: conAlpha(acento, '60'), width: '100%' }]} />
old_esti = "backgroundColor: conAlpha(acento, '60'), width: '100%'"
new_esti = "backgroundColor: 'rgba(255,255,255,0.15)', width: '100%'"
acode = acode.replace(old_esti, new_esti)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/rutinas/RutinasAnalisis.tsx', 'w') as f:
    f.write(acode)

