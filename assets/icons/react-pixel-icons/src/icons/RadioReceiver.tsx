import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const RadioReceiver = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, color = '#111111', ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      shapeRendering="crispEdges"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect x="2" y="7" width="20" height="1" />
      <rect x="1" y="8" width="22" height="1" />
      <rect x="1" y="9" width="2" height="1" />
      <rect x="21" y="9" width="2" height="1" />
      <rect x="1" y="10" width="2" height="1" />
      <rect x="21" y="10" width="2" height="1" />
      <rect x="1" y="11" width="2" height="1" />
      <rect x="17" y="11" width="2" height="1" />
      <rect x="21" y="11" width="2" height="1" />
      <rect x="1" y="12" width="2" height="1" />
      <rect x="17" y="12" width="2" height="1" />
      <rect x="21" y="12" width="2" height="1" />
      <rect x="1" y="13" width="2" height="1" />
      <rect x="21" y="13" width="2" height="1" />
      <rect x="1" y="14" width="2" height="1" />
      <rect x="21" y="14" width="2" height="1" />
      <rect x="1" y="15" width="22" height="1" />
      <rect x="2" y="16" width="20" height="1" />
      <rect x="4" y="17" width="2" height="1" />
      <rect x="18" y="17" width="2" height="1" />
      <rect x="4" y="18" width="2" height="1" />
      <rect x="18" y="18" width="2" height="1" />
    </svg>
  )
);

RadioReceiver.displayName = 'RadioReceiver';

export default RadioReceiver;
