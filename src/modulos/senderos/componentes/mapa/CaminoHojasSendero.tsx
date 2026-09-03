import React from 'react';
import Svg, { Ellipse } from 'react-native-svg';

type CaminoHojasSenderoProps = {
  color: string;
  opacidad?: number;
  tamano?: number;
};

const hojas = [
  [5.5, 7, 5.5, 2, 0], [20, 25.5, 4, 1.5, 0], [20, 8, 4, 1.5, 180],
  [19, 23.5, 4, 1.5, 180], [7, 14.5, 4, 1.5, 180], [11, 16.5, 4, 1.5, 0],
  [16, 15.5, 4, 1.5, 0], [9, 8.5, 4, 1.5, 180], [13, 13.5, 4, 1.5, 0],
  [11, 11, 5, 2, 0], [4, 4.5, 4, 1.5, 180], [10, 5.5, 4, 1.5, 0],
  [5, 10.5, 4, 1.5, 180], [14, 20.5, 4, 1.5, 180], [20, 19.5, 4, 1.5, 180],
  [15, 22.5, 4, 1.5, 180], [22, 33.5, 4, 1.5, 0], [21, 31.5, 4, 1.5, 180],
  [17, 30.5, 4, 1.5, 180],
] as const;

export function CaminoHojasSendero({ color, opacidad = 0.22, tamano = 32 }: CaminoHojasSenderoProps) {
  return (
    <Svg height={tamano * (35 / 26)} viewBox="0 0 26 35" width={tamano}>
      {hojas.map(([cx, cy, rx, ry, rotacion], indice) => (
        <Ellipse
          cx={cx}
          cy={cy}
          fill={color}
          key={`${cx}-${cy}-${indice}`}
          opacity={opacidad * (indice % 3 === 0 ? 1 : indice % 3 === 1 ? 0.78 : 0.58)}
          rx={rx}
          ry={ry}
          transform={rotacion ? `rotate(${rotacion} ${cx} ${cy})` : undefined}
        />
      ))}
    </Svg>
  );
}
