import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/rutinas/RutinasAnalisis.tsx', 'r') as f:
    acode = f.read()

# 1. Restore Gauge Gradient
old_gauge_path = """<AnimatedPath d="M 20 100 A 70 70 0 0 1 180 100" fill="none" stroke={acento} strokeWidth={14} strokeLinecap="round" strokeDasharray="219.91" strokeDashoffset="14.66" animatedProps={svgProps} />"""
new_gauge_path = """<Defs>
                  <LinearGradient id="gauge" x1="0%" y1="0%" x2="100%" y2="0%">
                    <Stop offset="0%" stopColor={conAlpha(acento, '40')} />
                    <Stop offset="100%" stopColor={acento} />
                  </LinearGradient>
                </Defs>
                <AnimatedPath d="M 20 100 A 70 70 0 0 1 180 100" fill="none" stroke="url(#gauge)" strokeWidth={14} strokeLinecap="round" strokeDasharray="219.91" strokeDashoffset="14.66" animatedProps={svgProps} />"""
acode = acode.replace(old_gauge_path, new_gauge_path)

# 2. Restore Friccion secondary bars
acode = acode.replace("backgroundColor: b.critico ? acento : 'rgba(255,255,255,0.15)'", "backgroundColor: b.critico ? acento : conAlpha(acento, '60')")

# 3. Restore Eficiencia Estimado bar
acode = acode.replace("backgroundColor: 'rgba(255,255,255,0.15)', width: '100%'", "backgroundColor: conAlpha(acento, '60'), width: '100%'")

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/rutinas/RutinasAnalisis.tsx', 'w') as f:
    f.write(acode)

