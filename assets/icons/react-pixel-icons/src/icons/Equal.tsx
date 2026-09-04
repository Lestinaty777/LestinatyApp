import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const Equal = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="4" y="8" width="16" height="1" />
      <rect x="4" y="9" width="16" height="1" />
      <rect x="4" y="14" width="16" height="1" />
      <rect x="4" y="15" width="16" height="1" />
    </svg>
  )
);

Equal.displayName = 'Equal';

export default Equal;
