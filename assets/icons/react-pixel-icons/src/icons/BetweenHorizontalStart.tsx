import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const BetweenHorizontalStart = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="8" y="2" width="13" height="1" />
      <rect x="7" y="3" width="15" height="1" />
      <rect x="7" y="4" width="2" height="1" />
      <rect x="20" y="4" width="2" height="1" />
      <rect x="7" y="5" width="2" height="1" />
      <rect x="20" y="5" width="2" height="1" />
      <rect x="7" y="6" width="2" height="1" />
      <rect x="20" y="6" width="2" height="1" />
      <rect x="7" y="7" width="2" height="1" />
      <rect x="20" y="7" width="2" height="1" />
      <rect x="1" y="8" width="2" height="1" />
      <rect x="7" y="8" width="2" height="1" />
      <rect x="20" y="8" width="2" height="1" />
      <rect x="1" y="9" width="3" height="1" />
      <rect x="7" y="9" width="15" height="1" />
      <rect x="2" y="10" width="3" height="1" />
      <rect x="8" y="10" width="13" height="1" />
      <rect x="3" y="11" width="3" height="1" />
      <rect x="3" y="12" width="3" height="1" />
      <rect x="2" y="13" width="3" height="1" />
      <rect x="8" y="13" width="13" height="1" />
      <rect x="1" y="14" width="3" height="1" />
      <rect x="7" y="14" width="15" height="1" />
      <rect x="1" y="15" width="2" height="1" />
      <rect x="7" y="15" width="2" height="1" />
      <rect x="20" y="15" width="2" height="1" />
      <rect x="7" y="16" width="2" height="1" />
      <rect x="20" y="16" width="2" height="1" />
      <rect x="7" y="17" width="2" height="1" />
      <rect x="20" y="17" width="2" height="1" />
      <rect x="7" y="18" width="2" height="1" />
      <rect x="20" y="18" width="2" height="1" />
      <rect x="7" y="19" width="2" height="1" />
      <rect x="20" y="19" width="2" height="1" />
      <rect x="7" y="20" width="15" height="1" />
      <rect x="8" y="21" width="13" height="1" />
    </svg>
  )
);

BetweenHorizontalStart.displayName = 'BetweenHorizontalStart';

export default BetweenHorizontalStart;
