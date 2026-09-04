import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const AlignCenter = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="2" y="4" width="20" height="1" />
      <rect x="2" y="5" width="20" height="1" />
      <rect x="6" y="11" width="12" height="1" />
      <rect x="6" y="12" width="12" height="1" />
      <rect x="4" y="18" width="16" height="1" />
      <rect x="4" y="19" width="16" height="1" />
    </svg>
  )
);

AlignCenter.displayName = 'AlignCenter';

export default AlignCenter;
