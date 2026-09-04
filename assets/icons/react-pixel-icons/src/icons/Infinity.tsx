import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const Infinity = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="4" y="7" width="5" height="1" />
      <rect x="15" y="7" width="5" height="1" />
      <rect x="2" y="8" width="8" height="1" />
      <rect x="14" y="8" width="8" height="1" />
      <rect x="2" y="9" width="3" height="1" />
      <rect x="8" y="9" width="3" height="1" />
      <rect x="13" y="9" width="3" height="1" />
      <rect x="19" y="9" width="3" height="1" />
      <rect x="1" y="10" width="3" height="1" />
      <rect x="9" y="10" width="6" height="1" />
      <rect x="20" y="10" width="3" height="1" />
      <rect x="1" y="11" width="2" height="1" />
      <rect x="10" y="11" width="4" height="1" />
      <rect x="21" y="11" width="2" height="1" />
      <rect x="1" y="12" width="2" height="1" />
      <rect x="10" y="12" width="4" height="1" />
      <rect x="21" y="12" width="2" height="1" />
      <rect x="1" y="13" width="3" height="1" />
      <rect x="9" y="13" width="6" height="1" />
      <rect x="20" y="13" width="3" height="1" />
      <rect x="2" y="14" width="3" height="1" />
      <rect x="8" y="14" width="3" height="1" />
      <rect x="13" y="14" width="3" height="1" />
      <rect x="19" y="14" width="3" height="1" />
      <rect x="2" y="15" width="8" height="1" />
      <rect x="14" y="15" width="8" height="1" />
      <rect x="4" y="16" width="5" height="1" />
      <rect x="15" y="16" width="5" height="1" />
    </svg>
  )
);

Infinity.displayName = 'Infinity';

export default Infinity;
