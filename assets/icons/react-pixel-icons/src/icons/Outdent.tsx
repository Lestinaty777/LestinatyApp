import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const Outdent = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="10" y="4" width="12" height="1" />
      <rect x="10" y="5" width="12" height="1" />
      <rect x="6" y="7" width="2" height="1" />
      <rect x="5" y="8" width="3" height="1" />
      <rect x="4" y="9" width="3" height="1" />
      <rect x="3" y="10" width="3" height="1" />
      <rect x="2" y="11" width="3" height="1" />
      <rect x="10" y="11" width="12" height="1" />
      <rect x="2" y="12" width="3" height="1" />
      <rect x="10" y="12" width="12" height="1" />
      <rect x="3" y="13" width="3" height="1" />
      <rect x="4" y="14" width="3" height="1" />
      <rect x="5" y="15" width="3" height="1" />
      <rect x="6" y="16" width="2" height="1" />
      <rect x="10" y="18" width="12" height="1" />
      <rect x="10" y="19" width="12" height="1" />
    </svg>
  )
);

Outdent.displayName = 'Outdent';

export default Outdent;
