import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const Redo2 = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="14" y="3" width="2" height="1" />
      <rect x="14" y="4" width="3" height="1" />
      <rect x="15" y="5" width="3" height="1" />
      <rect x="16" y="6" width="3" height="1" />
      <rect x="17" y="7" width="3" height="1" />
      <rect x="7" y="8" width="14" height="1" />
      <rect x="5" y="9" width="16" height="1" />
      <rect x="4" y="10" width="4" height="1" />
      <rect x="17" y="10" width="3" height="1" />
      <rect x="4" y="11" width="2" height="1" />
      <rect x="16" y="11" width="3" height="1" />
      <rect x="3" y="12" width="3" height="1" />
      <rect x="15" y="12" width="3" height="1" />
      <rect x="3" y="13" width="2" height="1" />
      <rect x="14" y="13" width="3" height="1" />
      <rect x="3" y="14" width="2" height="1" />
      <rect x="14" y="14" width="2" height="1" />
      <rect x="3" y="15" width="2" height="1" />
      <rect x="3" y="16" width="3" height="1" />
      <rect x="4" y="17" width="2" height="1" />
      <rect x="4" y="18" width="4" height="1" />
      <rect x="5" y="19" width="9" height="1" />
      <rect x="7" y="20" width="7" height="1" />
    </svg>
  )
);

Redo2.displayName = 'Redo2';

export default Redo2;
