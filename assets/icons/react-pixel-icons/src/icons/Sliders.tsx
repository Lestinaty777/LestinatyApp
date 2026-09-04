import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const Sliders = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="4" y="2" width="2" height="1" />
      <rect x="11" y="2" width="2" height="1" />
      <rect x="18" y="2" width="2" height="1" />
      <rect x="4" y="3" width="2" height="1" />
      <rect x="11" y="3" width="2" height="1" />
      <rect x="18" y="3" width="2" height="1" />
      <rect x="4" y="4" width="2" height="1" />
      <rect x="11" y="4" width="2" height="1" />
      <rect x="18" y="4" width="2" height="1" />
      <rect x="4" y="5" width="2" height="1" />
      <rect x="11" y="5" width="2" height="1" />
      <rect x="18" y="5" width="2" height="1" />
      <rect x="4" y="6" width="2" height="1" />
      <rect x="11" y="6" width="2" height="1" />
      <rect x="18" y="6" width="2" height="1" />
      <rect x="4" y="7" width="2" height="1" />
      <rect x="9" y="7" width="6" height="1" />
      <rect x="18" y="7" width="2" height="1" />
      <rect x="4" y="8" width="2" height="1" />
      <rect x="9" y="8" width="6" height="1" />
      <rect x="18" y="8" width="2" height="1" />
      <rect x="4" y="9" width="2" height="1" />
      <rect x="18" y="9" width="2" height="1" />
      <rect x="4" y="10" width="2" height="1" />
      <rect x="18" y="10" width="2" height="1" />
      <rect x="11" y="11" width="2" height="1" />
      <rect x="18" y="11" width="2" height="1" />
      <rect x="11" y="12" width="2" height="1" />
      <rect x="18" y="12" width="2" height="1" />
      <rect x="2" y="13" width="6" height="1" />
      <rect x="11" y="13" width="2" height="1" />
      <rect x="2" y="14" width="6" height="1" />
      <rect x="11" y="14" width="2" height="1" />
      <rect x="4" y="15" width="2" height="1" />
      <rect x="11" y="15" width="2" height="1" />
      <rect x="16" y="15" width="6" height="1" />
      <rect x="4" y="16" width="2" height="1" />
      <rect x="11" y="16" width="2" height="1" />
      <rect x="16" y="16" width="6" height="1" />
      <rect x="4" y="17" width="2" height="1" />
      <rect x="11" y="17" width="2" height="1" />
      <rect x="18" y="17" width="2" height="1" />
      <rect x="4" y="18" width="2" height="1" />
      <rect x="11" y="18" width="2" height="1" />
      <rect x="18" y="18" width="2" height="1" />
      <rect x="4" y="19" width="2" height="1" />
      <rect x="11" y="19" width="2" height="1" />
      <rect x="18" y="19" width="2" height="1" />
      <rect x="4" y="20" width="2" height="1" />
      <rect x="11" y="20" width="2" height="1" />
      <rect x="18" y="20" width="2" height="1" />
      <rect x="4" y="21" width="2" height="1" />
      <rect x="11" y="21" width="2" height="1" />
      <rect x="18" y="21" width="2" height="1" />
    </svg>
  )
);

Sliders.displayName = 'Sliders';

export default Sliders;
