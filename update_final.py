import re

# Fix RutinasAnalisis
with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/rutinas/RutinasAnalisis.tsx', 'r') as f:
    rcode = f.read()

rcode = rcode.replace('estados.contador', 'estados[mockCronometro.id]')
rcode = rcode.replace('estados[mockCronometro.id] || "activo"} color={acento} onEvento={manejarEvento} />\n        </View>\n\n        <View>\n          <Texto style={{ color: acento, fontFamily: \'MontserratAlternates-Bold\', fontSize: 14, marginBottom: 8 }}>3. Widget Registro Numérico</Texto>\n          <RenderizadorAccion widget={mockRegistro} estado={estados[mockCronometro.id]', 'estados[mockCronometro.id] || "activo"} color={acento} onEvento={manejarEvento} />\n        </View>\n\n        <View>\n          <Texto style={{ color: acento, fontFamily: \'MontserratAlternates-Bold\', fontSize: 14, marginBottom: 8 }}>3. Widget Registro Numérico</Texto>\n          <RenderizadorAccion widget={mockRegistro} estado={estados[mockRegistro.id]')
rcode = rcode.replace('estados[mockCronometro.id]', 'estados[mockChecklist.id]', 1) # This is getting messy, let's just do regex

rcode = re.sub(r'estado=\{estados\[mockCronometro\.id\] \|\| "activo"\} color=\{acento\} onEvento=\{manejarEvento\} />', r'estado={estados.cronometro || "activo"} color={acento} onEvento={manejarEvento} />', rcode)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/rutinas/RutinasAnalisis.tsx', 'w') as f:
    f.write(rcode)

