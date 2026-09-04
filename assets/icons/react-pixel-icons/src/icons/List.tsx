import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const List = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="2" y="4" width="2" height="1" />
      <rect x="7" y="4" width="15" height="1" />
      <rect x="2" y="5" width="2" height="1" />
      <rect x="7" y="5" width="15" height="1" />
      <rect x="2" y="11" width="2" height="1" />
      <rect x="7" y="11" width="15" height="1" />
      <rect x="2" y="12" width="2" height="1" />
      <rect x="7" y="12" width="15" height="1" />
      <rect x="2" y="18" width="2" height="1" />
      <rect x="7" y="18" width="15" height="1" />
      <rect x="2" y="19" width="2" height="1" />
      <rect x="7" y="19" width="15" height="1" />
    </svg>
  )
);

List.displayName = 'List';

export default List;
