import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const Wind = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="9" y="3" width="4" height="1" />
      <rect x="9" y="4" width="5" height="1" />
      <rect x="12" y="5" width="2" height="1" />
      <rect x="12" y="6" width="2" height="1" />
      <rect x="18" y="6" width="3" height="1" />
      <rect x="1" y="7" width="13" height="1" />
      <rect x="17" y="7" width="5" height="1" />
      <rect x="1" y="8" width="12" height="1" />
      <rect x="17" y="8" width="2" height="1" />
      <rect x="20" y="8" width="3" height="1" />
      <rect x="21" y="9" width="2" height="1" />
      <rect x="20" y="10" width="3" height="1" />
      <rect x="1" y="11" width="21" height="1" />
      <rect x="1" y="12" width="20" height="1" />
      <rect x="1" y="15" width="15" height="1" />
      <rect x="1" y="16" width="16" height="1" />
      <rect x="15" y="17" width="2" height="1" />
      <rect x="15" y="18" width="2" height="1" />
      <rect x="12" y="19" width="5" height="1" />
      <rect x="12" y="20" width="4" height="1" />
    </svg>
  )
);

Wind.displayName = 'Wind';

export default Wind;
