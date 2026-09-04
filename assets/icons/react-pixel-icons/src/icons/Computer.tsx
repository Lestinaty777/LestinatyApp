import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const Computer = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="5" y="1" width="14" height="1" />
      <rect x="4" y="2" width="16" height="1" />
      <rect x="4" y="3" width="2" height="1" />
      <rect x="18" y="3" width="2" height="1" />
      <rect x="4" y="4" width="2" height="1" />
      <rect x="18" y="4" width="2" height="1" />
      <rect x="4" y="5" width="2" height="1" />
      <rect x="18" y="5" width="2" height="1" />
      <rect x="4" y="6" width="2" height="1" />
      <rect x="18" y="6" width="2" height="1" />
      <rect x="4" y="7" width="2" height="1" />
      <rect x="18" y="7" width="2" height="1" />
      <rect x="4" y="8" width="2" height="1" />
      <rect x="18" y="8" width="2" height="1" />
      <rect x="4" y="9" width="16" height="1" />
      <rect x="5" y="10" width="14" height="1" />
      <rect x="2" y="13" width="20" height="1" />
      <rect x="1" y="14" width="22" height="1" />
      <rect x="1" y="15" width="2" height="1" />
      <rect x="21" y="15" width="2" height="1" />
      <rect x="1" y="16" width="2" height="1" />
      <rect x="21" y="16" width="2" height="1" />
      <rect x="1" y="17" width="2" height="1" />
      <rect x="5" y="17" width="4" height="1" />
      <rect x="11" y="17" width="8" height="1" />
      <rect x="21" y="17" width="2" height="1" />
      <rect x="1" y="18" width="2" height="1" />
      <rect x="5" y="18" width="4" height="1" />
      <rect x="11" y="18" width="8" height="1" />
      <rect x="21" y="18" width="2" height="1" />
      <rect x="1" y="19" width="2" height="1" />
      <rect x="21" y="19" width="2" height="1" />
      <rect x="1" y="20" width="2" height="1" />
      <rect x="21" y="20" width="2" height="1" />
      <rect x="1" y="21" width="22" height="1" />
      <rect x="2" y="22" width="20" height="1" />
    </svg>
  )
);

Computer.displayName = 'Computer';

export default Computer;
