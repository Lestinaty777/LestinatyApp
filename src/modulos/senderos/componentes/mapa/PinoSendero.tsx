import React from 'react';
import Svg, { Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';
import { useEscala } from '../../../../diseno/tema/MasterColorContext';

export function PinoSendero({ tamano = 34 }: { tamano?: number }) {
  const esc = useEscala();
  return (
    <Svg height={tamano * (40 / 28)} viewBox="0 0 28 40" width={tamano}>
      <Defs>
        <LinearGradient gradientUnits="userSpaceOnUse" id="pinoLuz" x1="5" x2="23" y1="4" y2="31">
          <Stop stopColor={esc.lima.l87} />
          <Stop offset="1" stopColor={esc.hoja.l61} />
        </LinearGradient>
        <LinearGradient gradientUnits="userSpaceOnUse" id="pinoSombra" x1="14" x2="25" y1="8" y2="34">
          <Stop stopColor={esc.hoja.l45} />
          <Stop offset="1" stopColor={esc.jade.l28} />
        </LinearGradient>
      </Defs>
      <Ellipse cx="14" cy="36" fill="#6C6258" fillOpacity={0.16} rx="12" ry="3" />
      <Path d="M11.4 29.2L16.4 30.1V37.1L11.4 35.5V29.2Z" fill="#745239" />
      <Path d="M16.4 30.1L19.2 28.3V35.4L16.4 37.1V30.1Z" fill="#513829" />
      <Path d="M14.1 2L3.2 17.1L14.1 21.8L24.9 17.1L14.1 2Z" fill="url(#pinoSombra)" />
      <Path d="M14.1 2V21.8L24.9 17.1L14.1 2Z" fill="url(#pinoLuz)" />
      <Path d="M14.1 10.1L1.5 25.2L14.1 30.7L26.8 25.2L14.1 10.1Z" fill="url(#pinoSombra)" />
      <Path d="M14.1 10.1V30.7L26.8 25.2L14.1 10.1Z" fill="url(#pinoLuz)" />
      <Path d="M14.1 19.1L0.4 33.1L14.1 38.4L27.7 33.1L14.1 19.1Z" fill={esc.jade.l34a} />
      <Path d="M14.1 19.1V38.4L27.7 33.1L14.1 19.1Z" fill={esc.lima.l69} />
      <Path d="M4.1 32.9L14.1 36.8L24 32.9L14.1 38.4L4.1 32.9Z" fill={esc.jade.l28} fillOpacity={0.48} />
      <Path d="M9.1 16.4L14.1 18.6L19.2 16.4" fill="none" stroke={esc.lima.l93} strokeLinecap="round" strokeOpacity={0.32} strokeWidth={1.2} />
      <Path d="M7.4 25.2L14.1 28.2L20.9 25.2" fill="none" stroke={esc.lima.l93} strokeLinecap="round" strokeOpacity={0.25} strokeWidth={1.2} />
    </Svg>
  );
}
