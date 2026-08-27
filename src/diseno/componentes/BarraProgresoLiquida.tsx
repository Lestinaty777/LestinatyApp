import React from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export function Burbuja({ delay, size, duration, top }: any) {
  const translateX = useSharedValue(-20);
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      translateX.value = withRepeat(
        withTiming(300, { duration, easing: Easing.linear }),
        -1, false
      );
    }, delay);
    return () => clearTimeout(timeout);
  }, [delay, duration, translateX]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return <Animated.View style={[style, {
    position: 'absolute', top, width: size, height: size,
    borderRadius: size/2, backgroundColor: 'rgba(255,255,255,0.45)'
  }]} />;
}

export function BarraProgresoLiquida({ porcentaje, color }: any) {
  const widthAnim = useSharedValue(0);
  React.useEffect(() => {
    widthAnim.value = withSpring(porcentaje, { damping: 15 });
  }, [porcentaje, widthAnim]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${widthAnim.value}%`
  }));

  return (
    <View style={{ height: 14, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 7, overflow: 'hidden', width: '100%', marginTop: 10, borderColor: 'rgba(255,255,255,0.15)', borderWidth: 1 }}>
      <Animated.View style={[barStyle, { height: '100%', backgroundColor: color, overflow: 'hidden' }]}>
        <Burbuja delay={0} size={6} duration={2500} top={4} />
        <Burbuja delay={600} size={4} duration={2000} top={1} />
        <Burbuja delay={1200} size={8} duration={3000} top={-2} />
        <Burbuja delay={1800} size={5} duration={2200} top={5} />
        <Burbuja delay={2400} size={3} duration={1800} top={2} />
      </Animated.View>
    </View>
  );
}

