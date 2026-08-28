import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/rutinas/RutinasAnalisis.tsx', 'r') as f:
    acode = f.read()

# I will replace everything between useEffect(() => { and }, []);
old_effect = """  useEffect(() => {
    pulsoEnergia.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0.6, { duration: 1500 })
      ),
      -1,
      true
    );

    rayoOffset.value = withRepeat(
      withTiming(1, { duration: 2500, easing: Easing.linear }),
      ),
      -1,
      true
    );
  }, []);"""

new_effect = """  useEffect(() => {
    pulsoEnergia.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0.6, { duration: 1500 })
      ),
      -1,
      true
    );

    rayoOffset.value = withRepeat(
      withTiming(1, { duration: 2500, easing: Easing.linear }),
      -1,
      false
    );
  }, []);"""
acode = acode.replace(old_effect, new_effect)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/rutinas/RutinasAnalisis.tsx', 'w') as f:
    f.write(acode)

