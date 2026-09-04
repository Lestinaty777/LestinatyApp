import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const BetweenVerticalStart = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="8" y="1" width="2" height="1" />
      <rect x="14" y="1" width="2" height="1" />
      <rect x="8" y="2" width="3" height="1" />
      <rect x="13" y="2" width="3" height="1" />
      <rect x="9" y="3" width="6" height="1" />
      <rect x="10" y="4" width="4" height="1" />
      <rect x="11" y="5" width="2" height="1" />
      <rect x="3" y="7" width="7" height="1" />
      <rect x="14" y="7" width="7" height="1" />
      <rect x="2" y="8" width="9" height="1" />
      <rect x="13" y="8" width="9" height="1" />
      <rect x="2" y="9" width="2" height="1" />
      <rect x="9" y="9" width="2" height="1" />
      <rect x="13" y="9" width="2" height="1" />
      <rect x="20" y="9" width="2" height="1" />
      <rect x="2" y="10" width="2" height="1" />
      <rect x="9" y="10" width="2" height="1" />
      <rect x="13" y="10" width="2" height="1" />
      <rect x="20" y="10" width="2" height="1" />
      <rect x="2" y="11" width="2" height="1" />
      <rect x="9" y="11" width="2" height="1" />
      <rect x="13" y="11" width="2" height="1" />
      <rect x="20" y="11" width="2" height="1" />
      <rect x="2" y="12" width="2" height="1" />
      <rect x="9" y="12" width="2" height="1" />
      <rect x="13" y="12" width="2" height="1" />
      <rect x="20" y="12" width="2" height="1" />
      <rect x="2" y="13" width="2" height="1" />
      <rect x="9" y="13" width="2" height="1" />
      <rect x="13" y="13" width="2" height="1" />
      <rect x="20" y="13" width="2" height="1" />
      <rect x="2" y="14" width="2" height="1" />
      <rect x="9" y="14" width="2" height="1" />
      <rect x="13" y="14" width="2" height="1" />
      <rect x="20" y="14" width="2" height="1" />
      <rect x="2" y="15" width="2" height="1" />
      <rect x="9" y="15" width="2" height="1" />
      <rect x="13" y="15" width="2" height="1" />
      <rect x="20" y="15" width="2" height="1" />
      <rect x="2" y="16" width="2" height="1" />
      <rect x="9" y="16" width="2" height="1" />
      <rect x="13" y="16" width="2" height="1" />
      <rect x="20" y="16" width="2" height="1" />
      <rect x="2" y="17" width="2" height="1" />
      <rect x="9" y="17" width="2" height="1" />
      <rect x="13" y="17" width="2" height="1" />
      <rect x="20" y="17" width="2" height="1" />
      <rect x="2" y="18" width="2" height="1" />
      <rect x="9" y="18" width="2" height="1" />
      <rect x="13" y="18" width="2" height="1" />
      <rect x="20" y="18" width="2" height="1" />
      <rect x="2" y="19" width="2" height="1" />
      <rect x="9" y="19" width="2" height="1" />
      <rect x="13" y="19" width="2" height="1" />
      <rect x="20" y="19" width="2" height="1" />
      <rect x="2" y="20" width="9" height="1" />
      <rect x="13" y="20" width="9" height="1" />
      <rect x="3" y="21" width="7" height="1" />
      <rect x="14" y="21" width="7" height="1" />
    </svg>
  )
);

BetweenVerticalStart.displayName = 'BetweenVerticalStart';

export default BetweenVerticalStart;
