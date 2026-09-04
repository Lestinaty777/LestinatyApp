import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const Heading1 = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="3" y="5" width="2" height="1" />
      <rect x="11" y="5" width="2" height="1" />
      <rect x="3" y="6" width="2" height="1" />
      <rect x="11" y="6" width="2" height="1" />
      <rect x="3" y="7" width="2" height="1" />
      <rect x="11" y="7" width="2" height="1" />
      <rect x="3" y="8" width="2" height="1" />
      <rect x="11" y="8" width="2" height="1" />
      <rect x="3" y="9" width="2" height="1" />
      <rect x="11" y="9" width="2" height="1" />
      <rect x="19" y="9" width="2" height="1" />
      <rect x="3" y="10" width="2" height="1" />
      <rect x="11" y="10" width="2" height="1" />
      <rect x="17" y="10" width="4" height="1" />
      <rect x="3" y="11" width="10" height="1" />
      <rect x="16" y="11" width="5" height="1" />
      <rect x="3" y="12" width="10" height="1" />
      <rect x="16" y="12" width="2" height="1" />
      <rect x="19" y="12" width="2" height="1" />
      <rect x="3" y="13" width="2" height="1" />
      <rect x="11" y="13" width="2" height="1" />
      <rect x="19" y="13" width="2" height="1" />
      <rect x="3" y="14" width="2" height="1" />
      <rect x="11" y="14" width="2" height="1" />
      <rect x="19" y="14" width="2" height="1" />
      <rect x="3" y="15" width="2" height="1" />
      <rect x="11" y="15" width="2" height="1" />
      <rect x="19" y="15" width="2" height="1" />
      <rect x="3" y="16" width="2" height="1" />
      <rect x="11" y="16" width="2" height="1" />
      <rect x="19" y="16" width="2" height="1" />
      <rect x="3" y="17" width="2" height="1" />
      <rect x="11" y="17" width="2" height="1" />
      <rect x="19" y="17" width="2" height="1" />
      <rect x="3" y="18" width="2" height="1" />
      <rect x="11" y="18" width="2" height="1" />
      <rect x="19" y="18" width="2" height="1" />
    </svg>
  )
);

Heading1.displayName = 'Heading1';

export default Heading1;
