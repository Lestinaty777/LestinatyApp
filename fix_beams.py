import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/rutinas/RutinasAnalisis.tsx', 'r') as f:
    acode = f.read()

# 1. Update the Animated Styles
old_shimmer = """  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: '20deg' },
      { translateX: -50 + (rayoOffset.value * 400) }
    ]
  }));"""

new_beams = """  const beamStyleH = useAnimatedStyle(() => ({
    transform: [
      { translateX: -20 + (rayoOffset.value * 350) }
    ]
  }));

  const beamStyleV = useAnimatedStyle(() => ({
    transform: [
      { translateY: -10 + (rayoOffset.value * 130) }
    ]
  }));"""
acode = acode.replace(old_shimmer, new_beams)

# 2. Update Horizontal Bar (Eficiencia)
old_efi_inner = """<Reanimated.View style={[{ width: 20, height: '300%', backgroundColor: 'rgba(255,255,255,0.4)', position: 'absolute', top: -10, left: 0 }, shimmerStyle]} />"""
new_efi_inner = """<Reanimated.View style={[{ width: 4, height: '100%', backgroundColor: '#FFFFFF', position: 'absolute', top: 0, left: 0, opacity: 0.8, borderRadius: 2, shadowColor: '#FFF', shadowOpacity: 1, shadowRadius: 4 }, beamStyleH]} />"""
acode = acode.replace(old_efi_inner, new_efi_inner)

# 3. Update Vertical Bar (Friccion)
old_fric_inner = """<Reanimated.View style={[{ width: '300%', height: 15, backgroundColor: 'rgba(255,255,255,0.4)', position: 'absolute', left: -10, top: 0 }, shimmerStyle]} />"""
new_fric_inner = """<Reanimated.View style={[{ width: '100%', height: 4, backgroundColor: '#FFFFFF', position: 'absolute', left: 0, top: 0, opacity: 0.8, borderRadius: 2, shadowColor: '#FFF', shadowOpacity: 1, shadowRadius: 4 }, beamStyleV]} />"""
acode = acode.replace(old_fric_inner, new_fric_inner)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/rutinas/RutinasAnalisis.tsx', 'w') as f:
    f.write(acode)

