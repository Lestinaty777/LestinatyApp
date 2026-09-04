import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const Menu = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="3" y="4" width="18" height="1" />
      <rect x="3" y="5" width="18" height="1" />
      <rect x="3" y="11" width="18" height="1" />
      <rect x="3" y="12" width="18" height="1" />
      <rect x="3" y="18" width="18" height="1" />
      <rect x="3" y="19" width="18" height="1" />
    </svg>
  )
);

Menu.displayName = 'Menu';

export default Menu;
