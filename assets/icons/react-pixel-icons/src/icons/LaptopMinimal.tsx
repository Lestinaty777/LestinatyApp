import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const LaptopMinimal = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="3" y="3" width="18" height="1" />
      <rect x="2" y="4" width="20" height="1" />
      <rect x="2" y="5" width="2" height="1" />
      <rect x="20" y="5" width="2" height="1" />
      <rect x="2" y="6" width="2" height="1" />
      <rect x="20" y="6" width="2" height="1" />
      <rect x="2" y="7" width="2" height="1" />
      <rect x="20" y="7" width="2" height="1" />
      <rect x="2" y="8" width="2" height="1" />
      <rect x="20" y="8" width="2" height="1" />
      <rect x="2" y="9" width="2" height="1" />
      <rect x="20" y="9" width="2" height="1" />
      <rect x="2" y="10" width="2" height="1" />
      <rect x="20" y="10" width="2" height="1" />
      <rect x="2" y="11" width="2" height="1" />
      <rect x="20" y="11" width="2" height="1" />
      <rect x="2" y="12" width="2" height="1" />
      <rect x="20" y="12" width="2" height="1" />
      <rect x="2" y="13" width="2" height="1" />
      <rect x="20" y="13" width="2" height="1" />
      <rect x="2" y="14" width="2" height="1" />
      <rect x="20" y="14" width="2" height="1" />
      <rect x="2" y="15" width="20" height="1" />
      <rect x="3" y="16" width="18" height="1" />
      <rect x="1" y="19" width="22" height="1" />
      <rect x="1" y="20" width="22" height="1" />
    </svg>
  )
);

LaptopMinimal.displayName = 'LaptopMinimal';

export default LaptopMinimal;
