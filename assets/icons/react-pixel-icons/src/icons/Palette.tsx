import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const Palette = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="8" y="1" width="8" height="1" />
      <rect x="6" y="2" width="12" height="1" />
      <rect x="5" y="3" width="4" height="1" />
      <rect x="15" y="3" width="4" height="1" />
      <rect x="4" y="4" width="3" height="1" />
      <rect x="17" y="4" width="3" height="1" />
      <rect x="3" y="5" width="3" height="1" />
      <rect x="12" y="5" width="3" height="1" />
      <rect x="18" y="5" width="3" height="1" />
      <rect x="2" y="6" width="3" height="1" />
      <rect x="7" y="6" width="3" height="1" />
      <rect x="12" y="6" width="3" height="1" />
      <rect x="19" y="6" width="3" height="1" />
      <rect x="2" y="7" width="2" height="1" />
      <rect x="7" y="7" width="3" height="1" />
      <rect x="12" y="7" width="3" height="1" />
      <rect x="20" y="7" width="2" height="1" />
      <rect x="1" y="8" width="3" height="1" />
      <rect x="7" y="8" width="3" height="1" />
      <rect x="20" y="8" width="3" height="1" />
      <rect x="1" y="9" width="2" height="1" />
      <rect x="16" y="9" width="3" height="1" />
      <rect x="21" y="9" width="2" height="1" />
      <rect x="1" y="10" width="2" height="1" />
      <rect x="16" y="10" width="3" height="1" />
      <rect x="21" y="10" width="2" height="1" />
      <rect x="1" y="11" width="2" height="1" />
      <rect x="5" y="11" width="3" height="1" />
      <rect x="16" y="11" width="3" height="1" />
      <rect x="21" y="11" width="2" height="1" />
      <rect x="1" y="12" width="2" height="1" />
      <rect x="5" y="12" width="3" height="1" />
      <rect x="21" y="12" width="2" height="1" />
      <rect x="1" y="13" width="2" height="1" />
      <rect x="5" y="13" width="3" height="1" />
      <rect x="20" y="13" width="3" height="1" />
      <rect x="1" y="14" width="2" height="1" />
      <rect x="19" y="14" width="3" height="1" />
      <rect x="1" y="15" width="3" height="1" />
      <rect x="13" y="15" width="8" height="1" />
      <rect x="2" y="16" width="2" height="1" />
      <rect x="12" y="16" width="8" height="1" />
      <rect x="2" y="17" width="3" height="1" />
      <rect x="12" y="17" width="2" height="1" />
      <rect x="3" y="18" width="3" height="1" />
      <rect x="12" y="18" width="2" height="1" />
      <rect x="4" y="19" width="3" height="1" />
      <rect x="13" y="19" width="2" height="1" />
      <rect x="5" y="20" width="4" height="1" />
      <rect x="13" y="20" width="2" height="1" />
      <rect x="6" y="21" width="9" height="1" />
      <rect x="8" y="22" width="6" height="1" />
    </svg>
  )
);

Palette.displayName = 'Palette';

export default Palette;
