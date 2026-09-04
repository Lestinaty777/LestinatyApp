import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const FishSymbol = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="1" y="7" width="2" height="1" />
      <rect x="10" y="7" width="7" height="1" />
      <rect x="1" y="8" width="3" height="1" />
      <rect x="8" y="8" width="11" height="1" />
      <rect x="2" y="9" width="2" height="1" />
      <rect x="7" y="9" width="4" height="1" />
      <rect x="16" y="9" width="5" height="1" />
      <rect x="2" y="10" width="7" height="1" />
      <rect x="18" y="10" width="4" height="1" />
      <rect x="3" y="11" width="4" height="1" />
      <rect x="20" y="11" width="3" height="1" />
      <rect x="3" y="12" width="4" height="1" />
      <rect x="20" y="12" width="3" height="1" />
      <rect x="2" y="13" width="7" height="1" />
      <rect x="18" y="13" width="4" height="1" />
      <rect x="2" y="14" width="2" height="1" />
      <rect x="7" y="14" width="4" height="1" />
      <rect x="16" y="14" width="5" height="1" />
      <rect x="1" y="15" width="3" height="1" />
      <rect x="8" y="15" width="11" height="1" />
      <rect x="1" y="16" width="2" height="1" />
      <rect x="10" y="16" width="7" height="1" />
    </svg>
  )
);

FishSymbol.displayName = 'FishSymbol';

export default FishSymbol;
