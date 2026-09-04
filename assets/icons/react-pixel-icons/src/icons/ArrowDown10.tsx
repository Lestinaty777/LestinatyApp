import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const ArrowDown10 = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="6" y="3" width="2" height="1" />
      <rect x="14" y="3" width="4" height="1" />
      <rect x="6" y="4" width="2" height="1" />
      <rect x="14" y="4" width="4" height="1" />
      <rect x="6" y="5" width="2" height="1" />
      <rect x="16" y="5" width="2" height="1" />
      <rect x="6" y="6" width="2" height="1" />
      <rect x="16" y="6" width="2" height="1" />
      <rect x="6" y="7" width="2" height="1" />
      <rect x="16" y="7" width="2" height="1" />
      <rect x="6" y="8" width="2" height="1" />
      <rect x="16" y="8" width="2" height="1" />
      <rect x="6" y="9" width="2" height="1" />
      <rect x="14" y="9" width="6" height="1" />
      <rect x="6" y="10" width="2" height="1" />
      <rect x="14" y="10" width="6" height="1" />
      <rect x="6" y="11" width="2" height="1" />
      <rect x="6" y="12" width="2" height="1" />
      <rect x="6" y="13" width="2" height="1" />
      <rect x="15" y="13" width="4" height="1" />
      <rect x="6" y="14" width="2" height="1" />
      <rect x="14" y="14" width="6" height="1" />
      <rect x="2" y="15" width="2" height="1" />
      <rect x="6" y="15" width="2" height="1" />
      <rect x="10" y="15" width="2" height="1" />
      <rect x="14" y="15" width="2" height="1" />
      <rect x="18" y="15" width="2" height="1" />
      <rect x="2" y="16" width="3" height="1" />
      <rect x="6" y="16" width="2" height="1" />
      <rect x="9" y="16" width="3" height="1" />
      <rect x="14" y="16" width="2" height="1" />
      <rect x="18" y="16" width="2" height="1" />
      <rect x="3" y="17" width="8" height="1" />
      <rect x="14" y="17" width="2" height="1" />
      <rect x="18" y="17" width="2" height="1" />
      <rect x="4" y="18" width="6" height="1" />
      <rect x="14" y="18" width="2" height="1" />
      <rect x="18" y="18" width="2" height="1" />
      <rect x="5" y="19" width="4" height="1" />
      <rect x="14" y="19" width="6" height="1" />
      <rect x="6" y="20" width="2" height="1" />
      <rect x="15" y="20" width="4" height="1" />
    </svg>
  )
);

ArrowDown10.displayName = 'ArrowDown10';

export default ArrowDown10;
