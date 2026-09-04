import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const Divide = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="11" y="4" width="2" height="1" />
      <rect x="10" y="5" width="4" height="1" />
      <rect x="10" y="6" width="4" height="1" />
      <rect x="11" y="7" width="2" height="1" />
      <rect x="4" y="11" width="16" height="1" />
      <rect x="4" y="12" width="16" height="1" />
      <rect x="11" y="16" width="2" height="1" />
      <rect x="10" y="17" width="4" height="1" />
      <rect x="10" y="18" width="4" height="1" />
      <rect x="11" y="19" width="2" height="1" />
    </svg>
  )
);

Divide.displayName = 'Divide';

export default Divide;
