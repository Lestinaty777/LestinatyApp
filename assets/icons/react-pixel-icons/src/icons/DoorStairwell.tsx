import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const DoorStairwell = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="5" y="2" width="14" height="1" />
      <rect x="4" y="3" width="16" height="1" />
      <rect x="4" y="4" width="2" height="1" />
      <rect x="18" y="4" width="2" height="1" />
      <rect x="4" y="5" width="2" height="1" />
      <rect x="18" y="5" width="2" height="1" />
      <rect x="4" y="6" width="2" height="1" />
      <rect x="18" y="6" width="2" height="1" />
      <rect x="4" y="7" width="2" height="1" />
      <rect x="18" y="7" width="2" height="1" />
      <rect x="4" y="8" width="2" height="1" />
      <rect x="15" y="8" width="5" height="1" />
      <rect x="4" y="9" width="2" height="1" />
      <rect x="14" y="9" width="6" height="1" />
      <rect x="4" y="10" width="2" height="1" />
      <rect x="14" y="10" width="2" height="1" />
      <rect x="18" y="10" width="2" height="1" />
      <rect x="4" y="11" width="2" height="1" />
      <rect x="14" y="11" width="2" height="1" />
      <rect x="18" y="11" width="2" height="1" />
      <rect x="4" y="12" width="2" height="1" />
      <rect x="12" y="12" width="8" height="1" />
      <rect x="4" y="13" width="2" height="1" />
      <rect x="11" y="13" width="9" height="1" />
      <rect x="4" y="14" width="2" height="1" />
      <rect x="11" y="14" width="2" height="1" />
      <rect x="18" y="14" width="2" height="1" />
      <rect x="4" y="15" width="2" height="1" />
      <rect x="11" y="15" width="2" height="1" />
      <rect x="18" y="15" width="2" height="1" />
      <rect x="4" y="16" width="2" height="1" />
      <rect x="9" y="16" width="11" height="1" />
      <rect x="4" y="17" width="2" height="1" />
      <rect x="8" y="17" width="12" height="1" />
      <rect x="4" y="18" width="2" height="1" />
      <rect x="8" y="18" width="2" height="1" />
      <rect x="18" y="18" width="2" height="1" />
      <rect x="4" y="19" width="2" height="1" />
      <rect x="8" y="19" width="2" height="1" />
      <rect x="18" y="19" width="2" height="1" />
      <rect x="1" y="20" width="22" height="1" />
      <rect x="1" y="21" width="22" height="1" />
    </svg>
  )
);

DoorStairwell.displayName = 'DoorStairwell';

export default DoorStairwell;
