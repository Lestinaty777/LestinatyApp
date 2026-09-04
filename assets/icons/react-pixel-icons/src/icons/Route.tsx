import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const Route = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="16" y="1" width="4" height="1" />
      <rect x="15" y="2" width="6" height="1" />
      <rect x="14" y="3" width="3" height="1" />
      <rect x="19" y="3" width="3" height="1" />
      <rect x="4" y="4" width="12" height="1" />
      <rect x="20" y="4" width="2" height="1" />
      <rect x="3" y="5" width="13" height="1" />
      <rect x="20" y="5" width="2" height="1" />
      <rect x="2" y="6" width="3" height="1" />
      <rect x="14" y="6" width="3" height="1" />
      <rect x="19" y="6" width="3" height="1" />
      <rect x="2" y="7" width="2" height="1" />
      <rect x="15" y="7" width="6" height="1" />
      <rect x="2" y="8" width="2" height="1" />
      <rect x="16" y="8" width="4" height="1" />
      <rect x="2" y="9" width="2" height="1" />
      <rect x="2" y="10" width="3" height="1" />
      <rect x="3" y="11" width="17" height="1" />
      <rect x="4" y="12" width="17" height="1" />
      <rect x="19" y="13" width="3" height="1" />
      <rect x="20" y="14" width="2" height="1" />
      <rect x="4" y="15" width="4" height="1" />
      <rect x="20" y="15" width="2" height="1" />
      <rect x="3" y="16" width="6" height="1" />
      <rect x="20" y="16" width="2" height="1" />
      <rect x="2" y="17" width="3" height="1" />
      <rect x="7" y="17" width="3" height="1" />
      <rect x="19" y="17" width="3" height="1" />
      <rect x="2" y="18" width="2" height="1" />
      <rect x="8" y="18" width="13" height="1" />
      <rect x="2" y="19" width="2" height="1" />
      <rect x="8" y="19" width="12" height="1" />
      <rect x="2" y="20" width="3" height="1" />
      <rect x="7" y="20" width="3" height="1" />
      <rect x="3" y="21" width="6" height="1" />
      <rect x="4" y="22" width="4" height="1" />
    </svg>
  )
);

Route.displayName = 'Route';

export default Route;
