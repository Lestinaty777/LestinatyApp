import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const Cigarette = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="15" y="2" width="2" height="1" />
      <rect x="19" y="2" width="2" height="1" />
      <rect x="15" y="3" width="2" height="1" />
      <rect x="19" y="3" width="2" height="1" />
      <rect x="15" y="4" width="3" height="1" />
      <rect x="19" y="4" width="3" height="1" />
      <rect x="16" y="5" width="2" height="1" />
      <rect x="20" y="5" width="2" height="1" />
      <rect x="16" y="6" width="3" height="1" />
      <rect x="20" y="6" width="3" height="1" />
      <rect x="17" y="7" width="2" height="1" />
      <rect x="21" y="7" width="2" height="1" />
      <rect x="17" y="8" width="2" height="1" />
      <rect x="21" y="8" width="2" height="1" />
      <rect x="2" y="11" width="16" height="1" />
      <rect x="20" y="11" width="2" height="1" />
      <rect x="1" y="12" width="17" height="1" />
      <rect x="20" y="12" width="3" height="1" />
      <rect x="1" y="13" width="2" height="1" />
      <rect x="6" y="13" width="2" height="1" />
      <rect x="21" y="13" width="2" height="1" />
      <rect x="1" y="14" width="2" height="1" />
      <rect x="6" y="14" width="2" height="1" />
      <rect x="21" y="14" width="2" height="1" />
      <rect x="1" y="15" width="17" height="1" />
      <rect x="20" y="15" width="3" height="1" />
      <rect x="2" y="16" width="16" height="1" />
      <rect x="20" y="16" width="2" height="1" />
    </svg>
  )
);

Cigarette.displayName = 'Cigarette';

export default Cigarette;
