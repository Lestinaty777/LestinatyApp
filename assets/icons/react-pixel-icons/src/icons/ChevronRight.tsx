import * as React from 'react';
import Svg, { Rect } from 'react-native-svg';

import { SvgProps } from 'react-native-svg';
export interface IconProps extends SvgProps {
  size?: number | string;
  color?: string;
}

const ChevronRight = React.forwardRef<any, IconProps>(
  ({ size = 24, color = '#111111', ...props }, ref) => (
    <Svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      
      
      {...props}
    >
      <Rect x="8" y="5" width="2" height="1" />
      <Rect x="8" y="6" width="3" height="1" />
      <Rect x="9" y="7" width="3" height="1" />
      <Rect x="10" y="8" width="3" height="1" />
      <Rect x="11" y="9" width="3" height="1" />
      <Rect x="12" y="10" width="3" height="1" />
      <Rect x="13" y="11" width="3" height="1" />
      <Rect x="13" y="12" width="3" height="1" />
      <Rect x="12" y="13" width="3" height="1" />
      <Rect x="11" y="14" width="3" height="1" />
      <Rect x="10" y="15" width="3" height="1" />
      <Rect x="9" y="16" width="3" height="1" />
      <Rect x="8" y="17" width="3" height="1" />
      <Rect x="8" y="18" width="2" height="1" />
    </Svg>
  )
);

ChevronRight.displayName = 'ChevronRight';

export default ChevronRight;
