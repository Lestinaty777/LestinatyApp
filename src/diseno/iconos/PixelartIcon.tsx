import React from 'react';
import { View, type ViewStyle, type StyleProp } from 'react-native';
import Svg, { Path } from 'react-native-svg';
// We import the json file
import glyphMap from 'pixelarticons/fonts/pixelart-icons-font.json';

export type PixelartIconName = keyof typeof glyphMap;

interface PixelartIconProps {
  name: PixelartIconName;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export function PixelartIcon({ name, size = 24, color = '#FFFFFF', style }: PixelartIconProps) {
  const paths = glyphMap[name] as string[];
  
  if (!paths) {
    return <View style={[{ width: size, height: size }, style]} />;
  }

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width="100%" height="100%" viewBox="0 0 24 24" fill={color}>
        {paths.map((d, index) => (
          <Path key={index} d={d} />
        ))}
      </Svg>
    </View>
  );
}
