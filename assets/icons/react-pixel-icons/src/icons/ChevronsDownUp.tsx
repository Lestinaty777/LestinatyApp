import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const ChevronsDownUp = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="16" y="3" width="2" height="1" />
      <rect x="6" y="4" width="3" height="1" />
      <rect x="15" y="4" width="3" height="1" />
      <rect x="7" y="5" width="3" height="1" />
      <rect x="14" y="5" width="3" height="1" />
      <rect x="8" y="6" width="3" height="1" />
      <rect x="13" y="6" width="3" height="1" />
      <rect x="9" y="7" width="6" height="1" />
      <rect x="10" y="8" width="4" height="1" />
      <rect x="11" y="9" width="2" height="1" />
      <rect x="11" y="14" width="2" height="1" />
      <rect x="10" y="15" width="4" height="1" />
      <rect x="9" y="16" width="6" height="1" />
      <rect x="8" y="17" width="3" height="1" />
      <rect x="13" y="17" width="3" height="1" />
      <rect x="7" y="18" width="3" height="1" />
      <rect x="14" y="18" width="3" height="1" />
      <rect x="6" y="19" width="3" height="1" />
      <rect x="15" y="19" width="3" height="1" />
      <rect x="6" y="20" width="2" height="1" />
      <rect x="16" y="20" width="2" height="1" />
    </svg>
  )
);

ChevronsDownUp.displayName = 'ChevronsDownUp';

export default ChevronsDownUp;
