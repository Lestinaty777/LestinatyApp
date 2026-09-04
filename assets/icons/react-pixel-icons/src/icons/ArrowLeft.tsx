import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const ArrowLeft = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="10" y="5" width="3" height="1" />
      <rect x="9" y="6" width="3" height="1" />
      <rect x="8" y="7" width="3" height="1" />
      <rect x="7" y="8" width="3" height="1" />
      <rect x="6" y="9" width="3" height="1" />
      <rect x="5" y="10" width="3" height="1" />
      <rect x="4" y="11" width="16" height="1" />
      <rect x="4" y="12" width="16" height="1" />
      <rect x="5" y="13" width="3" height="1" />
      <rect x="6" y="14" width="3" height="1" />
      <rect x="7" y="15" width="3" height="1" />
      <rect x="8" y="16" width="3" height="1" />
      <rect x="9" y="17" width="3" height="1" />
      <rect x="10" y="18" width="3" height="1" />
      <rect x="11" y="19" width="2" height="1" />
    </svg>
  )
);

ArrowLeft.displayName = 'ArrowLeft';

export default ArrowLeft;
