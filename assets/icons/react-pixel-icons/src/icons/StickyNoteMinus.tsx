import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const StickyNoteMinus = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="3" y="2" width="14" height="1" />
      <rect x="2" y="3" width="16" height="1" />
      <rect x="2" y="4" width="2" height="1" />
      <rect x="14" y="4" width="5" height="1" />
      <rect x="2" y="5" width="2" height="1" />
      <rect x="14" y="5" width="2" height="1" />
      <rect x="17" y="5" width="3" height="1" />
      <rect x="2" y="6" width="2" height="1" />
      <rect x="14" y="6" width="2" height="1" />
      <rect x="18" y="6" width="3" height="1" />
      <rect x="2" y="7" width="2" height="1" />
      <rect x="14" y="7" width="2" height="1" />
      <rect x="19" y="7" width="3" height="1" />
      <rect x="2" y="8" width="2" height="1" />
      <rect x="14" y="8" width="8" height="1" />
      <rect x="2" y="9" width="2" height="1" />
      <rect x="15" y="9" width="7" height="1" />
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
      <rect x="2" y="15" width="2" height="1" />
      <rect x="2" y="16" width="2" height="1" />
      <rect x="2" y="17" width="2" height="1" />
      <rect x="14" y="17" width="8" height="1" />
      <rect x="2" y="18" width="2" height="1" />
      <rect x="14" y="18" width="8" height="1" />
      <rect x="2" y="19" width="2" height="1" />
      <rect x="2" y="20" width="11" height="1" />
      <rect x="3" y="21" width="10" height="1" />
    </svg>
  )
);

StickyNoteMinus.displayName = 'StickyNoteMinus';

export default StickyNoteMinus;
