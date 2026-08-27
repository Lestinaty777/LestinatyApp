import { PropsWithChildren } from 'react';
import { BlurView, BlurViewProps } from 'expo-blur';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

type RecuadroGlassProps = PropsWithChildren<{
  blur?: boolean;
  intensity?: number;
  style?: StyleProp<ViewStyle>;
  tint?: BlurViewProps['tint'];
}>;

export function RecuadroGlass({ blur = false, children, intensity = 24, style, tint = 'light' }: RecuadroGlassProps) {
  if (blur) {
    return (
      <BlurView intensity={intensity} tint={tint} style={[styles.base, style]}>
        <View pointerEvents="none" style={styles.tinteBlur} />
        <View pointerEvents="none" style={styles.sombraInterna} />
        {children}
      </BlurView>
    );
  }

  return (
    <View style={[styles.base, style]}>
      <View pointerEvents="none" style={styles.sombraInterna} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  tinteBlur: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  sombraInterna: {
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderTopWidth: 0.5,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
