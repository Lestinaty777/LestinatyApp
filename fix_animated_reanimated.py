import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# 1. Clean up imports
content = content.replace("import { StyleSheet, View, useWindowDimensions, Pressable, ScrollView, Animated as RNAnimated, Easing as RNEasing } from 'react-native';", "import { StyleSheet, View, useWindowDimensions, Pressable, ScrollView } from 'react-native';")

content = content.replace("import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, withSpring } from 'react-native-reanimated';", "import Animated, { useSharedValue, useAnimatedStyle, useAnimatedProps, withTiming, Easing, withSpring, withRepeat } from 'react-native-reanimated';")

# 2. Rewrite FondoAnimado using Reanimated
old_fondo = """const AnimatedPattern = RNAnimated.createAnimatedComponent(Pattern);

function FondoAnimado({ idAsignatura, color }: { idAsignatura: string, color: string }) {
  const offset = React.useRef(new RNAnimated.Value(0)).current;

  React.useEffect(() => {
    RNAnimated.loop(
      RNAnimated.timing(offset, {
        toValue: 40,
        duration: 12000,
        easing: RNEasing.linear,
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
}"""

new_fondo = """const AnimatedPattern = Animated.createAnimatedComponent(Pattern);

function FondoAnimado({ idAsignatura, color }: { idAsignatura: string, color: string }) {
  const offset = useSharedValue(0);

  React.useEffect(() => {
    offset.value = withRepeat(
      withTiming(40, { duration: 12000, easing: Easing.linear }),
      -1, // infinite
      false // don't reverse
    );
  }, []);

  const animatedProps = useAnimatedProps(() => ({
    patternTransform: `translate(${offset.value}, ${offset.value})`
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          {idAsignatura === '1' && (
            <AnimatedPattern id="pat1" width={40} height={40} patternUnits="userSpaceOnUse" animatedProps={animatedProps}>
              <Path d="M0,40 L40,0" stroke="#ffffff" strokeWidth={2.4} opacity={0.75} />
            </AnimatedPattern>
          )}
          {idAsignatura === '2' && (
            <AnimatedPattern id="pat2" width={58} height={58} patternUnits="userSpaceOnUse" animatedProps={animatedProps}>
              <Circle cx={29} cy={29} r={10} fill="none" stroke="#ffffff" strokeWidth={2.4} opacity={0.75} />
            </AnimatedPattern>
          )}
          {idAsignatura === '3' && (
            <AnimatedPattern id="pat3" width={40} height={40} patternUnits="userSpaceOnUse" animatedProps={animatedProps}>
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
}"""

content = content.replace(old_fondo, new_fondo)

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)
