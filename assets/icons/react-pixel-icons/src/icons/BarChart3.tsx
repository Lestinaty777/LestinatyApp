import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const BarChart3 = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="2" y="2" width="2" height="1" />
      <rect x="2" y="3" width="2" height="1" />
      <rect x="2" y="4" width="2" height="1" />
      <rect x="12" y="4" width="2" height="1" />
      <rect x="2" y="5" width="2" height="1" />
      <rect x="12" y="5" width="2" height="1" />
      <rect x="2" y="6" width="2" height="1" />
      <rect x="12" y="6" width="2" height="1" />
      <rect x="2" y="7" width="2" height="1" />
      <rect x="12" y="7" width="2" height="1" />
      <rect x="2" y="8" width="2" height="1" />
      <rect x="12" y="8" width="2" height="1" />
      <rect x="17" y="8" width="2" height="1" />
      <rect x="2" y="9" width="2" height="1" />
      <rect x="12" y="9" width="2" height="1" />
      <rect x="17" y="9" width="2" height="1" />
      <rect x="2" y="10" width="2" height="1" />
      <rect x="12" y="10" width="2" height="1" />
      <rect x="17" y="10" width="2" height="1" />
      <rect x="2" y="11" width="2" height="1" />
      <rect x="12" y="11" width="2" height="1" />
      <rect x="17" y="11" width="2" height="1" />
      <rect x="2" y="12" width="2" height="1" />
      <rect x="12" y="12" width="2" height="1" />
      <rect x="17" y="12" width="2" height="1" />
      <rect x="2" y="13" width="2" height="1" />
      <rect x="7" y="13" width="2" height="1" />
      <rect x="12" y="13" width="2" height="1" />
      <rect x="17" y="13" width="2" height="1" />
      <rect x="2" y="14" width="2" height="1" />
      <rect x="7" y="14" width="2" height="1" />
      <rect x="12" y="14" width="2" height="1" />
      <rect x="17" y="14" width="2" height="1" />
      <rect x="2" y="15" width="2" height="1" />
      <rect x="7" y="15" width="2" height="1" />
      <rect x="12" y="15" width="2" height="1" />
      <rect x="17" y="15" width="2" height="1" />
      <rect x="2" y="16" width="2" height="1" />
      <rect x="7" y="16" width="2" height="1" />
      <rect x="12" y="16" width="2" height="1" />
      <rect x="17" y="16" width="2" height="1" />
      <rect x="2" y="17" width="2" height="1" />
      <rect x="7" y="17" width="2" height="1" />
      <rect x="12" y="17" width="2" height="1" />
      <rect x="17" y="17" width="2" height="1" />
      <rect x="2" y="18" width="2" height="1" />
      <rect x="2" y="19" width="2" height="1" />
      <rect x="2" y="20" width="20" height="1" />
      <rect x="3" y="21" width="19" height="1" />
    </svg>
  )
);

BarChart3.displayName = 'BarChart3';

export default BarChart3;
