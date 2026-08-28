import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/rutinas/RutinasAnalisis.tsx', 'r') as f:
    acode = f.read()

# 1. Update imports
old_re = "import Reanimated, { FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';"
new_re = "import Reanimated, { FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, useAnimatedProps } from 'react-native-reanimated';"
acode = acode.replace(old_re, new_re)

# 2. Add svgProps
hook_spot = "  const estiloNeon = useAnimatedStyle(() => ({"
new_hook_spot = """  const svgProps = useAnimatedProps(() => ({
    opacity: pulsoEnergia.value
  })) as any;

  const estiloNeon = useAnimatedStyle(() => ({"""
acode = acode.replace(hook_spot, new_hook_spot)

# 3. Fix Path and Circle
old_path = """<AnimatedPath d="M 20 100 A 70 70 0 0 1 180 100" fill="none" stroke="url(#gauge)" strokeWidth={14} strokeLinecap="round" strokeDasharray="219.91" strokeDashoffset="14.66" style={estiloGlow} />"""
new_path = """<AnimatedPath d="M 20 100 A 70 70 0 0 1 180 100" fill="none" stroke="url(#gauge)" strokeWidth={14} strokeLinecap="round" strokeDasharray="219.91" strokeDashoffset="14.66" animatedProps={svgProps} />"""
acode = acode.replace(old_path, new_path)

old_circ = """<AnimatedCircle cx="80" cy="80" r="60" fill="none" stroke={acento} strokeWidth="18" strokeDasharray="256.35 120.64" transform="rotate(-90 80 80)" style={estiloGlow} />"""
new_circ = """<AnimatedCircle cx="80" cy="80" r="60" fill="none" stroke={acento} strokeWidth="18" strokeDasharray="256.35 120.64" transform="rotate(-90 80 80)" animatedProps={svgProps} />"""
acode = acode.replace(old_circ, new_circ)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/rutinas/RutinasAnalisis.tsx', 'w') as f:
    f.write(acode)

