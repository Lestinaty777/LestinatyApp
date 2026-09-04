import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const ListClock = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="13" y="8" width="6" height="1" />
      <rect x="12" y="9" width="8" height="1" />
      <rect x="11" y="10" width="3" height="1" />
      <rect x="18" y="10" width="3" height="1" />
      <rect x="2" y="11" width="5" height="1" />
      <rect x="10" y="11" width="3" height="1" />
      <rect x="19" y="11" width="3" height="1" />
      <rect x="2" y="12" width="5" height="1" />
      <rect x="9" y="12" width="3" height="1" />
      <rect x="15" y="12" width="2" height="1" />
      <rect x="20" y="12" width="3" height="1" />
      <rect x="9" y="13" width="2" height="1" />
      <rect x="15" y="13" width="2" height="1" />
      <rect x="21" y="13" width="2" height="1" />
      <rect x="9" y="14" width="2" height="1" />
      <rect x="15" y="14" width="2" height="1" />
      <rect x="21" y="14" width="2" height="1" />
      <rect x="9" y="15" width="2" height="1" />
      <rect x="15" y="15" width="3" height="1" />
      <rect x="21" y="15" width="2" height="1" />
      <rect x="9" y="16" width="2" height="1" />
      <rect x="16" y="16" width="3" height="1" />
      <rect x="21" y="16" width="2" height="1" />
      <rect x="9" y="17" width="3" height="1" />
      <rect x="20" y="17" width="3" height="1" />
      <rect x="2" y="18" width="6" height="1" />
      <rect x="10" y="18" width="3" height="1" />
      <rect x="19" y="18" width="3" height="1" />
      <rect x="2" y="19" width="6" height="1" />
      <rect x="11" y="19" width="3" height="1" />
      <rect x="18" y="19" width="3" height="1" />
      <rect x="12" y="20" width="8" height="1" />
      <rect x="13" y="21" width="6" height="1" />
    </svg>
  )
);

ListClock.displayName = 'ListClock';

export default ListClock;
