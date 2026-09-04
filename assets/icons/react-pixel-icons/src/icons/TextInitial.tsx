import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const TextInitial = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="6" y="3" width="2" height="1" />
      <rect x="5" y="4" width="4" height="1" />
      <rect x="14" y="4" width="8" height="1" />
      <rect x="5" y="5" width="4" height="1" />
      <rect x="14" y="5" width="8" height="1" />
      <rect x="4" y="6" width="6" height="1" />
      <rect x="4" y="7" width="2" height="1" />
      <rect x="8" y="7" width="2" height="1" />
      <rect x="3" y="8" width="3" height="1" />
      <rect x="8" y="8" width="3" height="1" />
      <rect x="3" y="9" width="8" height="1" />
      <rect x="2" y="10" width="10" height="1" />
      <rect x="2" y="11" width="2" height="1" />
      <rect x="10" y="11" width="2" height="1" />
      <rect x="14" y="11" width="8" height="1" />
      <rect x="2" y="12" width="2" height="1" />
      <rect x="10" y="12" width="2" height="1" />
      <rect x="14" y="12" width="8" height="1" />
      <rect x="2" y="18" width="20" height="1" />
      <rect x="2" y="19" width="20" height="1" />
    </svg>
  )
);

TextInitial.displayName = 'TextInitial';

export default TextInitial;
