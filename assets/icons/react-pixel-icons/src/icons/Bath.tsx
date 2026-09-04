import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const Bath = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="4" y="2" width="4" height="1" />
      <rect x="3" y="3" width="8" height="1" />
      <rect x="3" y="4" width="2" height="1" />
      <rect x="7" y="4" width="4" height="1" />
      <rect x="3" y="5" width="2" height="1" />
      <rect x="7" y="5" width="3" height="1" />
      <rect x="3" y="6" width="2" height="1" />
      <rect x="7" y="6" width="2" height="1" />
      <rect x="3" y="7" width="2" height="1" />
      <rect x="3" y="8" width="2" height="1" />
      <rect x="3" y="9" width="2" height="1" />
      <rect x="3" y="10" width="2" height="1" />
      <rect x="1" y="11" width="22" height="1" />
      <rect x="1" y="12" width="22" height="1" />
      <rect x="3" y="13" width="2" height="1" />
      <rect x="19" y="13" width="2" height="1" />
      <rect x="3" y="14" width="2" height="1" />
      <rect x="19" y="14" width="2" height="1" />
      <rect x="3" y="15" width="2" height="1" />
      <rect x="19" y="15" width="2" height="1" />
      <rect x="3" y="16" width="2" height="1" />
      <rect x="19" y="16" width="2" height="1" />
      <rect x="3" y="17" width="2" height="1" />
      <rect x="19" y="17" width="2" height="1" />
      <rect x="3" y="18" width="18" height="1" />
      <rect x="4" y="19" width="16" height="1" />
      <rect x="6" y="20" width="2" height="1" />
      <rect x="16" y="20" width="2" height="1" />
      <rect x="6" y="21" width="2" height="1" />
      <rect x="16" y="21" width="2" height="1" />
    </svg>
  )
);

Bath.displayName = 'Bath';

export default Bath;
