import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const User = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="10" y="2" width="4" height="1" />
      <rect x="8" y="3" width="8" height="1" />
      <rect x="8" y="4" width="3" height="1" />
      <rect x="13" y="4" width="3" height="1" />
      <rect x="7" y="5" width="2" height="1" />
      <rect x="15" y="5" width="2" height="1" />
      <rect x="7" y="6" width="2" height="1" />
      <rect x="15" y="6" width="2" height="1" />
      <rect x="7" y="7" width="2" height="1" />
      <rect x="15" y="7" width="2" height="1" />
      <rect x="7" y="8" width="2" height="1" />
      <rect x="15" y="8" width="2" height="1" />
      <rect x="8" y="9" width="3" height="1" />
      <rect x="13" y="9" width="3" height="1" />
      <rect x="8" y="10" width="8" height="1" />
      <rect x="10" y="11" width="4" height="1" />
      <rect x="7" y="14" width="10" height="1" />
      <rect x="5" y="15" width="14" height="1" />
      <rect x="5" y="16" width="3" height="1" />
      <rect x="16" y="16" width="3" height="1" />
      <rect x="4" y="17" width="3" height="1" />
      <rect x="17" y="17" width="3" height="1" />
      <rect x="4" y="18" width="2" height="1" />
      <rect x="18" y="18" width="2" height="1" />
      <rect x="4" y="19" width="2" height="1" />
      <rect x="18" y="19" width="2" height="1" />
      <rect x="4" y="20" width="2" height="1" />
      <rect x="18" y="20" width="2" height="1" />
      <rect x="4" y="21" width="2" height="1" />
      <rect x="18" y="21" width="2" height="1" />
    </svg>
  )
);

User.displayName = 'User';

export default User;
