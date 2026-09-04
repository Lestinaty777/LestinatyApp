import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const Cherry = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="11" y="1" width="5" height="1" />
      <rect x="11" y="2" width="7" height="1" />
      <rect x="11" y="3" width="8" height="1" />
      <rect x="10" y="4" width="5" height="1" />
      <rect x="17" y="4" width="4" height="1" />
      <rect x="10" y="5" width="2" height="1" />
      <rect x="13" y="5" width="3" height="1" />
      <rect x="18" y="5" width="4" height="1" />
      <rect x="10" y="6" width="2" height="1" />
      <rect x="13" y="6" width="4" height="1" />
      <rect x="20" y="6" width="2" height="1" />
      <rect x="9" y="7" width="3" height="1" />
      <rect x="14" y="7" width="5" height="1" />
      <rect x="20" y="7" width="3" height="1" />
      <rect x="9" y="8" width="2" height="1" />
      <rect x="14" y="8" width="9" height="1" />
      <rect x="9" y="9" width="2" height="1" />
      <rect x="15" y="9" width="2" height="1" />
      <rect x="18" y="9" width="5" height="1" />
      <rect x="8" y="10" width="3" height="1" />
      <rect x="15" y="10" width="2" height="1" />
      <rect x="8" y="11" width="2" height="1" />
      <rect x="15" y="11" width="3" height="1" />
      <rect x="3" y="12" width="8" height="1" />
      <rect x="13" y="12" width="8" height="1" />
      <rect x="2" y="13" width="20" height="1" />
      <rect x="2" y="14" width="2" height="1" />
      <rect x="6" y="14" width="2" height="1" />
      <rect x="10" y="14" width="4" height="1" />
      <rect x="16" y="14" width="2" height="1" />
      <rect x="20" y="14" width="2" height="1" />
      <rect x="1" y="15" width="2" height="1" />
      <rect x="11" y="15" width="2" height="1" />
      <rect x="21" y="15" width="2" height="1" />
      <rect x="1" y="16" width="2" height="1" />
      <rect x="11" y="16" width="2" height="1" />
      <rect x="21" y="16" width="2" height="1" />
      <rect x="1" y="17" width="2" height="1" />
      <rect x="11" y="17" width="2" height="1" />
      <rect x="21" y="17" width="2" height="1" />
      <rect x="1" y="18" width="2" height="1" />
      <rect x="11" y="18" width="2" height="1" />
      <rect x="21" y="18" width="2" height="1" />
      <rect x="1" y="19" width="3" height="1" />
      <rect x="10" y="19" width="4" height="1" />
      <rect x="20" y="19" width="3" height="1" />
      <rect x="2" y="20" width="3" height="1" />
      <rect x="9" y="20" width="6" height="1" />
      <rect x="19" y="20" width="3" height="1" />
      <rect x="3" y="21" width="8" height="1" />
      <rect x="13" y="21" width="8" height="1" />
      <rect x="4" y="22" width="6" height="1" />
      <rect x="14" y="22" width="6" height="1" />
    </svg>
  )
);

Cherry.displayName = 'Cherry';

export default Cherry;
