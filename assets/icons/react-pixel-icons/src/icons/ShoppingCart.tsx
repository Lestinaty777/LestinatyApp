import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const ShoppingCart = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="1" y="1" width="4" height="1" />
      <rect x="1" y="2" width="4" height="1" />
      <rect x="3" y="3" width="2" height="1" />
      <rect x="3" y="4" width="19" height="1" />
      <rect x="3" y="5" width="20" height="1" />
      <rect x="4" y="6" width="2" height="1" />
      <rect x="21" y="6" width="2" height="1" />
      <rect x="4" y="7" width="2" height="1" />
      <rect x="21" y="7" width="2" height="1" />
      <rect x="4" y="8" width="2" height="1" />
      <rect x="20" y="8" width="3" height="1" />
      <rect x="4" y="9" width="3" height="1" />
      <rect x="20" y="9" width="3" height="1" />
      <rect x="4" y="10" width="3" height="1" />
      <rect x="20" y="10" width="2" height="1" />
      <rect x="5" y="11" width="2" height="1" />
      <rect x="20" y="11" width="2" height="1" />
      <rect x="5" y="12" width="2" height="1" />
      <rect x="20" y="12" width="2" height="1" />
      <rect x="5" y="13" width="17" height="1" />
      <rect x="5" y="14" width="16" height="1" />
      <rect x="5" y="15" width="3" height="1" />
      <rect x="6" y="16" width="2" height="1" />
      <rect x="6" y="17" width="14" height="1" />
      <rect x="5" y="18" width="16" height="1" />
      <rect x="5" y="19" width="2" height="1" />
      <rect x="9" y="19" width="2" height="1" />
      <rect x="15" y="19" width="2" height="1" />
      <rect x="19" y="19" width="2" height="1" />
      <rect x="5" y="20" width="2" height="1" />
      <rect x="9" y="20" width="2" height="1" />
      <rect x="15" y="20" width="2" height="1" />
      <rect x="19" y="20" width="2" height="1" />
      <rect x="5" y="21" width="6" height="1" />
      <rect x="15" y="21" width="6" height="1" />
      <rect x="6" y="22" width="4" height="1" />
      <rect x="16" y="22" width="4" height="1" />
    </svg>
  )
);

ShoppingCart.displayName = 'ShoppingCart';

export default ShoppingCart;
