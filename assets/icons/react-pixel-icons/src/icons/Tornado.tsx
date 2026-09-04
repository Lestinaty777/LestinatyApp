import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const Tornado = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="2" y="3" width="20" height="1" />
      <rect x="2" y="4" width="20" height="1" />
      <rect x="5" y="7" width="14" height="1" />
      <rect x="5" y="8" width="14" height="1" />
      <rect x="8" y="11" width="12" height="1" />
      <rect x="8" y="12" width="12" height="1" />
      <rect x="9" y="15" width="8" height="1" />
      <rect x="9" y="16" width="8" height="1" />
      <rect x="8" y="19" width="4" height="1" />
      <rect x="8" y="20" width="4" height="1" />
    </svg>
  )
);

Tornado.displayName = 'Tornado';

export default Tornado;
