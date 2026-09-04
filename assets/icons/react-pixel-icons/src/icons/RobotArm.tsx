import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const RobotArm = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="15" y="2" width="3" height="1" />
      <rect x="14" y="3" width="6" height="1" />
      <rect x="4" y="4" width="4" height="1" />
      <rect x="14" y="4" width="7" height="1" />
      <rect x="3" y="5" width="6" height="1" />
      <rect x="13" y="5" width="3" height="1" />
      <rect x="19" y="5" width="2" height="1" />
      <rect x="3" y="6" width="2" height="1" />
      <rect x="7" y="6" width="8" height="1" />
      <rect x="3" y="7" width="2" height="1" />
      <rect x="7" y="7" width="8" height="1" />
      <rect x="3" y="8" width="6" height="1" />
      <rect x="13" y="8" width="3" height="1" />
      <rect x="19" y="8" width="2" height="1" />
      <rect x="4" y="9" width="5" height="1" />
      <rect x="14" y="9" width="7" height="1" />
      <rect x="4" y="10" width="2" height="1" />
      <rect x="7" y="10" width="2" height="1" />
      <rect x="14" y="10" width="6" height="1" />
      <rect x="4" y="11" width="2" height="1" />
      <rect x="7" y="11" width="3" height="1" />
      <rect x="15" y="11" width="3" height="1" />
      <rect x="4" y="12" width="2" height="1" />
      <rect x="8" y="12" width="2" height="1" />
      <rect x="4" y="13" width="2" height="1" />
      <rect x="8" y="13" width="3" height="1" />
      <rect x="4" y="14" width="2" height="1" />
      <rect x="9" y="14" width="2" height="1" />
      <rect x="4" y="15" width="2" height="1" />
      <rect x="9" y="15" width="2" height="1" />
      <rect x="4" y="16" width="2" height="1" />
      <rect x="9" y="16" width="3" height="1" />
      <rect x="4" y="17" width="2" height="1" />
      <rect x="10" y="17" width="2" height="1" />
      <rect x="4" y="18" width="2" height="1" />
      <rect x="10" y="18" width="2" height="1" />
      <rect x="4" y="19" width="2" height="1" />
      <rect x="10" y="19" width="3" height="1" />
      <rect x="3" y="20" width="11" height="1" />
      <rect x="3" y="21" width="11" height="1" />
    </svg>
  )
);

RobotArm.displayName = 'RobotArm';

export default RobotArm;
