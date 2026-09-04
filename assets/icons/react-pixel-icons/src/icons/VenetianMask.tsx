import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const VenetianMask = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="2" y="5" width="8" height="1" />
      <rect x="14" y="5" width="8" height="1" />
      <rect x="1" y="6" width="22" height="1" />
      <rect x="1" y="7" width="2" height="1" />
      <rect x="9" y="7" width="6" height="1" />
      <rect x="21" y="7" width="2" height="1" />
      <rect x="1" y="8" width="2" height="1" />
      <rect x="11" y="8" width="2" height="1" />
      <rect x="21" y="8" width="2" height="1" />
      <rect x="1" y="9" width="2" height="1" />
      <rect x="21" y="9" width="2" height="1" />
      <rect x="1" y="10" width="2" height="1" />
      <rect x="5" y="10" width="3" height="1" />
      <rect x="16" y="10" width="3" height="1" />
      <rect x="21" y="10" width="2" height="1" />
      <rect x="1" y="11" width="2" height="1" />
      <rect x="5" y="11" width="4" height="1" />
      <rect x="15" y="11" width="4" height="1" />
      <rect x="21" y="11" width="2" height="1" />
      <rect x="1" y="12" width="2" height="1" />
      <rect x="7" y="12" width="3" height="1" />
      <rect x="14" y="12" width="3" height="1" />
      <rect x="21" y="12" width="2" height="1" />
      <rect x="1" y="13" width="2" height="1" />
      <rect x="8" y="13" width="2" height="1" />
      <rect x="14" y="13" width="2" height="1" />
      <rect x="21" y="13" width="2" height="1" />
      <rect x="1" y="14" width="3" height="1" />
      <rect x="20" y="14" width="3" height="1" />
      <rect x="2" y="15" width="3" height="1" />
      <rect x="19" y="15" width="3" height="1" />
      <rect x="3" y="16" width="7" height="1" />
      <rect x="14" y="16" width="7" height="1" />
      <rect x="4" y="17" width="16" height="1" />
      <rect x="9" y="18" width="6" height="1" />
      <rect x="11" y="19" width="2" height="1" />
    </svg>
  )
);

VenetianMask.displayName = 'VenetianMask';

export default VenetianMask;
