import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const BedSingle = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="5" y="3" width="14" height="1" />
      <rect x="4" y="4" width="16" height="1" />
      <rect x="4" y="5" width="2" height="1" />
      <rect x="18" y="5" width="2" height="1" />
      <rect x="4" y="6" width="2" height="1" />
      <rect x="18" y="6" width="2" height="1" />
      <rect x="4" y="7" width="2" height="1" />
      <rect x="18" y="7" width="2" height="1" />
      <rect x="4" y="8" width="2" height="1" />
      <rect x="18" y="8" width="2" height="1" />
      <rect x="3" y="9" width="18" height="1" />
      <rect x="2" y="10" width="20" height="1" />
      <rect x="2" y="11" width="2" height="1" />
      <rect x="20" y="11" width="2" height="1" />
      <rect x="2" y="12" width="2" height="1" />
      <rect x="20" y="12" width="2" height="1" />
      <rect x="2" y="13" width="2" height="1" />
      <rect x="20" y="13" width="2" height="1" />
      <rect x="2" y="14" width="2" height="1" />
      <rect x="20" y="14" width="2" height="1" />
      <rect x="2" y="15" width="2" height="1" />
      <rect x="20" y="15" width="2" height="1" />
      <rect x="2" y="16" width="2" height="1" />
      <rect x="20" y="16" width="2" height="1" />
      <rect x="2" y="17" width="20" height="1" />
      <rect x="2" y="18" width="20" height="1" />
      <rect x="2" y="19" width="2" height="1" />
      <rect x="20" y="19" width="2" height="1" />
      <rect x="2" y="20" width="2" height="1" />
      <rect x="20" y="20" width="2" height="1" />
    </svg>
  )
);

BedSingle.displayName = 'BedSingle';

export default BedSingle;
