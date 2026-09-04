import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const GripHorizontal = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="4" y="7" width="2" height="1" />
      <rect x="11" y="7" width="2" height="1" />
      <rect x="18" y="7" width="2" height="1" />
      <rect x="3" y="8" width="4" height="1" />
      <rect x="10" y="8" width="4" height="1" />
      <rect x="17" y="8" width="4" height="1" />
      <rect x="3" y="9" width="4" height="1" />
      <rect x="10" y="9" width="4" height="1" />
      <rect x="17" y="9" width="4" height="1" />
      <rect x="4" y="10" width="2" height="1" />
      <rect x="11" y="10" width="2" height="1" />
      <rect x="18" y="10" width="2" height="1" />
      <rect x="4" y="13" width="2" height="1" />
      <rect x="11" y="13" width="2" height="1" />
      <rect x="18" y="13" width="2" height="1" />
      <rect x="3" y="14" width="4" height="1" />
      <rect x="10" y="14" width="4" height="1" />
      <rect x="17" y="14" width="4" height="1" />
      <rect x="3" y="15" width="4" height="1" />
      <rect x="10" y="15" width="4" height="1" />
      <rect x="17" y="15" width="4" height="1" />
      <rect x="4" y="16" width="2" height="1" />
      <rect x="11" y="16" width="2" height="1" />
      <rect x="18" y="16" width="2" height="1" />
    </svg>
  )
);

GripHorizontal.displayName = 'GripHorizontal';

export default GripHorizontal;
