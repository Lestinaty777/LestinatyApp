import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const Pilcrow = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="7" y="3" width="13" height="1" />
      <rect x="6" y="4" width="14" height="1" />
      <rect x="5" y="5" width="3" height="1" />
      <rect x="12" y="5" width="2" height="1" />
      <rect x="16" y="5" width="2" height="1" />
      <rect x="4" y="6" width="3" height="1" />
      <rect x="12" y="6" width="2" height="1" />
      <rect x="16" y="6" width="2" height="1" />
      <rect x="4" y="7" width="2" height="1" />
      <rect x="12" y="7" width="2" height="1" />
      <rect x="16" y="7" width="2" height="1" />
      <rect x="4" y="8" width="2" height="1" />
      <rect x="12" y="8" width="2" height="1" />
      <rect x="16" y="8" width="2" height="1" />
      <rect x="4" y="9" width="2" height="1" />
      <rect x="12" y="9" width="2" height="1" />
      <rect x="16" y="9" width="2" height="1" />
      <rect x="4" y="10" width="3" height="1" />
      <rect x="12" y="10" width="2" height="1" />
      <rect x="16" y="10" width="2" height="1" />
      <rect x="5" y="11" width="3" height="1" />
      <rect x="12" y="11" width="2" height="1" />
      <rect x="16" y="11" width="2" height="1" />
      <rect x="6" y="12" width="8" height="1" />
      <rect x="16" y="12" width="2" height="1" />
      <rect x="7" y="13" width="7" height="1" />
      <rect x="16" y="13" width="2" height="1" />
      <rect x="12" y="14" width="2" height="1" />
      <rect x="16" y="14" width="2" height="1" />
      <rect x="12" y="15" width="2" height="1" />
      <rect x="16" y="15" width="2" height="1" />
      <rect x="12" y="16" width="2" height="1" />
      <rect x="16" y="16" width="2" height="1" />
      <rect x="12" y="17" width="2" height="1" />
      <rect x="16" y="17" width="2" height="1" />
      <rect x="12" y="18" width="2" height="1" />
      <rect x="16" y="18" width="2" height="1" />
      <rect x="12" y="19" width="2" height="1" />
      <rect x="16" y="19" width="2" height="1" />
      <rect x="12" y="20" width="2" height="1" />
      <rect x="16" y="20" width="2" height="1" />
    </svg>
  )
);

Pilcrow.displayName = 'Pilcrow';

export default Pilcrow;
