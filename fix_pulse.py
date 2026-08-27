import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/MapaCompartido.tsx', 'r') as f:
    content = f.read()

# 1. Add reanimated import
import_reanimated = "import AnimatedReanimated, { useSharedValue, useAnimatedProps, withRepeat, withTiming } from 'react-native-reanimated';\n"
content = content.replace("import Svg, { Path, Rect } from 'react-native-svg';", "import Svg, { Path, Rect } from 'react-native-svg';\n" + import_reanimated)

# 2. Fix AnimatedPath definition
content = content.replace("const AnimatedPath = Animated.createAnimatedComponent(Path);", "const AnimatedPath = AnimatedReanimated.createAnimatedComponent(Path);")

# 3. Fix the hook and props
old_hook = """  // Animacion de pulso para el camino activo
  const pulseAnim = useSharedValue(0.15);
  useEffect(() => {
    pulseAnim.value = withRepeat(
      withTiming(0.65, { duration: 1200 }),
      -1,
      true
    );
  }, []);
  
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseAnim.value
  }));"""

new_hook = """  // Animacion de pulso para el camino activo
  const pulseAnim = useSharedValue(0.15);
  useEffect(() => {
    pulseAnim.value = withRepeat(
      withTiming(0.65, { duration: 1200 }),
      -1,
      true
    );
  }, [pulseAnim]);
  
  const animatedProps = useAnimatedProps(() => ({
    strokeOpacity: pulseAnim.value
  }));"""

content = content.replace(old_hook, new_hook)

# 4. Fix the Path usage
old_path = """              // Camino palpitante
              paths.push(
                <AnimatedPath 
                  key={`${nodo.id}-${destinoId}`} 
                  d={d} 
                  stroke={masterColor}
                  strokeWidth={12}
                  strokeLinecap="round"
                  fill="none" 
                  style={pulseStyle}
                />
              );"""

new_path = """              // Camino palpitante
              paths.push(
                <AnimatedPath 
                  key={`${nodo.id}-${destinoId}`} 
                  d={d} 
                  stroke={masterColor}
                  strokeWidth={12}
                  strokeLinecap="round"
                  fill="none" 
                  animatedProps={animatedProps}
                />
              );"""

content = content.replace(old_path, new_path)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/MapaCompartido.tsx', 'w') as f:
    f.write(content)
