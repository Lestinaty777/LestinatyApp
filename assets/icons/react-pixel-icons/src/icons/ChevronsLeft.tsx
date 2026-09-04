import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const ChevronsLeft = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="10" y="6" width="2" height="1" />
      <rect x="17" y="6" width="2" height="1" />
      <rect x="9" y="7" width="3" height="1" />
      <rect x="16" y="7" width="3" height="1" />
      <rect x="8" y="8" width="3" height="1" />
      <rect x="15" y="8" width="3" height="1" />
      <rect x="7" y="9" width="3" height="1" />
      <rect x="14" y="9" width="3" height="1" />
      <rect x="6" y="10" width="3" height="1" />
      <rect x="13" y="10" width="3" height="1" />
      <rect x="5" y="11" width="3" height="1" />
      <rect x="12" y="11" width="3" height="1" />
      <rect x="5" y="12" width="3" height="1" />
      <rect x="12" y="12" width="3" height="1" />
      <rect x="6" y="13" width="3" height="1" />
      <rect x="13" y="13" width="3" height="1" />
      <rect x="7" y="14" width="3" height="1" />
      <rect x="14" y="14" width="3" height="1" />
      <rect x="8" y="15" width="3" height="1" />
      <rect x="15" y="15" width="3" height="1" />
      <rect x="9" y="16" width="3" height="1" />
      <rect x="16" y="16" width="3" height="1" />
      <rect x="10" y="17" width="2" height="1" />
      <rect x="17" y="17" width="2" height="1" />
    </svg>
  )
);

ChevronsLeft.displayName = 'ChevronsLeft';

export default ChevronsLeft;
