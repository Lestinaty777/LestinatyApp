import React from 'react';
import Svg, { Path } from 'react-native-svg';

type PiedrasSenderoProps = {
  tamano: number;
};

export function PiedrasSendero({ tamano }: PiedrasSenderoProps) {
  return (
    <Svg height={tamano * 0.6} viewBox="0 0 64 38" width={tamano}>
      <Path d="M4 28 17 20l16 5 11-8 16 7-15 12H18Z" fill="#817B74" opacity={0.62} />
      <Path d="m7 25 10-13 15 4 4 12-13 6Z" fill="#D7D3CD" />
      <Path d="m7 25 16 9 13-6-4-12Z" fill="#9D9790" />
      <Path d="m21 19 10-9 11 4 2 10-12 5-11-4Z" fill="#E4E0DA" />
      <Path d="m21 19 11 6 12-1-2-10Z" fill="#ADA7A0" />
      <Path d="m42 27 8-8 9 4 1 8-10 4Z" fill="#D0CBC4" />
      <Path d="m42 27 8 8 10-4-1-8Z" fill="#908A83" />
    </Svg>
  );
}
