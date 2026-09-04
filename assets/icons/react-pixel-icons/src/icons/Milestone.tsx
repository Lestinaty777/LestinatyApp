import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const Milestone = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="11" y="2" width="2" height="1" />
      <rect x="11" y="3" width="2" height="1" />
      <rect x="11" y="4" width="2" height="1" />
      <rect x="3" y="5" width="17" height="1" />
      <rect x="2" y="6" width="19" height="1" />
      <rect x="2" y="7" width="2" height="1" />
      <rect x="19" y="7" width="3" height="1" />
      <rect x="2" y="8" width="2" height="1" />
      <rect x="20" y="8" width="3" height="1" />
      <rect x="2" y="9" width="2" height="1" />
      <rect x="21" y="9" width="2" height="1" />
      <rect x="2" y="10" width="2" height="1" />
      <rect x="20" y="10" width="3" height="1" />
      <rect x="2" y="11" width="2" height="1" />
      <rect x="19" y="11" width="3" height="1" />
      <rect x="2" y="12" width="19" height="1" />
      <rect x="3" y="13" width="17" height="1" />
      <rect x="11" y="14" width="2" height="1" />
      <rect x="11" y="15" width="2" height="1" />
      <rect x="11" y="16" width="2" height="1" />
      <rect x="11" y="17" width="2" height="1" />
      <rect x="11" y="18" width="2" height="1" />
      <rect x="11" y="19" width="2" height="1" />
      <rect x="11" y="20" width="2" height="1" />
      <rect x="11" y="21" width="2" height="1" />
    </svg>
  )
);

Milestone.displayName = 'Milestone';

export default Milestone;
