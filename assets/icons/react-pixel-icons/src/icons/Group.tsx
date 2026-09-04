import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const Group = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="3" y="2" width="5" height="1" />
      <rect x="16" y="2" width="5" height="1" />
      <rect x="2" y="3" width="6" height="1" />
      <rect x="16" y="3" width="6" height="1" />
      <rect x="2" y="4" width="2" height="1" />
      <rect x="20" y="4" width="2" height="1" />
      <rect x="2" y="5" width="2" height="1" />
      <rect x="20" y="5" width="2" height="1" />
      <rect x="2" y="6" width="2" height="1" />
      <rect x="7" y="6" width="7" height="1" />
      <rect x="20" y="6" width="2" height="1" />
      <rect x="2" y="7" width="2" height="1" />
      <rect x="6" y="7" width="9" height="1" />
      <rect x="20" y="7" width="2" height="1" />
      <rect x="6" y="8" width="2" height="1" />
      <rect x="13" y="8" width="2" height="1" />
      <rect x="6" y="9" width="2" height="1" />
      <rect x="13" y="9" width="2" height="1" />
      <rect x="6" y="10" width="2" height="1" />
      <rect x="13" y="10" width="2" height="1" />
      <rect x="6" y="11" width="11" height="1" />
      <rect x="7" y="12" width="11" height="1" />
      <rect x="9" y="13" width="2" height="1" />
      <rect x="16" y="13" width="2" height="1" />
      <rect x="9" y="14" width="2" height="1" />
      <rect x="16" y="14" width="2" height="1" />
      <rect x="9" y="15" width="2" height="1" />
      <rect x="16" y="15" width="2" height="1" />
      <rect x="2" y="16" width="2" height="1" />
      <rect x="9" y="16" width="9" height="1" />
      <rect x="20" y="16" width="2" height="1" />
      <rect x="2" y="17" width="2" height="1" />
      <rect x="10" y="17" width="7" height="1" />
      <rect x="20" y="17" width="2" height="1" />
      <rect x="2" y="18" width="2" height="1" />
      <rect x="20" y="18" width="2" height="1" />
      <rect x="2" y="19" width="2" height="1" />
      <rect x="20" y="19" width="2" height="1" />
      <rect x="2" y="20" width="6" height="1" />
      <rect x="16" y="20" width="6" height="1" />
      <rect x="3" y="21" width="5" height="1" />
      <rect x="16" y="21" width="5" height="1" />
    </svg>
  )
);

Group.displayName = 'Group';

export default Group;
