import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/salud/SaludAnalisis.tsx', 'r') as f:
    acode = f.read()

# Replace AnimatedCircle style with animatedProps
hook1 = """  const estiloLatido = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulsoLatido.value * 0.15 }],
    opacity: 0.7 + pulsoLatido.value * 0.3
  }));"""
new_hook1 = """  const latidoProps = useAnimatedProps(() => ({
    transform: [{ scale: 1 + pulsoLatido.value * 0.15 }],
    opacity: 0.7 + pulsoLatido.value * 0.3
  })) as any;"""
acode = acode.replace(hook1, new_hook1)

hook2 = """                        style={estiloLatido}"""
new_hook2 = """                        animatedProps={latidoProps}"""
acode = acode.replace(hook2, new_hook2)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/salud/SaludAnalisis.tsx', 'w') as f:
    f.write(acode)

