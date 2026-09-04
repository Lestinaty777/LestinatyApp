import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const ListFilter = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="1" y="4" width="22" height="1" />
      <rect x="1" y="5" width="22" height="1" />
      <rect x="5" y="11" width="14" height="1" />
      <rect x="5" y="12" width="14" height="1" />
      <rect x="8" y="18" width="8" height="1" />
      <rect x="8" y="19" width="8" height="1" />
    </svg>
  )
);

ListFilter.displayName = 'ListFilter';

export default ListFilter;
