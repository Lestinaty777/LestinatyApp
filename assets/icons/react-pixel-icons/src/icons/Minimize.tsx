import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const Minimize = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="7" y="2" width="2" height="1" />
      <rect x="15" y="2" width="2" height="1" />
      <rect x="7" y="3" width="2" height="1" />
      <rect x="15" y="3" width="2" height="1" />
      <rect x="7" y="4" width="2" height="1" />
      <rect x="15" y="4" width="2" height="1" />
      <rect x="7" y="5" width="2" height="1" />
      <rect x="15" y="5" width="2" height="1" />
      <rect x="7" y="6" width="2" height="1" />
      <rect x="15" y="6" width="2" height="1" />
      <rect x="2" y="7" width="7" height="1" />
      <rect x="15" y="7" width="7" height="1" />
      <rect x="2" y="8" width="6" height="1" />
      <rect x="16" y="8" width="6" height="1" />
      <rect x="2" y="15" width="6" height="1" />
      <rect x="16" y="15" width="6" height="1" />
      <rect x="2" y="16" width="7" height="1" />
      <rect x="15" y="16" width="7" height="1" />
      <rect x="7" y="17" width="2" height="1" />
      <rect x="15" y="17" width="2" height="1" />
      <rect x="7" y="18" width="2" height="1" />
      <rect x="15" y="18" width="2" height="1" />
      <rect x="7" y="19" width="2" height="1" />
      <rect x="15" y="19" width="2" height="1" />
      <rect x="7" y="20" width="2" height="1" />
      <rect x="15" y="20" width="2" height="1" />
      <rect x="7" y="21" width="2" height="1" />
      <rect x="15" y="21" width="2" height="1" />
    </svg>
  )
);

Minimize.displayName = 'Minimize';

export default Minimize;
