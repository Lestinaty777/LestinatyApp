import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const ListPlus = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="2" y="4" width="15" height="1" />
      <rect x="2" y="5" width="15" height="1" />
      <rect x="17" y="8" width="2" height="1" />
      <rect x="17" y="9" width="2" height="1" />
      <rect x="17" y="10" width="2" height="1" />
      <rect x="2" y="11" width="10" height="1" />
      <rect x="14" y="11" width="8" height="1" />
      <rect x="2" y="12" width="10" height="1" />
      <rect x="14" y="12" width="8" height="1" />
      <rect x="17" y="13" width="2" height="1" />
      <rect x="17" y="14" width="2" height="1" />
      <rect x="17" y="15" width="2" height="1" />
      <rect x="2" y="18" width="15" height="1" />
      <rect x="2" y="19" width="15" height="1" />
    </svg>
  )
);

ListPlus.displayName = 'ListPlus';

export default ListPlus;
