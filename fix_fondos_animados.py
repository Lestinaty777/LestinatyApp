import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

imports_old = "import Svg, { Defs, Pattern, Rect } from 'react-native-svg';"
imports_new = "import Svg, { Defs, Pattern, Rect, Path, Circle } from 'react-native-svg';\nimport { Animated, Easing } from 'react-native';"
content = content.replace(imports_old, imports_new)

# Add FondoAnimado component
fondo_animado = """
const AnimatedPattern = Animated.createAnimatedComponent(Pattern);

function FondoAnimado({ idAsignatura, color }: { idAsignatura: string, color: string }) {
  const offset = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.timing(offset, {
        toValue: 40,
        duration: 12000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();
  }, []);

  const patternTransform = offset.interpolate({
    inputRange: [0, 40],
    outputRange: ['translate(0,0)', 'translate(40,40)'],
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          {idAsignatura === '1' && (
            <AnimatedPattern id="pat1" width={40} height={40} patternUnits="userSpaceOnUse" patternTransform={patternTransform}>
              <Path d="M0,40 L40,0" stroke="#ffffff" strokeWidth={2.4} opacity={0.75} />
            </AnimatedPattern>
          )}
          {idAsignatura === '2' && (
            <AnimatedPattern id="pat2" width={58} height={58} patternUnits="userSpaceOnUse" patternTransform={patternTransform}>
              <Circle cx={29} cy={29} r={10} fill="none" stroke="#ffffff" strokeWidth={2.4} opacity={0.75} />
            </AnimatedPattern>
          )}
          {idAsignatura === '3' && (
            <AnimatedPattern id="pat3" width={40} height={40} patternUnits="userSpaceOnUse" patternTransform={patternTransform}>
              <Path d="M20,4 L36,20 L20,36 L4,20 Z" fill="none" stroke="#ffffff" strokeWidth={2.2} opacity={0.7} />
            </AnimatedPattern>
          )}
        </Defs>
        {idAsignatura === '1' && <Rect width="100%" height="100%" fill="url(#pat1)" />}
        {idAsignatura === '2' && <Rect width="100%" height="100%" fill="url(#pat2)" />}
        {idAsignatura === '3' && <Rect width="100%" height="100%" fill="url(#pat3)" />}
      </Svg>
    </View>
  );
}
"""

content = content.replace("const TexturaPixelArt = () => (", fondo_animado + "\nconst TexturaPixelArt = () => (")

# Replace TexturaPixelArt inside the main card with FondoAnimado
old_card = """          <View style={[styles.tarjetaAsignatura, { backgroundColor: asignatura.color }]}>
            <TexturaPixelArt />"""
new_card = """          <View style={[styles.tarjetaAsignatura, { backgroundColor: asignatura.color }]}>
            <FondoAnimado idAsignatura={asignatura.id} color={asignatura.color} />"""
content = content.replace(old_card, new_card)

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)
