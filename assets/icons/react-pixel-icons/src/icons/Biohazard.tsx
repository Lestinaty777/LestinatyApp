import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const Biohazard = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="6" y="2" width="1" height="1" />
      <rect x="17" y="2" width="1" height="1" />
      <rect x="6" y="3" width="2" height="1" />
      <rect x="16" y="3" width="2" height="1" />
      <rect x="5" y="4" width="3" height="1" />
      <rect x="10" y="4" width="4" height="1" />
      <rect x="16" y="4" width="3" height="1" />
      <rect x="5" y="5" width="2" height="1" />
      <rect x="9" y="5" width="6" height="1" />
      <rect x="17" y="5" width="2" height="1" />
      <rect x="5" y="6" width="3" height="1" />
      <rect x="16" y="6" width="3" height="1" />
      <rect x="6" y="7" width="2" height="1" />
      <rect x="16" y="7" width="2" height="1" />
      <rect x="6" y="8" width="3" height="1" />
      <rect x="15" y="8" width="4" height="1" />
      <rect x="3" y="9" width="18" height="1" />
      <rect x="2" y="10" width="20" height="1" />
      <rect x="1" y="11" width="3" height="1" />
      <rect x="9" y="11" width="2" height="1" />
      <rect x="13" y="11" width="2" height="1" />
      <rect x="20" y="11" width="3" height="1" />
      <rect x="2" y="12" width="1" height="1" />
      <rect x="9" y="12" width="2" height="1" />
      <rect x="13" y="12" width="2" height="1" />
      <rect x="21" y="12" width="1" height="1" />
      <rect x="5" y="13" width="1" height="1" />
      <rect x="9" y="13" width="6" height="1" />
      <rect x="18" y="13" width="1" height="1" />
      <rect x="5" y="14" width="2" height="1" />
      <rect x="10" y="14" width="4" height="1" />
      <rect x="17" y="14" width="2" height="1" />
      <rect x="5" y="15" width="3" height="1" />
      <rect x="11" y="15" width="2" height="1" />
      <rect x="16" y="15" width="3" height="1" />
      <rect x="6" y="16" width="2" height="1" />
      <rect x="11" y="16" width="2" height="1" />
      <rect x="16" y="16" width="2" height="1" />
      <rect x="10" y="17" width="4" height="1" />
      <rect x="9" y="18" width="5" height="1" />
      <rect x="8" y="19" width="3" height="1" />
      <rect x="12" y="19" width="4" height="1" />
      <rect x="6" y="20" width="4" height="1" />
      <rect x="13" y="20" width="5" height="1" />
      <rect x="7" y="21" width="2" height="1" />
      <rect x="15" y="21" width="2" height="1" />
    </svg>
  )
);

Biohazard.displayName = 'Biohazard';

export default Biohazard;
