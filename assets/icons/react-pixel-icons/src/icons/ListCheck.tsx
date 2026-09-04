import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const ListCheck = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="2" y="11" width="15" height="1" />
      <rect x="2" y="12" width="15" height="1" />
      <rect x="20" y="15" width="2" height="1" />
      <rect x="19" y="16" width="3" height="1" />
      <rect x="14" y="17" width="2" height="1" />
      <rect x="18" y="17" width="3" height="1" />
      <rect x="2" y="18" width="10" height="1" />
      <rect x="14" y="18" width="6" height="1" />
      <rect x="2" y="19" width="10" height="1" />
      <rect x="15" y="19" width="4" height="1" />
      <rect x="16" y="20" width="2" height="1" />
    </svg>
  )
);

ListCheck.displayName = 'ListCheck';

export default ListCheck;
