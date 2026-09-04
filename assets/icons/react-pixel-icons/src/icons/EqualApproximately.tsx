import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const EqualApproximately = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="5" y="7" width="7" height="1" />
      <rect x="4" y="8" width="9" height="1" />
      <rect x="18" y="8" width="2" height="1" />
      <rect x="4" y="9" width="2" height="1" />
      <rect x="11" y="9" width="9" height="1" />
      <rect x="13" y="10" width="5" height="1" />
      <rect x="5" y="13" width="7" height="1" />
      <rect x="4" y="14" width="9" height="1" />
      <rect x="18" y="14" width="2" height="1" />
      <rect x="4" y="15" width="2" height="1" />
      <rect x="11" y="15" width="9" height="1" />
      <rect x="13" y="16" width="5" height="1" />
    </svg>
  )
);

EqualApproximately.displayName = 'EqualApproximately';

export default EqualApproximately;
