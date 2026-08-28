import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/rutinas/RutinasAnalisis.tsx', 'r') as f:
    acode = f.read()

# Remove the opacity pulsing from svgProps
acode = acode.replace("  const svgProps = useAnimatedProps(() => ({\n    opacity: pulsoEnergia.value\n  })) as any;", "  const svgProps = useAnimatedProps(() => ({\n    // Removed opacity pulse for readability\n  })) as any;")

# Remove the opacity pulsing from estiloNeon
acode = acode.replace("  const estiloNeon = useAnimatedStyle(() => ({\n    opacity: pulsoEnergia.value,\n    shadowColor: acento,", "  const estiloNeon = useAnimatedStyle(() => ({\n    shadowColor: acento,")

# Remove the pulsoEnergia useEffect block
old_effect_block = """  useEffect(() => {
    pulsoEnergia.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0.6, { duration: 1500 })
      ),
      -1,
      true
    );"""
new_effect_block = """  useEffect(() => {"""
acode = acode.replace(old_effect_block, new_effect_block)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/rutinas/RutinasAnalisis.tsx', 'w') as f:
    f.write(acode)

