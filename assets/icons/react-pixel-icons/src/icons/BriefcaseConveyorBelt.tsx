import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const BriefcaseConveyorBelt = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="8" y="1" width="8" height="1" />
      <rect x="7" y="2" width="10" height="1" />
      <rect x="7" y="3" width="2" height="1" />
      <rect x="15" y="3" width="2" height="1" />
      <rect x="7" y="4" width="2" height="1" />
      <rect x="15" y="4" width="2" height="1" />
      <rect x="4" y="5" width="16" height="1" />
      <rect x="3" y="6" width="18" height="1" />
      <rect x="3" y="7" width="2" height="1" />
      <rect x="7" y="7" width="2" height="1" />
      <rect x="15" y="7" width="2" height="1" />
      <rect x="19" y="7" width="2" height="1" />
      <rect x="3" y="8" width="2" height="1" />
      <rect x="7" y="8" width="2" height="1" />
      <rect x="15" y="8" width="2" height="1" />
      <rect x="19" y="8" width="2" height="1" />
      <rect x="3" y="9" width="2" height="1" />
      <rect x="7" y="9" width="2" height="1" />
      <rect x="15" y="9" width="2" height="1" />
      <rect x="19" y="9" width="2" height="1" />
      <rect x="3" y="10" width="2" height="1" />
      <rect x="7" y="10" width="2" height="1" />
      <rect x="15" y="10" width="2" height="1" />
      <rect x="19" y="10" width="2" height="1" />
      <rect x="3" y="11" width="2" height="1" />
      <rect x="7" y="11" width="2" height="1" />
      <rect x="15" y="11" width="2" height="1" />
      <rect x="19" y="11" width="2" height="1" />
      <rect x="3" y="12" width="2" height="1" />
      <rect x="7" y="12" width="2" height="1" />
      <rect x="15" y="12" width="2" height="1" />
      <rect x="19" y="12" width="2" height="1" />
      <rect x="3" y="13" width="2" height="1" />
      <rect x="7" y="13" width="2" height="1" />
      <rect x="15" y="13" width="2" height="1" />
      <rect x="19" y="13" width="2" height="1" />
      <rect x="3" y="14" width="2" height="1" />
      <rect x="7" y="14" width="2" height="1" />
      <rect x="15" y="14" width="2" height="1" />
      <rect x="19" y="14" width="2" height="1" />
      <rect x="3" y="15" width="18" height="1" />
      <rect x="4" y="16" width="16" height="1" />
      <rect x="2" y="19" width="20" height="1" />
      <rect x="2" y="20" width="20" height="1" />
      <rect x="5" y="21" width="2" height="1" />
      <rect x="9" y="21" width="2" height="1" />
      <rect x="13" y="21" width="2" height="1" />
      <rect x="17" y="21" width="2" height="1" />
      <rect x="5" y="22" width="2" height="1" />
      <rect x="9" y="22" width="2" height="1" />
      <rect x="13" y="22" width="2" height="1" />
      <rect x="17" y="22" width="2" height="1" />
    </svg>
  )
);

BriefcaseConveyorBelt.displayName = 'BriefcaseConveyorBelt';

export default BriefcaseConveyorBelt;
